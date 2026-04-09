import type { ReactNode } from 'react';
import { cn } from '@lib/utils';

export function SectionTitle({
  eyebrow,
  title,
  description,
  actions,
  className = ''
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{eyebrow}</p> : null}
        <h2 className="mt-1 font-display text-3xl leading-none text-white">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm text-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
