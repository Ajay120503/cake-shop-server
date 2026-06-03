import { Router } from 'express';
import * as paymentCtrl from '../controllers/paymentController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/key', paymentCtrl.getRazorpayKey);
router.post('/razorpay/create', protect, paymentCtrl.createRazorpayOrder);
router.post('/razorpay/verify', protect, paymentCtrl.verifyRazorpayPayment);
router.post('/mock/verify', protect, paymentCtrl.mockVerifyPayment);
router.post('/cod/confirm', protect, paymentCtrl.confirmCOD);
router.post('/refund', protect, adminOnly, paymentCtrl.initiateRefund);

export default router;
