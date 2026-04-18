import { describe, expect, it } from 'vitest';
import { isEmailLogin, isUsernameLogin, loginSchema, normalizeLoginIdentifier, registerSchema } from './auth';

describe('auth schemas', () => {
  it('accepts email or username login payloads', () => {
    expect(loginSchema.safeParse({ identifier: 'mysto_1', password: 'senha123' }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: 'mysto@example.com', password: 'senha123' }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: 'mysto-1', password: 'senha123' }).success).toBe(false);
  });

  it('keeps username validation aligned with account creation', () => {
    expect(
      registerSchema.safeParse({
        displayName: 'Mysto',
        username: 'mysto_1',
        email: 'mysto@example.com',
        password: 'senha123',
        confirmPassword: 'senha123'
      }).success
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        displayName: 'Mysto',
        username: 'mysto-1',
        email: 'mysto@example.com',
        password: 'senha123',
        confirmPassword: 'senha123'
      }).success
    ).toBe(false);
  });

  it('normalizes and classifies login identifiers correctly', () => {
    expect(normalizeLoginIdentifier('  Mysto_1  ')).toBe('mysto_1');
    expect(isUsernameLogin('mysto_1')).toBe(true);
    expect(isEmailLogin('mysto@example.com')).toBe(true);
    expect(isUsernameLogin('mysto@example.com')).toBe(false);
  });
});
