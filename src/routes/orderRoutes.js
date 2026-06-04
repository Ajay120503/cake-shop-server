import { Router } from 'express';
import { body } from 'express-validator';
import * as orderCtrl from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../utils/validators.js';

const router = Router();

// Customer
router.post(
  '/',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('Items are required'),
    body('items.*.product').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('shippingAddress.fullName').notEmpty(),
    body('shippingAddress.phone').notEmpty(),
    body('shippingAddress.addressLine1').notEmpty(),
    body('shippingAddress.city').notEmpty(),
    body('shippingAddress.state').notEmpty(),
    body('shippingAddress.postalCode').notEmpty(),
    body('paymentMethod').trim().notEmpty().isLength({ min: 1, max: 50 }),
    validate,
  ],
  orderCtrl.createOrder,
);

router.get('/my-orders', protect, orderCtrl.getMyOrders);
router.get('/track/:id', protect, orderCtrl.trackOrder);
router.get('/:id', protect, orderCtrl.getOrder);
router.get('/:id/invoice', protect, orderCtrl.getOrderInvoice);
router.put('/:id/cancel', protect, orderCtrl.cancelOrder);

// Admin
router.get('/', protect, adminOnly, orderCtrl.getAllOrders);
router.put('/:id/status', protect, adminOnly, orderCtrl.updateOrderStatus);
router.put('/:id/refund', protect, adminOnly, orderCtrl.refundOrder);

export default router;
