import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@features/auth/hooks/use-auth';
import { LoginForm } from './login-form';
import type { AuthService } from '@services/auth/types';

function createAuthServiceMock(overrides: Partial<AuthService> = {}): AuthService {
  return {
    initialize: vi.fn().mockResolvedValue(null),
    subscribe: vi.fn().mockReturnValue(() => undefined),
    signUp: vi.fn().mockResolvedValue({ session: null, requiresEmailConfirmation: false }),
    signIn: vi.fn().mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        username: 'tester',
        displayName: 'Tester',
        avatarUrl: '',
        avatarPath: ''
      },
      token: 'token'
    }),
    signOut: vi.fn().mockResolvedValue(undefined),
    getProfile: vi.fn().mockResolvedValue(null),
    updateProfile: vi.fn().mockResolvedValue(null),
    uploadProfileAvatar: vi.fn().mockResolvedValue(null),
    clearProfileAvatar: vi.fn().mockResolvedValue(null),
    ...overrides
  };
}

describe('LoginForm', () => {
  it('keeps submit enabled before validation and signs in successfully', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const service = createAuthServiceMock();

    render(
      <AuthProvider service={service}>
        <LoginForm onSuccess={onSuccess} />
      </AuthProvider>
    );

    const submitButton = screen.getByRole('button', { name: 'Entrar no Project Nexus' });
    expect(submitButton).toBeEnabled();

    await user.type(screen.getByLabelText('Email'), 'tester@example.com');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(service.signIn).toHaveBeenCalledWith({
        email: 'tester@example.com',
        password: 'senha123'
      });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
