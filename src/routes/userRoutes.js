import { Router } from 'express';
import * as userCtrl from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/me/stats', protect, userCtrl.getUserStats);
router.get('/', protect, adminOnly, userCtrl.getUsers);
router.get('/:id', protect, adminOnly, userCtrl.getUser);
router.put('/:id', protect, adminOnly, userCtrl.updateUser);
router.put('/:id/block', protect, adminOnly, userCtrl.blockUser);
router.put('/:id/unblock', protect, adminOnly, userCtrl.unblockUser);
router.delete('/:id', protect, adminOnly, userCtrl.deleteUser);

export default router;
