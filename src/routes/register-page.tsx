import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '@components/ui/empty-state';
import { RegisterForm } from '@features/auth/components/register-form';
import type { SignUpResult } from '@services/auth/types';

export function RegisterPage() {
  const navigate = useNavigate();
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('');

  const handleSuccess = (result: SignUpResult) => {
    if (result.session) {
      navigate('/fichas', { replace: true });
      return;
    }

    setPendingConfirmationEmail('confirme seu email');
  };

  if (pendingConfirmationEmail) {
    return (
      <EmptyState
        title="Confirme seu email para ativar a conta."
        body="O cadastro foi criado no Supabase, mas a sessao ainda nao foi aberta. Valide a mensagem recebida e depois volte para entrar."
      />
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Cadastro</p>
      <h2 className="mt-3 font-display text-5xl leading-none text-white">Criar identidade ritual.</h2>
      <p className="mt-4 max-w-lg text-sm leading-6 text-soft">
        Cadastre email, username publico e senha. O username aparece na mesa, enquanto o email fica como credencial de acesso.
      </p>
      <div className="mt-8">
        <RegisterForm onSuccess={handleSuccess} />
      </div>
      <p className="mt-6 text-sm text-soft">
        Ja possui conta?{' '}
        <Link className="font-semibold text-sky-200 hover:text-white" to="/entrar">
          Voltar para login
        </Link>
      </p>
    </div>
  );
}
