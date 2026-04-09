import type { AuthChangeEvent, AuthSession as SupabaseAuthSession, Session, User } from '@supabase/supabase-js';
import { supabase } from '@integrations/supabase/client';
import type { AuthSession, AuthUser } from '@/types/domain';
import type { AuthService, SignInPayload, SignUpPayload } from './types';

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    username: String(user.user_metadata.username || ''),
    displayName: String(user.user_metadata.display_name || user.user_metadata.full_name || user.email || 'Feiticeiro')
  };
}

function mapSession(session: Session | null): AuthSession | null {
  if (!session?.user) return null;
  return {
    user: mapUser(session.user),
    token: session.access_token
  };
}

function normalizeAuthError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error || 'Erro desconhecido.');
  const normalized = message.toLowerCase();

  if (normalized.includes('profiles_username_key') || normalized.includes('duplicate key value') || normalized.includes('username')) {
    return new Error('Este username ja esta em uso.');
  }

  if (normalized.includes('email address') && normalized.includes('invalid')) {
    return new Error('O email informado nao foi aceito pelo provedor de autenticacao.');
  }

  if (normalized.includes('over_email_send_rate_limit') || normalized.includes('email rate limit exceeded')) {
    return new Error('O projeto Supabase atingiu o limite de envio de email. Tente novamente mais tarde ou use uma conta ja validada.');
  }

  if (normalized.includes('user already registered') || normalized.includes('email_exists') || normalized.includes('already exists')) {
    return new Error('Ja existe uma conta com este email.');
  }

  if (normalized.includes('email not confirmed')) {
    return new Error('Confirme seu email antes de entrar.');
  }

  return error instanceof Error ? error : new Error(message);
}

export function createSupabaseAuthService(): AuthService {
  const client = supabase;

  if (!client) {
    throw new Error('Supabase nao configurado.');
  }

  return {
    async initialize() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return mapSession(data.session);
    },
    subscribe(callback) {
      const {
        data: { subscription }
      } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: SupabaseAuthSession | null) => {
        callback(mapSession(session));
      });

      return () => subscription.unsubscribe();
    },
    async signUp({ email, username, displayName, password }: SignUpPayload) {
      try {
        const { data, error } = await client.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              username: username.trim().toLowerCase(),
              display_name: displayName.trim() || username.trim()
            }
          }
        });

        if (error) throw error;

        return {
          session: mapSession(data.session),
          requiresEmailConfirmation: !data.session
        };
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },
    async signIn({ email, password }: SignInPayload) {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) throw normalizeAuthError(error);
      return mapSession(data.session);
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
    async updateProfile({ displayName }: Pick<AuthUser, 'displayName'>) {
      const { error } = await client.auth.updateUser({
        data: {
          display_name: displayName.trim()
        }
      });

      if (error) throw error;
      const {
        data: { user }
      } = await client.auth.getUser();

      if (user) {
        const { error: profileError } = await client
          .from('profiles')
          .update({
            display_name: displayName.trim()
          })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      return mapSession(data.session);
    }
  };
}

