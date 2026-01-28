import { Readable } from 'stream';

import { v2 as cloudinary } from 'cloudinary';

import { IUploadResult, DeleteFileResult, DeleteResultStatus } from './file.type';

import { FileError } from '@/errors/file.error';

export class FileService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  /**
   * Validate file based on size and type constraints
   * @param file - Multer file object
   * @throws {FileError} if file validation fails
   */
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
      throw FileError.fileRequired();
    }

    if (file.size > MAX_SIZE) {
      throw FileError.fileTooLarge(10);
    }

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw FileError.invalidFileType(['JPG', 'PNG', 'WebP', 'PDF', 'DOC', 'DOCX']);
    }
  }

  /**
   * Upload document to Cloudinary
   * @param buffer - File buffer
   * @param userId - User identifier for folder organization
   * @param documentType - Type of document (e.g., GOVERNMENT_ID)
   * @param fileName - Original filename
   * @returns Upload result with URL and metadata
   * @throws {FileError} if upload fails
   */
  async uploadDocument(
    buffer: Buffer,
    userId: string,
    documentType: string,
    fileName: string,
  ): Promise<IUploadResult & { actualResourceType: string }> {
    return new Promise((resolve, reject) => {
      const resourceType = this.determineResourceTypeFromFilename(fileName);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `documents/${userId}`,
          public_id: `${documentType}_${Date.now()}`,
          resource_type: resourceType,
          transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
          tags: ['document', documentType, userId],
          context: {
            userId,
            documentType,
            originalName: fileName,
            uploadedAt: new Date().toISOString(),
          },
        },
        (error, result) => {
          if (error) {
            reject(FileError.uploadFailed(error));
          } else if (result) {
            const actualResourceType =
              result.resource_type ||
              (resourceType === 'auto' ? (result.format ? 'image' : 'raw') : resourceType);

            console.log('[FileService] Upload successful:', {
              publicId: result.public_id,
              actualResourceType,
              format: result.format,
              resourceTypeUsed: resourceType,
            });

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              size: result.bytes,
              width: result.width,
              height: result.height,
              resourceType: actualResourceType,
              originalName: fileName,
              actualResourceType,
            });
          } else {
            reject(new FileError('UPLOAD_FAILED', 'Upload failed with no result', 500));
          }
        },
      );

      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Delete a file from Cloudinary storage with automatic resource type detection
   * @param publicId - Cloudinary public ID
   * @param options - Optional deletion configuration
   * @returns Deletion result with status
   * @throws {FileError} if deletion fails
   */
  async deleteFile(
    publicId: string,
    options?: {
      resourceType?: 'image' | 'video' | 'raw';
      invalidate?: boolean;
    },
  ): Promise<DeleteFileResult> {
    const cleanedPublicId = publicId.trim();

    if (!cleanedPublicId || cleanedPublicId.length === 0) {
      throw FileError.invalidPublicId(publicId);
    }

    if (options?.resourceType) {
      return this.deleteWithSpecificResourceType(
        cleanedPublicId,
        options.resourceType,
        options.invalidate ?? true,
      );
    }

    const extensionMatch = cleanedPublicId.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';

    if (extension) {
      const resourceType = this.getResourceTypeFromExtension(extension);
      try {
        return await this.deleteWithSpecificResourceType(
          cleanedPublicId,
          resourceType,
          options?.invalidate ?? true,
        );
      } catch (error: any) {
        if (error.http_code === 400 && error.message?.includes('resource type')) {
          console.log(
            `[FileService] Wrong resource type "${resourceType}", trying alternatives...`,
          );
          return await this.tryMultipleResourceTypes(cleanedPublicId, options?.invalidate ?? true);
        }
        throw error;
      }
    }

    console.log(
      `[FileService] No extension in publicId "${cleanedPublicId}", trying to detect resource type`,
    );
    return await this.tryMultipleResourceTypes(cleanedPublicId, options?.invalidate ?? true);
  }

  /**
   * Try deleting with multiple resource types until one works
   */
  private async tryMultipleResourceTypes(
    publicId: string,
    invalidate: boolean,
  ): Promise<DeleteFileResult> {
    const resourceTypesToTry: Array<'image' | 'raw' | 'video'> = ['image', 'raw', 'video'];

    for (const resourceType of resourceTypesToTry) {
      try {
        console.log(`[FileService] Trying resource type: ${resourceType}`);
        return await this.deleteWithSpecificResourceType(publicId, resourceType, invalidate);
      } catch (error: any) {
        if (error.http_code === 404 || error.message?.includes('not found')) {
          console.log(`[FileService] File not found with resource type: ${resourceType}`);
          return {
            success: true,
            result: 'already_deleted' as DeleteResultStatus,
            details: {
              message: 'File not found (may already be deleted)',
              triedResourceType: resourceType,
            },
          };
        }

        if (error.http_code === 400 && error.message?.includes('resource type')) {
          console.log(`[FileService] Wrong resource type: ${resourceType}`);
          continue;
        }

        throw error;
      }
    }

    throw new FileError(
      'DELETE_FAILED',
      `Failed to delete file with any resource type (tried: image, raw, video)`,
      500,
      { publicId },
    );
  }

  /**
   * Delete file with specific resource type
   */
  private async deleteWithSpecificResourceType(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw',
    invalidate: boolean,
  ): Promise<DeleteFileResult> {
    console.log('[FileService] Deleting with specific resource type:', {
      publicId,
      resourceType,
      invalidate,
      timestamp: new Date().toISOString(),
    });

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate,
    });

    console.log('[FileService] Cloudinary response:', {
      result: result.result,
      resourceType,
      publicId,
    });

    if (result.result === 'ok') {
      return {
        success: true,
        result: 'deleted' as DeleteResultStatus,
        details: { ...result, usedResourceType: resourceType },
      };
    } else if (result.result === 'not found') {
      return {
        success: true,
        result: 'already_deleted' as DeleteResultStatus,
        details: { ...result, usedResourceType: resourceType },
      };
    } else {
      throw new FileError(
        'CLOUDINARY_DELETE_FAILED',
        `Cloudinary deletion failed: ${result.result}`,
        500,
        { publicId, cloudinaryResult: result, usedResourceType: resourceType },
      );
    }
  }

  /**
   * Determine Cloudinary resource type from file extension
   * @param publicId - Cloudinary public ID or filename
   * @returns Appropriate resource type for Cloudinary API
   */
  private determineResourceType(publicId: string): 'image' | 'video' | 'raw' {
    const extensionMatch = publicId.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';

    return this.getResourceTypeFromExtension(extension);
  }

  /**
   * Determine resource type from filename (for uploads)
   * @param fileName - Original filename
   * @returns Appropriate resource type
   */
  private determineResourceTypeFromFilename(fileName: string): 'image' | 'video' | 'raw' | 'auto' {
    const extensionMatch = fileName.match(/\.([a-z0-9]+)$/i);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';

    if (extension === '') {
      return 'auto';
    }

    const type = this.getResourceTypeFromExtension(extension);
    return type === 'image' ? 'auto' : type;
  }

  /**
   * Map file extension to Cloudinary resource type
   * @param extension - File extension
   * @returns Resource type
   */
  private getResourceTypeFromExtension(extension: string): 'image' | 'video' | 'raw' {
    const imageExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'svg',
      'bmp',
      'tiff',
      'ico',
      'psd',
      'ai',
      'eps',
      'heic',
      'heif',
    ];

    const videoExtensions = [
      'mp4',
      'mov',
      'avi',
      'wmv',
      'flv',
      'webm',
      'mpeg',
      'mpg',
      'mkv',
      '3gp',
      'm4v',
      'ogv',
      'qt',
    ];

    const rawExtensions = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'rtf',
      'csv',
      'zip',
      'rar',
      '7z',
      'tar',
      'gz',
      'json',
      'xml',
      'js',
      'css',
      'html',
      'htm',
      'odt',
      'ods',
      'odp',
    ];

    if (imageExtensions.includes(extension)) {
      return 'image';
    } else if (videoExtensions.includes(extension)) {
      return 'video';
    } else if (rawExtensions.includes(extension)) {
      return 'raw';
    }

    console.warn(
      `[FileService] Unknown file extension "${extension}", defaulting to 'image' resource type`,
    );
    return 'image';
  }

  /**
   * Batch delete multiple files
   * @param publicIds - Array of Cloudinary public IDs
   * @returns Array of deletion results for each file
   */
  async deleteMultipleFiles(
    publicIds: string[],
  ): Promise<Array<DeleteFileResult & { publicId: string }>> {
    const results: Array<DeleteFileResult & { publicId: string }> = [];

    for (const publicId of publicIds) {
      try {
        const result = await this.deleteFile(publicId);
        results.push({
          publicId,
          ...result,
        });
      } catch (error: any) {
        const errorResult = {
          publicId,
          success: false,
          result: 'error' as DeleteResultStatus,
          error: error instanceof FileError ? error.message : 'Unknown error',
          details: error instanceof FileError ? error.details : undefined,
        };
        results.push(errorResult);
      }
    }

    return results;
  }

  /**
   * Generate optimized thumbnail URL for images
   * @param url - Original Cloudinary URL
   * @param width - Thumbnail width (default: 300)
   * @param height - Thumbnail height (default: 300)
   * @returns Thumbnail URL
   */
  async generateThumbnail(url: string, width: number = 300, height: number = 300): Promise<string> {
    try {
      const publicId = this.extractPublicIdFromUrl(url);
      return cloudinary.url(publicId, {
        transformation: [
          { width, height, crop: 'fill' },
          { quality: 'auto:low' },
          { fetch_format: 'auto' },
        ],
      });
    } catch (error) {
      console.error('[FileService] Failed to generate thumbnail:', error);
      return url;
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param url - Cloudinary URL
   * @returns Extracted public ID
   */
  private extractPublicIdFromUrl(url: string): string {
    try {
      const patterns = [
        /\/upload\/(?:v\d+\/)?([^.]+)/, // Removed \ before .
        /\/image\/upload\/(?:v\d+\/)?([^.]+)/, // Removed \ before .
        /\/raw\/upload\/(?:v\d+\/)?([^.]+)/, // Removed \ before .
        /\/video\/upload\/(?:v\d+\/)?([^.]+)/, // Removed \ before .
      ];

      for (const pattern of patterns) {
        const matches = url.match(pattern);
        if (matches && matches[1]) {
          return matches[1];
        }
      }

      const fallbackMatch = url.match(/\/([^/]+\/[^/]+)\./); // Removed \ before /
      return fallbackMatch ? fallbackMatch[1] : url;
    } catch (error) {
      console.warn('[FileService] Failed to extract public ID from URL:', url);
      return url;
    }
  }

  /**
   * Get file information from Cloudinary (metadata only, no download)
   * @param publicId - Cloudinary public ID
   * @param resourceType - Resource type to check
   * @returns File metadata
   */
  async getFileInfo(publicId: string, resourceType?: 'image' | 'video' | 'raw'): Promise<any> {
    if (!resourceType) {
      resourceType = this.determineResourceType(publicId);
    }

    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error: unknown) {
      console.error('[FileService] Failed to get file info:', {
        publicId,
        resourceType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw FileError.fileNotFound(publicId);
    }
  }

  /**
   * Check if file exists in Cloudinary
   * @param publicId - Cloudinary public ID
   * @returns True if file exists
   */
  async fileExists(publicId: string): Promise<boolean> {
    try {
      const resourceTypes: Array<'image' | 'raw' | 'video'> = ['image', 'raw', 'video'];

      for (const resourceType of resourceTypes) {
        try {
          await cloudinary.api.resource(publicId, { resource_type: resourceType });
          return true;
        } catch (error) {
          continue;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Debug method to list files in a folder
   */
  async listFilesInFolder(folderPath: string): Promise<any> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: 100,
      });
      return result;
    } catch (error) {
      console.error('[FileService] Failed to list files:', error);
      throw error;
    }
  }
}
