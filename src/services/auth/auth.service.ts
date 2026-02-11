import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import type { AuthResult } from './auth.types';
import type { SignInInput, SignUpInput } from './auth.validator';
import { signInSchema, validateSignInInput, validateSignUpInput } from './auth.validator';

import { env } from '@/config/env';
import { supabaseServer } from '@/config/supabase/server-client';
import { ApiError } from '@/errors/general-api-error';
import prisma from '@/lib/prisma/client';
import { logger } from '@/utils/logger';

export class AuthService {
  async signUp(input: SignUpInput): Promise<AuthResult> {
    let supabaseUserId: string | null = null;
    let dbTransactionSucceeded = false;

    try {
      const validation = validateSignUpInput(input);
      if (!validation.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid input data', validation.errors);
      }

      const validatedInput = validation.data!;

      const existingUser = await prisma.user.findUnique({
        where: { email: validatedInput.email },
      });

      if (existingUser) {
        throw new ApiError(409, 'USER_ALREADY_EXISTS', 'User already exists');
      }

      const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
        email: validatedInput.email,
        password: validatedInput.password,
        email_confirm: true,
        user_metadata: {
          name: validatedInput.name,
          role: validatedInput.role || 'USER',
        },
      });

      if (authError || !authData.user) {
        if (authError?.message.includes('already registered')) {
          throw new ApiError(409, 'USER_ALREADY_EXISTS', 'User already exists');
        }
        throw new ApiError(
          500,
          'AUTH_CREATION_FAILED',
          authError?.message || 'Unknown authentication error',
        );
      }

      supabaseUserId = authData.user.id;

      const user = await prisma.$transaction(async tx => {
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
        throw new ApiError(500, 'SESSION_CREATION_FAILED', 'Failed to create user session');
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: {
            id: user.profile?.id || '',
            avatar: user.profile?.avatar || null,
          },
        },
        session: sessionData.session,
      };
    } catch (error) {
      logger.error('Signup process failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
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

      throw new ApiError(500, 'SIGNUP_FAILED', 'Signup process failed');
    }
  }

  //SigIn method:
  async signIn(input: SignInInput): Promise<AuthResult> {
    try {
      const validation = validateSignInInput(input);
      if (!validation.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid input data', validation.errors);
      }
      const validatedInput: SignInInput = validation.data!;
      const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
        email: validatedInput.email,
        password: validatedInput.password,
      });

      if (authError) {
        throw new ApiError(400, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }

      if (!authData.user || !authData.session) {
        throw new ApiError(500, 'AUTHENTICATION_FAILED', 'Authentication failed');
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
        logger.warn('User exists in Supabase but not in our DB', {
          userId: authData.user.id,
        });

        this.syncMissingUser(authData.user.id);
        throw new ApiError(404, 'USER_NOT_FOUND', 'Please sign up again');
      }
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: {
            id: user.profile?.id ?? '',
            avatar: user.profile?.avatar ?? '',
          },
        },
        session: authData.session,
      };
    } catch (error) {
      logger.error('Signin process failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: input.email,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'LOGIN_FAILED', 'Login process failed');
    }
  }

  // Refresh Token method:
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    if (!refreshToken) {
      throw new ApiError(401, 'NO_REFRESH_TOKEN', 'Refresh token is required');
    }

    const tempClient = this.createTempSupabaseClient();

    const { data: sessionData, error: refreshError } = await tempClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (refreshError) {
      logger.error('Refresh token validation failed', { error: refreshError });

      if (refreshError.message.includes('invalid refresh token')) {
        throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
      }
      throw new ApiError(401, 'REFRESH_FAILED', 'Failed to refresh session');
    }

    if (!sessionData.session) {
      throw new ApiError(500, 'NO_SESSION', 'No session returned after refresh');
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionData.session.user.id },
      include: { profile: true },
    });

    if (!user) {
      logger.warn('User not found in database after token refresh', {
        userId: sessionData.session.user.id,
      });
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: {
          id: user.profile?.id ?? '',
          avatar: user.profile?.avatar ?? null,
        },
      },
      session: sessionData.session,
    };
  }

  async revokeTokens(userId: string): Promise<void> {
    if (!userId) {
      throw new ApiError(400, 'USER_ID_REQUIRED', 'User ID is required');
    }

    // Call an Edge Function that has admin access
    const { error } = await supabaseServer.functions.invoke('revoke-user-tokens', {
      body: { userId },
    });

    if (error) {
      logger.error('Failed to revoke tokens via edge function', {
        userId,
        error: error.message,
      });
      throw new ApiError(500, 'REVOKE_TOKENS_FAILED', 'Failed to revoke user tokens');
    }

    logger.info('All tokens revoked for user via edge function', { userId });
  }

  async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new ApiError(400, 'EMAIL_REQUIRED', 'Email is required');
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const { error } = await supabaseServer.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.CLIENT_URL}/reset-password`,
    });
    if (error) {
      logger.error('Password reset request failed', { email, error: error.message });
      throw new ApiError(500, 'PASSWORD_RESET_FAILED', 'Failed to send reset email');
    }
  }
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) {
      throw new ApiError(400, 'INVALID_INPUT', 'Token and new password are required');
    }
    const tempClient = this.createTempSupabaseClient();

    const {
      data: { user },
      error: tokenError,
    } = await tempClient.auth.getUser(token);

    if (tokenError || !user) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired reset token');
    }

    const { error: updateError } = await supabaseServer.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (updateError) {
      logger.error('Password reset failed', { userId: user.id, error: updateError.message });
      throw new ApiError(500, 'PASSWORD_UPDATE_FAILED', 'Failed to update password');
    }

    this.revokeTokens(user.id);
  }

  async verifyEmail(token: string): Promise<void> {
    if (!token) {
      throw new ApiError(400, 'TOKEN_REQUIRED', 'Verification token is required');
    }

    const { error, data } = await supabaseServer.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) {
      logger.error('Email verification failed', { error: error.message });

      if (error.message.includes('expired')) {
        throw new ApiError(400, 'VERIFICATION_EXPIRED', 'Verification link has expired');
      }

      throw new ApiError(400, 'VERIFICATION_FAILED', 'Invalid verification token');
    }

    if (data.user?.id) {
      await prisma.user.update({
        where: { id: data.user.id },
        data: {
          emailVerified: true,
        },
      });
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    try {
      if (!email) {
        throw new ApiError(400, 'EMAIL_REQUIRED', 'Email is required');
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, emailVerified: true },
      });

      if (!user) {
        return;
      }

      if (user.emailVerified) {
        throw new ApiError(400, 'ALREADY_VERIFIED', 'Email is already verified');
      }

      const { error } = await supabaseServer.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${env.CLIENT_URL}/verify-success`,
        },
      });

      if (error) {
        logger.error('Failed to resend verification email', {
          email,
          error: error.message,
        });

        if (error.message.includes('rate limit')) {
          throw new ApiError(429, 'RATE_LIMITED', 'Please try again in a few minutes');
        }

        throw new ApiError(500, 'RESEND_FAILED', 'Failed to resend verification email');
      }

      logger.info('Verification email resent', { email, userId: user.id });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'RESEND_FAILED', 'Failed to resend verification email');
    }
  }
  async getUser(userId: string) {
    if (!userId) {
      throw new ApiError(400, 'USER_ID_MISSING', 'User id is missing');
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, addresses: true },
    });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }
    return { user };
  }
  private createTempSupabaseClient(): SupabaseClient {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  //   Cleanup method:
  private async cleanupFailedSignup(userId: string) {
    try {
      logger.info('Cleaning up failed signup', { userId });

      await supabaseServer.auth.admin.deleteUser(userId);

      logger.info('Deleted Supabase user during cleanup', { userId });
    } catch (error) {
      logger.error('Cleanup failed for signup', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // sync missing user:

  private async syncMissingUser(userId: string) {
    try {
      const { data: user } = await supabaseServer.auth.admin.getUserById(userId);

      if (user && user.user?.email) {
        await prisma.user.create({
          data: {
            id: userId,
            email: user.user?.email,
            name: user.user?.user_metadata.name || 'User',
            role: user.user?.user_metadata.role || 'USER',
            profile: {
              create: {},
            },
          },
        });
        logger.info('Synced missing user from Supabase', { userId });
      }
    } catch (error) {
      logger.error('Failed to sync missing user', { userId, error });
    }
  }
}
