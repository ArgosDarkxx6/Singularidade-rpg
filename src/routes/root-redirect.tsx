import { Navigate } from 'react-router-dom';
import { LoadingState } from '@components/shared/loading-state';
import { useAuth } from '@features/auth/hooks/use-auth';

export function RootRedirect() {
  const { isReady, user } = useAuth();

  if (!isReady) {
    return <LoadingState title="Abrindo Singularidade" body="Encontrando a melhor entrada para sua sessão." />;
  }

  return <Navigate to={user ? '/mesas' : '/entrar'} replace />;
}
