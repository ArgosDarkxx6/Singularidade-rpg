import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@components/ui/button';
import { Field, Input } from '@components/ui/field';
import { useAuth } from '@features/auth/hooks/use-auth';
import { registerSchema } from '@schemas/auth';
import type { SignUpResult } from '@services/auth/types';

type RegisterValues = import('zod').infer<typeof registerSchema>;

export function RegisterForm({ onSuccess }: { onSuccess: (result: SignUpResult) => void }) {
  const { signUp } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      displayName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { confirmPassword, ...payload } = values;
      void confirmPassword;
      const result = await signUp(payload);
      onSuccess(result);
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Não foi possível criar a conta.'
      });
    }
  });

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <Field label="Nome público">
        <Input placeholder="Mysto" autoComplete="name" {...register('displayName')} />
        {errors.displayName ? <span className="text-xs text-rose-200">{errors.displayName.message}</span> : null}
      </Field>

      <Field label="Username">
        <Input placeholder="mysto" spellCheck={false} autoComplete="username" {...register('username')} />
        {errors.username ? <span className="text-xs text-rose-200">{errors.username.message}</span> : null}
      </Field>

      <Field label="Email">
        <Input type="email" placeholder="voce@exemplo.com" autoComplete="email" {...register('email')} />
        {errors.email ? <span className="text-xs text-rose-200">{errors.email.message}</span> : null}
      </Field>

      <Field label="Senha">
        <Input type="password" placeholder="Crie uma senha" autoComplete="new-password" {...register('password')} />
        {errors.password ? <span className="text-xs text-rose-200">{errors.password.message}</span> : null}
      </Field>

      <Field label="Confirmar senha">
        <Input type="password" placeholder="Repita a senha" autoComplete="new-password" {...register('confirmPassword')} />
        {errors.confirmPassword ? <span className="text-xs text-rose-200">{errors.confirmPassword.message}</span> : null}
      </Field>

      {errors.root ? (
        <div className="rounded-lg border border-rose-300/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{errors.root.message}</div>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  );
}
