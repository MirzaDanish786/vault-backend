import slugify from 'slugify';

import type { ICategory, ICreateCategoryInput, IPaginatedCategories } from './category.types';
import { CategoryError, ICategoryTree } from './category.types';
import type { CategoryFilters, CateogoryIdInput, UpdateCategoryInput } from './category.validator';
import { CategoryValidator } from './category.validator';

import type { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/prisma/client';
import { logger } from '@/utils/logger';

export class CategoryService {
  // ===Utils Methods====
  //   This method checks the circular reference on category creation time:
  private checkCircularReferenceOnCreate = async (
    parentId: string,
    allCategories: Array<{ id: string; parentId: string | null }>,
  ): Promise<void> => {
    if (!parentId) return;

    let currentId: string | null = parentId;
    const visited = new Set<string>();
    while (currentId) {
      if (visited.has(currentId)) {
        throw new CategoryError(
          'CIRCULAR_REFERENCE',
          'Circular reference detected in category hierarchy',
        );
      }
      const currentCategory = allCategories.find(c => c.id === currentId);
      if (!currentCategory) break;
      visited.add(currentId);
      currentId = currentCategory.parentId;
    }
  };

  //   This method checks the circular reference on category updation time:
  private checkCircularReferenceOnUpdate = async (
    categoryId: string,
    newParentId: string,
    allCategories: Array<{ id: string; parentId: string | null }>,
  ): Promise<void> => {
    if (!newParentId) return;

    if (categoryId === newParentId) {
      throw new CategoryError('CIRCULAR_REFERENCE', 'Category cannot be its own parent');
    }
    let currentId: string | null = newParentId;
    const visited = new Set<string>([categoryId]);
    while (currentId) {
      if (visited.has(currentId)) {
        throw new CategoryError(
          'CIRCULAR_REFERENCE',
          'Circular reference detected: cannot set parent to a descendant',
        );
      }
      const currentCategory = allCategories.find(c => c.id === currentId);
      if (!currentCategory) break;
      visited.add(currentId);
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

  private async generateSortOrder(parentId?: string | null): Promise<number> {
    const maxSortOrder = await prisma.category.aggregate({
      where: { parentId: parentId || null },
      _max: { sortOrder: true },
    });

    return (maxSortOrder._max.sortOrder ?? -10) + 10;
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
        throw new CategoryError('INVALID_PARENT', 'Parent category not found', 404);
      }

      const allCategories = await this.getAllCategoriesForValidation();
      await this.checkCircularReferenceOnCreate(validatedData.parentId, allCategories);
    }
    const sortOrder =
      validatedData.sortOrder ?? (await this.generateSortOrder(validatedData.parentId));
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
        sortOrder,
      },
    });
    logger.info('Category Service layer created the category successfully', {
      category,
    });
    return category;
  };

  findById = async (
    id: CateogoryIdInput,
    includeProducts: boolean = false,
  ): Promise<ICategory | null> => {
    const validatedId = CategoryValidator.validateId(id);

    const category = await prisma.category.findUnique({
      where: { id: validatedId },
      include: includeProducts
        ? {
            products: {
              where: { isActive: true },
              take: 10,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          }
        : undefined,
    });

    if (!category) {
      throw new CategoryError('CATEGORY_NOT_FOUND', 'Category not found!', 404);
    }
    logger.info('Category Service layer fetched the category successfully', {
      category,
    });
    return category;
  };

  findBySlug = async (slug: string): Promise<ICategory> => {
    const validatedSlug = CategoryValidator.validateSlug(slug);
    const category = await prisma.category.findUnique({
      where: { slug: validatedSlug },
      include: {
        products: {
          where: {
            isActive: true,
          },
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
        children: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
    if (!category) {
      throw new CategoryError('CATEGORY_NOT_FOUND', 'Category not found!', 404);
    }
    logger.info('Category Service layer fetched the category successfully', {
      category,
    });
    return category;
  };

  //
  findAll = async (filters: CategoryFilters): Promise<IPaginatedCategories> => {
    const validateFilters = CategoryValidator.validateFilters(filters);
    const {
      page,
      limit,
      search,
      parentId,
      isActive,
      treeFormat,
      includeChildren,
      includeProducts,
    } = validateFilters;
    console.log(validateFilters);
    const skip = (page - 1) * limit;
    const where: Prisma.CategoryWhereInput = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (parentId !== undefined) {
      where.parentId = parentId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        take: limit,
        skip,
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            name: 'asc',
          },
        ],
        include: includeProducts
          ? {
              _count: {
                select: {
                  products: true,
                },
              },
            }
          : undefined,
      }),
      prisma.category.count({
        where,
      }),
    ]);

    let finalCategories: ICategory[] = categories as ICategory[];
    if (includeChildren) {
      const categoriesId = categories.map(cat => cat.id);

      const childrens = await prisma.category.findMany({
        where: {
          parentId: {
            in: categoriesId,
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

      type CategoryWithChildren = Prisma.CategoryGetPayload<{}> & {
        children: Prisma.CategoryGetPayload<{}>[];
      };
      const categoryMap = new Map<string, CategoryWithChildren>(
        categories.map(c => [c.id, { ...c, children: [] }]),
      );
      childrens.forEach(child => {
        const parent = categoryMap.get(child.parentId!);
        if (parent) {
          parent.children.push(child);
        }
      });
      finalCategories = Array.from(categoryMap.values());
    }
    if (treeFormat) {
      const buildTree = (
        nodes: ICategory[],
        parentId: string | null = null,
        depth: number = 0,
      ): ICategory[] => {
        return nodes
          .filter(node => node.parentId === parentId)
          .map(node => ({
            ...node,
            depth,
            children: buildTree(nodes, node.id, depth + 1),
          }));
      };
      finalCategories = buildTree(finalCategories);
      console.log(finalCategories);
    }

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: finalCategories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  };

  // Update:
  update = async (id: string, data: UpdateCategoryInput): Promise<ICategory> => {
    const validatedId = CategoryValidator.validateId(id);
    const validatedData = CategoryValidator.validateUpdate({
      ...data,
      // id: validatedId,
    });

    const isCategoryExist = await prisma.category.findUnique({
      where: {
        id: validatedId,
      },
    });

    if (!isCategoryExist) {
      throw new CategoryError('CATEGORY_NOT_FOUND', 'Category is not found!', 404);
    }
    let newSlug = undefined;
    if (validatedData.name !== undefined) {
      newSlug = await this.generateUniqueSlug(validatedData.name);
    }

    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId === null) {
      } else {
        const parent = await prisma.category.findUnique({
          where: {
            id: validatedData.parentId,
          },
        });
        if (!parent) {
          throw new CategoryError('INVALID_PARENT', 'Parent not found!', 404);
        }
        const allCategoires = await this.getAllCategoriesForValidation();
        await this.checkCircularReferenceOnUpdate(id, validatedData.parentId, allCategoires);
      }
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id: validatedId,
      },
      data: {
        name: validatedData.name,
        slug: newSlug,
        description: validatedData.description,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        imageUrl: validatedData.imageUrl,
        parentId: validatedData.parentId,
        isActive: validatedData.isActive,
        sortOrder: validatedData.sortOrder,
      },
    });

    return updatedCategory;
  };

  // Delete:
  delete = async (id: CateogoryIdInput): Promise<ICategory> => {
    const validatedId = CategoryValidator.validateId(id);
    const categoryToDelete = await prisma.category.findUnique({
      where: {
        id: validatedId,
      },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });
    if (!categoryToDelete) {
      throw new CategoryError('CATEGORY_NOT_FOUND', 'Category not found', 404);
    }
    if (categoryToDelete._count.products > 0) {
      throw new CategoryError(
        'CATEGORY_HAS_PRODUCTS',
        "Category with products can't be deleted!",
        403,
      );
    }
    if (categoryToDelete._count.children > 0) {
      throw new CategoryError(
        'CATEGORY_HAS_CHILDREN',
        "Category with children can't be deleted!",
        403,
      );
    }
    return await prisma.category.delete({
      where: {
        id: validatedId,
      },
    });
  };
}
