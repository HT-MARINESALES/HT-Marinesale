import { Router } from 'express';
import authRoutes from './auth';
import listingsRoutes from './listings';
import sellersRoutes from './sellers';
import adminRoutes from './admin';
import contactRoutes from './contact';
import imagesRoutes from './images';
import contractRoute from './contract';
import { authLimiter, uploadLimiter, contractUploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use('/auth', authLimiter, authRoutes);
router.use('/listings', listingsRoutes);
router.use('/seller', sellersRoutes);
router.use('/seller/images', uploadLimiter, imagesRoutes);
router.use('/admin', adminRoutes);
router.use('/contact', contactRoutes);
router.use('/contract', contractUploadLimiter, contractRoute);

export default router;
