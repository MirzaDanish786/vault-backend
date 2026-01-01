import { Permission, ROLE_PERMISSIONS, UserRole } from "@/config/constants";
import { supabaseServer } from "@/config/supabase/server-client";
import prisma from "@/lib/prisma/client";
// import { UserRole } from "@/services/auth";
import { ApiResponse } from "@/utils/api-response";
import { logger } from "@/utils/logger";
import { Request, Response, NextFunction } from "express";
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      const response = ApiResponse.unauthorized(
        "NO_TOKEN",
        "Authentication token is required",
        {
          hint: "Include token in Authorization header or access_token cookie",
          supportedMethods: ["Bearer Token", "Cookie"],
        }
      );

      logger.warn("No authentication token provided", {
        requestId: req.requestId,
        path: req.path,
        ip: req.ip,
      });
      return ApiResponse.send(res, response);
    }

    //   Verify token from supabase:
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseServer.auth.getUser(token);

    if (authError || !authUser) {
      logger.warn("Invalid authentication token", {
        requestId: req.requestId,
        error: authError?.message,
        tokenType: token.startsWith("eyJ") ? "JWT" : "Unknown",
        path: req.path,
      });

      const response = ApiResponse.unauthorized(
        "INVALID_TOKEN",
        "Invalid or expired authentication token",
        {
          expired: authError?.message?.includes("expired") || false,
          malformed: authError?.message?.includes("malformed") || false,
        }
      );

      return ApiResponse.send(res, response);
    }

    //   Find user in our db:
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        profile: true,
      },
    });
    if (!dbUser) {
      logger.error("User not found in database", {
        requestId: req.requestId,
        authUserId: authUser.id,
        email: authUser.email,
      });

      const response = ApiResponse.unauthorized(
        "USER_NOT_FOUND",
        "User account not found in system",
        { userId: authUser.id }
      );

      return ApiResponse.send(res, response);
    }
    if (!dbUser.isActive) {
      const response = ApiResponse.forbidden(
        "ACCOUNT_INACTIVE",
        "Your account has been deactivated"
      );
      return ApiResponse.send(res, response);
    }
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      profile: dbUser.profile,
      authMetadata: {
        emailVerified: authUser.email_confirmed_at !== null,
        lastSignIn: authUser.last_sign_in_at,
        createdAt: authUser.created_at,
      },
    };

    logger.debug("User authenticated successfully", {
      requestId: req.requestId,
      userId: dbUser.id,
      role: dbUser.role,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.error("Authentication middleware error", {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      path: req.path,
      ip: req.ip,
    });

    const response = ApiResponse.internalError(
      error instanceof Error ? error : undefined
    );

    ApiResponse.send(res, response);
  }
};

// Role-Based Authorization Middleware
export const requireRole = (roles: UserRole | UserRole[]) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        const response = ApiResponse.unauthorized(
          "UNAUTHORIZED",
          "User context not found in request"
        );
        return ApiResponse.send(res, response);
      }
      if (!requiredRoles.includes(req.user?.role)) {
        logger.warn("Insufficient permissions", {
          requestId: req.requestId,
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles,
          path: req.path,
          method: req.method,
        });

        const response = ApiResponse.forbidden(
          "INSUFFICIENT_PERMISSIONS",
          `Access denied. Required roles: ${requiredRoles.join(", ")}`,
          {
            userRole: req.user.role,
            requiredRoles,
            hasAccess: false,
          }
        );
        logger.debug("Role check passed", {
          requestId: req.requestId,
          userId: req.user.id,
          role: req.user.role,
          requiredRoles,
        });

        return ApiResponse.send(res, response);
      }
      next();
    } catch (error) {
      logger.error("Role middleware error", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : "Unknown",
      });

      const response = ApiResponse.internalError(
        error instanceof Error ? error : undefined,
        { path: req.path, requestId: req.requestId }
      );

      ApiResponse.send(res, response);
    }
  };
};

// Permission-Based Middleware (for granular control)
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.send(
        res,
        ApiResponse.unauthorized("UNAUTHORIZED", "Authentication required")
      );
    }
    const userPermissions = ROLE_PERMISSIONS[req.user.role] ?? [];
    if (!hasPermission(userPermissions, permission)) {
      return ApiResponse.send(
        res,
        ApiResponse.forbidden(
          "INSUFFICIENT_PERMISSIONS",
          `Missing permission: ${permission}`,
          {
            required: permission,
            userPermissions,
          }
        )
      );
    }
    logger.debug("Role check passed") 

    next();
  };
};

const extractToken = (req: Request): string | null => {
  // Token via authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Access token via cookies
  const tokenViaCookie = req.cookies.access_token;
  if (tokenViaCookie) {
    return tokenViaCookie;
  }

  // Query parameter (for websockets or specific cases)
  if (req.query.token && typeof req.query.token === "string") {
    return req.query.token;
  }

  // X-Access-Token header (alternative)
  const xAccessToken = req.headers["x-access-token"];
  if (xAccessToken && typeof xAccessToken === "string") {
    return xAccessToken;
  }

  return null;
};

const hasPermission = (
  userPermissions: readonly Permission[],
  required: string
): boolean =>
  userPermissions.some(
    (p) =>
      p === required ||
      (p.endsWith(".*") && required.startsWith(p.slice(0, -2)))
  );
