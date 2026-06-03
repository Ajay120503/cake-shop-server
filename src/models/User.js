import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      public_id: String,
      url: {
        type: String,
        default: 'https://res.cloudinary.com/dwukp7e0q/image/upload/v1/cake-shop/default-avatar.png',
      },
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    // OAuth
    googleId: String,
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Email verification
    emailVerificationToken: String,
    emailVerificationExpire: Date,

    // Refresh token (rotated)
    refreshToken: String,
    refreshTokenExpire: Date,

    // Last login
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return this.name;
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min
  return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

const User = mongoose.model('User', userSchema);
export default User;
