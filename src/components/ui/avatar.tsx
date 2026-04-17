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
    return <img src={src} alt={name} className={cn('rounded-lg border border-white/10 object-cover', sizeClass, className)} />;
  }

  return (
    <div
      className={cn(
        'grid place-items-center rounded-lg border border-sky-300/18 bg-[radial-gradient(circle_at_top,rgba(87,187,255,0.22),transparent_35%),linear-gradient(180deg,rgba(9,18,29,0.95),rgba(4,10,18,0.98))] font-display font-semibold text-white/80',
        sizeClass,
        className
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
