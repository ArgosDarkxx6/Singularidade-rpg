import type { ReactNode } from 'react';
import { NexusPageHeader, NexusPanel, NexusSectionHeader, NexusStat } from '@components/ui/nexus';
import { UtilityPanel } from '@components/ui/panel';
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
    <NexusPanel className={cn('grid gap-2.5', className)}>
      <NexusPageHeader kicker={eyebrow} title={title} actions={actions} />
      {description ? <p className="max-w-2xl text-sm leading-6 text-soft">{description}</p> : null}
      {meta ? <div className="flex flex-wrap gap-2">{meta}</div> : null}
    </NexusPanel>
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
    <div className={className}>
      <NexusStat label={label} value={value} accent={accent} />
    </div>
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
    <NexusPanel className={cn('grid gap-2.5', className)}>
      <NexusSectionHeader kicker={eyebrow} title={title} actions={actions} />
      {description ? <p className="max-w-2xl text-sm leading-6 text-soft">{description}</p> : null}
      <div className="grid gap-2.5">{children}</div>
    </NexusPanel>
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
      className={cn('rounded-[9px] px-3 py-2.5', accent && 'border-blue-300/18 bg-blue-500/10', className)}
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
    <UtilityPanel className={cn('rounded-[9px] px-3 py-3', className)}>
      <div className="flex items-start gap-3">
        {icon ? <div className="rounded-[9px] border border-blue-300/16 bg-blue-500/10 p-2 text-white">{icon}</div> : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1.5 text-sm leading-6 text-soft">{description}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </UtilityPanel>
  );
}
