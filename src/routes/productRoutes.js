import { Router } from 'express';
import * as productCtrl from '../controllers/productController.js';
import * as reviewCtrl from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = Router();

// Public routes
router.get('/', productCtrl.getProducts);
router.get('/search', productCtrl.searchProducts);
router.get('/featured', productCtrl.getFeaturedProducts);
router.get('/best-sellers', productCtrl.getBestSellers);
router.get('/new-arrivals', productCtrl.getNewArrivals);
router.get('/trending', productCtrl.getTrendingProducts);
router.get('/related/:id', productCtrl.getRelatedProducts);
router.get('/:id', productCtrl.getProduct);
router.get('/:productId/reviews', reviewCtrl.getProductReviews);

// Admin routes
router.post('/', protect, adminOnly, uploadMultiple('images', 10), productCtrl.createProduct);
router.put('/:id', protect, adminOnly, uploadMultiple('images', 10), productCtrl.updateProduct);
router.delete('/:id', protect, adminOnly, productCtrl.deleteProduct);
router.patch('/:id/soft-delete', protect, adminOnly, productCtrl.softDeleteProduct);
router.patch('/:id/restore', protect, adminOnly, productCtrl.restoreProduct);
router.post('/bulk-upload', protect, adminOnly, productCtrl.bulkUploadProducts);
router.get('/admin/deleted', protect, adminOnly, productCtrl.getDeletedProducts);

export default router;
