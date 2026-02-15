import { StatusCode } from "@/types/http";
import { ApiError } from "./general-api-error";

export const STORE_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  STORE_NOT_FOUND: 'STORE_NOT_FOUND',
  DUPLICATE_STORE_NAME: 'DUPLICATE_STORE_NAME',
  DUPLICATE_STORE_SLUG: 'DUPLICATE_STORE_SLUG',
  SELLER_NOT_FOUND: 'SELLER_NOT_FOUND',
  SELLER_NOT_APPROVED: 'SELLER_NOT_APPROVED',
  SELLER_ALREADY_HAS_STORE: 'SELLER_ALREADY_HAS_STORE',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  STORE_NOT_ACTIVE: 'STORE_NOT_ACTIVE',
  INVALID_STORE_STATUS: 'INVALID_STORE_STATUS',
  STORE_HAS_PRODUCTS: 'STORE_HAS_PRODUCTS',
} as const;

export type StoreErrorCode = (typeof STORE_ERROR_CODES)[keyof typeof STORE_ERROR_CODES];

/**
 * Custom error class for store-related errors
 */
export class StoreError extends ApiError {
  constructor(
    code: StoreErrorCode,
    message: string,
    statusCode: StatusCode = 400,
    details?: unknown,
  ) {
    super(statusCode, code, message, details);
    this.name = 'StoreError';
  }
}