import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@lib/utils';

type V2StatusTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const toneClasses: Record<V2StatusTone, string> = {
  neutral: 'border-white/10 bg-white/[0.04] text-slate-200',
  accent: 'border-blue-300/25 bg-blue-500/14 text-blue-100',
  success: 'border-emerald-300/24 bg-emerald-500/14 text-emerald-100',
  warning: 'border-amber-300/28 bg-amber-500/14 text-amber-100',
  danger: 'border-rose-300/24 bg-rose-500/14 text-rose-100'
};

export function V2StatusChip({
  tone = 'neutral',
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: V2StatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em]',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
