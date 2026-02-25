import { Request, Response } from 'express';

import { storeService } from '@/services/store';
import {
  createStoreSchema,
  storeFiltersSchema,
  storeIdSchema,
  StoreValidator,
  updateStoreSchema,
} from '@/services/store/store.validator';
import { ApiResponse } from '@/utils/api-response';
import { logger } from '@/utils/logger';

export class StoreController {
  // Create Store
  createStore = async (req: Request, res: Response) => {
    const validation = createStoreSchema.safeParse(req.body);

    if (!validation.success) {
      const firstError = validation.error.issues[0].message || 'Invalid input';
      const response = ApiResponse.badRequest('VALIDATION_ERROR', firstError);
      logger.error('Store creation validation error', { error: firstError });
      return ApiResponse.send(res, response);
    }

    if (!req.user?.id) {
      const response = ApiResponse.unauthorized('UNAUTHORIZED', 'User authentication required');
      logger.error('Store creation attempted without authentication');
      return ApiResponse.send(res, response);
    }

    const sellerId = req.user.id;
    const validatedData = validation.data;
    const store = await storeService.createStore(sellerId, validatedData);

    const apiResponse = ApiResponse.created(store);
    logger.info('Store created successfully via controller', { storeId: store.id });
    ApiResponse.send(res, apiResponse);
  };

  // Update Store
  updateStore = async (req: Request, res: Response) => {
    const idValidation = storeIdSchema.safeParse(req.params.id);

    if (!idValidation.success) {
      const firstError = idValidation.error.issues[0].message || 'Invalid store ID';
      const response = ApiResponse.badRequest('VALIDATION_ERROR', firstError);
      logger.error('Store ID validation error', { error: firstError });
      return ApiResponse.send(res, response);
    }

    const dataValidation = updateStoreSchema.safeParse(req.body);

    if (!dataValidation.success) {
      const firstError = dataValidation.error.issues[0].message || 'Invalid input';
      const response = ApiResponse.badRequest('VALIDATION_ERROR', firstError);
      logger.error('Store update validation error', { error: firstError });
      return ApiResponse.send(res, response);
    }

    const storeId = idValidation.data;
    const validatedData = dataValidation.data;

    if (!req.user?.id) {
      const response = ApiResponse.unauthorized('UNAUTHORIZED', 'User authentication required');
      logger.error('Store update attempted without authentication');
      return ApiResponse.send(res, response);
    }

    const sellerId = req.user.id;

    const updatedStore = await storeService.updateStore(storeId, validatedData, sellerId);

    const apiResponse = ApiResponse.success(updatedStore);
    logger.info('Store updated successfully via controller', { storeId });
    ApiResponse.send(res, apiResponse);
  };

  // Delete Store (Soft Delete)
  deleteStore = async (req: Request, res: Response) => {
    const validation = storeIdSchema.safeParse(req.params.id);

    if (!validation.success) {
      const firstError = validation.error.issues[0].message || 'Invalid store ID';
      const response = ApiResponse.badRequest('VALIDATION_ERROR', firstError);
      logger.error('Store ID validation error', { error: firstError });
      return ApiResponse.send(res, response);
    }

    const storeId = validation.data;
    const forceDelete = req.query.forceDelete === 'true';

    if (!req.user?.id) {
      const response = ApiResponse.unauthorized('UNAUTHORIZED', 'User authentication required');
      logger.error('Store deletion attempted without authentication');
      return ApiResponse.send(res, response);
    }

    const sellerId = req.user.id;

    const result = await storeService.deleteStore(storeId, sellerId, forceDelete);

    const apiResponse = ApiResponse.success(result);
    logger.info('Store deleted successfully via controller', { storeId });
    ApiResponse.send(res, apiResponse);
  };

  // Get Store by ID (public endpoint - anyone can view stores)
  getStoreById = async (req: Request, res: Response) => {
    const validation = storeIdSchema.safeParse(req.params.id);

    if (!validation.success) {
      const firstError = validation.error.issues[0].message || 'Invalid store ID';
      const response = ApiResponse.badRequest('VALIDATION_ERROR', firstError);
      logger.error('Store ID validation error', { error: firstError });
      return ApiResponse.send(res, response);
    }

    const storeId = validation.data;
    const includeSeller = req.query.includeSeller === 'true';

    const store = await storeService.getStoreByIdPublic(storeId, includeSeller);

    const apiResponse = ApiResponse.success(store);
    ApiResponse.send(res, apiResponse);
  };

  // Get any Store by ID (for admin)
  getAnyStoreById = async (req: Request, res: Response) => {
    const validation = storeIdSchema.safeParse(req.params.id);

    if (!validation.success) {
      const firstError = validation.error.issues[0].message || 'Invalid store ID';
      const response = ApiResponse.badRequest('VALIDATION_ERROR', firstError);
      logger.error('Store ID validation error', { error: firstError });
      return ApiResponse.send(res, response);
    }

    const storeId = validation.data;
    const store = await storeService.getAnyStoreById(storeId);

    const apiResponse = ApiResponse.success(store);
    ApiResponse.send(res, apiResponse);
  };

  // Get all stores by filters (public endpoint)
  getAllStoresByFilters = async (req: Request, res: Response) => {
    const validation = storeFiltersSchema.safeParse(req.query);

    if (!validation.success) {
      const firstError = validation.error.issues[0].message || 'Invalid filter parameters';
      const response = ApiResponse.badRequest('VALIDATION_ERROR', firstError);
      logger.error('Store filters validation error', { error: firstError });
      return ApiResponse.send(res, response);
    }

    const validatedFilters = validation.data;
    const result = await storeService.getStoresByFilters(validatedFilters);

    const apiResponse = ApiResponse.success(result);
    ApiResponse.send(res, apiResponse);
  };
}

export const storeController = new StoreController();
