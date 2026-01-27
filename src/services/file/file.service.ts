import { Readable } from 'stream';

import { v2 as cloudinary } from 'cloudinary';

import { SellerError } from '@/services/seller/seller.types';

export interface IUploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
}

export class FileService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  validateFile(file: Express.Multer.File): void {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!file) {
      throw new SellerError('FILE_REQUIRED', 'No file provided', 400);
    }

    if (file.size > MAX_SIZE) {
      throw new SellerError('FILE_TOO_LARGE', 'File must be less than 10MB', 400);
    }

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new SellerError(
        'INVALID_FILE_TYPE',
        'Allowed types: JPG, PNG, WebP, PDF, DOC, DOCX',
        400,
      );
    }
  }

  // Upload buffer to Cloudinary
  async uploadDocument(
    buffer: Buffer,
    userId: string,
    documentType: string,
    fileName: string,
  ): Promise<IUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `documents/${userId}`,
          public_id: `${documentType}_${Date.now()}`,
          resource_type: 'auto',
          transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
          tags: ['seller_document', documentType, userId],
          context: {
            userId,
            documentType,
            uploadedAt: new Date().toISOString(),
          },
        },
        (error, result) => {
          if (error) {
            reject(new SellerError('UPLOAD_FAILED', `Upload failed: ${error.message}`, 500));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              size: result.bytes,
              width: result.width,
              height: result.height,
            });
          } else {
            reject(new SellerError('UPLOAD_FAILED', 'Upload failed with no result', 500));
          }
        },
      );

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  }

  // Delete file from Cloudinary
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  // Generate optimized thumbnail for images
  async generateThumbnail(url: string, width: number = 300, height: number = 300): Promise<string> {
    const publicId = this.extractPublicIdFromUrl(url);

    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill' },
        { quality: 'auto:low' },
        { fetch_format: 'auto' },
      ],
    });
  }

  private extractPublicIdFromUrl(url: string): string {
    const matches = url.match(/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|png|pdf|docx?)/);
    return matches ? matches[1] : url;
  }
}
