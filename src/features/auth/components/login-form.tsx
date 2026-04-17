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
    formState: { errors, isSubmitting },
    setError
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values);
      onSuccess();
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Não foi possível entrar.'
      });
    }
  });

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <Field label="Usuario">
        <Input placeholder="mysto" autoComplete="username" spellCheck={false} {...register('username')} />
        {errors.username ? <span className="text-xs text-rose-200">{errors.username.message}</span> : null}
      </Field>

      <Field label="Senha">
        <Input type="password" placeholder="Sua senha" autoComplete="current-password" {...register('password')} />
        {errors.password ? <span className="text-xs text-rose-200">{errors.password.message}</span> : null}
      </Field>

      {errors.root ? (
        <div className="rounded-lg border border-rose-300/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{errors.root.message}</div>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar no Project Nexus'}
      </Button>
    </form>
  );
}
