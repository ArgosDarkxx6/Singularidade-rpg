import type { ReactNode } from 'react';
import { Panel } from '@components/ui/panel';
import { cn } from '@lib/utils';

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
    <Panel className={cn('p-3.5', className)}>
      {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{eyebrow}</p> : null}
      <h2 className="mt-1 font-display text-base font-semibold leading-tight text-white">{title}</h2>
      {description ? <p className="mt-1.5 text-sm leading-6 text-soft">{description}</p> : null}
      {children ? <div className="mt-3 grid gap-2.5">{children}</div> : null}
    </Panel>
  );
}
