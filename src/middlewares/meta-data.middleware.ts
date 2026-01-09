import type { Request, Response, NextFunction } from 'express';

export const metaDataApiResponse = (req: Request, res: Response, next: NextFunction) => {
  res.metaData = {
    path: req.path,
    requestId: req.requestId,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };
  next();
};
