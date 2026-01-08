import { ApiError } from "@/utils/error";
import { StatusCode } from "../auth";

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  children?: ICategory[];
  productCount?: number;
  [key: string]: unknown;
}
export interface ICreateCategoryInput {
  name: string;
  // slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}
export interface IUpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ICategoryTree extends ICategory {
  children?: ICategoryTree[];
  productCount?: number;
  depth?: number;
}

export interface ICategoryFilters {
  isActive?: boolean;
  parentId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
  includeProducts?: boolean;
  includeChildren?: boolean;
}

export interface IPaginatedCategories {
  data: ICategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const CATEGORY_ERROR_CODE = {
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
  CATEGORY_HAS_PRODUCTS: "CATEGORY_HAS_PRODUCTS",
  CATEGORY_HAS_CHILDREN: "CATEGORY_HAS_CHILDREN",
  DUPLICATE_SLUG: "DUPLICATE_SLUG",
  INVALID_PARENT: "INVALID_PARENT",
  SELF_REFERENCE: "SELF_REFERENCE",
  CIRCULAR_REFERENCE: "CIRCULAR_REFERENCE",
  INVALID_SLUG: "INVALID_SLUG",
} as const;

export type CategoryErrorCode =
  (typeof CATEGORY_ERROR_CODE)[keyof typeof CATEGORY_ERROR_CODE];
export class CategoryError extends ApiError {
  constructor(
    code: CategoryErrorCode,
    message: string,
    statusCode: StatusCode = 400,
    details?: unknown
  ) {
    super(statusCode, code, message, details);
    this.name = "CategoryError";
  }
}
