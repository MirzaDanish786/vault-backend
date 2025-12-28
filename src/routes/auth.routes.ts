import { Router } from "express";
import { requestIdMiddleware } from "@/middlewares/request-id.middleware";
import { authController } from "@/controllers/auth.controller";

const router = Router();

router.use(requestIdMiddleware)
router.post("/signup", authController.signUp);
router.post("/signin", authController.signIn);
router.post("/signout", authController.signOut);

export default router;
