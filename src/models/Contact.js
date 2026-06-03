import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    subject: { type: String, required: true },
    message: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['New', 'In_Progress', 'Resolved', 'Closed'],
      default: 'New',
    },
    reply: String,
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    repliedAt: Date,
    ipAddress: String,
  },
  { timestamps: true },
);

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;
