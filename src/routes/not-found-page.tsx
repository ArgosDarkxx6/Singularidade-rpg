import { Link } from 'react-router-dom';
import { Button } from '@components/ui/button';

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="surface-panel-strong max-w-xl rounded-[32px] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">404</p>
        <h1 className="mt-4 text-balance font-display text-5xl leading-none sm:text-6xl">Página perdida no domínio.</h1>
        <p className="mt-4 text-sm leading-6 text-soft">
          O caminho solicitado não existe neste remake. Volte para o portal de mesas e retome a campanha certa.
        </p>
        <Link to="/mesas" className="mt-6 inline-flex">
          <Button>Ir para o portal</Button>
        </Link>
      </div>
    </div>
  );
}
