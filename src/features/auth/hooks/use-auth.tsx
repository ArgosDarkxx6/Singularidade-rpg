import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { AuthSession, AuthUser, Profile } from '@/types/domain';
import { shouldUseSupabaseRuntime } from '@integrations/supabase/env';
import { createLocalAuthService } from '@services/auth/local-auth-service';
import { createSupabaseAuthService } from '@services/auth/supabase-auth-service';
import type { AuthService, SignInPayload, SignUpPayload, SignUpResult } from '@services/auth/types';

interface AuthContextValue {
  isReady: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
  profile: Profile | null;
  refreshProfile: () => Promise<Profile | null>;
  signUp: (payload: SignUpPayload) => Promise<SignUpResult>;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => void;
  updateProfile: (payload: Pick<AuthUser, 'displayName'>) => Promise<AuthSession | null>;
  uploadProfileAvatar: (file: File) => Promise<AuthSession | null>;
  clearProfileAvatar: () => Promise<AuthSession | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const defaultAuthService = shouldUseSupabaseRuntime ? createSupabaseAuthService() : createLocalAuthService();

export function AuthProvider({ children, service }: { children: ReactNode; service?: AuthService }) {
  const authService = useMemo(() => service ?? defaultAuthService, [service]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    authService
      .initialize()
      .then((nextSession) => {
        if (isMounted) setSession(nextSession);
        if (nextSession) {
          void authService.getProfile().then((nextProfile) => {
            if (isMounted) setProfile(nextProfile);
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsReady(true);
      });

    const unsubscribe = authService.subscribe((nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        return;
      }

      void authService.getProfile().then((nextProfile) => {
        if (isMounted) setProfile(nextProfile);
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [authService]);

  const signUp = useCallback(
    async (payload: SignUpPayload) => {
      const result = await authService.signUp(payload);
      if (result.session) setSession(result.session);
      return result;
    },
    [authService]
  );

  const signIn = useCallback(
    async (payload: SignInPayload) => {
      const nextSession = await authService.signIn(payload);
      if (nextSession) setSession(nextSession);
    },
    [authService]
  );

  const signOut = useCallback(() => {
    void authService.signOut().finally(() => {
      setSession(null);
      setProfile(null);
    });
  }, [authService]);

  const refreshProfile = useCallback(async () => {
    const nextProfile = await authService.getProfile();
    setProfile(nextProfile);
    return nextProfile;
  }, [authService]);

  const updateProfile = useCallback(
    async ({ displayName }: Pick<AuthUser, 'displayName'>) => {
      const nextSession = await authService.updateProfile({ displayName });
      if (nextSession) setSession(nextSession);
      await refreshProfile();
      return nextSession;
    },
    [authService, refreshProfile]
  );

  const uploadProfileAvatar = useCallback(
    async (file: File) => {
      const nextSession = await authService.uploadProfileAvatar(file);
      if (nextSession) setSession(nextSession);
      await refreshProfile();
      return nextSession;
    },
    [authService, refreshProfile]
  );

  const clearProfileAvatar = useCallback(async () => {
    const nextSession = await authService.clearProfileAvatar();
    if (nextSession) setSession(nextSession);
    await refreshProfile();
    return nextSession;
  }, [authService, refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile,
      signUp,
      signIn,
      signOut,
      updateProfile,
      uploadProfileAvatar,
      clearProfileAvatar
    }),
    [clearProfileAvatar, isReady, profile, refreshProfile, session, signIn, signOut, signUp, updateProfile, uploadProfileAvatar]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

