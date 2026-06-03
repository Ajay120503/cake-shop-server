import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: String,
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    variant: String,
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    landmark: String,
  },
  { _id: false },
);

const paymentResultSchema = new mongoose.Schema(
  {
    id: String,
    status: String,
    method: String,
    email: String,
    contact: String,
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ['Razorpay', 'COD', 'UPI'],
      required: true,
    },
    paymentResult: paymentResultSchema,
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    itemsPrice: { type: Number, required: true, min: 0 },
    taxPrice: { type: Number, default: 0, min: 0 },
    shippingPrice: { type: Number, default: 0, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    couponCode: String,
    totalPrice: { type: Number, required: true, min: 0 },
    orderStatus: {
      type: String,
      enum: [
        'Processing',
        'Confirmed',
        'Preparing',
        'Shipped',
        'Out_for_Delivery',
        'Delivered',
        'Cancelled',
        'Refunded',
      ],
      default: 'Processing',
    },
    statusHistory: [
      {
        status: String,
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    deliveryDate: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    refundAt: Date,
    notes: String,
    isGift: { type: Boolean, default: false },
    giftMessage: String,
    trackingId: String,
    trackingUrl: String,
    isPaid: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ user: 1, createdAt: -1 });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber =
      'CS' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
  }
  next();
});

orderSchema.virtual('itemCount').get(function () {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
