import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const average = stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0;
  const count = stats[0] ? stats[0].count : 0;
  await Product.findByIdAndUpdate(productId, { 'ratings.average': average, 'ratings.count': count, reviewsCount: count });
};

export const createReview = asyncHandler(async (req, res) => {
  const { product, rating, title, comment } = req.body;
  if (!product || !rating || !comment) throw new ApiError(400, 'Product, rating, and comment are required');

  // Check if user has purchased this product
  const delivered = await Order.findOne({
    user: req.user._id,
    orderStatus: 'Delivered',
    'items.product': product,
  });
  const isVerifiedPurchase = !!delivered;

  // Check if user already reviewed
  const existing = await Review.findOne({ product, user: req.user._id });
  if (existing) throw new ApiError(400, 'You have already reviewed this product');

  const images = (req.files || []).map((f) => ({ public_id: f.filename, url: f.path }));

  const review = await Review.create({
    product,
    user: req.user._id,
    rating,
    title,
    comment,
    images,
    isVerifiedPurchase,
    isApproved: false, // admin must approve
  });

  // Update product rating
  await updateProductRating(product);

  return ApiResponse.created(res, review, 'Review submitted and pending approval');
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;
  const filter = { product: productId, isApproved: true };
  if (req.query.rating) filter.rating = Number(req.query.rating);
  const [reviews, total] = await Promise.all([
    Review.find(filter).populate('user', 'name avatar').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    data: reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getAllReviews = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === 'true';
  if (req.query.product) filter.product = req.query.product;
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email avatar')
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    data: reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getUserReviews = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ user: req.user._id })
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ user: req.user._id }),
  ]);
  res.status(200).json({
    success: true,
    data: reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }
  Object.assign(review, req.body);
  review.isApproved = false; // re-approve on edit
  await review.save();
  await updateProductRating(review.product);
  return ApiResponse.success(res, review, 'Review updated');
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }
  const productId = review.product;
  await review.deleteOne();
  await updateProductRating(productId);
  return ApiResponse.success(res, null, 'Review deleted');
});

export const approveReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  review.isApproved = true;
  review.approvedAt = new Date();
  review.approvedBy = req.user._id;
  await review.save();
  await updateProductRating(review.product);
  return ApiResponse.success(res, review, 'Review approved');
});

export const markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  // Check if user already marked this review as helpful
  if (review.helpfulBy.some((userId) => userId.toString() === req.user._id.toString())) {
    // Already voted — toggle it off
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    review.helpfulBy = review.helpfulBy.filter(
      (userId) => userId.toString() !== req.user._id.toString(),
    );
    await review.save();
    return ApiResponse.success(res, review, 'Removed helpful vote');
  }

  review.helpfulCount += 1;
  review.helpfulBy.push(req.user._id);
  await review.save();
  return ApiResponse.success(res, review, 'Marked as helpful');
});

export default {
  createReview, getProductReviews, getAllReviews, getUserReviews,
  updateReview, deleteReview, approveReview, markHelpful,
};
