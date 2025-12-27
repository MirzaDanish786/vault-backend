import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma/client";
// import { supabaseServer } from "./lib/supabase/server-client";
import { env } from "./config/env";
import { supabaseServer } from "./config/supabase/server-client";

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

//  TEST ENDPOINT: Verify all connections
app.get("/api/test", async (req: Request, res: Response) => {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      port: env.PORT,
      
      // Test 1: Database Connection (Prisma)
      database: await testDatabaseConnection(),
      
      // Test 2: Supabase Connection
      supabase: await testSupabaseConnection(),
      
      // Test 3: Get users from your custom table (via Prisma)
      customUsers: await getCustomUsers(),
      
      // Test 4: Get users from Supabase Auth
      supabaseUsers: await getSupabaseUsers(),
    };

    res.json({
      success: true,
      message: "System health check",
      data: testResults,
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "System check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Simple root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "VAULT Backend API is running!",
    endpoints: {
      test: "GET /api/test - Check all connections",
      docs: "Coming soon...",
    },
    timestamp: new Date().toISOString(),
  });
});

// Helper functions for testing
async function testDatabaseConnection() {
  try {
    // Simple query to verify Prisma connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    return {
      connected: true,
      message: " Database connection successful",
      testResult: result,
    };
  } catch (error) {
    return {
      connected: false,
      message: " Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testSupabaseConnection() {
  try {
    // Test Supabase auth connection
    const { data, error } = await supabaseServer.auth.getSession();
    
    if (error) throw error;
    
    return {
      connected: true,
      message: " Supabase connection successful",
      projectUrl: env.SUPABASE_URL,
      keyFormat: env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_') 
        ? ' New format (sb_secret_)' 
        : ' Old format',
    };
  } catch (error) {
    return {
      connected: false,
      message: " Supabase connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function getCustomUsers() {
  try {
    // Get users from YOUR custom table (using Prisma)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      take: 5, // Limit to 5 users
    });
    
    return {
      success: true,
      count: users.length,
      users: users,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch custom users",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function getSupabaseUsers() {
  try {
    // Get users from Supabase Auth (admin API)
    const { data, error } = await supabaseServer.auth.admin.listUsers({
      page: 1,
      perPage: 5,
    });
    
    if (error) throw error;
    
    return {
      success: true,
      count: data.users.length,
      users: data.users.map(user => ({
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
      })),
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch Supabase users",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default app;