import { Navigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/use-auth';
import { AuthLayout } from '@layouts/auth-layout';

export function GuestLayout() {
  const { isReady, user } = useAuth();

  if (!isReady) {
    return <div className="grid min-h-screen place-items-center text-sm text-soft">Carregando sessao...</div>;
  }

  if (user) {
    return <Navigate to="/fichas" replace />;
  }

  return <AuthLayout />;
}
