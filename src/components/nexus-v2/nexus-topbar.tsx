import type { ReactNode } from 'react';
import { cn } from '@lib/utils';

export function V2Topbar({
  title,
  context,
  left,
  center,
  actions,
  className = ''
}: {
  title: string;
  context?: string;
  left?: ReactNode;
  center?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'relative flex min-h-[54px] shrink-0 items-center justify-between gap-3 px-2 py-1',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center justify-start">{left}</div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 hidden min-w-0 -translate-x-1/2 -translate-y-1/2 text-center md:block">
        <h1 className="truncate font-display text-base font-bold uppercase tracking-[0.08em] text-white sm:text-lg">{title}</h1>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-400">{context || 'Project Nexus'}</p>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {center ? <div className="hidden min-w-0 items-center justify-end gap-2 xl:flex">{center}</div> : null}
        {actions ? <div className="flex min-w-0 items-center justify-end gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
