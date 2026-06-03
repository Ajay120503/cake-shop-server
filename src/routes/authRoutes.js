import { Router } from 'express';
import { body } from 'express-validator';
import * as authCtrl from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../utils/validators.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isLength({ min: 10, max: 15 }),
    validate,
  ],
  authCtrl.register,
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  authCtrl.login,
);

router.post('/google', authCtrl.googleLogin);
router.post('/refresh', authCtrl.refreshToken);
router.post('/logout', protect, authCtrl.logout);

router.post(
  '/forgot-password',
  [body('email').isEmail(), validate],
  authCtrl.forgotPassword,
);

router.put(
  '/reset-password/:token',
  [body('password').isLength({ min: 6 }), validate],
  authCtrl.resetPassword,
);

router.get('/me', protect, authCtrl.getMe);

router.put(
  '/update-profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('phone').optional().isLength({ min: 10, max: 15 }),
    validate,
  ],
  authCtrl.updateProfile,
);

router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be 6+ chars'),
    validate,
  ],
  authCtrl.changePassword,
);

export default router;
