import { Router } from "express";
import { requestIdMiddleware } from "@/middlewares/request-id.middleware";
import { authController } from "@/controllers/auth.controller";
import { metaDataApiResponse } from "@/middlewares/meta-data.middleware";

const router = Router();

router.use(requestIdMiddleware)
router.use(metaDataApiResponse)

router.post("/signup", authController.signUp);
router.post("/signin", authController.signIn);
router.post("/signout", authController.signOut);
router.post("/refresh", authController.refreshToken)

export default router;
