import type { HTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('surface-panel min-w-0 rounded-xl border border-white/7 bg-white/[0.02]', className)} {...props} />;
}

export function UtilityPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('surface-utility min-w-0 rounded-lg border border-white/6 bg-[rgba(16,22,36,0.88)]', className)} {...props} />;
}

export function InteractiveRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-white/6 bg-white/[0.025] transition hover:border-sky-300/16 hover:bg-white/[0.04]',
        className
      )}
      {...props}
    />
  );
}
