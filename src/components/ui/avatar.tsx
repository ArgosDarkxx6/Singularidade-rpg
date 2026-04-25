import { cn } from '@lib/utils';

export function Avatar({
  src,
  name,
  size = 'md',
  className = ''
}: {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass = size === 'sm' ? 'size-10 text-sm' : size === 'lg' ? 'size-20 text-2xl' : 'size-14 text-lg';

  if (src) {
    return <img src={src} alt={name} className={cn('rounded-lg border border-white/8 object-cover', sizeClass, className)} />;
  }

  return (
    <div
      className={cn(
        'grid place-items-center rounded-lg border border-white/8 bg-[radial-gradient(circle_at_top,rgba(60,124,255,0.24),transparent_35%),linear-gradient(180deg,rgba(10,18,31,0.95),rgba(6,12,21,0.98))] font-display font-semibold text-white/85',
        sizeClass,
        className
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
