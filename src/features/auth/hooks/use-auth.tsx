import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { AuthSession, AuthUser } from '@/types/domain';
import { shouldUseSupabaseRuntime } from '@integrations/supabase/env';
import { createLocalAuthService } from '@services/auth/local-auth-service';
import { createSupabaseAuthService } from '@services/auth/supabase-auth-service';
import type { AuthService, SignInPayload, SignUpPayload, SignUpResult } from '@services/auth/types';

interface AuthContextValue {
  isReady: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
  signUp: (payload: SignUpPayload) => Promise<SignUpResult>;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => void;
  updateProfile: (payload: Pick<AuthUser, 'displayName'>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const defaultAuthService = shouldUseSupabaseRuntime ? createSupabaseAuthService() : createLocalAuthService();

export function AuthProvider({ children, service }: { children: ReactNode; service?: AuthService }) {
  const authService = useMemo(() => service ?? defaultAuthService, [service]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    authService
      .initialize()
      .then((nextSession) => {
        if (isMounted) setSession(nextSession);
      })
      .finally(() => {
        if (isMounted) setIsReady(true);
      });

    const unsubscribe = authService.subscribe((nextSession) => {
      setSession(nextSession);
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
    void authService.signOut().finally(() => setSession(null));
  }, [authService]);

  const updateProfile = useCallback(
    ({ displayName }: Pick<AuthUser, 'displayName'>) => {
      void authService.updateProfile({ displayName }).then((nextSession) => {
        if (nextSession) setSession(nextSession);
      });
    },
    [authService]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      session,
      user: session?.user ?? null,
      signUp,
      signIn,
      signOut,
      updateProfile
    }),
    [isReady, session, signIn, signOut, signUp, updateProfile]
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

