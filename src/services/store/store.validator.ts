import { z } from 'zod';

import { STORE_ERROR_CODES, StoreError } from '@/errors/store.error';
import { StoreStatus } from '@/generated/prisma/enums';

export const storeStatusEnum = z.nativeEnum(StoreStatus);

export const createStoreSchema = z.object({
  name: z
    .string()
    .min(3, 'Store name must be at least 3 characters')
    .max(255, 'Store name cannot exceed 255 characters')
    .trim(),

  description: z.string().max(2000, 'Description cannot exceed 2000 characters').trim().optional(),

  logoUrl: z.string().url('Invalid logo URL').optional(),

  bannerUrl: z.string().url('Invalid banner URL').optional(),

  // sellerId: z.string().uuid('Invalid seller ID'),
});

export const updateStoreSchema = z.object({
  name: z
    .string()
    .min(3, 'Store name must be at least 3 characters')
    .max(255, 'Store name cannot exceed 255 characters')
    .trim()
    .optional(),

  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .nullable()
    .optional(),

  logoUrl: z.string().url('Invalid logo URL').nullable().optional(),

  bannerUrl: z.string().url('Invalid banner URL').nullable().optional(),

  isActive: z.boolean().optional(),

  storeStatus: storeStatusEnum.optional(),
});

export const storeIdSchema = z.string().cuid('Invalid store ID');

export const storeSlugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(255, 'Slug cannot exceed 255 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens')
  .trim();

export const storeFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
  storeStatus: storeStatusEnum.optional(),
  sellerId: z.string().uuid('Invalid seller ID').optional(),
  includeProducts: z.coerce.boolean().default(false),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type StoreIdInput = z.infer<typeof storeIdSchema>;
export type StoreSlugInput = z.infer<typeof storeSlugSchema>;
export type StoreFilters = z.infer<typeof storeFiltersSchema>;

export class StoreValidator {
  static validateCreate(data: unknown): CreateStoreInput {
    try {
      return createStoreSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new StoreError(
          STORE_ERROR_CODES.VALIDATION_ERROR,
          'Store validation failed',
          400,
          error.issues,
        );
      }
      throw error;
    }
  }

  static validateUpdate(data: unknown): UpdateStoreInput {
    try {
      return updateStoreSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new StoreError(
          STORE_ERROR_CODES.VALIDATION_ERROR,
          'Store validation failed',
          400,
          error.issues,
        );
      }
      throw error;
    }
  }

  static validateId(id: unknown): StoreIdInput {
    try {
      return storeIdSchema.parse(id);
    } catch (error) {
      throw new StoreError(STORE_ERROR_CODES.VALIDATION_ERROR, 'Invalid store ID format', 400);
    }
  }

  static validateSlug(slug: unknown): StoreSlugInput {
    try {
      return storeSlugSchema.parse(slug);
    } catch (error) {
      throw new StoreError(STORE_ERROR_CODES.VALIDATION_ERROR, 'Invalid store slug format', 400);
    }
  }

  static validateFilters(filters: unknown): StoreFilters {
    try {
      return storeFiltersSchema.parse(filters);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new StoreError(
          STORE_ERROR_CODES.VALIDATION_ERROR,
          'Invalid filter parameters',
          400,
          error.issues,
        );
      }
      throw error;
    }
  }

  static validateSellerId(sellerId: unknown): string {
    try {
      return z.string().uuid('Invalid seller ID').parse(sellerId);
    } catch (error) {
      throw new StoreError(STORE_ERROR_CODES.SELLER_NOT_FOUND, 'Invalid seller ID format', 400);
    }
  }
}
