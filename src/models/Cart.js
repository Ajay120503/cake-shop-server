import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: String,
    image: String,
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    variant: String,
    customMessage: String,
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    coupon: {
      code: String,
      discountType: String,
      discountValue: Number,
      discount: { type: Number, default: 0 },
    },
    totals: {
      itemsPrice: { type: Number, default: 0 },
      taxPrice: { type: Number, default: 0 },
      shippingPrice: { type: Number, default: 0 },
      discountPrice: { type: Number, default: 0 },
      totalPrice: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
