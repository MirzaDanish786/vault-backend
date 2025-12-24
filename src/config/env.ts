// src/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Define schema for environment variables
const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url().min(1, 'Supabase URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string()
    .min(1, 'Supabase Service Role Key is required')
    .refine((key) => key.startsWith('sb_secret_'), {
      message: 'Service Role Key must start with "sb_secret_"'
    }),
  
  // Database
  DATABASE_URL: z.string().url().min(1, 'Database URL is required'),
  
  // App
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .default('development'),
  
  // ✅ FIXED: PORT - default FIRST, then transform
  PORT: z.string()
    .default('3000')                    // 1. Set default as string
    .transform((val) => parseInt(val, 10)) // 2. Transform to number
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'PORT must be a positive number'
    }),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'silly'])
    .default('info'),
  
  ENABLE_RATE_LIMITING: z.string()
    .default('true')                      // 1. Default as string
    .transform((val) => val === 'true'),  // 2. Transform to boolean
});

// Validate and export
export const env = envSchema.parse(process.env);

// Type for TypeScript
export type EnvConfig = z.infer<typeof envSchema>;

// Helper functions
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';