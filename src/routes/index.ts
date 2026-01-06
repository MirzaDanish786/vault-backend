import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import categoryRoutes from "./category.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);

export default router;
