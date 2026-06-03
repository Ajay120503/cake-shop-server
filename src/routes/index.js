import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import orderRoutes from './orderRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import couponRoutes from './couponRoutes.js';
import userRoutes from './userRoutes.js';
import addressRoutes from './addressRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';
import cartRoutes from './cartRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import contactRoutes from './contactRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json(ApiResponse.success(res, { status: 'OK', uptime: process.uptime(), timestamp: new Date() }, 'Cake Shop API is healthy'));
});

// Mount all routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/users', userRoutes);
router.use('/addresses', addressRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/cart', cartRoutes);
router.use('/payment', paymentRoutes);
router.use('/settings', settingsRoutes);
router.use('/contact', contactRoutes);
router.use('/newsletter', contactRoutes); // alias
router.use('/analytics', analyticsRoutes);
router.use('/upload', uploadRoutes);

export default router;
