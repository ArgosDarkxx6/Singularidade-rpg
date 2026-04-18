import type { AuthChangeEvent, AuthSession as SupabaseAuthSession, Session, User } from '@supabase/supabase-js';
import { supabase } from '@integrations/supabase/client';
import { authApiUrl, emailAvailabilityApiUrl, usernameAvailabilityApiUrl } from '@integrations/supabase/env';
import type { AuthSession, AuthUser, Profile } from '@/types/domain';
import { isEmailLogin, isUsernameLogin, normalizeLoginIdentifier } from '@schemas/auth';
import type { AuthService, SignInPayload, SignUpPayload } from './types';

type ProfileRow = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  avatar_path: string;
  created_at: string;
  updated_at: string;
};

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

  if (normalized.includes('invalid login credentials') || normalized.includes('usuario ou senha')) {
    return new Error('Usuario ou senha invalidos.');
  }

  return error instanceof Error ? error : new Error(message);
}

function fallbackAuthUser(user: User, avatarUrl = '', avatarPath = ''): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    username: String(user.user_metadata.username || ''),
    displayName: String(user.user_metadata.display_name || user.user_metadata.full_name || user.email || 'Feiticeiro'),
    avatarUrl,
    avatarPath
  };
}

export function createSupabaseAuthService(): AuthService {
  if (!supabase) {
    throw new Error('Supabase nao configurado.');
  }
  const client = supabase;

  async function createSignedAvatarUrl(path: string) {
    if (!path) return '';
    const { data, error } = await client.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 30);
    if (error) return '';
    return data.signedUrl;
  }

  async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await client
      .from('profiles')
      .select('id, email, username, display_name, avatar_url, avatar_path, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return (data as ProfileRow | null) || null;
  }

  async function mapUser(user: User): Promise<AuthUser> {
    const profile = await fetchProfileRow(user.id);
    const avatarPath = profile?.avatar_path || '';
    const avatarUrl = avatarPath ? await createSignedAvatarUrl(avatarPath) : profile?.avatar_url || '';

    return {
      ...fallbackAuthUser(user, avatarUrl, avatarPath),
      username: profile?.username || String(user.user_metadata.username || ''),
      displayName:
        profile?.display_name || String(user.user_metadata.display_name || user.user_metadata.full_name || user.email || 'Feiticeiro')
    };
  }

  async function mapProfile(user: User): Promise<Profile> {
    const profile = await fetchProfileRow(user.id);
    const avatarPath = profile?.avatar_path || '';
    const avatarUrl = avatarPath ? await createSignedAvatarUrl(avatarPath) : profile?.avatar_url || '';
    const fallback = fallbackAuthUser(user, avatarUrl, avatarPath);

    return {
      id: user.id,
      email: profile?.email || fallback.email,
      username: profile?.username || fallback.username,
      displayName: profile?.display_name || fallback.displayName,
      avatarUrl,
      avatarPath,
      createdAt: profile?.created_at || user.created_at || new Date().toISOString(),
      updatedAt: profile?.updated_at || new Date().toISOString()
    };
  }

  async function mapSession(session: Session | null): Promise<AuthSession | null> {
    if (!session?.user) return null;

    return {
      user: await mapUser(session.user),
      token: session.access_token
    };
  }

  function fallbackAuthSession(session: Session | null): AuthSession | null {
    if (!session?.user) return null;
    return {
      user: fallbackAuthUser(session.user),
      token: session.access_token
    };
  }

  async function getCurrentSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return mapSession(data.session);
  }

  async function getCurrentProfile() {
    const {
      data: { user }
    } = await client.auth.getUser();

    if (!user) return null;
    return mapProfile(user);
  }

  async function assertUsernameAvailable(username: string) {
    const { data, error } = await client.rpc('is_username_available', {
      input: username.trim().toLowerCase()
    });

    if (!error) {
      if (data === false) {
        throw new Error('Este username ja esta em uso.');
      }
      return;
    }

    if (error.code !== 'PGRST202') {
      throw error;
    }

    const response = await fetch(usernameAvailabilityApiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        username: username.trim().toLowerCase()
      })
    });

    const payload = (await response.json().catch(() => null)) as { available?: boolean; error?: string } | null;
    if (!response.ok) {
      throw new Error(payload?.error || 'Nao foi possivel validar o username agora.');
    }

    if (payload?.available === false) {
      throw new Error('Este username ja esta em uso.');
    }
  }

  async function assertEmailAvailable(email: string) {
    const response = await fetch(emailAvailabilityApiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase()
      })
    });

    const payload = (await response.json().catch(() => null)) as { available?: boolean; error?: string } | null;
    if (!response.ok) {
      throw new Error(payload?.error || 'Nao foi possivel validar o email agora.');
    }

    if (payload?.available === false) {
      throw new Error('Ja existe uma conta com este email.');
    }
  }

  async function syncProfileUpdate(patch: { displayName?: string; avatarUrl?: string; avatarPath?: string }) {
    const {
      data: { user }
    } = await client.auth.getUser();

    if (!user) return null;

    const nextDisplayName = patch.displayName?.trim() || String(user.user_metadata.display_name || user.email || 'Feiticeiro');
    const { error: authError } = await client.auth.updateUser({
      data: {
        display_name: nextDisplayName
      }
    });
    if (authError) throw authError;

    const profilePatch: { display_name: string; avatar_url?: string; avatar_path?: string } = {
      display_name: nextDisplayName
    };
    if (patch.avatarUrl !== undefined) profilePatch.avatar_url = patch.avatarUrl;
    if (patch.avatarPath !== undefined) profilePatch.avatar_path = patch.avatarPath;

    const { error: profileError } = await client
      .from('profiles')
      .update(profilePatch)
      .eq('id', user.id);

    if (profileError) throw profileError;
    return getCurrentSession();
  }

  return {
    async initialize() {
      return getCurrentSession();
    },
    subscribe(callback) {
      const {
        data: { subscription }
      } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: SupabaseAuthSession | null) => {
        void mapSession(session)
          .then((nextSession) => callback(nextSession))
          .catch((error) => {
            console.error('auth session mapping failed', error);
            callback(fallbackAuthSession(session));
          });
      });

      return () => subscription.unsubscribe();
    },
    async getProfile() {
      return getCurrentProfile();
    },
    async signUp({ email, username, displayName, password }: SignUpPayload) {
      try {
        await assertUsernameAvailable(username);
        await assertEmailAvailable(email);
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
          session: await mapSession(data.session),
          requiresEmailConfirmation: !data.session
        };
      } catch (error) {
        throw normalizeAuthError(error);
      }
    },
    async signIn({ identifier, password }: SignInPayload) {
      const normalizedIdentifier = normalizeLoginIdentifier(identifier);

      if (isEmailLogin(normalizedIdentifier)) {
        const { data, error } = await client.auth.signInWithPassword({
          email: normalizedIdentifier,
          password
        });

        if (error) throw normalizeAuthError(error);
        return mapSession(data.session);
      }

      if (!isUsernameLogin(normalizedIdentifier)) {
        throw normalizeAuthError(new Error('Usuario, email ou senha invalidos.'));
      }

      const response = await fetch(authApiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: JSON.stringify({
          identifier: normalizedIdentifier,
          password
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            access_token?: string;
            refresh_token?: string;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.access_token || !payload.refresh_token) {
        throw normalizeAuthError(new Error(payload?.error || 'Usuario, email ou senha invalidos.'));
      }

      const { data, error } = await client.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token
      });

      if (error) throw normalizeAuthError(error);
      return mapSession(data.session);
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
    async updateProfile({ displayName }: Pick<AuthUser, 'displayName'>) {
      return syncProfileUpdate({
        displayName
      });
    },
    async uploadProfileAvatar(file: File) {
      const {
        data: { user }
      } = await client.auth.getUser();

      if (!user) return null;

      const currentProfile = await fetchProfileRow(user.id);
      if (currentProfile?.avatar_path) {
        await client.storage.from('avatars').remove([currentProfile.avatar_path]);
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `profiles/${user.id}/profile-${crypto.randomUUID()}.${extension}`;
      const { error } = await client.storage.from('avatars').upload(path, file, {
        upsert: true,
        contentType: file.type || 'image/png'
      });

      if (error) throw error;

      return syncProfileUpdate({
        avatarUrl: '',
        avatarPath: path
      });
    },
    async clearProfileAvatar() {
      const {
        data: { user }
      } = await client.auth.getUser();

      if (!user) return null;

      const currentProfile = await fetchProfileRow(user.id);
      if (currentProfile?.avatar_path) {
        await client.storage.from('avatars').remove([currentProfile.avatar_path]);
      }

      return syncProfileUpdate({
        avatarUrl: '',
        avatarPath: ''
      });
    }
  };
}
