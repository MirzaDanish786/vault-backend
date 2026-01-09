import {
  categoryFiltersSchema,
  categoryIdSchema,
  CategoryService,
  categorySlugSchema,
  CategoryValidator,
  createCategorySchema,
  ICreateCategoryInput,
  updateCategorySchema,
} from "@/services/category";
import { ApiResponse } from "@/utils/api-response";
import { logger } from "@/utils/logger";
import { Request, Response } from "express";
export class CategoryController {
  private categoryService: CategoryService;
  constructor() {
    this.categoryService = new CategoryService();
  }
  // Create:
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

  // Get by Id:
  findCategoryById = async (req: Request, res: Response) => {
    const validation = categoryIdSchema.safeParse(req.params.id);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest("VALIDATION_ERROR", firstError);
      logger.error("Validation error", { error: firstError });
      return ApiResponse.send(res, response);
    }
    const isProductsInclude = req.query.includeProducts === "true";
    const validateId = validation.data;
    const result = await this.categoryService.findById(
      validateId,
      isProductsInclude
    );
    const apiResponse = ApiResponse.success(result);
    ApiResponse.send(res, apiResponse);
  };

  // Get by slug:
  findCategoryBySlug = async (req: Request, res: Response) => {
    const validation = categorySlugSchema.safeParse(req.params.slug);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest("VALIDATION_ERROR", firstError);
      logger.error("Validation error", { error: firstError });
      return ApiResponse.send(res, response);
    }
    const slug = validation.data;
    const result = await this.categoryService.findBySlug(slug);
    const apiResponse = ApiResponse.success(result);
    ApiResponse.send(res, apiResponse);
  };

  // Get all by filters such as searching, pagination, etc...
  findAllCategoriesByFilters = async (req: Request, res: Response) => {
    const validationFilters = categoryFiltersSchema.safeParse(req.query);
    logger.debug("query...", req.query);
    if (!validationFilters.success) {
      const firstError = validationFilters.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest("VALIDATION_ERROR", firstError);
      logger.error("Validation error", { error: firstError });
      return ApiResponse.send(res, response);
    }
    const validateFilters = validationFilters.data;
    const result = await this.categoryService.findAll(validateFilters);
    const apiResponse = ApiResponse.success(result);
    ApiResponse.send(res, apiResponse);
  };

  // Update:
  updateCategory = async (req: Request, res: Response) => {
    const {id} = req.params;
    const categoryId = CategoryValidator.validateId(id)

    const validationData = updateCategorySchema.safeParse(req.body);
    logger.debug("=========body data", { validationData });
    if (!validationData.success) {
      const firstError = validationData.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest("VALIDATION_ERROR", firstError);
      logger.error("Validation error", { error: firstError });
      return ApiResponse.send(res, response);
    }

    const validatedData = validationData.data;
    const result = await this.categoryService.update(
      categoryId,
      validatedData
    );
    logger.info("Category updated successfully", { result });
    const apiResponse = ApiResponse.success(result);
    ApiResponse.send(res, apiResponse);
  };

  // Delete:
  deleteCategory = async (req: Request, res: Request) => {
    const validationData = categoryIdSchema.safeParse(req.params.id);
    if (!validationData.success) {
      const firstError = validationData.error.issues[0].message || "Invalid";
      const response = ApiResponse.badRequest("VALIDATION_ERROR", firstError);
      logger.error("Validation error", { error: firstError });
      return ApiResponse.send(res, response);
    }
    const validatedId = validationData.data;
    const result = await this.categoryService.delete(validatedId);
    const apiResponse = ApiResponse.success(result);
    ApiResponse.send(res, apiResponse);
  };
}
export const categoryController = new CategoryController();
