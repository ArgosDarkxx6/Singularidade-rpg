import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Avatar } from '@components/ui/avatar';
import { cn } from '@lib/utils';

export type V2FeedItem = {
  id: string;
  label: string;
  title: string;
  body: string;
  timestamp: string;
  href: string;
  actionLabel: string;
  avatarUrl?: string;
};

export function V2Feed({
  items,
  empty,
  className = ''
}: {
  items: V2FeedItem[];
  empty: ReactNode;
  className?: string;
}) {
  if (!items.length) return <>{empty}</>;

  return (
    <div className={cn('grid gap-2', className)}>
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          className="group flex min-w-0 flex-col gap-3 rounded-lg border border-white/8 bg-white/[0.026] px-3 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-white/[0.045] sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Avatar src={item.avatarUrl} name={item.title} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/65">{item.label}</span>
                <span className="text-[11px] text-slate-400">{item.timestamp}</span>
              </div>
              <p className="mt-1 truncate text-sm font-bold text-white">{item.title}</p>
              <p className="mt-1 truncate text-sm leading-6 text-slate-300/72">{item.body}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 self-start text-sm font-bold text-white sm:self-center">
            {item.actionLabel}
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}
