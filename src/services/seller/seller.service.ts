import { SellerError } from './seller.types';
import { SellerApplicationInput, SellerValidator } from './seller.validator';

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

  becomeSeller = async (data: SellerApplicationInput) => {
    try {
      const validatedData = SellerValidator.validateSellerApplicationInput(data);

      const user = await prisma.user.findUnique({ where: { id: validatedData.userId } });
      if (!user) {
        throw new SellerError('USER_NOT_FOUND', 'User not found', 404);
      }
      if (user.isAppliedForSeller && user.sellerStatus === 'PENDING_VERIFICATION') {
        throw new SellerError('SELLER_ALREADY_APPLIED', 'Already applied for seller', 403);
      }
      if (user.sellerStatus === 'APPROVED') {
        throw new SellerError('ALREADY_A_SELLER', 'User is already seller', 403);
      }

      await this.validateTaxId(validatedData.taxId);

      const becomeSeller = await prisma.user.update({
        where: { id: validatedData.userId },
        data: {
          isAppliedForSeller: true,
          sellerAppliedAt: Date.now().toString(),
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
    } catch (e) {
      console.log('Fail to become seller!');
    }
  };
}
