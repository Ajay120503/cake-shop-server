import Category from '../models/Category.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.isFeatured === 'true') filter.isFeatured = true;

  const categories = await Category.find(filter)
    .populate('parent', 'name slug')
    .sort({ order: 1, name: 1 });
  return ApiResponse.success(res, categories);
});

export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const category = await Category.findOne(isObjectId ? { _id: id } : { slug: id });
  if (!category) throw new ApiError(404, 'Category not found');
  return ApiResponse.success(res, category);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parent, order, isActive, isFeatured, icon } = req.body;
  let image = req.body.image;
  if (req.file) {
    image = { public_id: req.file.filename, url: req.file.path };
  }
  const category = await Category.create({
    name,
    description,
    parent,
    order,
    isActive,
    isFeatured,
    icon,
    image,
  });
  return ApiResponse.created(res, category, 'Category created');
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) {
    updates.image = { public_id: req.file.filename, url: req.file.path };
  }
  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new ApiError(404, 'Category not found');
  return ApiResponse.success(res, category, 'Category updated');
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  // Check if products exist
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    throw new ApiError(400, `Cannot delete: ${productCount} products are using this category.`);
  }
  await category.deleteOne();
  return ApiResponse.success(res, null, 'Category deleted');
});

export const getCategoryProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 12, 100);
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find({ category: id, isDeleted: false, isAvailable: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments({ category: id, isDeleted: false, isAvailable: true }),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page, limit, total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

export default {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts,
};
