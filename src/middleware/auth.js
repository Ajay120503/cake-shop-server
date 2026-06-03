import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Protect routes - require authenticated user
 */
// export const protect = asyncHandler(async (req, res, next) => {
//   let token;

//   // Read from Authorization header or cookies
//   if (req.headers.authorization?.startsWith('Bearer ')) {
//     token = req.headers.authorization.split(' ')[1];
//   } else if (req.cookies?.accessToken) {
//     token = req.cookies.accessToken;
//   }

//   if (!token) {
//     throw new ApiError(401, 'Not authorized. Please log in to access this resource.');
//   }

//   try {
//     const decoded = verifyAccessToken(token);
//     const user = await User.findById(decoded.id).select('-password');

//     if (!user) {
//       throw new ApiError(401, 'User belonging to this token no longer exists.');
//     }

//     if (!user.isActive || user.isBlocked) {
//       throw new ApiError(403, 'Your account has been blocked. Please contact support.');
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       throw new ApiError(401, 'Token expired. Please log in again.');
//     }
//     if (error.name === 'JsonWebTokenError') {
//       throw new ApiError(401, 'Invalid token. Please log in again.');
//     }
//     throw error;
//   }
// });

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  console.log("AUTH HEADER:", req.headers.authorization);
  console.log("COOKIE TOKEN:", req.cookies?.accessToken);

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  console.log("TOKEN FOUND:", token ? "YES" : "NO");

  if (!token) {
    throw new ApiError(401, 'Not authorized. Please log in to access this resource.');
  }

  try {
    const decoded = verifyAccessToken(token);
    console.log("DECODED:", decoded);

    const user = await User.findById(decoded.id).select('-password');
    console.log("USER FOUND:", !!user);

    req.user = user;
    next();
  } catch (error) {
    console.log("AUTH ERROR:", error.message);
    throw error;
  }
});

/**
 * Optional auth - attach user if token is present, but don't fail if not
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive && !user.isBlocked) {
        req.user = user;
      }
    } catch (_) {
      // ignore
    }
  }
  next();
});

/**
 * Restrict to specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authorized.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not authorized to access this resource.`),
      );
    }
    next();
  };
};

/**
 * Admin only
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required.'));
  }
  next();
};

/**
 * Verify Google ID token (for Google Login)
 */
export const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload; // { email, name, picture, sub, email_verified }
  } catch (error) {
    throw new ApiError(401, 'Invalid Google token');
  }
};

export default protect;
