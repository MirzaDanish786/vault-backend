import type { Role, SellerStatus, StoreStatus } from '@/generated/prisma/enums';

export interface ISellerApplication {
  bussinessName: string;
  bussinessEmail: string;
  bsussinessPhone: string;
  taxId: string;

  description?: string;
  websiteUrl?: string;

  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
}

export interface InputUpdateSellerProfile {
  bussinessName?: string;
  bussinessEmail?: string;
  bsussinessPhone?: string;
  taxId?: string;
  description?: string;
  websiteUrl?: string;
  avatar?: string;
}

export interface ISellerProfile {
  // User fields
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Seller fields (from User model)
  isSeller: boolean;
  sellerStatus: SellerStatus;
  sellerAppliedAt: Date | null;
  sellerApprovedAt: Date | null;
  sellerRejectedAt: Date | null;
  sellerRejectionReason: string | null;

  // Business info (from User model)
  businessName: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  taxId: string | null;

  // Performance metrics (from User model)
  sellerRating: number | null;
  totalSales: number;

  // Verification status (from User model)
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: Date | null;

  // Profile info (from Profile model)
  profile?: {
    avatar: string | null;
  } | null;

  // Store info (from Store model - if exists)
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

  // Addresses (from Address model)
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

  // Computed fields (not in DB)
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
