import { Router } from 'express';

import { documentController } from '@/controllers/document.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { metaDataApiResponse } from '@/middlewares/meta-data.middleware';
import { requestIdMiddleware } from '@/middlewares/request-id.middleware';
import { uploadDocuments, uploadSingleDocument } from '@/middlewares/upload.middleware';

const router = Router();

router.use(requestIdMiddleware);
router.use(metaDataApiResponse);

router.post(
  '/seller/documents',
  authenticate,
  uploadDocuments,
  documentController.uploadSellerDocuments,
);

router.post(
  '/documents/upload',
  authenticate,
  uploadSingleDocument,
  documentController.uploadSingleDocument,
);

router.delete('/documents', authenticate, documentController.deleteDocument);

router.delete('/documents/bulk-delete', authenticate, documentController.deleteMultipleDocuments);

export default router;
