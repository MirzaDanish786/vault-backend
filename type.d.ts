import { Response } from "express";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }

    interface Response {
      metaData?: {
        path: string;
        requestId?: string;
        timestamp?: string
      };
    }
  }
}
