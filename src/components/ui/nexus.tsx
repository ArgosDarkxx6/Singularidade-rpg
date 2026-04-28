import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@lib/utils';

export function NexusPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn('nexus-panel p-3 sm:p-3.5', className)} {...props} />;
}

export function NexusRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('nexus-row px-3 py-2.5', className)} {...props} />;
}

export function NexusPageHeader({
  kicker,
  title,
  actions,
  className = ''
}: {
  kicker: string;
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('nexus-page-head', className)}>
      <div className="min-w-0">
        <p className="nexus-page-kicker">{kicker}</p>
        <h1 className="nexus-page-title">{title}</h1>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div> : null}
    </div>
  );
}

export function NexusSectionHeader({
  kicker,
  title,
  actions,
  className = ''
}: {
  kicker?: string;
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center', className)}>
      <div className="min-w-0">
        {kicker ? <p className="section-label">{kicker}</p> : null}
        <h2 className="mt-0.5 truncate font-display text-base font-semibold leading-tight text-white">{title}</h2>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  );
}

export function NexusStat({ label, value, accent = false }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className={cn('rounded-[9px] border px-2.5 py-2', accent ? 'border-blue-300/22 bg-blue-500/12' : 'border-white/7 bg-white/[0.025]')}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function NexusToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex min-w-0 flex-wrap items-center gap-2', className)} {...props} />;
}
