import { Request } from 'express';
import multer from 'multer';

import { SellerError } from '@/services/seller/seller.types';

// Memory storage (process file then upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new SellerError('INVALID_FILE_TYPE', 'Invalid file type', 400) as any);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files at once
  },
});

// Middleware for document uploads
export const uploadDocuments = upload.fields([
  { name: 'governmentId', maxCount: 1 },
  { name: 'taxCertificate', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 },
]);

// Middleware for single document
export const uploadSingleDocument = upload.single('document');
