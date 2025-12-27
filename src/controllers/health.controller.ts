import { Request, Response } from "express";
import { ApiResponse } from "@/utils/api-response";
import prisma from "@/lib/prisma/client";
import { supabaseServer } from "@/config/supabase/server-client";

/**
 * Check the health of the backend and its dependencies
 */
export const getHealthStatus = async (req: Request, res: Response) => {
  try {
    // Check Database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Supabase connection
    const { error } = await supabaseServer.auth.getSession();
    if (error) throw new Error("Supabase connection failed");

    // Return success
    return ApiResponse.send(res, ApiResponse.success({
      database: "ok",
      supabase: "ok",
    }, {
      path: req.path,
      requestId: req.requestId,
      method: req.method,
      ip: req.ip,
    }));

  } catch (err: unknown) {
    // Use internalError for unknown failures
    return ApiResponse.send(res, ApiResponse.internalError(
      err instanceof Error ? err : new Error(String(err)), 
      {
        path: req.path,
        requestId: req.requestId,
        method: req.method,
        ip: req.ip,
      }
    ));
  }
};
