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

  getPendingSellerApplications = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.user?.id;

    if (!adminId) {
      const response = ApiResponse.unauthorized(
        'ADMIN_NOT_AUTHENTICATED',
        'Admin not authenticated',
      );
      return ApiResponse.send(res, response);
    }

    if (!req.pagination) {
      const response = ApiResponse.badRequest(
        'PAGINATION_MISSING',
        'Pagination params are missing',
      );
      return ApiResponse.send(res, response);
    }

    const result = await this.sellerService.getPendingSellerApplications(adminId, req.pagination);
    const apiResponse = ApiResponse.success(result);

    logger.info('Pending seller applications fetched successfully', {
      adminId,
      page: req.pagination.page,
      limit: req.pagination.limit,
      totalItems: result.pagination.totalItems,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };

  getAllSellers = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.user?.id;

    if (!adminId) {
      const response = ApiResponse.unauthorized(
        'ADMIN_NOT_AUTHENTICATED',
        'Admin not authenticated',
      );
      return ApiResponse.send(res, response);
    }

    if (!req.pagination) {
      const response = ApiResponse.badRequest(
        'PAGINATION_MISSING',
        'Pagination params are missing',
      );
      return ApiResponse.send(res, response);
    }

    // Extract filters from query params
    const filters: any = {};

    // Status filters
    if (req.query.sellerStatus) {
      const statusParam = req.query.sellerStatus as string;
      filters.sellerStatus = statusParam.includes(',') ? statusParam.split(',') : statusParam;
    }
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    if (req.query.isSeller !== undefined) {
      filters.isSeller = req.query.isSeller === 'true';
    }
    if (req.query.emailVerified !== undefined) {
      filters.emailVerified = req.query.emailVerified === 'true';
    }
    if (req.query.phoneVerified !== undefined) {
      filters.phoneVerified = req.query.phoneVerified === 'true';
    }

    // Business type
    if (req.query.businessType) {
      filters.businessType = req.query.businessType;
    }

    // Store filters
    if (req.query.hasStore !== undefined) {
      filters.hasStore = req.query.hasStore === 'true';
    }
    if (req.query.storeStatus) {
      filters.storeStatus = req.query.storeStatus;
    }

    // Rating filters
    if (req.query.minRating) {
      filters.minRating = parseFloat(req.query.minRating as string);
    }
    if (req.query.maxRating) {
      filters.maxRating = parseFloat(req.query.maxRating as string);
    }

    // Sales filters
    if (req.query.minSales) {
      filters.minSales = parseInt(req.query.minSales as string, 10);
    }
    if (req.query.maxSales) {
      filters.maxSales = parseInt(req.query.maxSales as string, 10);
    }

    // Date filters
    if (req.query.appliedAfter) {
      filters.appliedAfter = req.query.appliedAfter;
    }
    if (req.query.appliedBefore) {
      filters.appliedBefore = req.query.appliedBefore;
    }
    if (req.query.approvedAfter) {
      filters.approvedAfter = req.query.approvedAfter;
    }
    if (req.query.approvedBefore) {
      filters.approvedBefore = req.query.approvedBefore;
    }

    // Search filters
    if (req.query.search) {
      filters.search = req.query.search as string;
    }
    if (req.query.businessName) {
      filters.businessName = req.query.businessName as string;
    }
    if (req.query.email) {
      filters.email = req.query.email as string;
    }

    // Sorting
    if (req.query.sortBy) {
      filters.sortBy = req.query.sortBy;
    }
    if (req.query.sortOrder) {
      filters.sortOrder = req.query.sortOrder;
    }

    const result = await this.sellerService.getAllSellers(filters, req.pagination);
    const apiResponse = ApiResponse.success(result);

    logger.info('All sellers fetched successfully', {
      adminId,
      filters,
      page: req.pagination.page,
      limit: req.pagination.limit,
      totalItems: result.pagination.totalItems,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };

  suspendSeller = async (req: Request, res: Response): Promise<void> => {
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
        'SUSPENSION_REASON_REQUIRED',
        'Suspension reason is required',
      );
      return ApiResponse.send(res, response);
    }

    const result = await this.sellerService.suspendSeller(sellerId, reason, adminId);
    const apiResponse = ApiResponse.success(result, {
      message: 'Seller suspended successfully',
    });

    logger.info('Seller suspended successfully', {
      sellerId,
      adminId,
      reason,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };

  unsuspendSeller = async (req: Request, res: Response): Promise<void> => {
    const { sellerId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      const response = ApiResponse.unauthorized(
        'ADMIN_NOT_AUTHENTICATED',
        'Admin not authenticated',
      );
      return ApiResponse.send(res, response);
    }

    const result = await this.sellerService.unsuspendSeller(sellerId, adminId);
    const apiResponse = ApiResponse.success(result, {
      message: 'Seller unsuspended successfully',
    });

    logger.info('Seller unsuspended successfully', {
      sellerId,
      adminId,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };
}

export const sellerController = new SellerController();
