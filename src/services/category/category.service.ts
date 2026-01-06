import prisma from "@/lib/prisma/client";
import {
  CategoryError,
  ICategory,
  ICreateCategoryInput,
} from "./category.types";
import { CategoryValidator } from "./category.validator";
import slugify from "slugify";
import { logger } from "@/utils/logger";

export class CategoryService {
  // ===Utils Methods====
  //   This method checks the circular reference on category creation time:
  private checkCircularReferenceOnCreate = async (
    parentId: string,
    allCategories: Array<{ id: string; parentId: string | null }>
  ): Promise<void> => {
    if (!parentId) return;

    let currentId: string | null = parentId;
    const visited = new Set<string>();
    while (currentId) {
      if (visited.has(currentId)) {
        throw new CategoryError(
          "CIRCULAR_REFERENCE",
          "Circular reference detected in category hierarchy"
        );
      }
      const currentCategory = allCategories.find((c) => c.id === currentId);
      if (!currentCategory) break;
      currentId = currentCategory.parentId;
    }
  };

  //   This method checks the circular reference on category updation time:
  private checkCircularReferenceOnUpdate = async (
    categoryId: string,
    newParentId: string,
    allCategories: Array<{ id: string; parentId: string | null }>
  ): Promise<void> => {
    if (!newParentId) return;

    if (categoryId === newParentId) {
      throw new CategoryError(
        "CIRCULAR_REFERENCE",
        "Category cannot be its own parent"
      );
    }
    let currentId: string | null = newParentId;
    const visited = new Set<string>([categoryId]);
    while (currentId) {
      if (visited.has(currentId)) {
        throw new CategoryError(
          "CIRCULAR_REFERENCE",
          "Circular reference detected: cannot set parent to a descendant"
        );
      }
      const currentCategory = allCategories.find((c) => c.id === currentId);
      if (!currentCategory) break;
      currentId = currentCategory.parentId;
    }
  };

  private getAllCategoriesForValidation = async (): Promise<
    Array<{ id: string; parentId: string | null }>
  > => {
    const allCategoires = await prisma.category.findMany({
      select: { id: true, parentId: true },
    });
    return allCategoires;
  };

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return slug;
  }

  private async generateSortOrder(): Promise<number> {
    // here in this funcion we generate the sortorder with the gap of 10:
    const maxSortOrder = await prisma.category.aggregate({
      _max: { sortOrder: true },
    });
    const next = (maxSortOrder._max.sortOrder ?? 0) + 10;
    return next;
  }

  //   ======CRUD============
  createCategory = async (data: ICreateCategoryInput): Promise<ICategory> => {
    const validatedData = CategoryValidator.validateCreate(data);
    const slug = await this.generateUniqueSlug(data.name);

    if (validatedData.parentId) {
      const isParentExist = await prisma.category.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!isParentExist) {
        throw new CategoryError("INVALID_PARENT", "Parent category not found");
      }

      const allCategories = await this.getAllCategoriesForValidation();
      await this.checkCircularReferenceOnCreate(
        validatedData.parentId,
        allCategories
      );
    }
    const sortOrder = await this.generateSortOrder();
    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        slug: slug,
        description: validatedData.description,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        parentId: validatedData.parentId,
        imageUrl: validatedData.imageUrl,
        isActive: validatedData.isActive,
        sortOrder
      },
    });
    logger.info("Category Service layer created the category successfully", { category });
    return category;
  };
}
