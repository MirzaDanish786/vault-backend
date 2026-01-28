import { Request, Response } from 'express';

import { FileError } from '@/errors/file.error';
import { FileService } from '@/services/file/file.service';
import { ApiResponse } from '@/utils/api-response';
import { logger } from '@/utils/logger';

export class DocumentController {
  private fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  uploadSellerDocuments = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || Object.keys(files).length === 0) {
      return ApiResponse.send(res, ApiResponse.badRequest('NO_FILES', 'No files uploaded'));
    }

    const uploadResults: Record<string, any> = {};

    for (const [fieldName, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];

        this.fileService.validateFile(file);

        const result = await this.fileService.uploadDocument(
          file.buffer,
          userId!,
          fieldName,
          file.originalname,
        );

        uploadResults[fieldName] = {
          url: result.url,
          publicId: result.publicId,
          size: result.size,
          uploadedAt: new Date(),
        };
      }
    }

    logger.info('Documents uploaded successfully', {
      userId,
      documentCount: Object.keys(uploadResults).length,
    });

    ApiResponse.send(
      res,
      ApiResponse.success({
        message: 'Documents uploaded successfully',
        documents: uploadResults,
        total: Object.keys(uploadResults).length,
      }),
    );
  };

  uploadSingleDocument = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { documentType } = req.body;
    const file = req.file;

    if (!file) {
      return ApiResponse.send(res, ApiResponse.badRequest('NO_FILE', 'No file uploaded'));
    }

    if (
      !documentType ||
      !['GOVERNMENT_ID', 'TAX_CERTIFICATE', 'ADDRESS_PROOF', 'BANK_STATEMENT'].includes(
        documentType,
      )
    ) {
      return ApiResponse.send(
        res,
        ApiResponse.badRequest('INVALID_DOCUMENT_TYPE', 'Invalid document type'),
      );
    }

    this.fileService.validateFile(file);
    const result = await this.fileService.uploadDocument(
      file.buffer,
      userId!,
      documentType,
      file.originalname,
    );

    logger.info('Single document uploaded', {
      userId,
      documentType,
      publicId: result.publicId,
    });

    ApiResponse.send(
      res,
      ApiResponse.success({
        url: result.url,
        publicId: result.publicId,
        documentType,
        uploadedAt: new Date(),
      }),
    );
  };

  deleteDocument = async (req: Request, res: Response) => {
    const { publicId } = req.body;
    const userId = req.user?.id;
    if (!publicId) {
      return ApiResponse.send(
        res,
        ApiResponse.badRequest('MISSING_PUBLIC_ID', 'publicId is required'),
      );
    }
    const normalizePublicId = publicId.trim();
    await this.fileService.deleteFile(normalizePublicId);

    logger.info('Document deleted', { userId, publicId });

    ApiResponse.send(
      res,
      ApiResponse.success({
        message: 'Document deleted successfully',
        publicId,
      }),
    );
  };

  deleteMultipleDocuments = async (req: Request, res: Response) => {
    const { publicIds } = req.body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return ApiResponse.send(
        res,
        ApiResponse.badRequest(
          'PUBLIC_IDS_REQUIRED',
          'publicIds array is required and cannot be empty',
        ),
      );
    }

    const results = await this.fileService.deleteMultipleFiles(publicIds);

    ApiResponse.send(
      res,
      ApiResponse.success({
        message: 'Documents deletion completed',
        results,
        summary: {
          total: publicIds.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
        },
      }),
    );
  };
}

export const documentController = new DocumentController();
