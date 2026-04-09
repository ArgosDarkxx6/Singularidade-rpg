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
    formState: { errors, isSubmitting, isValid },
    setError
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
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
        message: error instanceof Error ? error.message : 'Nao foi possivel criar a conta.'
      });
    }
  });

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field label="Nome publico">
        <Input placeholder="Mysto" {...register('displayName')} />
        {errors.displayName ? <span className="text-xs text-rose-200">{errors.displayName.message}</span> : null}
      </Field>

      <Field label="Username">
        <Input placeholder="mysto" {...register('username')} />
        {errors.username ? <span className="text-xs text-rose-200">{errors.username.message}</span> : null}
      </Field>

      <Field label="Email">
        <Input type="email" placeholder="voce@exemplo.com" {...register('email')} />
        {errors.email ? <span className="text-xs text-rose-200">{errors.email.message}</span> : null}
      </Field>

      <Field label="Senha">
        <Input type="password" placeholder="Crie uma senha" {...register('password')} />
        {errors.password ? <span className="text-xs text-rose-200">{errors.password.message}</span> : null}
      </Field>

      <Field label="Confirmar senha">
        <Input type="password" placeholder="Repita a senha" {...register('confirmPassword')} />
        {errors.confirmPassword ? <span className="text-xs text-rose-200">{errors.confirmPassword.message}</span> : null}
      </Field>

      {errors.root ? <p className="text-sm text-rose-200">{errors.root.message}</p> : null}

      <Button type="submit" size="lg" disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  );
}
