import { AUTH_STORAGE_KEY, USERS_STORAGE_KEY } from '@lib/domain/constants';
import { hashString, uid } from '@lib/domain/utils';
import type { AuthSession, AuthUser, Profile } from '@/types/domain';
import type { AuthService, SignInPayload, SignUpPayload } from './types';

interface StoredUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  avatarPath: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]') as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function toSession(user: StoredUser): AuthSession {
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarPath: user.avatarPath
    },
    token: `${user.id}:${Date.now()}`
  };
}

function toProfile(user: StoredUser): Profile {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    avatarPath: user.avatarPath,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Nao foi possivel ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function persistSession(session: AuthSession | null) {
  if (session) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function createLocalAuthService(): AuthService {
  return {
    async initialize() {
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as AuthSession) : null;
      } catch {
        return null;
      }
    },
    subscribe() {
      return () => undefined;
    },
    async getProfile() {
      const current = await this.initialize();
      if (!current) return null;
      const user = readUsers().find((entry) => entry.id === current.user.id);
      return user ? toProfile(user) : null;
    },
    async signUp({ email, username, displayName, password }: SignUpPayload) {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username.trim().toLowerCase();
      const users = readUsers();

      if (users.some((user) => user.email === normalizedEmail)) {
        throw new Error('Ja existe uma conta com este email.');
      }

      if (users.some((user) => user.username === normalizedUsername)) {
        throw new Error('Este username ja esta em uso.');
      }

      const passwordHash = await hashString(password);
      const user: StoredUser = {
        id: uid('user'),
        email: normalizedEmail,
        username: normalizedUsername,
        displayName: displayName.trim() || username.trim(),
        avatarUrl: '',
        avatarPath: '',
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const session = toSession(user);
      writeUsers([...users, user]);
      persistSession(session);
      return {
        session,
        requiresEmailConfirmation: false
      };
    },
    async signIn({ email, password }: SignInPayload) {
      const normalizedEmail = email.trim().toLowerCase();
      const passwordHash = await hashString(password);
      const user = readUsers().find((entry) => entry.email === normalizedEmail && entry.passwordHash === passwordHash);

      if (!user) {
        throw new Error('Email ou senha invalidos.');
      }

      const session = toSession(user);
      persistSession(session);
      return session;
    },
    async signOut() {
      persistSession(null);
    },
    async updateProfile({ displayName }: Pick<AuthUser, 'displayName'>) {
      const current = await this.initialize();
      if (!current) return null;

      const users = readUsers();
      const nextUsers = users.map((user) =>
        user.id === current.user.id
          ? {
              ...user,
              displayName: displayName.trim() || user.displayName,
              updatedAt: new Date().toISOString()
            }
          : user
      );
      writeUsers(nextUsers);

      const updated = nextUsers.find((user) => user.id === current.user.id);
      if (!updated) return null;

      const session = toSession(updated);
      persistSession(session);
      return session;
    },
    async uploadProfileAvatar(file: File) {
      const current = await this.initialize();
      if (!current) return null;

      const dataUrl = await fileToDataUrl(file);
      const users = readUsers();
      const nextUsers = users.map((user) =>
        user.id === current.user.id
          ? {
              ...user,
              avatarUrl: dataUrl,
              avatarPath: `local/profile/${user.id}/${file.name}`,
              updatedAt: new Date().toISOString()
            }
          : user
      );
      writeUsers(nextUsers);

      const updated = nextUsers.find((user) => user.id === current.user.id);
      if (!updated) return null;

      const session = toSession(updated);
      persistSession(session);
      return session;
    },
    async clearProfileAvatar() {
      const current = await this.initialize();
      if (!current) return null;

      const users = readUsers();
      const nextUsers = users.map((user) =>
        user.id === current.user.id
          ? {
              ...user,
              avatarUrl: '',
              avatarPath: '',
              updatedAt: new Date().toISOString()
            }
          : user
      );
      writeUsers(nextUsers);

      const updated = nextUsers.find((user) => user.id === current.user.id);
      if (!updated) return null;

      const session = toSession(updated);
      persistSession(session);
      return session;
    }
  };
}

