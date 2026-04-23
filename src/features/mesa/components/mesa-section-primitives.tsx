import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { cn } from '@lib/utils';

export function MesaHero({
  eyebrow,
  title,
  description,
  actions,
  className = ''
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('surface-panel-strong rounded-lg p-3.5 sm:p-4', className)}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
          <h1 className="mt-1.5 text-balance text-xl font-semibold leading-tight text-white sm:text-2xl">{title}</h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-5 text-soft">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </motion.section>
  );
}

export function MesaMetricTile({
  label,
  value,
  hint,
  className = ''
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <UtilityPanel className={cn('rounded-lg p-3.5', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{label}</p>
      <div className="mt-1.5 text-xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1.5 text-sm leading-5 text-soft">{hint}</div> : null}
    </UtilityPanel>
  );
}

export function MesaRailCard({
  eyebrow,
  title,
  description,
  children,
  className = ''
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn('rounded-lg p-3.5', className)}>
      {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{eyebrow}</p> : null}
      <h2 className="mt-1 text-lg font-semibold leading-tight text-white">{title}</h2>
      {description ? <p className="mt-1.5 text-sm leading-5 text-soft">{description}</p> : null}
      {children ? <div className="mt-3 grid gap-2.5">{children}</div> : null}
    </Panel>
  );
}

export function MesaDataRow({
  label,
  value,
  tone = 'default',
  className = ''
}: {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'accent';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.025] px-4 py-3',
        tone === 'accent' ? 'border-sky-300/18 bg-sky-500/10' : '',
        className
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
