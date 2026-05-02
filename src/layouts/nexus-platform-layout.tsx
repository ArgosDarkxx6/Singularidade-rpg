import { Bell, DoorOpen, House, IdCard, Inbox, Menu, Search, Shield, Users } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import {
  V2MobileNav,
  V2Rail,
  V2ScrollSurface,
  V2Shell,
  V2Topbar,
  type V2NavItem
} from '@components/nexus-v2';
import { useAuth } from '@features/auth/hooks/use-auth';
import { usePlatformTables } from '@features/workspace/hooks/use-workspace-segments';

const platformNavBase = [
  {
    label: 'Hub',
    to: '/hub',
    icon: House,
    matches: (pathname: string) => pathname.startsWith('/hub')
  },
  {
    label: 'Mesas',
    to: '/mesas',
    icon: Users,
    matches: (pathname: string) => pathname.startsWith('/mesas')
  },
  {
    label: 'Personagens',
    to: '/personagens',
    icon: IdCard,
    matches: (pathname: string) => pathname.startsWith('/personagens')
  },
  {
    label: 'Convites',
    to: '/convites',
    icon: Inbox,
    matches: (pathname: string) => pathname.startsWith('/convites')
  },
  {
    label: 'Conta',
    to: '/conta',
    icon: Shield,
    matches: (pathname: string) => pathname.startsWith('/conta') || pathname.startsWith('/perfil')
  }
] as const;

function pageSubtitle(pathname: string) {
  if (pathname.startsWith('/personagens')) return 'Hub / Personagens';
  if (pathname.startsWith('/convites')) return 'Hub / Convites';
  if (pathname.startsWith('/conta') || pathname.startsWith('/perfil')) return 'Conta';
  if (pathname.startsWith('/mesas')) return 'Hub / Mesas';
  return 'Hub / Feed';
}

export function NexusPlatformLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLElement | null>(null);
  const { user, signOut } = useAuth();
  const { tables, online } = usePlatformTables();
  const activeTable = tables.find((table) => table.slug === online.session?.tableSlug) || tables[0] || null;
  const subtitle = pageSubtitle(location.pathname);

  const navItems = useMemo<V2NavItem[]>(
    () =>
      platformNavBase.map((item) => ({
        label: item.label,
        to: item.to,
        icon: item.icon,
        active: item.matches(location.pathname),
        badge: item.label === 'Convites' ? 1 : undefined
      })),
    [location.pathname]
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = 0;
    scrollRef.current.scrollLeft = 0;
  }, [location.pathname, location.search]);

  const displayName = user?.displayName || user?.username || 'Usuário';

  return (
    <V2Shell
      rail={
        <V2Rail
          items={navItems}
          brand={
            <button
              type="button"
              className="grid size-10 place-items-center rounded-lg border border-blue-300/18 bg-blue-500/10 text-blue-100 shadow-[0_0_24px_rgba(47,109,255,0.12)] transition hover:border-blue-200/36 hover:bg-blue-400/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
              aria-label="Abrir navegação"
            >
              <Menu className="size-4" />
            </button>
          }
          footer={
            <>
              <button
                type="button"
                className="flex min-h-10 min-w-0 items-center gap-2 rounded-lg border border-white/8 bg-white/[0.026] px-2 text-left text-slate-300/70 transition hover:border-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
                onClick={() => navigate('/conta')}
                aria-label="Conta"
              >
                <Avatar src={user?.avatarUrl || undefined} name={displayName} size="sm" className="size-8 rounded-md text-xs" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-white">{displayName}</span>
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-400">Conta</span>
                </span>
              </button>
              <button
                type="button"
                className="flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/[0.026] px-3 text-sm font-semibold text-slate-300/70 transition hover:border-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
                onClick={signOut}
                aria-label="Sair"
              >
                <DoorOpen className="size-4" />
                Sair
              </button>
            </>
          }
        />
      }
      topbar={
        <V2Topbar
          title="PLATAFORMA PESSOAL"
          context={subtitle}
          left={
            <Link
              to="/hub"
              className="inline-flex min-w-0 items-center gap-2 rounded-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
              aria-label="Project Nexus"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-blue-300/22 bg-blue-500/12 shadow-[0_0_26px_rgba(47,109,255,0.14)]">
                <img src="/assets/nexus-mark.svg" alt="" className="size-6" />
              </span>
              <span className="hidden min-w-0 items-baseline gap-1 font-display text-sm font-black uppercase tracking-[0.08em] sm:inline-flex">
                <span>Project</span>
                <span className="text-blue-300">Nexus</span>
              </span>
            </Link>
          }
          actions={
            <>
              <span className="hidden min-w-0 flex-col text-right xl:flex">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Mesa ativa</span>
                <span className="max-w-[220px] truncate text-sm font-semibold text-white">{activeTable?.name || 'Nenhuma mesa aberta'}</span>
              </span>
              <Button
                className="px-2.5 sm:px-3"
                onClick={() => navigate(activeTable ? `/mesa/${activeTable.slug}` : '/mesas')}
                aria-label={activeTable ? `Mesa ativa: ${activeTable.name}` : 'Abrir mesas'}
              >
                <Users className="size-4" />
                <span className="hidden sm:inline">Mesa ativa</span>
              </Button>
              <Button className="px-2.5 sm:px-3" variant="secondary" onClick={() => navigate('/conta')} aria-label="Notificações">
                <Bell className="size-4" />
              </Button>
              <Button className="px-2.5 sm:px-3" variant="secondary" onClick={() => navigate('/conta')} aria-label="Conta">
                <Shield className="size-4" />
                <span className="hidden sm:inline">Conta</span>
              </Button>
            </>
          }
        />
      }
      mobileNav={<V2MobileNav items={navItems} />}
    >
      <V2ScrollSurface ref={scrollRef}>
        <div className="mb-3 hidden min-h-11 items-center justify-between gap-3 rounded-xl border border-white/8 bg-[rgba(8,22,36,0.62)] px-3 backdrop-blur-xl lg:flex">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="grid size-8 place-items-center rounded-lg border border-white/8 bg-white/[0.026] text-slate-300/72" aria-label="Menu compacto">
              <Menu className="size-4" />
            </button>
            <div className="flex min-h-9 w-[min(32vw,360px)] items-center gap-2 rounded-lg border border-white/8 bg-black/18 px-3 text-sm text-slate-400">
              <Search className="size-4" />
              Buscar no Nexus...
              <span className="ml-auto rounded border border-white/8 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-500">⌘ K</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/conta')} aria-label="Notificações">
              <Bell className="size-4" />
            </Button>
            <button type="button" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60" onClick={() => navigate('/conta')} aria-label="Conta">
              <Avatar src={user?.avatarUrl || undefined} name={displayName} size="sm" />
            </button>
          </div>
        </div>
        <Outlet />
      </V2ScrollSurface>
    </V2Shell>
  );
}
