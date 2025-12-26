import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/error";
import { logger } from "@/utils/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details || null,
    });
  }

  logger.error(err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
}
