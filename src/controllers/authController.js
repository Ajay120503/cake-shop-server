import crypto from 'crypto';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendTokenResponse, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { sendEmail } from '../utils/sendEmail.js';
import { welcomeTemplate, passwordResetTemplate } from '../utils/emailTemplates.js';
import { verifyGoogleToken } from '../middleware/auth.js';

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new customer
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'An account with this email already exists.');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    authProvider: 'local',
  });

  // Send welcome email (non-blocking)
  sendEmail({
    to: user.email,
    subject: '🎂 Welcome to Cake Shop!',
    html: welcomeTemplate(user.name),
  }).catch(() => {});

  sendTokenResponse(user, 201, res, 'Registration successful! Welcome to Cake Shop 🎂');
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked. Please contact support.');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, 'Logged in successfully');
});

/**
 * @route   POST /api/v1/auth/google
 * @desc    Login or register with Google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken, credential } = req.body;
  const token = idToken || credential;
  if (!token) throw new ApiError(400, 'Google token is required.');

  const payload = await verifyGoogleToken(token);

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = await User.create({
      name: payload.name,
      email: payload.email,
      avatar: { url: payload.picture },
      googleId: payload.sub,
      isEmailVerified: payload.email_verified,
      authProvider: 'google',
    });
    sendEmail({
      to: user.email,
      subject: '🎂 Welcome to Cake Shop!',
      html: welcomeTemplate(user.name),
    }).catch(() => {});
  } else {
    user.googleId = payload.sub;
    user.lastLogin = new Date();
    if (!user.avatar?.url && payload.picture) user.avatar = { url: payload.picture };
    await user.save({ validateBeforeSave: false });
  }

  sendTokenResponse(user, 200, res, 'Logged in with Google');
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user / clear cookies
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  res.cookie('accessToken', '', { maxAge: 1, httpOnly: true });
  res.cookie('refreshToken', '', { maxAge: 1, httpOnly: true });
  if (req.user) {
    req.user.refreshToken = undefined;
    await req.user.save({ validateBeforeSave: false });
  }
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.cookies?.refreshToken
    ? { refreshToken: req.cookies.refreshToken }
    : req.body;

  if (!token) throw new ApiError(401, 'Refresh token missing');

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id);

  if (!user) throw new ApiError(401, 'User not found');
  if (user.isBlocked) throw new ApiError(403, 'Account blocked');

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  res.cookie('accessToken', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new ApiError(404, 'No user found with that email.');

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: '🔐 Password Reset Request',
      html: passwordResetTemplate(resetUrl, user.name),
    });
  } catch (_) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'Email could not be sent. Try again later.');
  }

  res.status(200).json({
    success: true,
    message: 'Password reset link sent to your email.',
  });
});

/**
 * @route   PUT /api/v1/auth/reset-password/:token
 * @desc    Reset password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, 'Token is invalid or has expired.');

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful. You are now logged in.');
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return ApiResponse.success(res, user, 'User fetched');
});

/**
 * @route   PUT /api/v1/auth/update-profile
 * @desc    Update profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(avatar && { avatar }),
    },
    { new: true, runValidators: true },
  );
  return ApiResponse.success(res, user, 'Profile updated');
});

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password changed successfully');
});

export default {
  register,
  login,
  logout,
  refreshToken,
  googleLogin,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};
