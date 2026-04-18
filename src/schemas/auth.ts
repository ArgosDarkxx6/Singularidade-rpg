import { z } from 'zod';

const emailSchema = z.email('Informe um email valido.');
const usernameSchema = z
  .string()
  .min(3, 'Informe seu username ou email.')
  .regex(/^[a-z0-9_]+$/i, 'Use um email valido ou apenas letras, numeros e underscore.');

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Informe seu username ou email.').refine((value) => {
    const trimmed = value.trim();
    return emailSchema.safeParse(trimmed).success || usernameSchema.safeParse(trimmed).success;
  }, 'Use um email valido ou apenas letras, numeros e underscore.'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres.')
});

export function isEmailLogin(value: string) {
  return emailSchema.safeParse(value.trim()).success;
}

export function normalizeLoginIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export function isUsernameLogin(value: string) {
  return usernameSchema.safeParse(normalizeLoginIdentifier(value)).success;
}

export { usernameSchema };

export const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Informe um nome de exibicao.'),
    username: z
      .string()
      .min(3, 'O username precisa ter ao menos 3 caracteres.')
      .regex(/^[a-z0-9_]+$/i, 'Use apenas letras, numeros e underscore.'),
    email: z.email('Informe um email valido.'),
    password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'Confirme a senha.')
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword']
  });

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2, 'Informe um nome de exibicao.')
});
