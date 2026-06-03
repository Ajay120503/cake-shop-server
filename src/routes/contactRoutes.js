import { Router } from 'express';
import * as contactCtrl from '../controllers/contactController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/', contactCtrl.submitContact);
router.post('/subscribe', contactCtrl.subscribe);
router.post('/unsubscribe', contactCtrl.unsubscribe);

// Admin
router.get('/', protect, adminOnly, contactCtrl.getAllContacts);
router.put('/:id', protect, adminOnly, contactCtrl.updateContact);
router.delete('/:id', protect, adminOnly, contactCtrl.deleteContact);
router.get('/subscribers', protect, adminOnly, contactCtrl.getSubscribers);

export default router;
