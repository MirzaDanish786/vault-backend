import { Router } from 'express';

import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import documentRoutes from './document.route';
import healthRoutes from './health.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/', documentRoutes);

export default router;
