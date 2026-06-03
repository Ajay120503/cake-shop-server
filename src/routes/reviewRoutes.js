import { Router } from 'express';
import { body } from 'express-validator';
import * as reviewCtrl from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../utils/validators.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = Router();

router.post(
  '/',
  protect,
  uploadMultiple('images', 5),
  [
    body('product').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').trim().notEmpty().isLength({ max: 1500 }),
    validate,
  ],
  reviewCtrl.createReview,
);

router.get('/admin/all', protect, adminOnly, reviewCtrl.getAllReviews);
router.get('/my-reviews', protect, reviewCtrl.getUserReviews);
router.put('/:id', protect, reviewCtrl.updateReview);
router.delete('/:id', protect, reviewCtrl.deleteReview);
router.put('/:id/approve', protect, adminOnly, reviewCtrl.approveReview);
router.put('/:id/helpful', protect, reviewCtrl.markHelpful);
router.post('/:id/helpful', protect, reviewCtrl.markHelpful);

export default router;
