import { cn } from '@lib/utils';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[18px] bg-white/6', className)} />;
}
