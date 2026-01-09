import {
  ACCESS_TOKEN_MAX_AGE,
  COOKIE_CONFIG,
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

  /**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     description: Creates a new user account
 */
  //   SignUp Controller:
  signUp = async (req: Request, res: Response): Promise<void> => {
    const validation = signUpSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest(
        "VALIDATION_ERROR",
        firstError
      );
      return ApiResponse.send(res, response);
    }
    const validateInput = validation.data!;
    const result = await this.authService.signUp(validateInput);
    this.setAuthCookies(res, result.session);
    const apiResponse = ApiResponse.created(result.user);

    logger.info("User signed up successfully", {
      userId: result.user.id,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };

  //   SignIn Controller:
  signIn = async (req: Request, res: Response): Promise<void> => {
    const validation = signInSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest(
        "VALIDATION_ERROR",
        firstError
      );
      return ApiResponse.send(res, response);
    }
    const validatedInput = validation.data;
    const result = await this.authService.signIn(validatedInput);
    this.setAuthCookies(res, result.session);

    const apiResponse = ApiResponse.success(result.user);
    logger.info("User signed in successfully", {
      userId: result.user.id,
      requestId: req.requestId,
    });

    ApiResponse.send(res, apiResponse);
  };

  //   SignOut Controller:
  signOut = async (req: Request, res: Response) => {
    this.clearAuthCookies(res);
    const response = ApiResponse.success({message: "Logged out successfully"}, {
      path: req.path,
      requestId: req.requestId,
      message: "Logged out successfully",
    });

    logger.info("User logged out", { requestId: req.requestId });

    ApiResponse.send(res, response);
  };

  // Me ednpoint:
  getUserDetails= async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if(!userId){
      const response = ApiResponse.unauthorized("UNAUTHORIZED", "User id is missing");
      return ApiResponse.send(res, response)
    }
    const user = await this.authService.getUser(userId!);
    const response = ApiResponse.success(user)
    ApiResponse.send(res, response)

  }

  // Refresh Token:
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refresh_token || req.body.refresh_token;
    if (!refreshToken) {
      const apiResponse = ApiResponse.badRequest(
        "UNAUTHORIZED",
        "Refresh Token is missing",
      );
      return ApiResponse.send(res, apiResponse);
    }
    const result = await this.authService.refreshToken(refreshToken);
    this.setAuthCookies(res, result.session)
    const apiResponse = ApiResponse.success(result.user);
    ApiResponse.send(res, apiResponse);
  };

  //   Auth helper methods:
  private setAuthCookies(res: Response, session: any) {
    res.cookie("access_token", session.access_token, {
      ...COOKIE_CONFIG,
      maxAge: ACCESS_TOKEN_MAX_AGE,
      path: "/",
    });

    res.cookie("refresh_token", session.refresh_token, {
      ...COOKIE_CONFIG,
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
