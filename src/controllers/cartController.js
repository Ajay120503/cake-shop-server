import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { StoreSettings } from '../models/Settings.js';

const recalculateCart = async (cart) => {
  let itemsPrice = 0;
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    item.price = price;
    item.name = product.name;
    item.image = product.images?.[0]?.url;
    itemsPrice += price * item.quantity;
  }
  let discount = 0;
  if (cart.coupon?.code) {
    const coupon = await Coupon.findOne({ code: cart.coupon.code });
    if (coupon) {
      const validity = coupon.isValid(itemsPrice);
      if (validity.valid) {
        discount = coupon.calculateDiscount(itemsPrice);
        cart.coupon = { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, discount };
      } else {
        cart.coupon = undefined;
      }
    }
  }
  const settings = (await StoreSettings.findOne()) || { taxPercent: 5, shippingCharge: 50, freeShippingThreshold: 500 };
  const taxPrice = +(itemsPrice * (settings.taxPercent / 100)).toFixed(2);
  const shippingPrice = itemsPrice >= settings.freeShippingThreshold ? 0 : settings.shippingCharge;
  const totalPrice = +(itemsPrice + taxPrice + shippingPrice - discount).toFixed(2);
  cart.totals = {
    itemsPrice: +itemsPrice.toFixed(2),
    taxPrice,
    shippingPrice,
    discountPrice: +discount.toFixed(2),
    totalPrice,
  };
  await cart.save();
  return cart;
};

export const getMyCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images stock');
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  return ApiResponse.success(res, cart);
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant, customMessage } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity) throw new ApiError(400, 'Insufficient stock');

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existing = cart.items.find((i) => i.product.toString() === productId && i.variant === variant);
  if (existing) {
    existing.quantity += quantity;
  } else {
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    cart.items.push({ product: productId, name: product.name, image: product.images?.[0]?.url, price, quantity, variant, customMessage });
  }
  await recalculateCart(cart);
  await cart.populate('items.product', 'name images stock');
  return ApiResponse.success(res, cart, 'Added to cart');
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  if (quantity < 1) throw new ApiError(400, 'Quantity must be at least 1');
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');
  const item = cart.items.id(itemId);
  if (!item) throw new ApiError(404, 'Item not found in cart');
  item.quantity = quantity;
  await recalculateCart(cart);
  await cart.populate('items.product', 'name images stock');
  return ApiResponse.success(res, cart, 'Cart updated');
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');
  cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
  await recalculateCart(cart);
  await cart.populate('items.product', 'name images stock');
  return ApiResponse.success(res, cart, 'Item removed');
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.coupon = undefined;
    cart.totals = { itemsPrice: 0, taxPrice: 0, shippingPrice: 0, discountPrice: 0, totalPrice: 0 };
    await cart.save();
  }
  return ApiResponse.success(res, null, 'Cart cleared');
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new ApiError(404, 'Invalid coupon code');
  const validity = coupon.isValid(cart.totals.itemsPrice, req.user._id);
  if (!validity.valid) throw new ApiError(400, validity.reason);
  cart.coupon = { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue };
  await recalculateCart(cart);
  await cart.populate('items.product', 'name images stock');
  return ApiResponse.success(res, cart, 'Coupon applied');
});

export const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');
  cart.coupon = undefined;
  await recalculateCart(cart);
  return ApiResponse.success(res, cart, 'Coupon removed');
});

export default {
  getMyCart, addToCart, updateCartItem,
  removeFromCart, clearCart, applyCoupon, removeCoupon,
};
