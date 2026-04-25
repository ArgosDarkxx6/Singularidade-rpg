import type { HTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('surface-panel min-w-0 overflow-hidden rounded-xl border border-white/7 p-3.5 sm:p-4', className)} {...props} />;
}
