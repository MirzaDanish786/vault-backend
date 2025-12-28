import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/config/constants";
import { isProduction } from "@/config/env";
import { AuthService, signInSchema, signUpSchema } from "@/services/auth";
import { ApiResponse } from "@/utils/api-response";
import { logger } from "@/utils/logger";
import { Request, Response, NextFunction } from "express";

export class AuthController {
  private authService: AuthService;
  constructor() {
    this.authService = new AuthService();
  }

  //   SignUp Controller:
  signUp = async (req: Request, res: Response): Promise<void> => {
    const validation = signUpSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest(
        "VALIDATION_ERROR",
        firstError,
        undefined,
        { path: req.path, requestId: req.requestId }
      );
      return ApiResponse.send(res, response);
    }
    const validateInput = validation.data!;
    const result = await this.authService.signUp(validateInput);
    this.setAuthCookies(res, result.session);
    const apiResponse = ApiResponse.created(result.user, {
      path: req.path,
      requestId: req.requestId,
    });

    logger.info("User signed up successfully", {
      userId: result.user.id,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };

  //   SignIn Controller:
  signIn = async (req: Request, res: Response):Promise<void> => {
    const validation = signInSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest(
        "VALIDATION_ERROR",
        firstError,
        undefined,
        { path: req.path, requestId: req.requestId }
      );
      return ApiResponse.send(res, response);
    }
    const validatedInput = validation.data;
    const result = await this.authService.signIn(validatedInput);
    this.setAuthCookies(res, result.session);

    const apiResponse = ApiResponse.success(result.user, {
      path: req.path,
      requestId: req.requestId,
    });
    logger.info("User signed in successfully", {
      userId: result.user.id,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };

  //   SignOut Controller:
  signOut = async (req: Request, res: Response) => {
    this.clearAuthCookies(res);
    const response = ApiResponse.success(undefined, {
      path: req.path,
      requestId: req.requestId,
      message: "Logged out successfully",
    });

    logger.info("User logged out", { requestId: req.requestId });
    
    ApiResponse.send(res, response);
  };

  //   Auth helper methods:
  private setAuthCookies(res: Response, session: any) {
    res.cookie("access_token", session.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: ACCESS_TOKEN_MAX_AGE,
      path: "/",
    });

    res.cookie("refresh_token", session.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: "/api/v1/auth/refresh",
    });
  }
  private clearAuthCookies(res: Response) {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/api/v1/auth/refresh" });
  }
}

export const authController = new AuthController();
