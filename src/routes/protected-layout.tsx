import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useWorkspace } from '@features/workspace/use-workspace';

export function ProtectedLayout() {
  const { isReady, user } = useAuth();
  const { isReady: workspaceReady } = useWorkspace();
  const location = useLocation();

  if (!isReady) {
    return <div className="grid min-h-screen place-items-center text-sm text-soft">Carregando sessao...</div>;
  }

  if (!user) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/entrar?next=${encodeURIComponent(next)}`} replace />;
  }

  if (!workspaceReady) {
    return <div className="grid min-h-screen place-items-center text-sm text-soft">Carregando ambiente...</div>;
  }

  return <Outlet />;
}
