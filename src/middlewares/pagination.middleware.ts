import { Request, Response, NextFunction } from 'express';

import { parsePaginationParams } from '@/utils/pagination';

/**
 * Middleware to parse pagination parameters from query string
 * Adds `req.pagination` to the request object
 *
 * Usage in routes:
 * router.get('/items', paginationMiddleware(), controller.getItems)
 */
export function paginationMiddleware(options?: { defaultLimit?: number; maxLimit?: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { page, limit } = req.query;

    req.pagination = parsePaginationParams(page as string, limit as string, options);

    next();
  };
}
