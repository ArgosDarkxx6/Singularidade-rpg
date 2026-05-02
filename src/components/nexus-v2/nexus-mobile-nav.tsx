import { NavLink } from 'react-router-dom';
import { cn } from '@lib/utils';
import type { V2NavItem } from './nexus-rail';

export function V2MobileNav({ items }: { items: V2NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(3,8,16,0.96)] px-2 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-2 backdrop-blur-xl lg:hidden" aria-label="Navegação inferior">
      <ul className="mx-auto grid max-w-[640px] grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                aria-label={item.label}
                className={cn(
                  'relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[10px] font-bold leading-none transition duration-200',
                  item.active ? 'border-blue-300/28 bg-blue-500/18 text-white' : 'border-white/8 bg-white/[0.035] text-slate-300/72 hover:text-white'
                )}
              >
                <Icon className="size-4" />
                <span className="w-full truncate text-center">{item.label}</span>
                {item.badge ? <span className="absolute right-3 top-2 size-2 rounded-full bg-blue-300" /> : null}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
