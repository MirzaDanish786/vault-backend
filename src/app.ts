import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma/client";
// import { supabaseServer } from "./lib/supabase/server-client";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { supabaseServer } from "./config/supabase/server-client";
import { errorHandler } from "./middlewares/error.middleware";
import { ApiError } from "./utils/error";
import router from "./routes";
import { setupSwaggerDocs } from './docs';


dotenv.config();

const app: Application = express();
const port = env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());




// Simple root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "VAULT Backend API is running!",
    endpoints: {
      test: "GET /api/test - Check all connections",
      docs: "GET /api-docs - API Documentation",
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/v1", router);

// Setup Swagger Documentation
setupSwaggerDocs(app, Number(port));

app.use(errorHandler)




export default app;