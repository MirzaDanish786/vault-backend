import { Router } from 'express';

import { PERMISSIONS } from '@/config/permissions';
import { storeController } from '@/controllers/store.controller';
import { authenticate, requirePermission } from '@/middlewares/auth.middleware';
import { metaDataApiResponse } from '@/middlewares/meta-data.middleware';
import { requestIdMiddleware } from '@/middlewares/request-id.middleware';

const router = Router();

router.use(requestIdMiddleware);
router.use(metaDataApiResponse);

router.get('/', storeController.getAllStoresByFilters);

router.get('/:id', storeController.getStoreById);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.STORE_CREATE),
  storeController.createStore,
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.STORE_OWN_UPDATE),
  storeController.updateStore,
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.STORE_OWN_DELETE),
  storeController.deleteStore,
);

router.get(
  '/admin/:id',
  authenticate,
  requirePermission(PERMISSIONS.STORE_ALL),
  storeController.getAnyStoreById,
);

export default router;
