import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@lib/utils';

type V2PanelTone = 'default' | 'strong' | 'flat';

const panelToneClasses: Record<V2PanelTone, string> = {
  default:
    'border-white/10 bg-[linear-gradient(180deg,rgba(10,22,36,0.82),rgba(5,12,22,0.72))] shadow-[0_14px_36px_rgba(0,0,0,0.22)]',
  strong:
    'border-blue-300/20 bg-[linear-gradient(180deg,rgba(13,30,51,0.92),rgba(6,14,25,0.86))] shadow-[0_18px_52px_rgba(18,80,190,0.14)]',
  flat: 'border-white/8 bg-white/[0.026]'
};

export function V2Panel({
  tone = 'default',
  interactive = false,
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: V2PanelTone;
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'min-w-0 rounded-xl border backdrop-blur-xl',
        panelToneClasses[tone],
        interactive && 'transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/30 hover:bg-white/[0.045]',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function V2PanelHeader({
  eyebrow,
  title,
  description,
  action,
  className = ''
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/80">{eyebrow}</p> : null}
        <h2 className="mt-1 truncate font-display text-base font-bold leading-tight text-white sm:text-lg">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-300/72">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
