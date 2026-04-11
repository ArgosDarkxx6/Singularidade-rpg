import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@features/auth/hooks/use-auth';
import { RegisterForm } from './register-form';
import type { AuthService } from '@services/auth/types';

function createAuthServiceMock(overrides: Partial<AuthService> = {}): AuthService {
  return {
    initialize: vi.fn().mockResolvedValue(null),
    subscribe: vi.fn().mockReturnValue(() => undefined),
    signUp: vi.fn().mockResolvedValue({ session: null, requiresEmailConfirmation: true }),
    signIn: vi.fn().mockResolvedValue(null),
    signOut: vi.fn().mockResolvedValue(undefined),
    getProfile: vi.fn().mockResolvedValue(null),
    updateProfile: vi.fn().mockResolvedValue(null),
    uploadProfileAvatar: vi.fn().mockResolvedValue(null),
    clearProfileAvatar: vi.fn().mockResolvedValue(null),
    ...overrides
  };
}

describe('RegisterForm', () => {
  it('submits email, username and password while keeping the button available before submit', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const service = createAuthServiceMock();

    render(
      <AuthProvider service={service}>
        <RegisterForm onSuccess={onSuccess} />
      </AuthProvider>
    );

    const submitButton = screen.getByRole('button', { name: 'Criar conta' });
    expect(submitButton).toBeEnabled();

    await user.type(screen.getByLabelText('Nome público'), 'Mysto');
    await user.type(screen.getByLabelText('Username'), 'mysto');
    await user.type(screen.getByLabelText('Email'), 'mysto@example.com');
    await user.type(screen.getByPlaceholderText('Crie uma senha'), 'senha123');
    await user.type(screen.getByPlaceholderText('Repita a senha'), 'senha123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(service.signUp).toHaveBeenCalledWith({
        displayName: 'Mysto',
        username: 'mysto',
        email: 'mysto@example.com',
        password: 'senha123'
      });
    });
    expect(onSuccess).toHaveBeenCalledWith({
      session: null,
      requiresEmailConfirmation: true
    });
  });
});
