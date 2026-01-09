import { Response } from 'express';

import type { UserRole } from '@/config/constants';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        profile: any;
        authMetadata?: {
          emailVerified: boolean;
          lastSignIn?: string;
          createdAt?: string;
        };
      };
      rateLimit?: {
        limit: number;
        remaining: number;
        resetTime: number;
      };
    }

    interface Response {
      metaData?: {
        path: string;
        requestId?: string;
        ip?: string;
        timestamp?: string;
      };
    }
  }
}
