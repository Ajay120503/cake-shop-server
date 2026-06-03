import Product from '../models/Product.js';
import Category from '../models/Category.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const buildProductFilter = (query) => {
  const filter = { isDeleted: false, isAvailable: true };
  const { search, category, minPrice, maxPrice, rating, isFeatured, isBestSeller, isNewArrival, isTrending, isEggless, tags, flavor, occasion, inStock } = query;

  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (rating) filter['ratings.average'] = { $gte: Number(rating) };
  if (isFeatured === 'true') filter.isFeatured = true;
  if (isBestSeller === 'true') filter.isBestSeller = true;
  if (isNewArrival === 'true') filter.isNewArrival = true;
  if (isTrending === 'true') filter.isTrending = true;
  if (isEggless === 'true') filter.isEggless = true;
  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim());
    filter.tags = { $in: tagList };
  }
  if (flavor) filter.flavor = new RegExp(flavor, 'i');
  if (occasion) filter.occasion = { $in: occasion.split(',') };
  if (inStock === 'true') filter.stock = { $gt: 0 };
  return filter;
};

export const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 12, 100);
  const skip = (page - 1) * limit;

  const filter = buildProductFilter(req.query);

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'name-asc': { name: 1 },
    'name-desc': { name: -1 },
    'rating-desc': { 'ratings.average': -1 },
    popular: { sold: -1 },
    'best-selling': { sold: -1, 'ratings.average': -1 },
  };
  const sort = sortMap[req.query.sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
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

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const products = await Product.find({ isFeatured: true, isDeleted: false, isAvailable: true })
    .populate('category', 'name slug')
    .sort({ 'ratings.average': -1, createdAt: -1 })
    .limit(limit);
  return ApiResponse.success(res, products);
});

export const getBestSellers = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const products = await Product.find({ isBestSeller: true, isDeleted: false, isAvailable: true })
    .populate('category', 'name slug').sort({ sold: -1 }).limit(limit);
  return ApiResponse.success(res, products);
});

export const getNewArrivals = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const products = await Product.find({ isNewArrival: true, isDeleted: false, isAvailable: true })
    .populate('category', 'name slug').sort({ createdAt: -1 }).limit(limit);
  return ApiResponse.success(res, products);
});

export const getTrendingProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const products = await Product.find({ isTrending: true, isDeleted: false, isAvailable: true })
    .populate('category', 'name slug').sort({ 'ratings.average': -1, sold: -1 }).limit(limit);
  return ApiResponse.success(res, products);
});

export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  const product = await Product.findOne(isObjectId ? { _id: id } : { slug: id })
    .populate('category', 'name slug description');
  if (!product || product.isDeleted) throw new ApiError(404, 'Product not found');
  return ApiResponse.success(res, product);
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isDeleted: false,
    isAvailable: true,
  }).limit(4);
  return ApiResponse.success(res, related);
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) throw new ApiError(400, 'Search query is required');
  const products = await Product.find(
    { $text: { $search: q }, isDeleted: false, isAvailable: true },
    { score: { $meta: 'textScore' } },
  )
    .sort({ score: { $meta: 'textScore' } })
    .populate('category', 'name slug')
    .limit(20);
  return ApiResponse.success(res, products);
});

const parseArrayField = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

const parseWeight = (val, unit) => {
  if (!val) return undefined;
  return { value: Number(val), unit: unit || 'g' };
};

export const createProduct = asyncHandler(async (req, res) => {
  if (req.body.category) {
    const cat = await Category.findById(req.body.category);
    if (!cat) throw new ApiError(400, 'Invalid category');
  }
  const images = (req.files || []).map((f) => ({ public_id: f.filename, url: f.path }));
  const data = {
    ...req.body,
    images: images.length ? images : req.body.images || [],
    ingredients: parseArrayField(req.body.ingredients),
    allergens: parseArrayField(req.body.allergens),
    tags: parseArrayField(req.body.tags),
    weight: parseWeight(req.body.weight, req.body.weightUnit),
    createdBy: req.user._id,
  };
  delete data.weightUnit;
  const product = await Product.create(data);
  return ApiResponse.created(res, product, 'Product created');
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const updates = { ...req.body };
  if (req.files && req.files.length) {
    // If new files uploaded, replace images
    updates.images = req.files.map((f) => ({ public_id: f.filename, url: f.path }));
  } else {
    // No new files — keep existing images by not including them in updates
    delete updates.images;
  }
  updates.ingredients = parseArrayField(updates.ingredients);
  updates.allergens = parseArrayField(updates.allergens);
  updates.tags = parseArrayField(updates.tags);
  updates.weight = parseWeight(updates.weight, updates.weightUnit);
  delete updates.weightUnit;

  const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  return ApiResponse.success(res, updated, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  product.isDeleted = true;
  product.deletedAt = new Date();
  await product.save();
  return ApiResponse.success(res, null, 'Product deleted');
});

export const softDeleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  product.isDeleted = true;
  product.deletedAt = new Date();
  await product.save();
  return ApiResponse.success(res, null, 'Product soft-deleted');
});

export const restoreProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).setOptions({ includeDeleted: true });
  if (!product) throw new ApiError(404, 'Product not found');
  product.isDeleted = false;
  product.deletedAt = undefined;
  await product.save();
  return ApiResponse.success(res, product, 'Product restored');
});

export const bulkUploadProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products)) throw new ApiError(400, 'Products array is required');
  const created = await Product.insertMany(
    products.map((p) => ({ ...p, createdBy: req.user._id })),
    { ordered: false },
  );
  return ApiResponse.created(res, { count: created.length, products: created }, `${created.length} products created`);
});

export const getDeletedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isDeleted: true })
    .populate('category', 'name slug')
    .sort({ deletedAt: -1 });
  return ApiResponse.success(res, products);
});

export const checkCanReview = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const userId = req.user._id;

  const hasPurchased = await Order.findOne({
    user: userId,
    orderStatus: 'Delivered',
    'items.product': productId,
  });

  return ApiResponse.success(res, { canReview: !!hasPurchased });
});

export default {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getTrendingProducts,
  getRelatedProducts,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  softDeleteProduct,
  restoreProduct,
  bulkUploadProducts,
  getDeletedProducts,
  checkCanReview,
};
