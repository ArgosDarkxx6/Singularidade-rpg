import { Navigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useWorkspace } from '@features/workspace/use-workspace';
import { AppShellLayout } from '@layouts/app-shell';

export function ProtectedLayout() {
  const { isReady, user } = useAuth();
  const { isReady: workspaceReady } = useWorkspace();

  if (!isReady) {
    return <div className="grid min-h-screen place-items-center text-sm text-soft">Carregando sessao...</div>;
  }

  if (!user) {
    return <Navigate to="/entrar" replace />;
  }

  if (!workspaceReady) {
    return <div className="grid min-h-screen place-items-center text-sm text-soft">Carregando workspace...</div>;
  }

  return <AppShellLayout />;
}
