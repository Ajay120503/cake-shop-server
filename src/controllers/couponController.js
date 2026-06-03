import Coupon from '../models/Coupon.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getCoupons = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    data: coupons,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getPublicCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isActive: true, isPublic: true, validUntil: { $gte: new Date() } })
    .select('code name description discountType discountValue minOrderAmount validUntil')
    .sort({ createdAt: -1 });
  return ApiResponse.success(res, coupons);
});

export const getCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  return ApiResponse.success(res, coupon);
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) throw new ApiError(400, 'Coupon code is required');
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new ApiError(404, 'Invalid coupon code');
  const validity = coupon.isValid(Number(orderAmount) || 0, req.user?._id);
  if (!validity.valid) throw new ApiError(400, validity.reason);
  const discount = coupon.calculateDiscount(Number(orderAmount) || 0);
  return ApiResponse.success(res, { coupon, discount }, 'Coupon is valid');
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return ApiResponse.created(res, coupon, 'Coupon created');
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  return ApiResponse.success(res, coupon, 'Coupon updated');
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  await coupon.deleteOne();
  return ApiResponse.success(res, null, 'Coupon deleted');
});

export default {
  getCoupons, getPublicCoupons, getCoupon, validateCoupon,
  createCoupon, updateCoupon, deleteCoupon,
};
