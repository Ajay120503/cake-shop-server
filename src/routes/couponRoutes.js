import { Router } from 'express';
import { body } from 'express-validator';
import * as couponCtrl from '../controllers/couponController.js';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.js';
import { validate } from '../utils/validators.js';

const router = Router();

// Public
router.get('/public', couponCtrl.getPublicCoupons);
router.post('/validate', optionalAuth, couponCtrl.validateCoupon);

// Admin
router.get('/', protect, adminOnly, couponCtrl.getCoupons);
router.get('/:id', protect, adminOnly, couponCtrl.getCoupon);
router.post(
  '/',
  protect,
  adminOnly,
  [
    body('code').trim().notEmpty().isLength({ min: 2, max: 30 }),
    body('name').trim().notEmpty(),
    body('discountValue').isFloat({ min: 0 }),
    body('validUntil').isISO8601(),
    validate,
  ],
  couponCtrl.createCoupon,
);
router.put('/:id', protect, adminOnly, couponCtrl.updateCoupon);
router.delete('/:id', protect, adminOnly, couponCtrl.deleteCoupon);

export default router;
