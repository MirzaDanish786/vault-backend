import {
  categoryIdSchema,
  CategoryService,
  categorySlugSchema,
  createCategorySchema,
  ICreateCategoryInput,
} from "@/services/category";
import { ApiResponse } from "@/utils/api-response";
import { logger } from "@/utils/logger";
import { Request, Response } from "express";
export class CategoryController {
  private categoryService: CategoryService;
  constructor() {
    this.categoryService = new CategoryService();
  }
  createCategory = async (req: Request, res: Response) => {
    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest("VALIDATION_ERROR", firstError);
      logger.error("Validation error", { error: firstError });
      return ApiResponse.send(res, response);
    }
    const validatedData = validation.data!;
    const result = await this.categoryService.createCategory(validatedData);

    const resposne = ApiResponse.created(result);
    logger.info("Category created successfully", {
      result,
    });
    ApiResponse.send(res, resposne);
  };

  findCategoryById = async (req: Request, res: Response) => {
    const validation = categoryIdSchema.safeParse(req.params.id);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest("VALIDATION_ERROR", firstError);
      logger.error("Validation error", { error: firstError });
      return ApiResponse.send(res, response);
    }
    const isProductsInclude = req.query.includeProducts === "true"
    const validateId = validation.data;
    const result = await this.categoryService.findById(validateId, isProductsInclude);
    const apiResponse = ApiResponse.success(result);
    ApiResponse.send(res, apiResponse)
  };

  findCategoryBySlug = async(req:Request, res:Response) =>{
    const validation = categorySlugSchema.safeParse(req.params.slug)
    if (!validation.success) {
      const firstError = validation.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest("VALIDATION_ERROR", firstError);
      logger.error("Validation error", { error: firstError });
      return ApiResponse.send(res, response);
    }
    const slug = validation.data;
    const result = await this.categoryService.findBySlug(slug)
    const apiResponse = ApiResponse.success(result)
    ApiResponse.send(res, apiResponse)
  }
}
export const categoryController = new CategoryController();
