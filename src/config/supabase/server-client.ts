import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/utils/logger";
import { env } from "@config/env";
// import { env } from "../env";

export class SupabaseServerClient {
  private static instance: SupabaseClient | null = null;

  static getInstance(): SupabaseClient {
    if (!SupabaseServerClient.instance) {
      SupabaseServerClient.instance = SupabaseServerClient.createClient();
    }
    return SupabaseServerClient.instance;
  }

  private static createClient(): SupabaseClient {
    try {
      // Validation
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
          "Missing Supabase environment variables. " +
          "Check your .env file for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
        );
      }

      if (!env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_')) {
        throw new Error(
          'Invalid service role key format. ' +
          'Key must start with "sb_secret_". ' +
          'Did you regenerate your key in Supabase dashboard?'
        );
      }

      // Create client
      const client = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
          global: {
            headers: {
              'x-application-name': 'vault-backend',
              'x-application-version': '1.0.0',
              'x-environment': env.NODE_ENV,
            },
          },
          db: {
            schema: 'public',
          },
        }
      );

      // Log success (development only)
      if (env.NODE_ENV === 'development') {
        logger.debug('Supabase server client initialized');
      }

      return client;

    } catch (error: unknown) {
      // Professional error logging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      
      logger.error("Failed to create Supabase client", { 
        error: errorMessage,
        stack
      });
      
      // Re-throw for upstream handling
      throw new Error(`Supabase client initialization failed: ${errorMessage}`);
    }
  }

  // Convenience property with explicit type
  static get client(): SupabaseClient {
    return SupabaseServerClient.getInstance();
  }

  // Health check method
  static async testConnection(): Promise<boolean> {
    try {
      const client = this.getInstance();
      const { error } = await client.auth.getSession();
      return !error;
    } catch {
      return false;
    }
  }
}

// Default export and named export
export const supabaseServer = SupabaseServerClient.client;
export default SupabaseServerClient;