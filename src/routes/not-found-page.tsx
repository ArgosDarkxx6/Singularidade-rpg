import { Link } from 'react-router-dom';
import { Button } from '@components/ui/button';

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="surface-panel-strong max-w-lg rounded-[12px] p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">404</p>
        <h1 className="mt-4 text-balance font-display text-2xl leading-tight sm:text-3xl">Página não encontrada.</h1>
        <Link to="/mesas" className="mt-6 inline-flex">
          <Button>Ir para mesas</Button>
        </Link>
      </div>
    </div>
  );
}
