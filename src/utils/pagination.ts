import { PaginationParams, PaginationMeta, PaginatedResponse } from '@/types/pagination';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export function parsePaginationParams(
  page?: string | number,
  limit?: string | number,
  options?: { defaultLimit?: number; maxLimit?: number },
): PaginationParams {
  const defaultLimit = options?.defaultLimit || DEFAULT_LIMIT;
  const maxLimit = options?.maxLimit || MAX_LIMIT;

  const parsedPage = Math.max(1, parseInt(String(page || DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  let parsedLimit = parseInt(String(limit || defaultLimit), 10) || defaultLimit;

  parsedLimit = Math.min(parsedLimit, maxLimit);
  parsedLimit = Math.max(1, parsedLimit);
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
}

export function calculatePaginationMeta(
  totalItems: number,
  currentPage: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  const meta = calculatePaginationMeta(totalItems, params.page, params.limit);

  return {
    data,
    pagination: meta,
  };
}

export function getPrismaPaginationParams(params: PaginationParams) {
  return {
    skip: params.skip,
    take: params.limit,
  };
}
