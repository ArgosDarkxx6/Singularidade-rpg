import type { HTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('nexus-panel min-w-0 overflow-hidden p-3 sm:p-3.5', className)} {...props} />;
}
