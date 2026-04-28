import type { HTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('nexus-panel min-w-0', className)} {...props} />;
}

export function UtilityPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('surface-utility min-w-0 rounded-[9px] border border-white/6 bg-[rgba(13,24,39,0.76)]', className)} {...props} />;
}

export function InteractiveRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'nexus-row',
        className
      )}
      {...props}
    />
  );
}
