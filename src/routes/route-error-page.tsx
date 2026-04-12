import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { EmptyState } from '@components/ui/empty-state';
import { Panel } from '@components/ui/panel';

function getRouteErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'O módulo encontrou uma falha inesperada.';
}

export function RouteErrorPage() {
  const error = useRouteError();

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <Panel className="w-full max-w-2xl rounded-[32px] p-8">
        <EmptyState
          tone="danger"
          title="Não foi possível renderizar esta tela."
          body={getRouteErrorMessage(error)}
          actions={
            <>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-sky-300/24 bg-sky-500/14 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-sky-200/50" to="/mesas">
                Voltar ao portal
              </Link>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.08]" to="/entrar">
                Ir para login
              </Link>
            </>
          }
        />
      </Panel>
    </div>
  );
}
