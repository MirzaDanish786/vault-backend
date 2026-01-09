import { randomUUID } from 'crypto';

import type { Response, Request, NextFunction } from 'express';

import { logger } from '@/utils/logger';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const start = Date.now();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  logger.info({
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    msg: 'Request started',
  });

  res.on('finish', () => {
    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      msg: 'Request completed',
    });
  });

  next();
};
