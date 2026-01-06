import {
  CategoryService,
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
}
export const categoryController = new CategoryController();
