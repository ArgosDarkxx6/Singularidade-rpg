import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@lib/utils';

export type V2NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
};

export function V2Rail({
  items,
  brand,
  footer
}: {
  items: V2NavItem[];
  brand: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <aside className="hidden min-h-0 rounded-xl border border-white/8 bg-[rgba(7,19,32,0.68)] p-1.5 shadow-[0_18px_52px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:flex lg:flex-col" aria-label="Navegação principal">
      <div className="flex justify-center">{brand}</div>
      <nav className="mt-3 grid gap-1" aria-label="Plataforma">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={cn(
                'relative flex min-h-9 min-w-0 items-center gap-2 rounded-lg border px-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60',
                item.active
                  ? 'border-blue-300/30 bg-blue-500/18 text-white shadow-[0_10px_26px_rgba(47,109,255,0.18)]'
                  : 'border-transparent text-slate-300/70 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{item.label}</span>
              {item.badge ? (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-blue-300 shadow-[0_0_12px_rgba(90,170,255,0.8)]" />
              ) : null}
            </NavLink>
          );
        })}
      </nav>
      {footer ? <div className="mt-auto grid gap-1.5">{footer}</div> : null}
    </aside>
  );
}
