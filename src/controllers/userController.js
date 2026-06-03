import User from '../models/User.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const filter = { role: 'customer' };
  if (req.query.search) {
    filter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
    ];
  }
  if (req.query.isBlocked !== undefined) filter.isBlocked = req.query.isBlocked === 'true';
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const orders = await Order.countDocuments({ user: user._id });
  return ApiResponse.success(res, { ...user.toObject(), orderCount: orders });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, role, isActive, isBlocked } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, phone, role, isActive, isBlocked },
    { new: true, runValidators: true },
  );
  if (!user) throw new ApiError(404, 'User not found');
  return ApiResponse.success(res, user, 'User updated');
});

export const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.isBlocked = true;
  await user.save();
  return ApiResponse.success(res, null, 'User blocked');
});

export const unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.isBlocked = false;
  await user.save();
  return ApiResponse.success(res, null, 'User unblocked');
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Cannot delete admin user');
  await user.deleteOne();
  return ApiResponse.success(res, null, 'User deleted');
});

export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [orders, totalSpent] = await Promise.all([
    Order.countDocuments({ user: userId }),
    Order.aggregate([
      { $match: { user: userId, paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
  ]);
  res.status(200).json(ApiResponse.success(res, {
    orderCount: orders,
    totalSpent: totalSpent[0]?.total || 0,
  }));
});

export default {
  getUsers, getUser, updateUser, blockUser, unblockUser,
  deleteUser, getUserStats,
};
