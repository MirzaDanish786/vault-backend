import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url().min(1, 'Supabase URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string()
    .min(1, 'Supabase Service Role Key is required')
    .refine((key) => key.startsWith('sb_secret_'), {
      message: 'Service Role Key must start with "sb_secret_"'
    }),
  
  DATABASE_URL: z.string().url().min(1, 'Database URL is required'),
  
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .default('development'),
  
  PORT: z.string()
    .default('3000')                   
    .transform((val) => parseInt(val, 10)) 
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'PORT must be a positive number'
    }),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'silly'])
    .default('info'),
  
  ENABLE_RATE_LIMITING: z.string()
    .default('true')                     
    .transform((val) => val === 'true'),  
});

export const env = envSchema.parse(process.env);

export type EnvConfig = z.infer<typeof envSchema>;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';