import { Router } from 'express';

import { PERMISSIONS } from '@/config/constants';
import { categoryController } from '@/controllers/category.controller';
import { authenticate, requirePermission } from '@/middlewares/auth.middleware';
import { metaDataApiResponse } from '@/middlewares/meta-data.middleware';
import { requestIdMiddleware } from '@/middlewares/request-id.middleware';
import { logger } from '@/utils/logger';

const router = Router();
router.use(requestIdMiddleware);
router.use(metaDataApiResponse);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CATEGORY_WRITE),
  categoryController.createCategory,
);

router.get(
  '/id/:id',
  //   requirePermission(PERMISSIONS.CATEGORY_READ),
  categoryController.findCategoryById,
);
router.get('/slug/:slug', categoryController.findCategoryBySlug);

// Find categories by filters and searching API route:
router.get('/', categoryController.findAllCategoriesByFilters);

router.put('/test/:id', authenticate, requirePermission(PERMISSIONS.CATEGORY_WRITE), (req, res) => {
  logger.debug('Test route hit', { params: req.params, id: req.params.id });
  res.json({ success: true, params: req.params });
});
router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CATEGORY_WRITE),
  categoryController.updateCategory,
);

router.delete(
  '/id/:id',
  authenticate,
  requirePermission(PERMISSIONS.CATEGORY_ALL),
  categoryController.deleteCategory,
);

export default router;
