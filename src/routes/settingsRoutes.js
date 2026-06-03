import { Router } from 'express';
import * as settingsCtrl from '../controllers/settingsController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/public', settingsCtrl.getPublicSettings);
router.get('/', protect, adminOnly, settingsCtrl.getStoreSettings);
router.put('/', protect, adminOnly, uploadSingle('logo'), settingsCtrl.updateStoreSettings);
router.put('/hero-banners', protect, adminOnly, upload.any(), settingsCtrl.updateHeroBanners);
router.put('/gallery', protect, adminOnly, settingsCtrl.updateGallery);
router.put('/section', protect, adminOnly, settingsCtrl.updateSection);
router.put('/payment-methods', protect, adminOnly, settingsCtrl.updatePaymentMethods);
router.get('/all', protect, adminOnly, settingsCtrl.getSettings);
router.put('/key', protect, adminOnly, settingsCtrl.setSetting);

export default router;
