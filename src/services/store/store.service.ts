import slugify from 'slugify';

import { SellerValidator } from '../seller/seller.validator';

import { IStore, IUpdateStoreInput, IPaginatedStores } from './store.type';
import {
  CreateStoreInput,
  StoreValidator,
  UpdateStoreInput,
  StoreFilters,
} from './store.validator';

import { STORE_ERROR_CODES, StoreError } from '@/errors/store.error';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/prisma/client';
import { logger } from '@/utils/logger';
import {
  createPaginatedResponse,
  getPrismaPaginationParams,
  parsePaginationParams,
} from '@/utils/pagination';

export class StoreService {
  private generateUniqueSlug = async (name: string): Promise<string> => {
    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.store.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return slug;
  };

  createStore = async (sellerId: string, input: CreateStoreInput): Promise<IStore> => {
    const validatedData = StoreValidator.validateCreate(input);
    const validateSellerId = SellerValidator.validateId(sellerId);

    const seller = await prisma.user.findUnique({
      where: { id: validateSellerId },
      select: {
        id: true,
        isSeller: true,
        sellerStatus: true,
        store: true,
      },
    });

    if (!seller) {
      throw new StoreError(STORE_ERROR_CODES.SELLER_NOT_FOUND, 'Seller not found', 404);
    }

    if (!seller.isSeller || seller.sellerStatus !== 'APPROVED') {
      throw new StoreError(
        STORE_ERROR_CODES.SELLER_NOT_APPROVED,
        'Seller is not approved. Only approved sellers can create stores.',
        403,
      );
    }

    if (seller.store) {
      throw new StoreError(
        STORE_ERROR_CODES.SELLER_ALREADY_HAS_STORE,
        'Seller already has a store. Each seller can only have one store.',
        400,
      );
    }

    const slug = await this.generateUniqueSlug(validatedData.name);

    const existingStore = await prisma.store.findFirst({
      where: { name: validatedData.name },
    });

    if (existingStore) {
      throw new StoreError(
        STORE_ERROR_CODES.DUPLICATE_STORE_NAME,
        'Store name is already taken',
        400,
      );
    }

    const store = await prisma.store.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        slug,
        logoUrl: validatedData.logoUrl,
        bannerUrl: validatedData.bannerUrl,
        sellerId: sellerId,
        storeStatus: 'DRAFT',
        isActive: true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    logger.info('Store created successfully', {
      storeId: store.id,
      sellerId: sellerId,
    });

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      logoUrl: store.logoUrl,
      bannerUrl: store.bannerUrl,
      isActive: store.isActive,
      storeStatus: store.storeStatus,
      sellerId: store.sellerId,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      productCount: store._count.products,
    };
  };

  updateStore = async (
    storeId: string,
    input: UpdateStoreInput,
    sellerId: string,
  ): Promise<IStore> => {
    const validatedStoreId = StoreValidator.validateId(storeId);
    const validatedSellerId = SellerValidator.validateId(sellerId);
    const validatedData = StoreValidator.validateUpdate(input);

    const existingStore = await prisma.store.findUnique({
      where: {
        id: validatedStoreId,
      },
      select: {
        id: true,
        name: true,
        sellerId: true,
        isActive: true,
      },
    });
    if (!existingStore) {
      logger.warn('Update attempt on non-existent store', {
        storeId: validatedStoreId,
        sellerId: validatedSellerId,
      });
      throw new StoreError(
        STORE_ERROR_CODES.STORE_NOT_FOUND,
        `Store with ID '${validatedStoreId}' not found`,
        404,
      );
    }
    if (validatedSellerId && existingStore.sellerId !== validatedSellerId) {
      logger.warn('Unauthorized store update attempt', {
        storeId: validatedStoreId,
        attemptedBy: validatedSellerId,
        actualOwner: existingStore.sellerId,
      });
      throw new StoreError(
        STORE_ERROR_CODES.UNAUTHORIZED_ACCESS,
        'You do not have permission to update this store. You can only update your own store.',
        403,
      );
    }

    const updatedData: IUpdateStoreInput = {};
    if (validatedData.name !== undefined) {
      updatedData.name = validatedData.name;
      if (validatedData.name !== existingStore.name) {
        const newSlug = await this.generateUniqueSlug(validatedData.name);
        updatedData.slug = newSlug;
      }
    }
    if (validatedData.description !== undefined) {
      updatedData.description = validatedData.description;
    }
    if (validatedData.isActive !== undefined) {
      updatedData.isActive = validatedData.isActive;
    }
    if (validatedData.bannerUrl !== undefined) {
      updatedData.bannerUrl = validatedData.bannerUrl;
    }
    if (validatedData.logoUrl !== undefined) {
      updatedData.logoUrl = validatedData.logoUrl;
    }
    if (validatedData.storeStatus !== undefined) {
      updatedData.storeStatus = validatedData.storeStatus;
    }

    const updatedStore = await prisma.store.update({
      where: {
        id: storeId,
      },
      data: updatedData,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    logger.info('Store updated successfully', {
      storeId: validatedStoreId,
      sellerId: validatedSellerId,
      updatedFields: Object.keys(updatedData),
    });

    return {
      ...updatedStore,
      productCount: updatedStore._count.products,
    };
  };

  deleteStore = async (
    storeId: string,
    sellerId: string,
    forceDelete?: boolean,
  ): Promise<{ message: string; storeId: string }> => {
    const validatedStoreId = StoreValidator.validateId(storeId);
    const validatedSellerId = SellerValidator.validateId(sellerId);

    const existingStore = await prisma.store.findUnique({
      where: {
        id: validatedStoreId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sellerId: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existingStore) {
      logger.warn('Delete attempt on non-existent or inactive store', {
        storeId: validatedStoreId,
        sellerId: validatedSellerId,
      });
      throw new StoreError(
        STORE_ERROR_CODES.STORE_NOT_FOUND,
        `Store with ID '${validatedStoreId}' not found or already inactive`,
        404,
      );
    }

    if (validatedSellerId && existingStore.sellerId !== validatedSellerId) {
      logger.warn('Unauthorized store delete attempt', {
        storeId: validatedStoreId,
        attemptedBy: validatedSellerId,
        actualOwner: existingStore.sellerId,
      });
      throw new StoreError(
        STORE_ERROR_CODES.UNAUTHORIZED_ACCESS,
        'You do not have permission to delete this store. You can only delete your own store.',
        403,
      );
    }

    if (!forceDelete && existingStore._count.products > 0) {
      logger.warn('Delete attempt on store with products', {
        storeId: validatedStoreId,
        productCount: existingStore._count.products,
      });
      throw new StoreError(
        STORE_ERROR_CODES.STORE_HAS_PRODUCTS,
        `Store '${existingStore.name}' has ${existingStore._count.products} product(s). Cannot delete store with products. Use forceDelete=true to override.`,
        400,
      );
    }

    await prisma.store.update({
      where: {
        id: validatedStoreId,
      },
      data: {
        isActive: false,
        storeStatus: 'SUSPENDED',
      },
    });

    logger.info('Store deactivated successfully', {
      storeId: validatedStoreId,
      storeName: existingStore.name,
      sellerId: validatedSellerId,
      forceDelete,
      productCount: existingStore._count.products,
    });

    return {
      message: 'Store has been deactivated successfully',
      storeId: validatedStoreId,
    };
  };

  // For seller to get their own store
  getOwnStoreById = async (
    storeId: string,
    sellerId: string,
    includeSeller?: boolean,
  ): Promise<IStore> => {
    const validatedStoreId = StoreValidator.validateId(storeId);
    const validatedSellerId = SellerValidator.validateId(sellerId);

    const store = await prisma.store.findUnique({
      where: {
        id: validatedStoreId,
        sellerId: validatedSellerId,
      },
      include: {
        seller: includeSeller,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!store) {
      logger.warn('Seller attempted to access non-existent or unauthorized store', {
        storeId: validatedStoreId,
        sellerId: validatedSellerId,
      });
      throw new StoreError(
        STORE_ERROR_CODES.STORE_NOT_FOUND,
        `Store with ID '${validatedStoreId}' not found or you don't have access to it`,
        404,
      );
    }

    logger.info('Seller accessed own store', {
      storeId: validatedStoreId,
      sellerId: validatedSellerId,
    });

    return {
      ...store,
      productCount: store._count.products,
    };
  };

  // For Admin - Can access any store
  getAnyStoreById = async (storeId: string): Promise<IStore> => {
    const validatedStoreId = StoreValidator.validateId(storeId);

    const store = await prisma.store.findUnique({
      where: {
        id: validatedStoreId,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true,
            sellerRating: true,
            sellerStatus: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!store) {
      logger.warn('Admin attempted to access non-existent store', {
        storeId: validatedStoreId,
      });
      throw new StoreError(
        STORE_ERROR_CODES.STORE_NOT_FOUND,
        `Store with ID '${validatedStoreId}' not found`,
        404,
      );
    }

    logger.info('Admin accessed store', {
      storeId: validatedStoreId,
      adminAction: true,
    });

    return {
      ...store,
      productCount: store._count.products,
    };
  };

  /**
   * Get store by ID (Public endpoint)
   * Anyone can view any store - this is standard e-commerce behavior
   * Like viewing a store on Amazon or Etsy
   */
  getStoreByIdPublic = async (storeId: string, includeSeller: boolean = false): Promise<IStore> => {
    const validatedStoreId = StoreValidator.validateId(storeId);

    const store = await prisma.store.findUnique({
      where: { id: validatedStoreId },
      include: {
        _count: {
          select: { products: true },
        },
        ...(includeSeller && {
          seller: {
            select: {
              id: true,
              name: true,
              businessName: true,
              sellerRating: true,
              createdAt: true,
            },
          },
        }),
      },
    });

    if (!store) {
      logger.warn('Store not found for public view', { storeId: validatedStoreId });
      throw new StoreError(STORE_ERROR_CODES.STORE_NOT_FOUND, 'Store not found');
    }

    logger.info('Store viewed publicly', {
      storeId: validatedStoreId,
      storeName: store.name,
      includeSeller,
    });

    return {
      ...store,
      productCount: store._count.products,
    };
  };

  getStoresByFilters = async (filters: StoreFilters): Promise<IPaginatedStores> => {
    const validatedFilters = StoreValidator.validateFilters(filters);
    const { page, limit, search, isActive, storeStatus, sellerId, includeProducts } =
      validatedFilters;

    const paginationParams = parsePaginationParams(page, limit);

    // Build where clause
    const where: Prisma.StoreWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (storeStatus) {
      where.storeStatus = storeStatus;
    }

    if (sellerId) {
      const validatedSellerId = StoreValidator.validateSellerId(sellerId);
      where.sellerId = validatedSellerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count and stores
    const [stores, totalItems] = await Promise.all([
      prisma.store.findMany({
        where,
        ...getPrismaPaginationParams(paginationParams),
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        include: {
          _count: {
            select: { products: true },
          },
          ...(includeProducts && {
            seller: {
              select: {
                id: true,
                name: true,
                businessName: true,
                sellerRating: true,
              },
            },
          }),
        },
      }),
      prisma.store.count({ where }),
    ]);

    logger.info('Stores fetched successfully', {
      count: stores.length,
      totalItems,
      filters: validatedFilters,
    });

    const data: IStore[] = stores.map(store => ({
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      logoUrl: store.logoUrl,
      bannerUrl: store.bannerUrl,
      isActive: store.isActive,
      storeStatus: store.storeStatus,
      sellerId: store.sellerId,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      productCount: store._count.products,
      ...('seller' in store && { seller: store.seller }),
    }));

    const response = createPaginatedResponse(data, totalItems, paginationParams);

    return {
      data: response.data,
      pagination: {
        page: response.pagination.currentPage,
        limit: response.pagination.itemsPerPage,
        total: response.pagination.totalItems,
        totalPages: response.pagination.totalPages,
        hasNextPage: response.pagination.hasNextPage,
        hasPreviousPage: response.pagination.hasPreviousPage,
      },
    };
  };
}

export const storeService = new StoreService();
