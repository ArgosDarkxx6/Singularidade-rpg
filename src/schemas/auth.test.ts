import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth';

describe('auth schemas', () => {
  it('accepts username login and rejects email login payloads', () => {
    expect(loginSchema.safeParse({ username: 'mysto_1', password: 'senha123' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'mysto@example.com', password: 'senha123' }).success).toBe(false);
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
});
