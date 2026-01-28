import { ApiError } from '@/errors/general-api-error';
import type { Role, SellerStatus, StoreStatus } from '@/generated/prisma/enums';
import { StatusCode } from '@/types/http';

const BUSINESS_TYPES = ['INDIVIDUAL', 'COMPANY'] as const;
type BUSINESS_TYPE = (typeof BUSINESS_TYPES)[keyof typeof BUSINESS_TYPES];
export interface ISellerApplication {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessType: BUSINESS_TYPE;
  taxId: string;
  documents: {
    governmentId?: string;
    taxCertificate?: string;
    addressProof?: string;
    bankStatement?: string;
  };

  description?: string;
  websiteUrl?: string;

  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
}

// export interface InputUpdateSellerProfile {
//   bussinessName?: string;
//   bussinessEmail?: string;
//   bsussinessPhone?: string;
//   taxId?: string;
//   description?: string;
//   websiteUrl?: string;
//   avatar?: string;
// }

export interface ISellerProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  isSeller: boolean;
  sellerStatus: SellerStatus;
  sellerAppliedAt: Date | null;
  sellerApprovedAt: Date | null;
  sellerRejectedAt: Date | null;
  sellerRejectionReason: string | null;

  businessName: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  businessType: BUSINESS_TYPE;
  description: string | null;
  websiteUrl: string | null;
  taxId: string | null;

  sellerRating: number | null;
  totalSales: number;

  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: Date | null;

  profile?: {
    avatar: string | null;
  } | null;

  store?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    storeStatus: StoreStatus;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null;

  addresses?: Array<{
    id: string;
    label: string;
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    isDefault: boolean;
  }>;

  stats?: {
    totalProducts: number;
    activeProducts: number;
    pendingOrders: number;
    completedOrders: number;
    averageRating: number;
  };
}

export interface IAdminSellerView {
  // User info
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;

  // Seller info
  isSeller: boolean;
  sellerStatus: SellerStatus;
  sellerAppliedAt: Date | null;
  sellerApprovedAt: Date | null;
  sellerRejectedAt: Date | null;
  sellerRejectionReason: string | null;

  // Business info
  businessName: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  taxId: string | null;

  // Performance
  sellerRating: number | null;
  totalSales: number;

  // Store info
  store?: {
    id: string;
    name: string;
    slug: string;
    storeStatus: StoreStatus;
    isActive: boolean;
    productCount: number;
    createdAt: Date;
  } | null;

  // Verification status
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface IPublicSellerView {
  id: string;
  name: string;
  businessName: string | null;

  // Performance metrics for trust
  sellerRating: number | null;
  totalSales: number;
  joinedAt: Date; // sellerApprovedAt or createdAt

  // Store info
  store?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
  } | null;

  // Stats for display
  stats?: {
    positiveReviews: number;
    totalReviews: number;
    responseRate: number; // percentage
    shippingTime?: string; // "2-3 days"
  };
}

export const SELLER_ERROR_CODES = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  FILE_REQUIRED: 'FILE_REQUIRED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  // Application errors
  // This is the perfect archecture of this project like if follow this then we can easily scale our app, specially when the app is very large and enterprises level, the user mush accept the term and policies so after that he wil able to enter in our app, and also this is the core logic that every app should have even if they want to scale there app
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
