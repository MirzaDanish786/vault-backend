import { Router } from 'express';

import { authController } from '@/controllers/auth.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { metaDataApiResponse } from '@/middlewares/meta-data.middleware';
import { authRateLimiter } from '@/middlewares/rate-limiter.middleware';
import { requestIdMiddleware } from '@/middlewares/request-id.middleware';

const router = Router();

router.use(requestIdMiddleware);
router.use(metaDataApiResponse);
router.use(authRateLimiter);

router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);
router.post('/signout', authController.signOut);
router.get('/me', authenticate, authController.getUserDetails);
router.post('/refresh', authController.refreshToken);

export default router;
