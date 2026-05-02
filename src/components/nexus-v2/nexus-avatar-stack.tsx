import { Avatar } from '@components/ui/avatar';
import { cn } from '@lib/utils';

export type V2AvatarStackItem = {
  id: string;
  name: string;
  src?: string;
};

export function V2AvatarStack({
  items,
  limit = 5,
  size = 'sm',
  className = ''
}: {
  items: V2AvatarStackItem[];
  limit?: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const visibleItems = items.slice(0, limit);
  const remaining = Math.max(items.length - visibleItems.length, 0);
  const sizeClass = size === 'sm' ? '-ml-2 first:ml-0' : '-ml-3 first:ml-0';

  return (
    <div className={cn('flex min-w-0 items-center', className)}>
      {visibleItems.map((item) => (
        <Avatar
          key={item.id}
          src={item.src}
          name={item.name}
          size={size}
          className={cn('border-2 border-[#07101d] shadow-[0_4px_16px_rgba(0,0,0,0.24)]', sizeClass)}
        />
      ))}
      {remaining > 0 ? (
        <span className="ml-2 text-xs font-bold text-slate-300/70">+{remaining}</span>
      ) : null}
    </div>
  );
}
