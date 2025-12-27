import { Router } from "express";
import { getHealthStatus } from "@/controllers/health.controller";

const router = Router();

// GET /api/health
router.get("/", getHealthStatus);

export default router;
