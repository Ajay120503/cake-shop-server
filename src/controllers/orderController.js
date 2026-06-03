import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendEmail } from '../utils/sendEmail.js';
import { orderConfirmationTemplate, orderStatusTemplate } from '../utils/emailTemplates.js';
import { StoreSettings } from '../models/Settings.js';

const calcPrices = async (items, couponCode) => {
  let itemsPrice = 0;
  const productUpdates = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new ApiError(404, 'Product not found: ' + item.product);
    if (product.stock < item.quantity) throw new ApiError(400, 'Insufficient stock for ' + product.name);
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    itemsPrice += price * item.quantity;
    productUpdates.push({ product, qty: item.quantity, price });
  }
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon) {
      const validity = coupon.isValid(itemsPrice);
      if (validity.valid) discount = coupon.calculateDiscount(itemsPrice);
    }
  }
  const settings = (await StoreSettings.findOne()) || { taxPercent: 5, shippingCharge: 50, freeShippingThreshold: 500 };
  const taxPrice = +(itemsPrice * (settings.taxPercent / 100)).toFixed(2);
  const shippingPrice = itemsPrice >= settings.freeShippingThreshold ? 0 : settings.shippingCharge;
  const totalPrice = +(itemsPrice + taxPrice + shippingPrice - discount).toFixed(2);
  return { itemsPrice: +itemsPrice.toFixed(2), taxPrice, shippingPrice, discountPrice: +discount.toFixed(2), totalPrice, productUpdates, coupon };
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode, notes, isGift, giftMessage } = req.body;
  if (!items?.length) throw new ApiError(400, 'No items in order');
  if (!shippingAddress?.addressLine1) throw new ApiError(400, 'Shipping address is required');

  const totals = await calcPrices(items, couponCode);
  const orderItems = items.map((item, i) => ({
    product: item.product,
    name: totals.productUpdates[i].product.name,
    image: totals.productUpdates[i].product.images?.[0]?.url,
    price: totals.productUpdates[i].price,
    quantity: item.quantity,
    variant: item.variant,
  }));

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice: totals.itemsPrice,
    taxPrice: totals.taxPrice,
    shippingPrice: totals.shippingPrice,
    discountPrice: totals.discountPrice,
    totalPrice: totals.totalPrice,
    couponCode: totals.coupon ? totals.coupon.code : undefined,
    notes, isGift, giftMessage,
    deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    statusHistory: [{ status: 'Processing', updatedBy: req.user._id, updatedAt: new Date() }],
  });

  // Decrement stock
  for (const u of totals.productUpdates) {
    u.product.stock -= u.qty;
    u.product.sold += u.qty;
    await u.product.save();
  }
  // Update coupon usage
  if (totals.coupon) {
    totals.coupon.usedCount += 1;
    totals.coupon.usedBy.push({ user: req.user._id, order: order._id });
    await totals.coupon.save();
  }

  // Send confirmation email
  sendEmail({
    to: shippingAddress.email || req.user.email,
    subject: 'Order Confirmation - #' + order.orderNumber,
    html: orderConfirmationTemplate(order),
  }).catch(() => {});

  return ApiResponse.created(res, order, 'Order placed successfully');
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;
  const filter = { user: req.user._id };
  if (req.query.status) filter.orderStatus = req.query.status;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name images slug'),
    Order.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    data: orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name images slug');
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }
  return ApiResponse.success(res, order);
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    data: orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');
  order.orderStatus = status;
  order.statusHistory.push({ status, note, updatedBy: req.user._id, updatedAt: new Date() });
  if (status === 'Delivered') {
    order.deliveredAt = new Date();
    order.isPaid = order.paymentMethod === 'COD' ? true : order.isPaid;
    order.paymentStatus = order.paymentMethod === 'COD' ? 'Paid' : order.paymentStatus;
  }
  if (status === 'Cancelled') {
    order.cancelledAt = new Date();
    // Restore stock
    for (const item of order.items) {
      const p = await Product.findById(item.product);
      if (p) {
        p.stock += item.quantity;
        p.sold = Math.max(0, p.sold - item.quantity);
        await p.save();
      }
    }
  }
  await order.save();
  // Send status email
  sendEmail({
    to: order.user.email,
    subject: 'Order ' + status + ' - #' + order.orderNumber,
    html: orderStatusTemplate(order, status),
  }).catch(() => {});
  return ApiResponse.success(res, order, 'Order status updated');
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) throw new ApiError(403, 'Not authorized');
  if (['Delivered', 'Cancelled', 'Refunded'].includes(order.orderStatus)) {
    throw new ApiError(400, 'Order cannot be cancelled in current state');
  }
  order.orderStatus = 'Cancelled';
  order.cancelledAt = new Date();
  order.statusHistory.push({ status: 'Cancelled', note: reason || 'Customer cancelled', updatedBy: req.user._id });
  await order.save();
  for (const item of order.items) {
    const p = await Product.findById(item.product);
    if (p) {
      p.stock += item.quantity;
      p.sold = Math.max(0, p.sold - item.quantity);
      await p.save();
    }
  }
  return ApiResponse.success(res, order, 'Order cancelled');
});

export const refundOrder = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus !== 'Paid') throw new ApiError(400, 'Order is not paid');
  order.orderStatus = 'Refunded';
  order.paymentStatus = 'Refunded';
  order.refundAt = new Date();
  order.statusHistory.push({ status: 'Refunded', note: 'Refund: ' + (reason || 'Customer request') + ' Amount: ' + (amount || order.totalPrice), updatedBy: req.user._id });
  await order.save();
  return ApiResponse.success(res, order, 'Order refunded');
});

export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).select('orderStatus statusHistory trackingId trackingUrl deliveryDate _id orderNumber');
  if (!order) throw new ApiError(404, 'Order not found');
  return ApiResponse.success(res, order);
});

export const getOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }
  const { generateInvoiceHTML } = await import('../utils/invoiceGenerator.js');
  const html = generateInvoiceHTML(order);
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', 'attachment; filename="invoice-' + order.orderNumber + '.html"');
  res.send(html);
});

export default {
  createOrder, getMyOrders, getOrder, getAllOrders,
  updateOrderStatus, cancelOrder, refundOrder, trackOrder, getOrderInvoice,
};
