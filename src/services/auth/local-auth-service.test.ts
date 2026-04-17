import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalAuthService } from './local-auth-service';

function installLocalStorageMock() {
  const store = new Map<string, string>();

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    }
  });
}

describe('local auth service', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it('signs in with normalized username and password', async () => {
    const service = createLocalAuthService();

    await service.signUp({
      email: 'MYSTO@example.com',
      username: 'Mysto',
      displayName: 'Mysto',
      password: 'senha123'
    });

    const session = await service.signIn({ username: 'mysto', password: 'senha123' });

    expect(session?.user.username).toBe('mysto');
    expect(session?.user.email).toBe('mysto@example.com');
  });

  it('rejects duplicated username and email', async () => {
    const service = createLocalAuthService();

    await service.signUp({
      email: 'mysto@example.com',
      username: 'mysto',
      displayName: 'Mysto',
      password: 'senha123'
    });

    await expect(
      service.signUp({
        email: 'other@example.com',
        username: 'MYSTO',
        displayName: 'Other',
        password: 'senha123'
      })
    ).rejects.toThrow('Este username ja esta em uso.');

    await expect(
      service.signUp({
        email: 'MYSTO@example.com',
        username: 'mysto_2',
        displayName: 'Other',
        password: 'senha123'
      })
    ).rejects.toThrow('Ja existe uma conta com este email.');
  });

  it('uses the same error for unknown username and wrong password', async () => {
    const service = createLocalAuthService();

    await service.signUp({
      email: 'mysto@example.com',
      username: 'mysto',
      displayName: 'Mysto',
      password: 'senha123'
    });

    await expect(service.signIn({ username: 'ninguém', password: 'senha123' })).rejects.toThrow('Usuario ou senha invalidos.');
    await expect(service.signIn({ username: 'mysto', password: 'senhaerrada' })).rejects.toThrow('Usuario ou senha invalidos.');
  });
});
