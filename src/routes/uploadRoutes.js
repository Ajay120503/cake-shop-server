import { Router } from 'express';
import * as uploadCtrl from '../controllers/uploadController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.js';

const router = Router();

router.post('/image', protect, adminOnly, uploadSingle('image'), uploadCtrl.uploadImage);
router.post('/images', protect, adminOnly, uploadMultiple('images', 10), uploadCtrl.uploadMultipleImages);
router.post('/signature', protect, uploadCtrl.getSignature);
router.post('/delete', protect, adminOnly, uploadCtrl.deleteImage);
router.post('/delete-multiple', protect, adminOnly, uploadCtrl.deleteMultipleImages);

export default router;
