import type { StoreStatus } from '@/generated/prisma/enums';


export interface IStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  storeStatus: StoreStatus;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
  productCount?: number;
  [key: string]: unknown;
}


export interface ICreateStoreInput {
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  sellerId: string;
}


export interface IUpdateStoreInput {
  name?: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isActive?: boolean;
  slug?: string,
  storeStatus?: StoreStatus;
}


export interface IStoreFilters {
  search?: string;
  isActive?: boolean;
  storeStatus?: StoreStatus;
  sellerId?: string;
  page?: number;
  limit?: number;
  includeProducts?: boolean;
}


export interface IPaginatedStores {
  data: IStore[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}


export interface IStoreWithSeller extends IStore {
  seller: {
    id: string;
    name: string;
    email: string;
    businessName: string | null;
    sellerRating: number | null;
  };
}

