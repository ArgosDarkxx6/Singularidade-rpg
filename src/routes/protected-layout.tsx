import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '@components/shared/loading-state';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useWorkspace } from '@features/workspace/use-workspace';

export function ProtectedLayout() {
  const { isReady, user } = useAuth();
  const { isReady: workspaceReady } = useWorkspace();
  const location = useLocation();

  if (!isReady) {
    return <LoadingState title="Carregando sessão" body="Conferindo autenticação e perfil do usuário." />;
  }

  if (!user) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/entrar?next=${encodeURIComponent(next)}`} replace />;
  }

  if (!workspaceReady) {
    return <LoadingState title="Sincronizando workspace" body="Carregando mesas, fichas e sessão online." />;
  }

  return <Outlet />;
}
