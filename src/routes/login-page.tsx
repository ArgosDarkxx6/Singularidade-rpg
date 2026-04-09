import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '@features/auth/components/login-form';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Acesso</p>
      <h2 className="mt-3 font-display text-5xl leading-none text-white">Entrar na mesa.</h2>
      <p className="mt-4 max-w-lg text-sm leading-6 text-soft">
        Use seu email e senha para recuperar o roster, a mesa ativa e o estado persistido do remake.
      </p>
      <div className="mt-8">
        <LoginForm onSuccess={() => navigate('/fichas', { replace: true })} />
      </div>
      <p className="mt-6 text-sm text-soft">
        Ainda nao tem conta?{' '}
        <Link className="font-semibold text-sky-200 hover:text-white" to="/cadastro">
          Criar cadastro
        </Link>
      </p>
    </div>
  );
}
