import { ApiError } from '@/errors/general-api-error';
import { StatusCode } from '@/types/http';

export const FILE_ERROR_CODES = {
  // Validation errors
  INVALID_DOCUMENT_TYPE: 'INVALID_DOCUMENT_TYPE',
  NO_FILE: 'NO_FILE',
  NO_FILES: 'NO_FILES',
  MISSING_PUBLIC_ID: 'MISSING_PUBLIC_ID',

  INVALID_REQUEST: 'INVALID_REQUEST',
  FILE_REQUIRED: 'FILE_REQUIRED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  DELETE_FAILED: 'DELETE_FAILED',
  PUBLIC_IDS_REQUIRED: 'PUBLIC_IDS_REQUIRED',

  // Upload/Download errors
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',

  // Cloudinary specific errors
  CLOUDINARY_UPLOAD_FAILED: 'CLOUDINARY_UPLOAD_FAILED',
  CLOUDINARY_DELETE_FAILED: 'CLOUDINARY_DELETE_FAILED',
  INVALID_PUBLIC_ID: 'INVALID_PUBLIC_ID',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',

  // Storage errors
  STORAGE_LIMIT_EXCEEDED: 'STORAGE_LIMIT_EXCEEDED',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',

  // Processing errors
  IMAGE_PROCESSING_FAILED: 'IMAGE_PROCESSING_FAILED',
  FILE_CORRUPTED: 'FILE_CORRUPTED',

  // Security errors
  VIRUS_DETECTED: 'VIRUS_DETECTED',
  FILE_BLOCKED: 'FILE_BLOCKED',
} as const;

export type FileErrorCode = (typeof FILE_ERROR_CODES)[keyof typeof FILE_ERROR_CODES];

export class FileError extends ApiError {
  constructor(
    code: FileErrorCode,
    message: string,
    statusCode: StatusCode = 400,
    details?: unknown,
  ) {
    super(statusCode, code, message, details);
    this.name = 'FileError';
  }

  static fileRequired(): FileError {
    return new FileError(FILE_ERROR_CODES.FILE_REQUIRED, 'No file provided', 400);
  }

  static fileTooLarge(maxSizeMB: number): FileError {
    return new FileError(
      FILE_ERROR_CODES.FILE_TOO_LARGE,
      `File must be less than ${maxSizeMB}MB`,
      400,
    );
  }

  static invalidFileType(allowedTypes: string[]): FileError {
    return new FileError(
      FILE_ERROR_CODES.INVALID_FILE_TYPE,
      `Allowed types: ${allowedTypes.join(', ')}`,
      400,
    );
  }

  static uploadFailed(error: Error): FileError {
    return new FileError(FILE_ERROR_CODES.UPLOAD_FAILED, `Upload failed: ${error.message}`, 500, {
      originalError: error.message,
    });
  }

  static deleteFailed(publicId: string, error: Error): FileError {
    return new FileError(
      FILE_ERROR_CODES.CLOUDINARY_DELETE_FAILED,
      `Failed to delete file: ${error.message}`,
      500,
      { publicId, originalError: error.message },
    );
  }

  static fileNotFound(publicId: string): FileError {
    return new FileError(
      FILE_ERROR_CODES.FILE_NOT_FOUND,
      `File with ID ${publicId} not found`,
      404,
      { publicId },
    );
  }

  static invalidPublicId(publicId: string): FileError {
    return new FileError(FILE_ERROR_CODES.INVALID_PUBLIC_ID, 'Invalid public ID provided', 400, {
      publicId,
    });
  }
}
