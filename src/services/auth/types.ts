import type { AuthSession, AuthUser, Profile } from '@/types/domain';

export interface SignUpPayload {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export interface SignInPayload {
  identifier: string;
  password: string;
}

export interface SignUpResult {
  session: AuthSession | null;
  requiresEmailConfirmation: boolean;
}

export interface AuthService {
  initialize: () => Promise<AuthSession | null>;
  subscribe: (callback: (session: AuthSession | null) => void) => () => void;
  getProfile: () => Promise<Profile | null>;
  signUp: (payload: SignUpPayload) => Promise<SignUpResult>;
  signIn: (payload: SignInPayload) => Promise<AuthSession | null>;
  signOut: () => Promise<void>;
  updateProfile: (payload: Pick<AuthUser, 'displayName'>) => Promise<AuthSession | null>;
  uploadProfileAvatar: (file: File) => Promise<AuthSession | null>;
  clearProfileAvatar: () => Promise<AuthSession | null>;
}

