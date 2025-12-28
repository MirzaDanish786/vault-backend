import { ErrorCode } from "@/types/error";

export class ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    path?: string;
    requestId?: string;
    [key: string]: unknown;
  };

  constructor(
    success: boolean,
    options?: {
      data?: T;
      error?: { code: ErrorCode; message: string; details?: unknown };
      meta?: { path?: string; requestId?: string; [key: string]: unknown };
    }
  ) {
    this.success = success;
    this.data = options?.data;
    this.error = options?.error;
    this.meta = {
      timestamp: new Date().toISOString(),
      ...options?.meta,
    };
  }

  static success<T>(data: T, meta?: { path?: string; requestId?: string; method?: string; ip?: string; [key: string]: string | number | NodeJS.MemoryUsage |  undefined}) {
    return new ApiResponse<T>(true, { data, meta });
  }

  static created<T>(data: T, meta?: { path?: string; requestId?: string }) {
    return new ApiResponse<T>(true, {
      data,
      meta: { ...meta, status: 'created' }
    });
  }

  static badRequest(
    code: ErrorCode,
    message: string,
    details?: unknown,
    meta?: { path?: string; requestId?: string }
  ) {
    return new ApiResponse(false, {
      error: { code, message, details },
      meta,
    });
  }

  static unauthorized(
    code: ErrorCode = 'UNAUTHORIZED',
    message: string = 'Authentication required',
    meta?: { path?: string; requestId?: string }
  ) {
    return new ApiResponse(false, {
      error: { code, message },
      meta,
    });
  }

  static forbidden(
    code: ErrorCode = 'FORBIDDEN',
    message: string = 'Insufficient permissions',
    meta?: { path?: string; requestId?: string }
  ) {
    return new ApiResponse(false, {
      error: { code, message },
      meta,
    });
  }

  static notFound(
    resource: string,
    meta?: { path?: string; requestId?: string }
  ) {
    return new ApiResponse(false, {
      error: {
        code: 'NOT_FOUND',
        message: `${resource} not found`,
      },
      meta,
    });
  }

  static conflict(
    code: ErrorCode,
    message: string,
    details?: unknown,
    meta?: { path?: string; requestId?: string }
  ) {
    return new ApiResponse(false, {
      error: { code, message, details },
      meta,
    });
  }

  static internalError(
    error?: Error,
    meta?: { path?: string; requestId?: string, method?: string, ip?: string }
  ) {
    return new ApiResponse(false, {
      error: {
        code: 'INTERNAL_SERVER_ERROR' as ErrorCode,
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      meta,
    });
  }

  static send(res: any, apiResponse: ApiResponse) {
    const statusCode = ApiResponse.getStatusCode(apiResponse);
    res.status(statusCode).json(apiResponse);
  }

  private static getStatusCode(response: ApiResponse): number {
    if (response.success) {
      if (response.meta?.status === 'created') return 201;
      return 200;
    }

    const codeMap: Record<string, number> = {
      'VALIDATION_ERROR': 400,
      'UNAUTHORIZED': 401,
      'FORBIDDEN': 403,
      'NOT_FOUND': 404,
      'USER_ALREADY_EXISTS': 409,
      'CONFLICT': 409,
      'INTERNAL_SERVER_ERROR': 500,
    };

    return codeMap[response.error?.code || ''] || 400;
  }
}

export type ApiResponseType<T = any> = InstanceType<typeof ApiResponse<T>>;