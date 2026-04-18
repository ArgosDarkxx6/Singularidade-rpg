export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL?.trim() || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''
};

export const authApiUrl = import.meta.env.VITE_AUTH_API_URL?.trim() || '/api/auth/username-login';
export const usernameAvailabilityApiUrl =
  import.meta.env.VITE_USERNAME_AVAILABILITY_API_URL?.trim() || '/api/auth/username-availability';
export const emailAvailabilityApiUrl = import.meta.env.VITE_EMAIL_AVAILABILITY_API_URL?.trim() || '/api/auth/email-availability';
export const characterOwnershipApiUrl =
  import.meta.env.VITE_CHARACTER_OWNERSHIP_API_URL?.trim() || '/api/characters/claim-ownership';

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);
export const shouldUseSupabaseRuntime = true;
