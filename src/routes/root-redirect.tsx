import { Navigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/use-auth';

export function RootRedirect() {
  const { isReady, user } = useAuth();

  if (!isReady) {
    return <div className="grid min-h-screen place-items-center text-sm text-soft">Carregando sessao...</div>;
  }

  return <Navigate to={user ? '/hub' : '/entrar'} replace />;
}
