import { Navigate } from 'react-router-dom';
import { LoadingState } from '@components/shared/loading-state';
import { useAuth } from '@features/auth/hooks/use-auth';
import { AuthLayout } from '@layouts/auth-layout';

export function GuestLayout() {
  const { isReady, user } = useAuth();

  if (!isReady) {
    return <LoadingState title="Preparando autenticação" body="Validando a sessão antes de abrir o portal." />;
  }

  if (user) {
    return <Navigate to="/mesas" replace />;
  }

  return <AuthLayout />;
}
