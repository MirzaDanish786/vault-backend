import { z } from 'zod';

import { SELLER_ERROR_CODES, SellerError } from '@/errors/seller.error';

export const BUSINESS_TYPE = z.enum(['INDIVIDUAL', 'COMPANY']);

export const sellerApplicationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name is too long'),

  businessEmail: z.string().email('Invalid business email'),

  businessPhone: z
    .string()
    .min(8, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number format'),

  businessAddress: z.string().min(5, 'Address is too short').max(200, 'Address is too long'),

  businessType: BUSINESS_TYPE,
  documents: z
    .object({
      governmentId: z.string().optional(),
      taxCertificate: z.string().optional(),
      addressProof: z.string().optional(),
      bankStatement: z.string().optional(),
    })
    .refine(docs => !!docs && Object.values(docs).some(value => !!value), {
      message: 'At least one document must be provided',
    })
    .optional(),

  taxId: z.string().min(5, 'Tax ID is too short').max(50, 'Tax ID is too long'),

  description: z.string().max(500, 'Description is too long').optional(),

  websiteUrl: z.string().url('Website URL must be valid').optional(),

  termsAccepted: z.literal(true, { message: 'You must accept the terms' }),

  privacyPolicyAccepted: z.literal(true, { message: 'You must accept the privacy policy' }),
});
export const sellerIdSchema = z.string().cuid('Invalid store ID');

export type SellerIdInput = z.infer<typeof sellerIdSchema>
export type SellerApplicationInput = z.infer<typeof sellerApplicationSchema>;

export class SellerValidator {
  static validateSellerApplicationInput(data: SellerApplicationInput): SellerApplicationInput {
    try {
      return sellerApplicationSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new SellerError(
          SELLER_ERROR_CODES.VALIDATION_ERROR,
          'Validation failed',
          400,
          error.issues,
        );
      }
      throw error;
    }
  }

  static validateId(id: SellerIdInput):SellerIdInput{
     try {
      return sellerIdSchema.parse(id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new SellerError(
          SELLER_ERROR_CODES.VALIDATION_ERROR,
          'Validation failed',
          400,
          error.issues,
        );
      }
      throw error;
    }
  }
}
