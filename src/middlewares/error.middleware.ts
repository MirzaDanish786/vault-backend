import type { Request, Response, NextFunction } from 'express';

import type { ErrorCode } from '@/types/error';
import { ApiResponse } from '@/utils/api-response';
import { ApiError } from '@/utils/error';
import { logger } from '@/utils/logger';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const requestId = req.requestId;
  const path = req.path;

  const error = err instanceof Error ? err : new Error(String(err));

  // If it is our custom ApiError
  if (err instanceof ApiError) {
    const apiResponse = new ApiResponse(false, {
      error: {
        code: err.code as ErrorCode,
        message: err.message,
        details: err.details,
      },
      meta: {
        path,
        requestId,
        method: req.method,
        ip: req.ip,
      },
      statusCode: err.statusCode,
    });

    logger.error('API error occurred', {
      requestId,
      message: err.message,
      stack: err.stack,
      code: err.code,
    });

    return ApiResponse.send(res, apiResponse);
  }

  // For all other unknown errors
  logger.error('Unhandled error', {
    requestId,
    message: error.message,
    stack: error.stack,
  });

  const apiResponse = ApiResponse.internalError(error, {
    path,
    requestId,
    method: req.method,
    ip: req.ip,
  });

  return ApiResponse.send(res, apiResponse);
}
