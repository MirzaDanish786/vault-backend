import { ApiError } from './general-api-error';

import { StatusCode } from '@/types/http';

export const SELLER_ERROR_CODES = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  FILE_REQUIRED: 'FILE_REQUIRED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',

  // Application errors
  SELLER_ALREADY_APPLIED: 'SELLER_ALREADY_APPLIED',
  ALREADY_A_SELLER: 'ALREADY_A_SELLER',
  BUSINESS_EMAIL_EXISTS: 'BUSINESS_EMAIL_EXISTS',
  TAX_ID_EXISTS: 'TAX_ID_EXISTS',
  INVALID_TAX_ID: 'INVALID_TAX_ID',
  TERMS_NOT_ACCEPTED: 'TERMS_NOT_ACCEPTED',

  // Status errors
  SELLER_NOT_FOUND: 'SELLER_NOT_FOUND',
  NOT_A_SELLER: 'NOT_A_SELLER',
  SELLER_NOT_PENDING: 'SELLER_NOT_PENDING',
  SELLER_ALREADY_APPROVED: 'SELLER_ALREADY_APPROVED',
  SELLER_ALREADY_REJECTED: 'SELLER_ALREADY_REJECTED',
  SELLER_ALREADY_SUSPENDED: 'SELLER_ALREADY_SUSPENDED',
  SELLER_NOT_SUSPENDED: 'SELLER_NOT_SUSPENDED',

  // Permission errors
  CANNOT_APPROVE_SELF: 'CANNOT_APPROVE_SELF',
  INSUFFICIENT_PRIVILEGES: 'INSUFFICIENT_PRIVILEGES',
  CANNOT_MODIFY_ADMIN: 'CANNOT_MODIFY_ADMIN',

  // Validation errors
  INVALID_BUSINESS_NAME: 'INVALID_BUSINESS_NAME',
  INVALID_BUSINESS_EMAIL: 'INVALID_BUSINESS_EMAIL',
  INVALID_BUSINESS_PHONE: 'INVALID_BUSINESS_PHONE',
  INVALID_TAX_ID_FORMAT: 'INVALID_TAX_ID_FORMAT',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',

  // Store errors
  STORE_ALREADY_EXISTS: 'STORE_ALREADY_EXISTS',
  STORE_REQUIRED_FOR_APPROVAL: 'STORE_REQUIRED_FOR_APPROVAL',
  CANNOT_CREATE_STORE: 'CANNOT_CREATE_STORE',

  // Rate limiting
  TOO_MANY_APPLICATIONS: 'TOO_MANY_APPLICATIONS',
  APPLICATION_COOLDOWN: 'APPLICATION_COOLDOWN',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  UPDATE_FAILED: 'UPDATE_FAILED',

  // External service errors
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  SELLER_NOT_APPLIED: 'SELLER_NOT_APPLIED',
} as const;

export type SellerErrorCode = (typeof SELLER_ERROR_CODES)[keyof typeof SELLER_ERROR_CODES];

export class SellerError extends ApiError {
  retryable: boolean;
  constructor(
    code: SellerErrorCode,
    message: string,
    statusCode: StatusCode = 400,
    details?: unknown,
    retryable: boolean = false,
  ) {
    super(statusCode, code, message, details);
    this.name = 'SellerError';
    this.retryable = retryable;
  }

  // Helper methods for common errors
  static notFound(sellerId?: string): SellerError {
    return new SellerError(
      SELLER_ERROR_CODES.SELLER_NOT_FOUND,
      sellerId ? `Seller with ID ${sellerId} not found` : 'Seller not found',
      404,
    );
  }

  static alreadyApplied(): SellerError {
    return new SellerError(
      SELLER_ERROR_CODES.SELLER_ALREADY_APPLIED,
      'You have already applied to become a seller',
      400,
    );
  }

  static alreadyASeller(): SellerError {
    return new SellerError(
      SELLER_ERROR_CODES.ALREADY_A_SELLER,
      'You are already registered as a seller',
      400,
    );
  }

  static notAPendingSeller(): SellerError {
    return new SellerError(
      SELLER_ERROR_CODES.SELLER_NOT_PENDING,
      'Seller is not in pending status',
      400,
    );
  }

  static businessEmailExists(email: string): SellerError {
    return new SellerError(
      SELLER_ERROR_CODES.BUSINESS_EMAIL_EXISTS,
      `Business email ${email} is already registered by another seller`,
      409,
    );
  }

  static taxIdExists(taxId: string): SellerError {
    return new SellerError(
      SELLER_ERROR_CODES.TAX_ID_EXISTS,
      `Tax ID ${taxId} is already registered by another seller`,
      409,
    );
  }

  static insufficientPrivileges(): SellerError {
    return new SellerError(
      SELLER_ERROR_CODES.INSUFFICIENT_PRIVILEGES,
      'You do not have permission to perform this action',
      403,
    );
  }
}
