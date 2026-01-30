import { Router } from 'express';

import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import documentRoutes from './document.route';
import healthRoutes from './health.routes';
import sellerRoutes from './seller.route';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/', documentRoutes);

router.use('/sellers', sellerRoutes);

export default router;
