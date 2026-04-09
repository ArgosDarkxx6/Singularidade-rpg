import type { ReactNode } from 'react';
import { cn } from '@lib/utils';

export function MetricChip({
  label,
  value,
  tone = 'default',
  className = ''
}: {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'danger' | 'success' | 'accent';
  className?: string;
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-rose-300/20 bg-rose-500/8 text-rose-50'
      : tone === 'success'
        ? 'border-emerald-300/20 bg-emerald-500/8 text-emerald-50'
        : tone === 'accent'
          ? 'border-sky-300/25 bg-sky-500/10 text-sky-50'
          : 'border-white/10 bg-white/4 text-white';

  return (
    <div className={cn('rounded-2xl border px-4 py-3', toneClass, className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
