import { PERMISSIONS } from "@/config/constants";
import { categoryController } from "@/controllers/category.controller";
import { authenticate, requirePermission } from "@/middlewares/auth.middleware";
import { metaDataApiResponse } from "@/middlewares/meta-data.middleware";
import { requestIdMiddleware } from "@/middlewares/request-id.middleware";
import { Router } from "express";

const router = Router();
router.use(requestIdMiddleware);
router.use(metaDataApiResponse);
router.post(
  "/",
  authenticate,
  requirePermission(PERMISSIONS.CATEGORY_WRITE),
  categoryController.createCategory
);
router.get(
  "/id/:id",
  //   requirePermission(PERMISSIONS.CATEGORY_READ),
  categoryController.findCategoryById
);

router.get("/slug/:slug", categoryController.findCategoryBySlug);

export default router;
