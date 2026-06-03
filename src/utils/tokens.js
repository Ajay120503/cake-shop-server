import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate Access Token
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' },
  );
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
};

/**
 * Generate Random Token (for email verification, password reset)
 */
export const generateRandomToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  return { resetToken, hashedToken };
};

/**
 * Send token response with cookies
 */
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  const cookieExpireDays = Number(process.env.COOKIE_EXPIRE) || 7;

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: cookieExpireDays * 24 * 60 * 60 * 1000,
    path: '/',
  };

  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: cookieExpireDays * 2 * 24 * 60 * 60 * 1000,
  });

  // Remove password from output
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
};
