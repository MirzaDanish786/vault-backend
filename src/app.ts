import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma/client";
// import { supabaseServer } from "./lib/supabase/server-client";
import { env } from "./config/env";
import { supabaseServer } from "./config/supabase/server-client";
import { errorHandler } from "./middlewares/error.middleware";
import { ApiError } from "./utils/error";

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

// //  TEST ENDPOINT: Verify all connections
// app.get("/api/test", async (req: Request, res: Response) => {
//   try {
//     const testResults = {
//       timestamp: new Date().toISOString(),
//       environment: env.NODE_ENV,
//       port: env.PORT,
      
//       // Test 1: Database Connection (Prisma)
//       database: await testDatabaseConnection(),
      
//       // Test 2: Supabase Connection
//       supabase: await testSupabaseConnection(),
      
//       // Test 3: Get users from your custom table (via Prisma)
//       customUsers: await getCustomUsers(),
      
//       // Test 4: Get users from Supabase Auth
//       supabaseUsers: await getSupabaseUsers(),
//     };

//     res.json({
//       success: true,
//       message: "System health check",
//       data: testResults,
//     });
//   } catch (error) {
//     console.error("Test endpoint error:", error);
//     res.status(500).json({
//       success: false,
//       message: "System check failed",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// });

// Simple root endpoint
app.get("/", (req: Request, res: Response) => {
  throw new ApiError(400, "BAD_REQUEST", "Bad request");
  res.json({
    message: "VAULT Backend API is running!",
    endpoints: {
      test: "GET /api/test - Check all connections",
      docs: "Coming soon...",
    },
    timestamp: new Date().toISOString(),
  });
});




app.use(errorHandler)




export default app;