import { Router } from 'express';

import { getHealthStatus } from '@/controllers/health.controller';
import { requestIdMiddleware } from '@/middlewares/request-id.middleware';

const router = Router();

// GET /api/health
router.use(requestIdMiddleware);

router.get('/', getHealthStatus);

export default router;
