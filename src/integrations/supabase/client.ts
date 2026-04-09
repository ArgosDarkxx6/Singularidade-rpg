import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { shouldUseSupabaseRuntime, supabaseConfig } from './env';

export const supabase = shouldUseSupabaseRuntime
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
