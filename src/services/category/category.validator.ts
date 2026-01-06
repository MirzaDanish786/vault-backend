import { z } from "zod";
import { CATEGORY_ERROR_CODE, CategoryError, CategoryErrorCode } from "./category.types";
import { IValidateReturn } from "@/types/validation";

// Validation schemas
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name cannot exceed 255 characters")
    .trim(),

  // slug: z
  //   .string()
  //   .min(2, "Slug must be at least 2 characters")
  //   .max(255, "Slug cannot exceed 255 characters")
  //   .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens")
  //   .trim(),

  description: z.string().max(2000).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),

  parentId: z.string().cuid("Invalid parent category ID").optional(),

  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().cuid("Invalid category ID"),
});

export const categoryIdSchema = z.object({
  id: z.string().cuid("Invalid category ID"),
});

export const categoryFiltersSchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  parentId: z.string().cuid("Invalid parent ID").optional().nullable(),
  search: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeProducts: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  includeChildren: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  treeFormat: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CateogryIdInput = z.infer<typeof categoryIdSchema>;
export type CategoryFilters = z.infer<typeof categoryFiltersSchema>;

export class CategoryValidator {
  static validateCreate(data: any): CreateCategoryInput {
    try {
      return createCategorySchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new CategoryError(
          CATEGORY_ERROR_CODE.INVALID_PARENT,
          'Validation failed',
          error.issues
        );
      }
      throw error;
    }
  }

  static validateUpdate(data: any): UpdateCategoryInput {
    try {
      return updateCategorySchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new CategoryError(
          CATEGORY_ERROR_CODE.INVALID_PARENT,
          'Validation failed',
          error.issues
        );
      }
      throw error;
    }
  }

  static validateId(id: CateogryIdInput): CateogryIdInput {
    try {
      return categoryIdSchema.parse({ id });
    } catch (error) {
      throw new CategoryError(
        CATEGORY_ERROR_CODE.CATEGORY_NOT_FOUND,
        'Invalid category ID'
      );
    }
  }

  static validateFilters(filters: any): CategoryFilters {
    try {
      return categoryFiltersSchema.parse(filters);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new CategoryError(
          CATEGORY_ERROR_CODE.INVALID_PARENT,
          'Invalid filter parameters',
          error.issues
        );
      }
      throw error;
    }
  }

  static validateSlugUniqueness(slug: string, existingSlugs: string[]): void {
    if (existingSlugs.includes(slug)) {
      throw new CategoryError(
        CATEGORY_ERROR_CODE.DUPLICATE_SLUG,
        `Category with slug "${slug}" already exists`
      );
    }
  }

  static checkCircularReference(
    categoryId: string,
    parentId: string | null,
    allCategories: Array<{ id: string; parentId: string | null }>
  ): void {
    if (!parentId) return;

    if (categoryId === parentId) {
      throw new CategoryError(
        CATEGORY_ERROR_CODE.SELF_REFERENCE,
        'Category cannot be its own parent'
      );
    }

    let currentParentId: string | null = parentId;
    const visited = new Set<string>([categoryId]);

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new CategoryError(
          CATEGORY_ERROR_CODE.CIRCULAR_REFERENCE,
          'Circular reference detected in category hierarchy'
        );
      }

      visited.add(currentParentId);
      const parentCategory = allCategories.find(c => c.id === currentParentId);
      
      if (!parentCategory) break;
      currentParentId = parentCategory.parentId;
    }
  }
}
