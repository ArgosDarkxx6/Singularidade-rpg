import type { ReactNode } from 'react';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { cn } from '@lib/utils';

export function MesaPageLead({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className = ''
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn('px-3.5 py-3.5 sm:px-4 sm:py-4', className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-4xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
          <h1 className="mt-1 text-balance font-display text-xl font-semibold leading-tight text-white sm:text-2xl">{title}</h1>
          {description ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-soft">{description}</p> : null}
          {meta ? <div className="mt-3 flex flex-wrap gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
      </div>
    </Panel>
  );
}

export function MesaLeadMeta({
  label,
  value,
  accent = false,
  className = ''
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <UtilityPanel
      className={cn(
        'rounded-lg px-2.5 py-1.5',
        accent && 'border-blue-300/20 bg-blue-500/12 text-white',
        className
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
      <span className="ml-2 text-xs font-semibold text-white sm:text-sm">{value}</span>
    </UtilityPanel>
  );
}

export function MesaSectionPanel({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = ''
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn('p-3.5 sm:p-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{eyebrow}</p> : null}
          <h2 className="mt-1 font-display text-base font-semibold leading-tight text-white sm:text-lg">{title}</h2>
          {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-soft">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-3 grid gap-2.5">{children}</div>
    </Panel>
  );
}

export function MesaKeyValueRow({
  label,
  value,
  helper,
  accent = false,
  className = ''
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <UtilityPanel
      className={cn(
        'rounded-lg px-3 py-2.5',
        accent && 'border-blue-300/18 bg-blue-500/10',
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
          {helper ? <p className="mt-1 text-xs leading-5 text-soft">{helper}</p> : null}
        </div>
        <p className="text-sm font-semibold text-white sm:text-right">{value}</p>
      </div>
    </UtilityPanel>
  );
}

export function MesaActionCard({
  title,
  description,
  icon,
  action,
  className = ''
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <UtilityPanel className={cn('rounded-lg px-3.5 py-3.5', className)}>
      <div className="flex items-start gap-3">
        {icon ? <div className="rounded-lg border border-blue-300/16 bg-blue-500/10 p-2 text-white">{icon}</div> : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm leading-6 text-soft">{description}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </UtilityPanel>
  );
}
