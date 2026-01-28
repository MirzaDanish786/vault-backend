// src/services/file/file.type.ts
export type DeleteResultStatus = 'deleted' | 'already_deleted' | 'not_found' | 'error';

export interface IUploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  resourceType?: string;
  originalName?: string;
  actualResourceType?: string;
}

export interface DeleteFileResult {
  success: boolean;
  result: DeleteResultStatus;
  details?: any;
  error?: string;
}

export interface FileMetadata {
  publicId: string;
  url: string;
  size: number;
  format: string;
  uploadedAt: Date;
  resourceType: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface BatchDeleteResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    publicId: string;
    success: boolean;
    result: DeleteResultStatus;
    error?: string;
  }>;
}
