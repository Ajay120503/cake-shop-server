import { Router } from 'express';
import * as analyticsCtrl from '../controllers/analyticsController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/dashboard', analyticsCtrl.getDashboardStats);
router.get('/revenue', analyticsCtrl.getRevenueAnalytics);
router.get('/sales', analyticsCtrl.getSalesReport);
router.get('/top-products', analyticsCtrl.getTopProducts);
router.get('/categories', analyticsCtrl.getCategoryReport);
router.get('/customers', analyticsCtrl.getCustomerReport);

export default router;
