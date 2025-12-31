import { UserRole } from "@/config/constants";
import { Response } from "express";

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

    }

    interface Response {
      metaData?: {
        path: string;
        requestId?: string;
        ip?: string,
        timestamp?: string
      };
    }
  }
}
