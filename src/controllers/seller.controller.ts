import { Request, Response } from 'express';

import { sellerApplicationSchema, SellerService } from '@/services/seller';
import { ApiResponse } from '@/utils/api-response';
import { logger } from '@/utils/logger';

export class SellerController {
  private sellerService: SellerService;
  constructor() {
    this.sellerService = new SellerService();
  }

  applyAsSeller = async (req: Request, res: Response) => {
    const validation = sellerApplicationSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message || 'Invalid';
      const response = ApiResponse.badRequest('VALIDATION_ERROR', firstError);
      logger.error('Validation error', { error: firstError });
      return ApiResponse.send(res, response);
    }
    const validatedData = validation.data;
    const result = await this.sellerService.applyAsSeller(validatedData);
    const apiResponse = ApiResponse.created(result);
    logger.info('Seller application submitted successfully', {
      result,
    });
    ApiResponse.send(res, apiResponse);
  };

  getSellerPublicProfile = async (req: Request, res: Response): Promise<void> => {
    const { sellerId } = req.params;

    const result = await this.sellerService.getSellerPublicProfile(sellerId);
    const apiResponse = ApiResponse.success(result);

    logger.info('Seller public profile fetched successfully', {
      sellerId,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };

  getSellerAdminProfile = async (req: Request, res: Response): Promise<void> => {
    const { sellerId } = req.params;

    const result = await this.sellerService.getSellerAdminProfile(sellerId);
    const apiResponse = ApiResponse.success(result);

    logger.info('Seller admin profile fetched successfully', {
      sellerId,
      requestId: req.requestId,
      adminId: req.user?.id,
    });

    ApiResponse.send(res, apiResponse);
  };

  approveSeller = async (req: Request, res: Response): Promise<void> => {
    const { sellerId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      const response = ApiResponse.unauthorized(
        'ADMIN_NOT_AUTHENTICATED',
        'Admin not authenticated',
      );
      return ApiResponse.send(res, response);
    }

    const result = await this.sellerService.approveSeller(sellerId, adminId);
    const apiResponse = ApiResponse.success(result, {
      message: 'Seller approved successfully',
    });

    logger.info('Seller approved successfully', {
      sellerId,
      adminId,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };

  rejectSeller = async (req: Request, res: Response): Promise<void> => {
    const { sellerId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      const response = ApiResponse.unauthorized(
        'ADMIN_NOT_AUTHENTICATED',
        'Admin not authenticated',
      );
      return ApiResponse.send(res, response);
    }

    if (!reason) {
      const response = ApiResponse.badRequest(
        'REJECTION_REASON_REQUIRED',
        'Rejection reason is required',
      );
      return ApiResponse.send(res, response);
    }

    const result = await this.sellerService.rejectSeller(sellerId, reason, adminId);
    const apiResponse = ApiResponse.success(result, {
      message: 'Seller rejected successfully',
    });

    logger.info('Seller rejected successfully', {
      sellerId,
      adminId,
      reason,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };
}

export const sellerController = new SellerController();
