import rateLimit from "express-rate-limit";
import { Request } from "express";
import { logger } from "@/utils/logger";
import { ApiResponse } from "@/utils/api-response";

export const rateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || 15 * 60 * 1000,
    max: options?.max || 100,
    message: options?.message || "Too many requests, please try again later.",

    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options?.skipSuccessfulRequests || false,

    keyGenerator:
      options?.keyGenerator ||
      ((req: Request) => {
        const userAgent = req.get("user-agent") || "unknown";
        const apiKey = req.get("x-api-key") || "no-api-key";

        if (req.user?.id) {
          return `user:${req.user.id}:${req.path}`;
        }

        return `ip:${req.ip}:${userAgent}:${req.path}:${apiKey}`;
      }),

    skip: (req) => {
      const apiKey = req.get("x-api-key");
      const internalKeys = process.env.INTERNAL_API_KEYS?.split(",") || [];

      if (apiKey && internalKeys.includes(apiKey)) {
        logger.debug("Rate limiting skipped for internal service", {
          apiKey,
          path: req.path,
        });
        return true;
      }

      return req.path === "/api/health";
    },

    handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime
        ? new Date(req.rateLimit.resetTime).toISOString()
        : undefined;

      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        path: req.path,
        method: req.method,
        limit: req.rateLimit?.limit,
        remaining: req.rateLimit?.remaining,
        resetTime,
      });

      const response = ApiResponse.badRequest(
        "RATE_LIMIT_EXCEEDED",
        options?.message || "Too many requests, please try again later.",
        {
          retryAfter: req.rateLimit?.resetTime
            ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
            : undefined,
        },
        {
          path: req.path,
          action: "rate_limited",
        }
      );

      if (req.rateLimit?.resetTime) {
        res.setHeader(
          "Retry-After",
          Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        );
      }

      ApiResponse.send(res, response);
    },
  });
};

// Specialized rate limiters for different endpoints
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 attempts for auth endpoints
  message: 'Too many authentication attempts. Please try again later.',
});

export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // 100 requests for general API
});

export const strictRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                  // 10 requests per hour
  message: 'Too many requests to this endpoint. Please try again in an hour.',
});


/**
 * Dynamic rate limiter based on user role
 */
export const roleBasedRateLimiter = (req: Request) => {
  const userRole = req.user?.role;
  
  switch (userRole) {
    case 'ADMIN':
      return rateLimiter({ windowMs: 15 * 60 * 1000, max: 1000 }); // High limit
    case 'SELLER':
      return rateLimiter({ windowMs: 15 * 60 * 1000, max: 500 });  // Medium limit
    case 'USER':
      return rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 });  // Standard limit
    default:
      return rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 });   // Anonymous limit
  }
};
