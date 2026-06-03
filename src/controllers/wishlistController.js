import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getMyWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products.product',
    populate: { path: 'category', select: 'name slug' },
  });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }
  return ApiResponse.success(res, wishlist);
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });

  const exists = wishlist.products.find((p) => p.product.toString() === productId);
  if (exists) throw new ApiError(400, 'Product already in wishlist');

  wishlist.products.push({ product: productId });
  await wishlist.save();
  await wishlist.populate('products.product');
  return ApiResponse.success(res, wishlist, 'Added to wishlist');
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) throw new ApiError(404, 'Wishlist not found');
  wishlist.products = wishlist.products.filter((p) => p.product.toString() !== productId);
  await wishlist.save();
  await wishlist.populate('products.product');
  return ApiResponse.success(res, wishlist, 'Removed from wishlist');
});

export const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = [];
    await wishlist.save();
  }
  return ApiResponse.success(res, null, 'Wishlist cleared');
});

export default {
  getMyWishlist, addToWishlist, removeFromWishlist, clearWishlist,
};
