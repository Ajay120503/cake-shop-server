import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1500,
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    isApproved: { type: Boolean, default: false },
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
