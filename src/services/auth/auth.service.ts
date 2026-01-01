import { ApiError } from "@/utils/error";
import { AuthResult, AuthUser, SupabaseAuthUser } from "./auth.types";

import {
  SignInInput,
  signInSchema,
  SignUpInput,
  validateSignInInput,
  validateSignUpInput,
} from "./auth.validator";
import { supabaseServer } from "@/config/supabase/server-client";
import { logger } from "@/utils/logger";
import prisma from "@/lib/prisma/client";
import { env } from "@/config/env";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export class AuthService {
  async signUp(input: SignUpInput): Promise<AuthResult> {
    let supabaseUserId: string | null = null;
    let dbTransactionSucceeded = false;

    try {
      const validation = validateSignUpInput(input);
      if (!validation.success) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Invalid input data",
          validation.errors
        );
      }

      const validatedInput = validation.data!;

      const existingUser = await prisma.user.findUnique({
        where: { email: validatedInput.email },
      });

      if (existingUser) {
        throw new ApiError(409, "USER_ALREADY_EXISTS", "User already exists");
      }

      const { data: authData, error: authError } =
        await supabaseServer.auth.admin.createUser({
          email: validatedInput.email,
          password: validatedInput.password,
          email_confirm: true,
          user_metadata: {
            name: validatedInput.name,
            role: validatedInput.role || "USER",
          },
        });

      if (authError || !authData.user) {
        if (authError?.message.includes("already registered")) {
          throw new ApiError(409, "USER_ALREADY_EXISTS", "User already exists");
        }
        throw new ApiError(500, "AUTH_CREATION_FAILED", authError?.message!);
      }

      supabaseUserId = authData.user.id;

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            id: authData.user.id,
            email: authData.user.email!,
            name: validatedInput.name,
            role: validatedInput.role,
            profile: { create: {} },
          },
          include: { profile: true },
        });

        return newUser;
      });

      dbTransactionSucceeded = true;

      const { data: sessionData, error: sessionError } =
        await supabaseServer.auth.signInWithPassword({
          email: validatedInput.email,
          password: validatedInput.password,
        });

      if (sessionError || !sessionData.session) {
        throw new ApiError(
          500,
          "SESSION_CREATION_FAILED",
          "Failed to create user session"
        );
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: {
            id: user.profile?.id || "",
            avatar: user.profile?.avatar || null,
          },
        },
        session: sessionData.session,
      };
    } catch (error) {
      logger.error("Signup process failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: input.email,
        supabaseUserId,
        dbTransactionSucceeded,
      });

      // CLEANUP ONLY IF TRANSACTION FAILED AFTER SUPABASE CREATION
      if (supabaseUserId && !dbTransactionSucceeded) {
        await this.cleanupFailedSignup(supabaseUserId);
      }

      // Preserve original error
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, "SIGNUP_FAILED", "Signup process failed");
    }
  }

  //SigIn method:
  async signIn(input: SignInInput): Promise<AuthResult> {
    try {
      const validation = validateSignInInput(input);
      if (!validation.success) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Invalid input data",
          validation.errors
        );
      }
      const validatedInput: SignInInput = validation.data!;
      const { data: authData, error: authError } =
        await supabaseServer.auth.signInWithPassword({
          email: validatedInput.email,
          password: validatedInput.password,
        });

      if (authError) {
        throw new ApiError(
          401,
          "INVALID_CREDENTIALS",
          "Invalid email or password"
        );
      }

      if (!authData.user || !authData.session) {
        throw new ApiError(
          500,
          "AUTHENTICATION_FAILED",
          "Authentication failed"
        );
      }

      //   Get user for our Database:
      const user = await prisma.user.findUnique({
        where: {
          id: authData.user.id,
        },
        include: {
          profile: true,
        },
      });
      if (!user) {
        logger.warn("User exists in Supabase but not in our DB", {
          userId: authData.user.id,
        });

        this.syncMissingUser(authData.user.id);
        throw new ApiError(404, "USER_NOT_FOUND", "Please sign up again");
      }
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: {
            id: user.profile?.id ?? "",
            avatar: user.profile?.avatar ?? "",
          },
        },
        session: authData.session,
      };
    } catch (error) {
      logger.error("Signin process failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: input.email,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, "LOGIN_FAILED", "Login process failed");
    }
  }

  // Refresh Token method:
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    if (!refreshToken) {
      throw new ApiError(401, "NO_REFRESH_TOKEN", "Refresh token is required");
    }

    const tempClient = this.createTempSupabaseClient();

    const { data: sessionData, error: refreshError } =
      await tempClient.auth.refreshSession({ refresh_token: refreshToken });

    if (refreshError) {
      logger.error("Refresh token validation failed", { error: refreshError });

      if (refreshError.message.includes("invalid refresh token")) {
        throw new ApiError(
          401,
          "INVALID_REFRESH_TOKEN",
          "Refresh token is invalid or expired"
        );
      }
      throw new ApiError(401, "REFRESH_FAILED", "Failed to refresh session");
    }

    if (!sessionData.session) {
      throw new ApiError(
        500,
        "NO_SESSION",
        "No session returned after refresh"
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionData.session.user.id },
      include: { profile: true },
    });

    if (!user) {
      logger.warn("User not found in database after token refresh", {
        userId: sessionData.session.user.id,
      });
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: {
          id: user.profile?.id ?? "",
          avatar: user.profile?.avatar ?? null,
        },
      },
      session: sessionData.session,
    };
  }

  async getUser(userId: string) {
    if (!userId) {
      throw new ApiError(400, "USER_ID_MISSING", "User id is missing");
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, addresses: true },
    });
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }
    return {user}
  }
  private createTempSupabaseClient(): SupabaseClient {
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );
  }

  //   Cleanup method:
  private async cleanupFailedSignup(userId: string) {
    try {
      logger.info("Cleaning up failed signup", { userId });

      await supabaseServer.auth.admin.deleteUser(userId);

      logger.info("Deleted Supabase user during cleanup", { userId });
    } catch (error) {
      logger.error("Cleanup failed for signup", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // sync missing user:

  private async syncMissingUser(userId: string) {
    try {
      const { data: user } = await supabaseServer.auth.admin.getUserById(
        userId
      );
      if (user) {
        await prisma.user.create({
          data: {
            id: userId,
            email: user.user?.email!,
            name: user.user?.user_metadata.name || "User",
            role: user.user?.user_metadata.role || "USER",
            profile: {
              create: {},
            },
          },
        });
        logger.info("Synced missing user from Supabase", { userId });
      }
    } catch (error) {
      logger.error("Failed to sync missing user", { userId, error });
    }
  }
}
