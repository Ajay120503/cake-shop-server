import mongoose from 'mongoose';
import { createSlug } from '../utils/slugify.js';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: 50,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    image: {
      public_id: String,
      url: {
        type: String,
        default: 'https://res.cloudinary.com/dwukp7e0q/image/upload/v1/cake-shop/default-category.png',
      },
    },
    icon: String,
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

categorySchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = createSlug(this.name);
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
