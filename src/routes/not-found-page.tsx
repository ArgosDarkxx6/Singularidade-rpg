import { Link } from 'react-router-dom';
import { Button } from '@components/ui/button';

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="surface-panel-strong max-w-xl rounded-[32px] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">404</p>
        <h1 className="mt-4 font-display text-6xl leading-none">Pagina perdida no dominio.</h1>
        <p className="mt-4 text-sm leading-6 text-soft">
          O caminho solicitado nao existe neste remake. Volte para a shell principal e continue a mesa.
        </p>
        <Link to="/fichas" className="mt-6 inline-flex">
          <Button>Ir para Fichas</Button>
        </Link>
      </div>
    </div>
  );
}
