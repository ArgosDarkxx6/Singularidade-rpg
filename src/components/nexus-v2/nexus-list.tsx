import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@lib/utils';

export function V2List({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn('grid min-w-0 gap-2', className)} {...props}>
      {children}
    </div>
  );
}

export function V2ListRow({
  href,
  children,
  action,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  href?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const rowClass = cn(
    'group flex min-w-0 flex-col gap-3 rounded-lg border border-white/8 bg-white/[0.026] px-3 py-2.5 transition duration-200 hover:border-blue-300/22 hover:bg-white/[0.045] sm:flex-row sm:items-center sm:justify-between',
    className
  );

  if (href) {
    return (
      <Link to={href} className={rowClass}>
        <div className="min-w-0 flex-1">{children}</div>
        <span className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-white">
          {action || 'Abrir'}
          <ArrowRight className="size-4" />
        </span>
      </Link>
    );
  }

  return (
    <div className={rowClass} {...props}>
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
