export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL?.trim() || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''
};

const runtimeBackend = String(import.meta.env.VITE_RUNTIME_BACKEND || '')
  .trim()
  .toLowerCase();

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);
export const isLocalRuntimeForced = runtimeBackend === 'local';
export const shouldUseSupabaseRuntime = isSupabaseConfigured && !isLocalRuntimeForced;
