import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegisterForm } from '@features/auth/components/register-form';
import { AuthProvider } from '@features/auth/hooks/use-auth';
import type { AuthService } from '@services/auth/types';

describe('RegisterForm', () => {
  it('submits a new account and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    const service: AuthService = {
      initialize: async () => null,
      subscribe: () => () => undefined,
      signUp: async ({ email, username, displayName }) => ({
        session: {
          user: {
            id: 'user_test',
            email,
            username,
            displayName
          },
          token: 'token_test'
        },
        requiresEmailConfirmation: false
      }),
      signIn: async () => null,
      signOut: async () => undefined,
      updateProfile: async () => null
    };

    render(
      <AuthProvider service={service}>
        <RegisterForm onSuccess={onSuccess} />
      </AuthProvider>
    );

    await user.type(screen.getByPlaceholderText('Mysto'), 'Mysto');
    await user.type(screen.getByPlaceholderText('mysto'), 'mysto');
    await user.type(screen.getByPlaceholderText('voce@exemplo.com'), 'mysto@example.com');
    await user.type(screen.getByPlaceholderText('Crie uma senha'), 'senha123');
    await user.type(screen.getByPlaceholderText('Repita a senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        requiresEmailConfirmation: false
      })
    );
  });
});
