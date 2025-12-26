import { USER_ROLES } from "@/config/constants";
import { ApiError } from "@/utils/error";

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface SupabaseAuthUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    role?: string;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: any;
}

export type StatusCode = 200 | 201 | 400 | 401 | 404 | 409 | 500
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profile: {
    id: string;
    avatar: string | null;
  };
}

export interface AuthResult {
  user: AuthUser
  session: AuthSession;  
}

// success:
// message?: string;
//   statusCode: StatusCode;

