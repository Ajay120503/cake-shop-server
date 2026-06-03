import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
    },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    landmark: String,
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

addressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await mongoose.model('Address').updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } },
    );
  }
  next();
});

const Address = mongoose.model('Address', addressSchema);
export default Address;
