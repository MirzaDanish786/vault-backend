import { IPublicSellerView, IAdminSellerView } from './seller.types';
import { SellerApplicationInput, SellerValidator } from './seller.validator';

import { ApiError } from '@/errors/general-api-error';
import { SellerError } from '@/errors/seller.error';
import prisma from '@/lib/prisma/client';

export class SellerService {
  private async validateTaxId(taxId: string): Promise<void> {
    const normalized = taxId.trim().toUpperCase();

    const TAX_ID_REGEX = /^[A-Z0-9-]{5,50}$/;

    if (!TAX_ID_REGEX.test(normalized)) {
      throw new SellerError('INVALID_TAX_ID_FORMAT', 'Invalid tax ID format', 400);
    }

    const existing = await prisma.user.findFirst({
      where: { taxId: normalized },
    });

    if (existing) {
      throw SellerError.taxIdExists(normalized);
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

    await this.validateTaxId(validatedData.taxId);

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
}
