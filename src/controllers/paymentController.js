import crypto from 'crypto';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { initRazorpay, getRazorpay } from '../config/razorpay.js';

// export const createRazorpayOrder = asyncHandler(async (req, res) => {
//   const { amount, currency = 'INR', receipt } = req.body;
//   if (!amount) throw new ApiError(400, 'Amount is required');

//   const razorpay = getRazorpay();
//   if (!razorpay) {
//     // Razorpay not configured - return mock data for testing
//     return res.status(200).json({
//       success: true,
//       data: {
//         id: 'mock_order_' + Date.now(),
//         amount: Math.round(amount * 100),
//         currency,
//         receipt: receipt || 'receipt_' + Date.now(),
//         mock: true,
//         message: 'Razorpay not configured. Use mock mode for testing.',
//       },
//     });
//   }

//   const options = {
//     amount: Math.round(amount * 100), // paise
//     currency,
//     receipt: receipt || 'receipt_' + Date.now(),
//   };

//   const order = await razorpay.orders.create(options);
//   // return ApiResponse.success(res, order);
//   return ApiResponse.success(res, order);
// });

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  console.log("REQ BODY:", req.body);

  const { amount, currency = 'INR', receipt } = req.body;

  console.log("AMOUNT:", amount);

  if (!amount) {
    console.log("AMOUNT MISSING");
    throw new ApiError(400, 'Amount is required');
  }

  const razorpay = getRazorpay();

  console.log("RAZORPAY EXISTS:", !!razorpay);
  console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);

  const options = {
    amount: Math.round(amount * 100),
    currency,
    receipt: receipt || 'receipt_' + Date.now(),
  };

  console.log("OPTIONS:", options);

  try {
    const order = await razorpay.orders.create(options);
    console.log("ORDER:", order);
    console.log("ORDER CREATED:", order);

    return ApiResponse.success(res, order);
  } catch (err) {
    console.error("RAZORPAY CREATE ERROR:", err);
    throw err;
  }
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    throw new ApiError(400, 'Missing payment verification details');
  }

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest('hex');

  if (razorpay_signature !== expectedSign) {
    throw new ApiError(400, 'Invalid payment signature');
  }

  // Update order
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }
  order.paymentResult = {
    id: razorpay_payment_id,
    status: 'captured',
    method: 'Razorpay',
  };
  order.paymentStatus = 'Paid';
  order.isPaid = true;
  await order.save();

  // Clear cart
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.coupon = undefined;
    cart.totals = { itemsPrice: 0, taxPrice: 0, shippingPrice: 0, discountPrice: 0, totalPrice: 0 };
    await cart.save();
  }

  // return ApiResponse.success(res, order, 'Payment verified successfully');
  return ApiResponse.success(res, order, 'Payment verified successfully');
});

// Mock verification for testing without real Razorpay
export const mockVerifyPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) throw new ApiError(400, 'Order ID is required');

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }
  order.paymentResult = { id: 'MOCK_' + Date.now(), status: 'captured', method: 'Mock' };
  order.paymentStatus = 'Paid';
  order.isPaid = true;
  await order.save();

  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.coupon = undefined;
    await cart.save();
  }
  return ApiResponse.success(res, order, 'Mock payment successful');
});

export const confirmCOD = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) throw new ApiError(400, 'Order ID is required');

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }
  if (order.paymentMethod !== 'COD') {
    throw new ApiError(400, 'Order is not a COD order');
  }
  order.paymentStatus = 'Pending';
  order.isPaid = false;
  await order.save();

  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.coupon = undefined;
    await cart.save();
  }
  return ApiResponse.success(res, order, 'COD order confirmed');
});

export const getRazorpayKey = asyncHandler(async (req, res) => {
  res.status(200).json(ApiResponse.success(res, {
    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  }));
});

export const initiateRefund = asyncHandler(async (req, res) => {
  const { orderId, amount } = req.body;
  if (!orderId || !amount) throw new ApiError(400, 'Order ID and amount required');
  const razorpay = getRazorpay();
  if (!razorpay) {
    return ApiResponse.success(res, { id: 'mock_refund_' + Date.now(), mock: true }, 'Mock refund initiated');
  }
  const payment = await razorpay.payments.refund(orderId, { amount: Math.round(amount * 100) });
  return ApiResponse.success(res, payment, 'Refund initiated');
});

export default {
  createRazorpayOrder,
  verifyRazorpayPayment,
  mockVerifyPayment,
  confirmCOD,
  getRazorpayKey,
  initiateRefund,
};
