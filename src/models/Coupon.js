import mongoose from 'mongoose';
import { createSlug } from '../utils/slugify.js';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    description: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: { type: Number, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    usageLimit: { type: Number, default: null },
    usagePerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        usedAt: { type: Date, default: Date.now },
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      },
    ],
    applicableCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    ],
    applicableProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ],
    excludedProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ],
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

couponSchema.pre('save', function (next) {
  if (this.isModified('code') || !this.slug) {
    this.slug = createSlug(this.code);
  }
  next();
});

couponSchema.methods.isValid = function (orderAmount, userId) {
  if (!this.isActive) return { valid: false, reason: 'Coupon is not active' };
  const now = new Date();
  if (now < this.validFrom) return { valid: false, reason: 'Coupon is not yet valid' };
  if (now > this.validUntil) return { valid: false, reason: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit)
    return { valid: false, reason: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount)
    return {
      valid: false,
      reason: `Minimum order amount is ₹${this.minOrderAmount}`,
    };
  if (userId) {
    const userUses = this.usedBy.filter(
      (u) => u.user.toString() === userId.toString(),
    ).length;
    if (userUses >= this.usagePerUser)
      return { valid: false, reason: 'You have already used this coupon' };
  }
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscountAmount) {
      discount = Math.min(discount, this.maxDiscountAmount);
    }
  } else {
    discount = this.discountValue;
  }
  return Math.min(discount, orderAmount);
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
