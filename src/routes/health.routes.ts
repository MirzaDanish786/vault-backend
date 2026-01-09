import { Router } from "express";
import { getHealthStatus } from "@/controllers/health.controller";
import { requestIdMiddleware } from "@/middlewares/request-id.middleware";

const router = Router();

// GET /api/health
router.use(requestIdMiddleware)
/**
 * @swagger
 * tags:
 *   name: Health
 *   description: API health monitoring
 */

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Check if the API is running and healthy
 *     operationId: healthCheck
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'API is healthy'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 *                 version:
 *                   type: string
 *                   example: '1.0.0'
 *                 environment:
 *                   type: string
 *                   example: 'development'
 */
router.get("/", getHealthStatus);

export default router;
