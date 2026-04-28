import { Bell, DoorOpen, House, IdCard, Inbox, Menu, Shield, Users } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogoLockup } from '@components/shared/logo-lockup';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { ScrollArea } from '@components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@components/ui/sheet';
import { useAuth } from '@features/auth/hooks/use-auth';
import { usePlatformTables } from '@features/workspace/hooks/use-workspace-segments';
import { cn } from '@lib/utils';

const PLATFORM_NAV_ITEMS = [
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

const PAGE_TITLES = {
  '/hub': 'Hub',
  '/mesas': 'Mesas',
  '/convites': 'Convites',
  '/conta': 'Conta',
  '/personagens': 'Personagens'
} as const;

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/personagens')) return PAGE_TITLES['/personagens'];
  if (pathname.startsWith('/convites')) return PAGE_TITLES['/convites'];
  if (pathname.startsWith('/conta') || pathname.startsWith('/perfil')) return PAGE_TITLES['/conta'];
  if (pathname.startsWith('/hub')) return PAGE_TITLES['/hub'];
  return PAGE_TITLES['/mesas'];
}

function PlatformSidebarContent({
  pathname,
  activeTableSlug,
  onNavigate,
  onSignOut,
  compact = false
}: {
  pathname: string;
  activeTableSlug: string | null;
  onNavigate?: () => void;
  onSignOut: () => void;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tables } = usePlatformTables();
  const activeTable = tables.find((table) => table.slug === activeTableSlug) || tables[0] || null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <Link
          to="/hub"
          onClick={onNavigate}
          className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.03] text-white transition hover:border-white/18 hover:bg-white/[0.06]"
          aria-label="Project Nexus"
        >
          <LogoLockup compact className="scale-[0.82]" />
        </Link>
        <span className={cn('rail-expanded-block rounded-[9px] border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted', compact && 'rail-expanded-block')}>
          Plataforma
        </span>
      </div>

      <ScrollArea className="mt-6 min-h-0 flex-1 pr-1">
        <div className="grid gap-2 pb-4">
          {PLATFORM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.matches(pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-label={item.label}
                className={cn(
              'rail-nav-link group flex items-center gap-3 text-sm font-semibold transition',
                  active ? 'border border-blue-300/18 bg-blue-500/14 text-white' : 'border border-transparent text-soft hover:border-white/8 hover:bg-white/[0.04] hover:text-white'
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="rail-label min-w-0 flex-1 truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </ScrollArea>

      <div className="mt-auto grid gap-3">
        {activeTable ? (
          <Link
            to={`/mesa/${activeTable.slug}`}
            onClick={onNavigate}
            className={cn(
              'rail-expanded-block rounded-[9px] border border-white/8 bg-white/[0.03] px-3 py-2.5 transition hover:border-blue-300/16 hover:bg-white/[0.05]',
              !compact && 'max-h-[1200px] opacity-100 pointer-events-auto translate-x-0'
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesa ativa</p>
            <p className="mt-1.5 truncate text-sm font-semibold text-white">{activeTable.name}</p>
          </Link>
        ) : null}

        <Panel className="border border-white/7 bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatarUrl || undefined} name={user?.displayName || user?.username || 'Usuário'} size="sm" />
            <div className="rail-label min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.displayName || 'Usuário'}</p>
              <p className="truncate text-xs uppercase tracking-[0.16em] text-muted">@{user?.username}</p>
            </div>
          </div>
          <div className={cn('mt-2 grid gap-1.5', compact ? 'rail-expanded-block' : '')}>
            <Button size="sm" variant="secondary" onClick={() => navigate('/conta')}>
              Conta
            </Button>
            <Button size="sm" variant="ghost" onClick={onSignOut}>
              <DoorOpen className="size-4" />
              Sair
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PlatformMobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(7,12,21,0.96)] px-2 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-2 backdrop-blur sm:hidden">
      <ul className="mx-auto grid max-w-[620px] grid-cols-5 gap-1.5">
        {PLATFORM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.matches(pathname);
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                aria-label={item.label}
                className={cn(
                  'flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] border text-[11px] font-semibold transition',
                  active ? 'border-blue-300/24 bg-blue-500/14 text-white' : 'border-white/8 bg-white/[0.03] text-soft hover:text-white'
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ProtectedAppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { tables, online } = usePlatformTables();
  const pageTitle = getPageTitle(location.pathname);
  const activeTable = tables.find((table) => table.slug === online.session?.tableSlug) || null;
  const contentScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!contentScrollRef.current) return;
    contentScrollRef.current.scrollTop = 0;
    contentScrollRef.current.scrollLeft = 0;
  }, [location.pathname, location.search]);

  return (
    <div className="platform-shell app-shell-root relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(47,109,255,0.12),transparent_21%),radial-gradient(circle_at_top_right,rgba(73,207,255,0.06),transparent_18%),linear-gradient(180deg,rgba(4,9,17,0.98),rgba(2,6,12,0.99))]" />

      <div className="app-shell-grid relative mx-auto grid h-full max-w-[1880px] grid-cols-1 gap-2.5 px-2.5 py-2.5 xl:grid-cols-[min-content_minmax(0,1fr)] xl:px-3 xl:py-3">
        <aside className="app-sidebar-shell rail-shell hidden xl:flex xl:flex-col" data-shell-layer="rail" aria-label="Navegação lateral">
          <div className="rail-shell-content">
            <PlatformSidebarContent pathname={location.pathname} activeTableSlug={activeTable?.slug || null} onSignOut={signOut} compact />
          </div>
        </aside>

        <div className="app-main-column flex h-full min-h-0 flex-col gap-2.5">
          <header className="app-topbar" data-shell-layer="header">
            <div className="flex min-h-[46px] flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="inline-flex rounded-[9px] border border-white/10 bg-white/[0.04] p-2 text-soft transition hover:text-white xl:hidden">
                      <Menu className="size-5" />
                      <span className="sr-only">Abrir navegação</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[min(88vw,360px)] border-white/10 bg-[rgba(6,11,20,0.98)] p-4">
                    <PlatformSidebarContent pathname={location.pathname} activeTableSlug={activeTable?.slug || null} onNavigate={() => undefined} onSignOut={signOut} compact={false} />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0 sm:min-w-[170px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Project Nexus</p>
                  <p className="mt-0.5 font-display text-base font-semibold text-white sm:text-lg">{pageTitle}</p>
                </div>

                <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
                  <span className="rounded-[9px] border border-white/8 bg-white/[0.025] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Plataforma
                  </span>
                  <span className="rounded-[9px] border border-blue-300/16 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                    {pageTitle}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <UtilityPanel className="hidden rounded-[9px] px-2.5 py-1.5 md:flex md:items-center md:gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Mesas</span>
                  <span className="text-xs font-semibold text-white">{tables.length}</span>
                </UtilityPanel>
                {activeTable ? (
                  <Button onClick={() => navigate(`/mesa/${activeTable.slug}`)}>
                    <Users className="size-4" />
                    Mesa ativa
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/mesas')}>
                    <Users className="size-4" />
                    Abrir mesas
                  </Button>
                )}
                <Button variant="secondary" onClick={() => navigate('/conta')}>
                  <Bell className="size-4" />
                  <span className="sr-only">Notificações</span>
                </Button>
                <Button variant="secondary" onClick={() => navigate('/conta')}>
                  <Shield className="size-4" />
                  Conta
                </Button>
              </div>
            </div>
          </header>

          <main ref={contentScrollRef} className="app-content-shell px-3 py-3 sm:px-3.5 xl:px-4" data-shell-layer="content" data-scroll-region="content">
            <div className="page-grid pb-24 sm:pb-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <PlatformMobileBottomNav pathname={location.pathname} />
    </div>
  );
}
