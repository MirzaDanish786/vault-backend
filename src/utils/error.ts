import { StatusCode } from "@/types/http";

export class ApiError extends Error {
  constructor(
    public statusCode: StatusCode,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
