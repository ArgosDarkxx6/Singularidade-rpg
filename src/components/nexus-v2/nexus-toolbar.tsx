import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@lib/utils';

export function V2Toolbar({
  children,
  className = '',
  align = 'end',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  align?: 'start' | 'end' | 'between';
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-2',
        align === 'end' && 'justify-start sm:justify-end',
        align === 'between' && 'justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
