import { Router } from 'express';
import * as categoryCtrl from '../controllers/categoryController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

router.get('/', categoryCtrl.getCategories);
router.get('/:id', categoryCtrl.getCategory);
router.get('/:id/products', categoryCtrl.getCategoryProducts);

router.post('/', protect, adminOnly, uploadSingle('image'), categoryCtrl.createCategory);
router.put('/:id', protect, adminOnly, uploadSingle('image'), categoryCtrl.updateCategory);
router.delete('/:id', protect, adminOnly, categoryCtrl.deleteCategory);

export default router;
