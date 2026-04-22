import {
  ChevronRight,
  DoorOpen,
  IdCard,
  LayoutDashboard,
  Menu,
  RadioTower,
  Shield,
  UserRound,
  Users
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogoLockup } from '@components/shared/logo-lockup';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { ScrollArea } from '@components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@components/ui/sheet';
import { useAuth } from '@features/auth/hooks/use-auth';
import { MESA_NAV_ITEMS } from '@features/mesa/lib/mesa-routing';
import { getGameSystem } from '@features/systems/registry';
import { useWorkspace } from '@features/workspace/use-workspace';
import { cn } from '@lib/utils';

const PLATFORM_NAV_ITEMS = [
  {
    label: 'Hub de mesas',
    to: '/mesas',
    icon: LayoutDashboard,
    matches: (pathname: string) => pathname.startsWith('/mesas')
  },
  {
    label: 'Perfil',
    to: '/perfil',
    icon: UserRound,
    matches: (pathname: string) => pathname.startsWith('/perfil')
  },
  {
    label: 'Meus personagens',
    to: '/personagens',
    icon: IdCard,
    matches: (pathname: string) => pathname.startsWith('/personagens')
  }
] as const;

const PAGE_META = {
  '/mesas': {
    eyebrow: 'Plataforma',
    title: 'Hub operacional',
    description: 'Acesse campanhas, retome mesas e mova-se pela plataforma sem depender de telas soltas.'
  },
  '/perfil': {
    eyebrow: 'Conta',
    title: 'Perfil e identidade',
    description: 'Gerencie sua presença na plataforma, personagens vinculados e acesso às mesas em um único lugar.'
  },
  '/personagens': {
    eyebrow: 'Conta',
    title: 'Meus personagens',
    description: 'Nucleo autoral dos personagens da sua conta, pronto para vincular em qualquer mesa.'
  }
} as const;

function getPageMeta(pathname: string) {
  if (pathname.startsWith('/personagens')) return PAGE_META['/personagens'];
  if (pathname.startsWith('/perfil')) return PAGE_META['/perfil'];
  return PAGE_META['/mesas'];
}

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Player';
  return 'Viewer';
}

function PlatformSidebarContent({
  pathname,
  onNavigate,
  onSignOut,
  compact = false
}: {
  pathname: string;
  onNavigate?: () => void;
  onSignOut: () => void;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { online, tables } = useWorkspace();
  const activeTable = tables.find((table) => table.slug === online.session?.tableSlug) || tables[0] || null;
  const activeSystem = activeTable ? getGameSystem(activeTable.systemKey) : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <LogoLockup compact={compact} className="min-w-0" />
        <span className="rail-expanded-block rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          plataforma
        </span>
      </div>

      <ScrollArea className="mt-6 min-h-0 flex-1 pr-2">
        <div className="grid gap-6 pb-4">
          <section className="grid gap-2">
            <p className={cn('section-label', compact && 'rail-expanded-block')}>Navegação</p>
            <nav className="grid gap-1.5">
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
                      'rail-nav-link group flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-semibold transition',
                      active ? 'bg-sky-400/14 text-white' : 'text-soft hover:bg-white/[0.05] hover:text-white'
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="rail-label min-w-0 flex-1 truncate">{item.label}</span>
                    <ChevronRight className={cn('rail-label size-4 opacity-0 transition group-hover:opacity-100', active && 'opacity-100')} />
                  </NavLink>
                );
              })}
            </nav>
          </section>

          {activeTable ? (
            <section className={cn('grid gap-3', compact && 'rail-expanded-block')}>
              <p className="section-label">Mesa ativa</p>
              <Panel className="rounded-lg p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{activeSystem?.name || 'Mesa'}</p>
                    <h2 className="mt-2 truncate text-lg font-semibold text-white">{activeTable.name}</h2>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">{formatRoleLabel(activeTable.role)}</p>
                  </div>
                  <RadioTower className="mt-1 size-4 shrink-0 text-sky-200" />
                </div>
                <div className="mt-4 grid gap-1.5">
                  {MESA_NAV_ITEMS.map((item) => (
                    <Link
                      key={item.section}
                      to={item.href(activeTable.slug)}
                      onClick={onNavigate}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-soft transition hover:bg-white/[0.05] hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </Panel>
            </section>
          ) : null}

          <section className={cn('grid gap-3', compact && 'rail-expanded-block')}>
            <div className="flex items-center justify-between gap-3">
              <p className="section-label">Mesas recentes</p>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {tables.length}
              </span>
            </div>
            <div className="grid gap-2">
              {tables.length ? (
                tables.slice(0, 6).map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => {
                      navigate(`/mesa/${table.slug}`);
                      onNavigate?.();
                    }}
                    className="rounded-lg border border-white/8 bg-white/[0.025] px-3.5 py-3 text-left transition hover:border-sky-300/18 hover:bg-white/[0.05]"
                  >
                    <p className="truncate text-sm font-semibold text-white">{table.name}</p>
                    <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted">
                      {getGameSystem(table.systemKey).name} · {formatRoleLabel(table.role)}
                    </p>
                  </button>
                ))
              ) : (
                <UtilityPanel className="rounded-xl px-3.5 py-4">
                  <p className="text-sm text-soft">Nenhuma mesa conectada ainda.</p>
                </UtilityPanel>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <Avatar src={user?.avatarUrl || undefined} name={user?.displayName || user?.username || 'Usuário'} size="sm" />
          <div className={cn('rail-label min-w-0 flex-1', !compact && 'max-w-none opacity-100')}>
            <p className="truncate text-sm font-semibold text-white">{user?.displayName || 'Usuário'}</p>
            <p className="truncate text-xs uppercase tracking-[0.16em] text-muted">@{user?.username}</p>
          </div>
          <Button size="sm" variant="ghost" aria-label="Encerrar sessão" onClick={onSignOut}>
            <DoorOpen className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProtectedAppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { tables, online } = useWorkspace();
  const meta = getPageMeta(location.pathname);
  const activeTable = tables.find((table) => table.slug === online.session?.tableSlug) || null;

  return (
    <div className="platform-shell relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(87,187,255,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(120,164,255,0.09),transparent_18%),linear-gradient(180deg,rgba(6,10,18,0.96),rgba(4,7,14,0.98))]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1820px] grid-cols-1 gap-4 px-3 py-3 xl:grid-cols-[min-content_minmax(0,1fr)] xl:px-4 xl:py-4">
        <aside className="app-sidebar-shell rail-shell hidden xl:flex xl:min-h-[calc(100svh-2rem)] xl:flex-col">
          <div className="rail-shell-content">
            <PlatformSidebarContent pathname={location.pathname} onSignOut={signOut} compact />
          </div>
        </aside>

        <div className="flex min-h-screen flex-col gap-4 xl:min-h-[calc(100svh-2rem)]">
          <header className="app-topbar sticky top-3 z-30">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-soft transition hover:text-white xl:hidden">
                      <Menu className="size-5" />
                      <span className="sr-only">Abrir navegação</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[min(88vw,380px)] p-4">
                    <PlatformSidebarContent pathname={location.pathname} onNavigate={() => undefined} onSignOut={signOut} compact={false} />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{meta.eyebrow}</p>
                  <h1 className="mt-1 text-balance text-xl font-semibold leading-tight text-white sm:text-2xl">{meta.title}</h1>
                  <p className="mt-1 text-sm text-soft">{meta.description}</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <UtilityPanel className="rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesas</p>
                  <p className="mt-2 text-sm font-semibold text-white">{tables.length} disponíveis</p>
                </UtilityPanel>
                <UtilityPanel className="rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesa conectada</p>
                  <p className="mt-2 text-sm font-semibold text-white">{activeTable?.name || 'Nenhuma ativa'}</p>
                </UtilityPanel>
                <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-1">
                  {activeTable ? (
                    <Button className="flex-1 xl:min-w-[170px]" onClick={() => navigate(`/mesa/${activeTable.slug}`)}>
                      <Users className="size-4" />
                      Abrir mesa ativa
                    </Button>
                  ) : (
                    <Button className="flex-1 xl:min-w-[170px]" onClick={() => navigate('/mesas')}>
                      <Users className="size-4" />
                      Ir para mesas
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => navigate('/perfil')}>
                    <Shield className="size-4" />
                    Conta
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="app-content-shell min-h-0 flex-1 px-3 py-3 sm:px-4 xl:px-5">
            <div className="page-grid pb-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
