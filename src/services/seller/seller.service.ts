import { IPublicSellerView, IAdminSellerView, ISellerFilters } from './seller.types';
import { SellerApplicationInput, SellerValidator } from './seller.validator';

import { ApiError } from '@/errors/general-api-error';
import { SellerError } from '@/errors/seller.error';
import prisma from '@/lib/prisma/client';
import { PaginationParams, PaginatedResponse } from '@/types/pagination';
import { createPaginatedResponse, getPrismaPaginationParams } from '@/utils/pagination';

export class SellerService {
  private async validateTaxId(taxId: string, userId?: string): Promise<void> {
    const normalized = taxId.trim().toUpperCase();

    const TAX_ID_REGEX = /^[A-Z0-9-]{5,50}$/;

    if (!TAX_ID_REGEX.test(normalized)) {
      throw new SellerError('INVALID_TAX_ID_FORMAT', 'Invalid tax ID format', 400);
    }

    const existing = await prisma.user.findFirst({
      where: {
        taxId: normalized,
        ...(userId && { id: { not: userId } }),
      },
    });

    if (existing) {
      throw SellerError.taxIdExists(normalized);
    }
  }

  private async validateBusinessEmail(businessEmail: string, userId?: string): Promise<void> {
    const normalized = businessEmail.trim().toLowerCase();

    const existing = await prisma.user.findFirst({
      where: {
        businessEmail: normalized,
        ...(userId && { id: { not: userId } }),
      },
    });

    if (existing) {
      throw new SellerError(
        'BUSINESS_EMAIL_EXISTS',
        'Business email is already registered by another seller',
        400,
      );
    }
  }

  applyAsSeller = async (data: SellerApplicationInput) => {
    const validatedData = SellerValidator.validateSellerApplicationInput(data);

    const user = await prisma.user.findUnique({ where: { id: validatedData.userId } });
    if (!user) {
      throw new SellerError('USER_NOT_FOUND', 'User not found', 404);
    }
    if (user.role === 'ADMIN') {
      throw new SellerError(
        'CANNOT_MODIFY_ADMIN',
        'You cannot apply as a seller as you are an admin',
        400,
      );
    }
    if (user.isAppliedForSeller && user.sellerStatus === 'PENDING_VERIFICATION') {
      throw new SellerError(
        'SELLER_ALREADY_APPLIED',
        'You have already applied for seller. Your application is under review.',
        400,
      );
    }
    if (user.sellerStatus === 'APPROVED') {
      throw new SellerError('ALREADY_A_SELLER', 'You are already an approved seller', 400);
    }

    await this.validateTaxId(validatedData.taxId, validatedData.userId);
    await this.validateBusinessEmail(validatedData.businessEmail, validatedData.userId);

    const seller = await prisma.user.update({
      where: { id: validatedData.userId },
      data: {
        sellerStatus: 'PENDING_VERIFICATION',
        isAppliedForSeller: true,
        sellerAppliedAt: new Date(),
        businessName: validatedData.businessName,
        businessEmail: validatedData.businessEmail,
        businessPhone: validatedData.businessPhone,
        businessAddress: validatedData.businessAddress,
        businessType: validatedData.businessType,
        taxId: validatedData.taxId,
        description: validatedData.description,
        websiteUrl: validatedData.websiteUrl,
        documents: validatedData.documents,
      },
    });
    return seller;
  };

  getSellerPublicProfile = async (sellerId: string): Promise<IPublicSellerView> => {
    if (!sellerId) {
      throw new ApiError(400, 'SELLER_ID_MISSING', 'Seller id is missing');
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId, isSeller: true, sellerStatus: 'APPROVED' },
      select: {
        id: true,
        name: true,
        businessName: true,
        sellerRating: true,
        totalSales: true,
        sellerApprovedAt: true,
        createdAt: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logoUrl: true,
            bannerUrl: true,
          },
        },
      },
    });

    if (!seller) {
      throw new SellerError('NOT_A_SELLER', 'This user is not an approved seller', 404);
    }

    const publicProfile: IPublicSellerView = {
      id: seller.id,
      name: seller.name,
      businessName: seller.businessName,
      sellerRating: seller.sellerRating,
      totalSales: seller.totalSales,
      joinedAt: seller.sellerApprovedAt || seller.createdAt,
      store: seller.store,
      stats: {
        positiveReviews: 0, // TODO: Calculate from reviews
        totalReviews: 0, // TODO: Calculate from reviews
        responseRate: 0, // TODO: Calculate from interactions
      },
    };

    return publicProfile;
  };

  getSellerAdminProfile = async (sellerId: string): Promise<IAdminSellerView> => {
    if (!sellerId) {
      throw new ApiError(400, 'SELLER_ID_MISSING', 'Seller id is missing');
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId, isSeller: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        isSeller: true,
        sellerStatus: true,
        sellerAppliedAt: true,
        sellerApprovedAt: true,
        sellerRejectedAt: true,
        sellerRejectionReason: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        taxId: true,
        sellerRating: true,
        totalSales: true,
        emailVerified: true,
        phoneVerified: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            storeStatus: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
      },
    });

    if (!seller) {
      throw new SellerError('SELLER_NOT_FOUND', 'Seller not found', 404);
    }

    const adminProfile: IAdminSellerView = {
      id: seller.id,
      email: seller.email,
      name: seller.name,
      role: seller.role,
      isActive: seller.isActive,
      createdAt: seller.createdAt,
      lastLoginAt: seller.lastLoginAt,
      isSeller: seller.isSeller,
      sellerStatus: seller.sellerStatus,
      sellerAppliedAt: seller.sellerAppliedAt,
      sellerApprovedAt: seller.sellerApprovedAt,
      sellerRejectedAt: seller.sellerRejectedAt,
      sellerRejectionReason: seller.sellerRejectionReason,
      businessName: seller.businessName,
      businessEmail: seller.businessEmail,
      businessPhone: seller.businessPhone,
      taxId: seller.taxId,
      sellerRating: seller.sellerRating,
      totalSales: seller.totalSales,
      emailVerified: seller.emailVerified,
      phoneVerified: seller.phoneVerified,
      store: seller.store
        ? {
            id: seller.store.id,
            name: seller.store.name,
            slug: seller.store.slug,
            storeStatus: seller.store.storeStatus,
            isActive: seller.store.isActive,
            productCount: seller.store._count.products,
            createdAt: seller.store.createdAt,
          }
        : null,
    };

    return adminProfile;
  };

  approveSeller = async (sellerId: string, adminId: string) => {
    if (!sellerId) {
      throw new ApiError(400, 'SELLER_ID_MISSING', 'Seller id is missing');
    }

    if (!adminId) {
      throw new ApiError(400, 'ADMIN_ID_MISSING', 'Admin id is missing');
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        sellerStatus: true,
        isAppliedForSeller: true,
      },
    });

    if (!seller) {
      throw new SellerError('SELLER_NOT_FOUND', 'Seller not found', 404);
    }

    if (!seller.isAppliedForSeller) {
      throw new SellerError('SELLER_NOT_APPLIED', 'User has not applied to become a seller', 400);
    }

    if (seller.sellerStatus === 'APPROVED') {
      throw new SellerError('SELLER_ALREADY_APPROVED', 'Seller is already approved', 400);
    }

    if (seller.sellerStatus !== 'PENDING_VERIFICATION') {
      throw new SellerError(
        'SELLER_NOT_PENDING',
        'Seller application is not in pending status',
        400,
      );
    }

    const updatedSeller = await prisma.user.update({
      where: { id: sellerId },
      data: {
        role: 'SELLER',
        sellerStatus: 'APPROVED',
        isSeller: true,
        sellerApprovedAt: new Date(),
        sellerRejectedAt: null,
        sellerRejectionReason: null,
      },
    });

    return updatedSeller;
  };

  rejectSeller = async (sellerId: string, reason: string, adminId: string) => {
    if (!sellerId) {
      throw new ApiError(400, 'SELLER_ID_MISSING', 'Seller id is missing');
    }

    if (!adminId) {
      throw new ApiError(400, 'ADMIN_ID_MISSING', 'Admin id is missing');
    }

    if (!reason || reason.trim().length === 0) {
      throw new ApiError(400, 'REJECTION_REASON_MISSING', 'Rejection reason is required');
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        sellerStatus: true,
        isAppliedForSeller: true,
      },
    });

    if (!seller) {
      throw new SellerError('SELLER_NOT_FOUND', 'Seller not found', 404);
    }

    if (!seller.isAppliedForSeller) {
      throw new SellerError('SELLER_NOT_APPLIED', 'User has not applied to become a seller', 400);
    }

    if (seller.sellerStatus === 'REJECTED') {
      throw new SellerError('SELLER_ALREADY_REJECTED', 'Seller is already rejected', 400);
    }

    if (seller.sellerStatus !== 'PENDING_VERIFICATION') {
      throw new SellerError(
        'SELLER_NOT_PENDING',
        'Seller application is not in pending status',
        400,
      );
    }

    const updatedSeller = await prisma.user.update({
      where: { id: sellerId },
      data: {
        sellerStatus: 'REJECTED',
        isSeller: false,
        sellerRejectedAt: new Date(),
        sellerRejectionReason: reason.trim(),
        sellerApprovedAt: null,
      },
    });

    return updatedSeller;
  };

  getPendingSellerApplications = async (
    adminId: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<IAdminSellerView>> => {
    if (!adminId) {
      throw new ApiError(400, 'ADMIN_ID_MISSING', 'Admin id is missing');
    }

    const totalItems = await prisma.user.count({
      where: {
        sellerStatus: 'PENDING_VERIFICATION',
        isAppliedForSeller: true,
      },
    });

    const sellers = await prisma.user.findMany({
      where: {
        sellerStatus: 'PENDING_VERIFICATION',
        isAppliedForSeller: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        isSeller: true,
        sellerStatus: true,
        sellerAppliedAt: true,
        sellerApprovedAt: true,
        sellerRejectedAt: true,
        sellerRejectionReason: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        taxId: true,
        sellerRating: true,
        totalSales: true,
        emailVerified: true,
        phoneVerified: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            storeStatus: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
      },
      ...getPrismaPaginationParams(paginationParams),
      orderBy: {
        sellerAppliedAt: 'desc',
      },
    });

    const data: IAdminSellerView[] = sellers.map(seller => ({
      id: seller.id,
      email: seller.email,
      name: seller.name,
      role: seller.role,
      isActive: seller.isActive,
      createdAt: seller.createdAt,
      lastLoginAt: seller.lastLoginAt,
      isSeller: seller.isSeller,
      sellerStatus: seller.sellerStatus,
      sellerAppliedAt: seller.sellerAppliedAt,
      sellerApprovedAt: seller.sellerApprovedAt,
      sellerRejectedAt: seller.sellerRejectedAt,
      sellerRejectionReason: seller.sellerRejectionReason,
      businessName: seller.businessName,
      businessEmail: seller.businessEmail,
      businessPhone: seller.businessPhone,
      taxId: seller.taxId,
      sellerRating: seller.sellerRating,
      totalSales: seller.totalSales,
      emailVerified: seller.emailVerified,
      phoneVerified: seller.phoneVerified,
      store: seller.store
        ? {
            id: seller.store.id,
            name: seller.store.name,
            slug: seller.store.slug,
            storeStatus: seller.store.storeStatus,
            isActive: seller.store.isActive,
            productCount: seller.store._count.products,
            createdAt: seller.store.createdAt,
          }
        : null,
    }));

    return createPaginatedResponse(data, totalItems, paginationParams);
  };

  getAllSellers = async (
    filters: ISellerFilters,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<IAdminSellerView>> => {
    const where: any = {};

    // Status filters
    if (filters.sellerStatus !== undefined) {
      if (Array.isArray(filters.sellerStatus)) {
        where.sellerStatus = { in: filters.sellerStatus };
      } else {
        where.sellerStatus = filters.sellerStatus;
      }
    } else {
      // Default to APPROVED if no status filter provided
      where.sellerStatus = 'APPROVED';
    }

    if (filters.isSeller !== undefined) {
      where.isSeller = filters.isSeller;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    if (filters.phoneVerified !== undefined) {
      where.phoneVerified = filters.phoneVerified;
    }

    if (filters.businessType) {
      where.businessType = filters.businessType;
    }

    if (filters.hasStore !== undefined) {
      if (filters.hasStore) {
        where.store = { isNot: null };
      } else {
        where.store = null;
      }
    }

    if (filters.storeStatus) {
      where.store = {
        ...where.store,
        storeStatus: filters.storeStatus,
      };
    }

    if (filters.minRating !== undefined || filters.maxRating !== undefined) {
      where.sellerRating = {};
      if (filters.minRating !== undefined) {
        where.sellerRating.gte = filters.minRating;
      }
      if (filters.maxRating !== undefined) {
        where.sellerRating.lte = filters.maxRating;
      }
    }

    if (filters.minSales !== undefined || filters.maxSales !== undefined) {
      where.totalSales = {};
      if (filters.minSales !== undefined) {
        where.totalSales.gte = filters.minSales;
      }
      if (filters.maxSales !== undefined) {
        where.totalSales.lte = filters.maxSales;
      }
    }

    if (filters.appliedAfter || filters.appliedBefore) {
      where.sellerAppliedAt = {};
      if (filters.appliedAfter) {
        where.sellerAppliedAt.gte = new Date(filters.appliedAfter);
      }
      if (filters.appliedBefore) {
        where.sellerAppliedAt.lte = new Date(filters.appliedBefore);
      }
    }

    if (filters.approvedAfter || filters.approvedBefore) {
      where.sellerApprovedAt = {};
      if (filters.approvedAfter) {
        where.sellerApprovedAt.gte = new Date(filters.approvedAfter);
      }
      if (filters.approvedBefore) {
        where.sellerApprovedAt.lte = new Date(filters.approvedBefore);
      }
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { businessEmail: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.businessName) {
      where.businessName = { contains: filters.businessName, mode: 'insensitive' };
    }

    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    const orderBy: any = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const totalItems = await prisma.user.count({ where });

    const sellers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        isSeller: true,
        sellerStatus: true,
        sellerAppliedAt: true,
        sellerApprovedAt: true,
        sellerRejectedAt: true,
        sellerRejectionReason: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        taxId: true,
        sellerRating: true,
        totalSales: true,
        emailVerified: true,
        phoneVerified: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            storeStatus: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
      },
      ...getPrismaPaginationParams(paginationParams),
      orderBy,
    });

    const data: IAdminSellerView[] = sellers.map(seller => ({
      id: seller.id,
      email: seller.email,
      name: seller.name,
      role: seller.role,
      isActive: seller.isActive,
      createdAt: seller.createdAt,
      lastLoginAt: seller.lastLoginAt,
      isSeller: seller.isSeller,
      sellerStatus: seller.sellerStatus,
      sellerAppliedAt: seller.sellerAppliedAt,
      sellerApprovedAt: seller.sellerApprovedAt,
      sellerRejectedAt: seller.sellerRejectedAt,
      sellerRejectionReason: seller.sellerRejectionReason,
      businessName: seller.businessName,
      businessEmail: seller.businessEmail,
      businessPhone: seller.businessPhone,
      taxId: seller.taxId,
      sellerRating: seller.sellerRating,
      totalSales: seller.totalSales,
      emailVerified: seller.emailVerified,
      phoneVerified: seller.phoneVerified,
      store: seller.store
        ? {
            id: seller.store.id,
            name: seller.store.name,
            slug: seller.store.slug,
            storeStatus: seller.store.storeStatus,
            isActive: seller.store.isActive,
            productCount: seller.store._count.products,
            createdAt: seller.store.createdAt,
          }
        : null,
    }));

    return createPaginatedResponse(data, totalItems, paginationParams);
  };

  suspendSeller = async (sellerId: string, reason: string, adminId: string) => {
    if (!sellerId) {
      throw new ApiError(400, 'SELLER_ID_MISSING', 'Seller id is missing');
    }

    if (!adminId) {
      throw new ApiError(400, 'ADMIN_ID_MISSING', 'Admin id is missing');
    }

    if (!reason || reason.trim().length === 0) {
      throw new ApiError(400, 'SUSPENSION_REASON_MISSING', 'Suspension reason is required');
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        isSeller: true,
        sellerStatus: true,
        role: true,
      },
    });

    if (!seller) {
      throw new SellerError('SELLER_NOT_FOUND', 'Seller not found', 404);
    }

    if (!seller.isSeller) {
      throw new SellerError('NOT_A_SELLER', 'This user is not a seller', 400);
    }

    if (seller.role === 'ADMIN') {
      throw new SellerError('CANNOT_MODIFY_ADMIN', 'Cannot suspend an admin user', 400);
    }

    if (seller.sellerStatus === 'SUSPENDED') {
      throw new SellerError('SELLER_ALREADY_SUSPENDED', 'Seller is already suspended', 400);
    }

    if (seller.sellerStatus !== 'APPROVED') {
      throw new SellerError('SELLER_NOT_APPROVED', 'Only approved sellers can be suspended', 400);
    }

    const updatedSeller = await prisma.user.update({
      where: { id: sellerId },
      data: {
        sellerStatus: 'SUSPENDED',
        isActive: false,
        sellerRejectionReason: reason.trim(), // Reusing this field for suspension reason
      },
    });

    return updatedSeller;
  };

  unsuspendSeller = async (sellerId: string, adminId: string) => {
    if (!sellerId) {
      throw new ApiError(400, 'SELLER_ID_MISSING', 'Seller id is missing');
    }

    if (!adminId) {
      throw new ApiError(400, 'ADMIN_ID_MISSING', 'Admin id is missing');
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        isSeller: true,
        sellerStatus: true,
        role: true,
      },
    });

    if (!seller) {
      throw new SellerError('SELLER_NOT_FOUND', 'Seller not found', 404);
    }

    if (!seller.isSeller) {
      throw new SellerError('NOT_A_SELLER', 'This user is not a seller', 400);
    }

    if (seller.role === 'ADMIN') {
      throw new SellerError('CANNOT_MODIFY_ADMIN', 'Cannot modify an admin user', 400);
    }

    if (seller.sellerStatus !== 'SUSPENDED') {
      throw new SellerError(
        'SELLER_NOT_SUSPENDED',
        'Only suspended sellers can be unsuspended',
        400,
      );
    }

    const updatedSeller = await prisma.user.update({
      where: { id: sellerId },
      data: {
        sellerStatus: 'APPROVED',
        isActive: true,
        sellerRejectionReason: null, // Clear the suspension reason
      },
    });

    return updatedSeller;
  };
}
