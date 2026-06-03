import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: String,
    isActive: { type: Boolean, default: true },
    source: { type: String, default: 'website' },
    unsubscribedAt: Date,
  },
  { timestamps: true },
);

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
export default Subscriber;
