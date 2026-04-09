import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Informe um email valido.'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres.')
});

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
