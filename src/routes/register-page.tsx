import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '@components/ui/empty-state';
import { RegisterForm } from '@features/auth/components/register-form';
import type { SignUpResult } from '@services/auth/types';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [waitingConfirmation, setWaitingConfirmation] = useState(false);
  const next = searchParams.get('next') || '/mesas';

  const handleSuccess = (result: SignUpResult) => {
    if (result.session) {
      navigate(next, { replace: true });
      return;
    }

    setWaitingConfirmation(true);
  };

  if (waitingConfirmation) {
    return (
      <EmptyState
        title="Confirme seu email para ativar a conta."
        body="O cadastro foi criado no Supabase, mas a sessão ainda não foi aberta. Valide a mensagem recebida e depois volte para entrar no Project Nexus."
      />
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Project Nexus</p>
      <h2 className="mt-3 text-balance font-display text-4xl leading-none text-white sm:text-5xl">Crie sua conta no hub.</h2>
      <p className="mt-4 max-w-lg text-sm leading-6 text-soft">
        Cadastre email, username público e senha para criar mesas, entrar em sistemas e manter sua identidade de jogo organizada.
      </p>

      <div className="mt-8">
        <RegisterForm onSuccess={handleSuccess} />
      </div>

      <p className="mt-6 text-sm text-soft">
        Já possui conta?{' '}
        <Link className="font-semibold text-sky-200 transition hover:text-white" to="/entrar">
          Voltar para login
        </Link>
      </p>
    </div>
  );
}
