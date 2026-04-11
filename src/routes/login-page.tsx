import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from '@features/auth/components/login-form';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/mesas';

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Autenticação</p>
          <h2 className="mt-3 text-balance font-display text-4xl leading-none text-white sm:text-5xl">Entre no portal de mesas.</h2>
      <p className="mt-4 max-w-lg text-sm leading-6 text-soft">
        Use email e senha para voltar ao seu portal autenticado e retomar a mesa certa sem cair em um workspace global bagunçado.
      </p>

      <div className="mt-8">
        <LoginForm onSuccess={() => navigate(next, { replace: true })} />
      </div>

      <p className="mt-6 text-sm text-soft">
        Ainda não tem conta?{' '}
        <Link className="font-semibold text-sky-200 transition hover:text-white" to="/cadastro">
          Criar cadastro
        </Link>
      </p>
    </div>
  );
}
