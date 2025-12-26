import { ApiError } from "@/utils/error";
import { AuthResult, SupabaseAuthUser } from "./auth.types";

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

export class AuthService {
  async signUp(input: SignUpInput): Promise<AuthResult> {
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
      const validatedInput: SignUpInput = validation.data!;

      const existingUser = await prisma.user.findUnique({
        where: {
          email: validatedInput.email,
        },
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
      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new ApiError(409, "USER_ALREADY_EXISTS", "User already exists");
        }
        logger.error("Supabase auth creation failed", { authError });
        throw new ApiError(500, "AUTH_CREATION_FAILED", authError.message);
      }
      if (!authData.user) {
        logger.error("Supabase user not creation failed");
        throw new ApiError(500, "NO_USER_CREATED", "Auth user creation failed");
      }

      // Create user in our database:
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            id: authData.user.id,
            email: authData.user.email!,
            name: validatedInput.name,
            role: validatedInput.role,
            profile: {
              create: {},
            },
          },
          include: {
            profile: true,
          },
        });
        return newUser;
      });

      // Get Session:
      const { data: sessionData, error: sessionError } =
        await supabaseServer.auth.signInWithPassword({
          email: validatedInput.email,
          password: validatedInput.password,
        });
      if (sessionError || !sessionData.session) {
        logger.error("Session creation failed after signup", {
          error: sessionError,
        });
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
      });

      await this.cleanupFailedSignup(input.email);
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

  //   Cleanup method:
  private async cleanupFailedSignup(email: string) {
    try {
      logger.info("Cleaning up failed signup ", { email });

      const { data: userList } = await supabaseServer.auth.admin.listUsers();
      const userToDelete = userList.users.find((u) => u.email === email);

      if (userToDelete) {
        await supabaseServer.auth.admin.deleteUser(userToDelete.id);
        logger.info("Deleted Supabase user during cleanup", {
          userId: userToDelete.id,
        });
      }
    } catch (cleanupError) {
      logger.error("Cleanup failed for signup", {
        email,
        error:
          cleanupError instanceof Error
            ? cleanupError.message
            : "Unknown error",
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
