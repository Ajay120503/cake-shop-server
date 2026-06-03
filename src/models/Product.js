import mongoose from 'mongoose';
import { createSlug } from '../utils/slugify.js';

const imageSchema = new mongoose.Schema(
  {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 3000,
    },
    shortDescription: {
      type: String,
      maxlength: 300,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    images: [imageSchema],
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    weight: {
      value: Number,
      unit: { type: String, enum: ['g', 'kg', 'ml', 'L', 'pcs'], default: 'g' },
    },
    ingredients: [String],
    allergens: [String],
    deliveryTime: {
      type: String,
      default: 'Same day delivery',
    },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: true },
    isTrending: { type: Boolean, default: false },
    isEggless: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    tags: [String],
    flavor: String,
    occasion: [String],
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    reviewsCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });

productSchema.virtual('finalPrice').get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

productSchema.virtual('inStock').get(function () {
  return this.stock > 0 && this.isAvailable;
});

productSchema.virtual('discountAmount').get(function () {
  if (this.discountPrice > 0) return this.price - this.discountPrice;
  if (this.discountPercent > 0) return (this.price * this.discountPercent) / 100;
  return 0;
});

productSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = createSlug(this.name) + '-' + Date.now().toString(36);
  }
  if (!this.sku) {
    this.sku = 'CS-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
  }
  if (this.discountPrice > 0 && this.price > 0) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  next();
});

productSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted !== true) {
    this.where({ isDeleted: false });
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
