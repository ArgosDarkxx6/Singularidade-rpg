import { LoaderCircle } from 'lucide-react';
import { LogoLockup } from '@components/shared/logo-lockup';
import { Panel } from '@components/ui/panel';
import { cn } from '@lib/utils';

export function LoadingState({
  title = 'Carregando Singularidade',
  body = 'Sincronizando dados, sessão e permissões.',
  fullScreen = true,
  className = ''
}: {
  title?: string;
  body?: string;
  fullScreen?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('grid place-items-center px-4 py-10', fullScreen ? 'min-h-screen' : 'min-h-[320px]', className)}>
      <Panel className="w-full max-w-xl rounded-[30px] p-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-[24px] border border-sky-300/16 bg-sky-500/10 shadow-[0_0_50px_rgba(87,187,255,0.12)]">
          <LoaderCircle className="size-7 animate-spin text-sky-200" />
        </div>
        <div className="mt-6 flex justify-center">
          <LogoLockup compact />
        </div>
        <h1 className="mt-5 font-display text-4xl leading-none text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-soft">{body}</p>
      </Panel>
    </div>
  );
}
