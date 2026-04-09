import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@components/ui/button';
import { Field, Input } from '@components/ui/field';
import { useAuth } from '@features/auth/hooks/use-auth';
import { loginSchema } from '@schemas/auth';

type LoginValues = import('zod').infer<typeof loginSchema>;

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { signIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setError
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values);
      onSuccess();
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Nao foi possivel entrar.'
      });
    }
  });

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field label="Email">
        <Input type="email" placeholder="voce@exemplo.com" {...register('email')} />
        {errors.email ? <span className="text-xs text-rose-200">{errors.email.message}</span> : null}
      </Field>

      <Field label="Senha">
        <Input type="password" placeholder="Sua senha" {...register('password')} />
        {errors.password ? <span className="text-xs text-rose-200">{errors.password.message}</span> : null}
      </Field>

      {errors.root ? <p className="text-sm text-rose-200">{errors.root.message}</p> : null}

      <Button type="submit" size="lg" disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
