import { Router } from 'express';
import * as cartCtrl from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', cartCtrl.getMyCart);
router.post('/add', cartCtrl.addToCart);
router.put('/item/:itemId', cartCtrl.updateCartItem);
router.delete('/item/:itemId', cartCtrl.removeFromCart);
router.delete('/', cartCtrl.clearCart);
router.post('/coupon', cartCtrl.applyCoupon);
router.delete('/coupon', cartCtrl.removeCoupon);

export default router;
