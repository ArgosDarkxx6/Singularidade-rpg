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
      className={cn('surface-panel-strong rounded-[30px] p-6 sm:p-7', className)}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
          <h1 className="mt-3 text-balance font-display text-4xl leading-none text-white sm:text-5xl xl:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-soft sm:text-base">{description}</p>
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
    <UtilityPanel className={cn('rounded-[24px] p-4', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{label}</p>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-2 text-sm text-soft">{hint}</div> : null}
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
    <Panel className={cn('rounded-[26px] p-5', className)}>
      {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{eyebrow}</p> : null}
      <h2 className="mt-2 font-display text-3xl leading-none text-white">{title}</h2>
      {description ? <p className="mt-3 text-sm leading-6 text-soft">{description}</p> : null}
      {children ? <div className="mt-5 grid gap-3">{children}</div> : null}
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
        'flex items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-white/[0.025] px-4 py-3',
        tone === 'accent' ? 'border-sky-300/18 bg-sky-500/10' : '',
        className
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
