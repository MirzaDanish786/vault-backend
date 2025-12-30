import rateLimit from "express-rate-limit";

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

    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable deprecated `X-RateLimit-*` headers
    skipSuccessfulRequests: options?.skipSuccessfulRequests || false,

    // TODO: complete this in office
    // keyGenerator: options?.keyGenerator || (req: Request)
  });
};
