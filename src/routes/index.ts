import { Router } from 'express';

import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);

export default router;
