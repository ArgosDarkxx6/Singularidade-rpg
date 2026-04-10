import type { HTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('surface-panel min-w-0 rounded-[24px] border border-white/10 bg-white/[0.03]', className)} {...props} />;
}

export function UtilityPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0 rounded-[20px] border border-white/8 bg-slate-950/55 shadow-[0_14px_30px_rgba(2,8,18,0.28)]', className)} {...props} />;
}

export function InteractiveRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-[20px] border border-white/8 bg-white/[0.025] transition hover:border-sky-300/20 hover:bg-white/[0.05]',
        className
      )}
      {...props}
    />
  );
}
