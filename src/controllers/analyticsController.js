import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [
    totalOrders, totalProducts, totalCustomers, totalCategories,
    todayOrders, monthOrders, totalRevenue, monthRevenue,
    pendingOrders, processingOrders, lowStock,
  ] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments({ isDeleted: false }),
    User.countDocuments({ role: 'customer' }),
    Category.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.aggregate([{ $match: { paymentStatus: 'Paid' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'Paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.countDocuments({ orderStatus: 'Processing' }),
    Order.countDocuments({ orderStatus: { $in: ['Confirmed', 'Preparing', 'Shipped'] } }),
    Product.find({ stock: { $lt: 10 }, isDeleted: false }).select('name stock images').limit(10),
  ]);

  return (ApiResponse.success(res, {
    totalOrders,
    totalProducts,
    totalCustomers,
    totalCategories,
    todayOrders,
    monthOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    monthRevenue: monthRevenue[0]?.total || 0,
    pendingOrders,
    processingOrders,
    lowStock,
  }));
});

export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period = '7days' } = req.query;
  let startDate;
  switch (period) {
    case '7days': startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
    case '30days': startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); break;
    case '12months': startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); break;
    default: startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  const data = await Order.aggregate([
    { $match: { paymentStatus: 'Paid', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return ApiResponse.success(res, data);
});

export const getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const match = { paymentStatus: 'Paid' };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  const data = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        totalTax: { $sum: '$taxPrice' },
        totalShipping: { $sum: '$shippingPrice' },
        totalDiscount: { $sum: '$discountPrice' },
        avgOrderValue: { $avg: '$totalPrice' },
      },
    },
  ]);
  return ApiResponse.success(res, data[0] || {});
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const products = await Product.find({ isDeleted: false })
    .sort({ sold: -1 })
    .limit(limit)
    .select('name images price sold ratings reviewsCount');
  return ApiResponse.success(res, products);
});

export const getCategoryReport = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: '$productInfo' },
    {
      $lookup: {
        from: 'categories',
        localField: 'productInfo.category',
        foreignField: '_id',
        as: 'categoryInfo',
      },
    },
    { $unwind: '$categoryInfo' },
    {
      $group: {
        _id: '$categoryInfo._id',
        name: { $first: '$categoryInfo.name' },
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
  return ApiResponse.success(res, data);
});

export const getCustomerReport = asyncHandler(async (req, res) => {
  const data = await User.aggregate([
    { $match: { role: 'customer' } },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'user',
        as: 'orders',
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        createdAt: 1,
        orderCount: { $size: '$orders' },
        totalSpent: { $sum: '$orders.totalPrice' },
        lastOrder: { $max: '$orders.createdAt' },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 50 },
  ]);
  return ApiResponse.success(res, data);
});

export default {
  getDashboardStats, getRevenueAnalytics, getSalesReport,
  getTopProducts, getCategoryReport, getCustomerReport,
};
