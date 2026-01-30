import { Router } from 'express';

import { sellerController } from '@/controllers/seller.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { metaDataApiResponse } from '@/middlewares/meta-data.middleware';
import { paginationMiddleware } from '@/middlewares/pagination.middleware';
import { requestIdMiddleware } from '@/middlewares/request-id.middleware';

const router = Router();

router.use(requestIdMiddleware);
router.use(metaDataApiResponse);

router.post('/apply', authenticate, sellerController.applyAsSeller);

router.get('/:sellerId/profile', sellerController.getSellerPublicProfile);

// Admin only route
router.get(
  '/:sellerId/admin-profile',
  authenticate,
  requireRole('ADMIN'),
  sellerController.getSellerAdminProfile,
);

// Admin only - Approve seller
router.patch(
  '/:sellerId/approve',
  authenticate,
  requireRole('ADMIN'),
  sellerController.approveSeller,
);

// Admin only - Reject seller
router.patch(
  '/:sellerId/reject',
  authenticate,
  requireRole('ADMIN'),
  sellerController.rejectSeller,
);

// Admin only - Get pending seller applications with pagination
router.get(
  '/pending/applications',
  authenticate,
  requireRole('ADMIN'),
  paginationMiddleware({ defaultLimit: 10, maxLimit: 50 }),
  sellerController.getPendingSellerApplications,
);

export default router;
