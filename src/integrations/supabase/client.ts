import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { isSupabaseConfigured, supabaseConfig } from './env';

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
