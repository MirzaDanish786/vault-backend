import prisma from "@/lib/prisma/client";
import {
  CategoryError,
  ICategory,
  ICategoryTree,
  ICreateCategoryInput,
  IPaginatedCategories,
} from "./category.types";
import {
  CategoryFilters,
  CategoryValidator,
  CateogoryIdInput,
} from "./category.validator";
import slugify from "slugify";
import { logger } from "@/utils/logger";
import { Prisma } from "@/generated/prisma/client";

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
      visited.add(currentId);  
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
        throw new CategoryError(
          "INVALID_PARENT",
          "Parent category not found",
          404
        );
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
        sortOrder,
      },
    });
    logger.info("Category Service layer created the category successfully", {
      category,
    });
    return category;
  };

  findById = async (
    id: CateogoryIdInput,
    includeProducts: boolean = false
  ): Promise<ICategory | null> => {
    const validatedId = CategoryValidator.validateId(id);

    const category = await prisma.category.findUnique({
      where: { id: validatedId },
      include: includeProducts
        ? {
            products: {
              where: { isActive: true },
              take: 10,
              orderBy: { createdAt: "desc" },
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
      throw new CategoryError("CATEGORY_NOT_FOUND", "Category not found!", 404);
    }
    logger.info("Category Service layer fetched the category successfully", {
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
            createdAt: "desc",
          },
        },
        children: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
    if (!category) {
      throw new CategoryError("CATEGORY_NOT_FOUND", "Category not found!", 404);
    }
    logger.info("Category Service layer fetched the category successfully", {
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
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        take: limit,
        skip,
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
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

    let finalCategories:ICategory[] = categories as ICategory[];
    if (includeChildren) {
      const categoriesId = categories.map((cat) => cat.id);

      const childrens = await prisma.category.findMany({
        where: {
          parentId: {
            in: categoriesId,
          },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });

      type CategoryWithChildren = Prisma.CategoryGetPayload<{}> & {
        children: Prisma.CategoryGetPayload<{}>[]
      }
      const categoryMap = new Map<string, CategoryWithChildren>(
        categories.map((c) => [c.id, { ...c, children: [] }])
      );
      childrens.forEach(child =>{
        const parent = categoryMap.get(child.parentId!)
        if(parent){
          parent.children.push(child)
        }
      })
      finalCategories = Array.from(categoryMap.values())
    }
    if(treeFormat){
      const buildTree = (nodes: ICategory[], parentId: string | null = null):ICategory[]=>{
        return nodes.filter(node => node.parentId === parentId).map((node)=>({
          ...node,
          children: buildTree(nodes, node.id)
        }))
      }
      finalCategories = buildTree(finalCategories);
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
}
