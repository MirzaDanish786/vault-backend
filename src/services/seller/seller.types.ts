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
