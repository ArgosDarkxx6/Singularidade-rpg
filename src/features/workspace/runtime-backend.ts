import { shouldUseSupabaseRuntime } from '@integrations/supabase/env';
import { createLocalWorkspaceBackend } from '@features/workspace/local-backend';
import { createSupabaseWorkspaceBackend } from '@features/workspace/supabase-backend';

export const runtimeWorkspaceBackend = shouldUseSupabaseRuntime ? createSupabaseWorkspaceBackend() : createLocalWorkspaceBackend();
