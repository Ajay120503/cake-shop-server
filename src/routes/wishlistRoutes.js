import { Router } from 'express';
import * as wishlistCtrl from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', wishlistCtrl.getMyWishlist);
router.post('/add', wishlistCtrl.addToWishlist);
router.delete('/:productId', wishlistCtrl.removeFromWishlist);
router.delete('/', wishlistCtrl.clearWishlist);

export default router;
