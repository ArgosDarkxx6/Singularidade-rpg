import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftRight,
  BookOpenText,
  CalendarClock,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Settings,
  Shield,
  Sparkles,
  Swords,
  TriangleAlert,
  Users
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LogoLockup } from '@components/shared/logo-lockup';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { ScrollArea } from '@components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@components/ui/sheet';
import { useAuth } from '@features/auth/hooks/use-auth';
import { MESA_NAV_ITEMS, getMesaSectionFromPath } from '@features/mesa/lib/mesa-routing';
import { useMesaShellStore } from '@features/mesa/store/use-mesa-shell-store';
import { getGameSystem } from '@features/systems/registry';
import { useWorkspace } from '@features/workspace/use-workspace';
import { MESA_SECTION_LABELS } from '@lib/domain/constants';
import { cn } from '@lib/utils';
import type { AuthUser, MesaSection, PresenceMember, TableSession, TableState } from '@/types/domain';

const sectionIcons: Record<MesaSection, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  sessao: CalendarClock,
  fichas: Sparkles,
  rolagens: Sparkles,
  ordem: Swords,
  livro: BookOpenText,
  membros: Users,
  configuracoes: Settings
};

const sectionDescriptions: Record<MesaSection, string> = {
  overview: 'Centro operacional da campanha com foco em mesa, campanha, estado atual e leitura executiva dos módulos.',
  sessao: 'Presença, andamento, episódio em foco e fluxo operacional da sessão.',
  fichas: 'Roster, leitura e operação das fichas da mesa em um workspace dedicado.',
  rolagens: 'Console de rolagens, histórico compartilhado e resolução recorrente.',
  ordem: 'Planejamento tático, iniciativa, turnos e combate em andamento.',
  livro: 'Referências, presets e consulta de conteúdo do sistema ativo.',
  membros: 'Pessoas, convites, códigos e controle de acesso da mesa.',
  configuracoes: 'Administração, snapshots, metadados e segurança da campanha.'
};

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Player';
  return 'Viewer';
}

function formatRelativeDate(value: string) {
  if (!value) return 'Sem atualização';
  const date = new Date(value);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function MesaNavigation({
  slug,
  onNavigate
}: {
  slug: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-1.5">
      {MESA_NAV_ITEMS.map((item) => {
        const Icon = sectionIcons[item.section];
        return (
          <NavLink
            key={item.section}
            to={item.href(slug)}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition',
                isActive ? 'bg-sky-400/14 text-white' : 'text-soft hover:bg-white/[0.05] hover:text-white'
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function MesaSidebarContent({
  table,
  session,
  members,
  slug,
  user,
  currentTableSummary,
  tables,
  onSwitchTable,
  onLeave,
  onOpenProfile,
  onSignOut,
  onNavigate
}: {
  table: TableState;
  session: TableSession;
  members: PresenceMember[];
  slug: string;
  user: AuthUser | null;
  currentTableSummary: { status?: string } | null;
  tables: Array<{ id: string; slug: string; name: string; systemKey: string; role: 'gm' | 'player' | 'viewer'; status?: string }>;
  onSwitchTable: (nextSlug: string) => void;
  onLeave: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  const activeSystem = getGameSystem(table.systemKey);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <LogoLockup variant="system" systemKey={table.systemKey} className="min-w-0" />
        <span className="rounded-full border border-sky-300/18 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-100">
          {formatRoleLabel(session.role)}
        </span>
      </div>

      <ScrollArea className="mt-6 min-h-0 flex-1 pr-2">
        <div className="grid gap-6 pb-4">
          <section className="grid gap-3">
            <p className="section-label">Mesa atual</p>
            <Panel className="rounded-2xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{activeSystem.name}</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{table.name}</h2>
              <p className="mt-2 text-sm text-soft">
                {table.meta.seriesName || 'Sem série'} · {table.meta.campaignName || 'Sem campanha'}
              </p>
              <div className="mt-4 grid gap-2">
                <Link
                  to="/mesas"
                  onClick={onNavigate}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm font-semibold text-soft transition hover:border-white/18 hover:text-white"
                >
                  Voltar ao hub
                </Link>
                <Link
                  to={`/mesa/${slug}/configuracoes`}
                  onClick={onNavigate}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm font-semibold text-soft transition hover:border-white/18 hover:text-white"
                >
                  Abrir configurações
                </Link>
              </div>
            </Panel>
          </section>

          <section className="grid gap-2">
            <p className="section-label">Módulos</p>
            <MesaNavigation slug={slug} onNavigate={onNavigate} />
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="section-label">Leitura rápida</p>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                live
              </span>
            </div>
            <div className="grid gap-2.5">
              <UtilityPanel className="rounded-xl px-3.5 py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
                <p className="mt-2 text-sm font-semibold text-white">{currentTableSummary?.status || table.currentSession?.status || 'Sem sessão'}</p>
              </UtilityPanel>
              <UtilityPanel className="rounded-xl px-3.5 py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Presença</p>
                <p className="mt-2 text-sm font-semibold text-white">{members.length} membro(s) visíveis</p>
              </UtilityPanel>
              <UtilityPanel className="rounded-xl px-3.5 py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Último sync</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatRelativeDate(table.updatedAt)}</p>
              </UtilityPanel>
            </div>
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="section-label">Trocar mesa</p>
              <ArrowLeftRight className="size-4 text-soft" />
            </div>
            <div className="grid gap-2">
              {tables.slice(0, 6).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    onSwitchTable(entry.slug);
                    onNavigate?.();
                  }}
                  className={cn(
                    'rounded-xl border px-3.5 py-3 text-left transition',
                    entry.slug === slug
                      ? 'border-sky-300/18 bg-sky-500/10'
                      : 'border-white/8 bg-white/[0.025] hover:border-sky-300/18 hover:bg-white/[0.05]'
                  )}
                >
                  <p className="truncate text-sm font-semibold text-white">{entry.name}</p>
                  <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted">
                    {getGameSystem(entry.systemKey).name} · {formatRoleLabel(entry.role)}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="section-label">Membros visíveis</p>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {members.length}
              </span>
            </div>
            <div className="grid gap-2">
              {members.length ? (
                members.map((member) => (
                  <UtilityPanel key={member.id} className="rounded-xl px-3.5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{member.nickname}</p>
                        <p className="truncate text-xs uppercase tracking-[0.16em] text-muted">
                          {formatRoleLabel(member.role)}
                          {member.characterName ? ` · ${member.characterName}` : ''}
                        </p>
                      </div>
                      {member.role === 'gm' ? <Shield className="mt-0.5 size-4 text-sky-200" /> : <Users className="mt-0.5 size-4 text-soft" />}
                    </div>
                  </UtilityPanel>
                ))
              ) : (
                <EmptyState title="Sem presença ao vivo." body="Os membros aparecem aqui quando entram na mesa." />
              )}
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
          <Avatar src={user?.avatarUrl || undefined} name={user?.displayName || user?.username || 'Usuário'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.displayName || 'Usuário'}</p>
            <p className="truncate text-xs uppercase tracking-[0.16em] text-muted">@{user?.username}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">{session.nickname}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          <Button variant="secondary" onClick={onOpenProfile}>
            Minha conta
          </Button>
          <Button variant="secondary" onClick={onLeave}>
            Sair da mesa
          </Button>
          <Button variant="ghost" onClick={onSignOut}>
            Encerrar sessão
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MesaLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  const { user, signOut } = useAuth();
  const { mobileNavOpen, setMobileNavOpen } = useMesaShellStore();
  const { isReady, online, tables, switchTable, connectToInvite, leaveCurrentTable } = useWorkspace();
  const attemptRef = useRef('');
  const [openError, setOpenError] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);
  const currentSection = getMesaSectionFromPath(location.pathname);
  const accessError = useMemo(() => {
    if (!isReady || !slug) return '';
    if (online.session?.tableSlug === slug) return '';
    if (inviteToken) return '';
    if (!tables.some((table) => table.slug === slug)) {
      return 'Você não participa desta mesa ou o convite não está mais válido.';
    }
    return '';
  }, [inviteToken, isReady, online.session?.tableSlug, slug, tables]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, setMobileNavOpen]);

  useEffect(() => {
    attemptRef.current = '';
    setOpenError('');
  }, [inviteToken, slug]);

  useEffect(() => {
    if (!isReady || !slug || online.session?.tableSlug === slug || accessError) return;

    const attemptKey = `${slug}|${inviteToken || ''}|${tables.map((table) => table.slug).join(',')}|${retryNonce}`;
    if (attemptRef.current === attemptKey) return;
    attemptRef.current = attemptKey;
    setOpenError('');

    void (async () => {
      try {
        if (inviteToken) {
          const joinedSession = await connectToInvite(window.location.href, user?.displayName || user?.username || 'Feiticeiro');
          if (!joinedSession) {
            setOpenError('A mesa não respondeu com uma sessão válida para este convite.');
          }
          return;
        }

        const nextSession = await switchTable(slug);
        if (!nextSession) {
          setOpenError('A mesa não respondeu com uma sessão válida para esta rota.');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível abrir a mesa solicitada.';
        setOpenError(message);
        toast.error(message);
      }
    })();
  }, [accessError, connectToInvite, inviteToken, isReady, online.session?.tableSlug, retryNonce, slug, switchTable, tables, user?.displayName, user?.username]);

  const session = online.session?.tableSlug === slug ? online.session : null;
  const table = online.session?.tableSlug === slug ? online.table : null;
  const currentTableSummary = tables.find((item) => item.slug === slug) || tables.find((item) => item.slug === session?.tableSlug) || null;
  const members = useMemo(() => (online.members.length ? online.members : table?.memberships || []).slice(0, 6), [online.members, table?.memberships]);
  const terminalAccessError = openError || accessError;

  const handleLeaveTable = async () => {
    try {
      await leaveCurrentTable();
      navigate('/mesas');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível sair desta mesa.');
    }
  };

  const handleSwitchTable = (nextSlug: string) => {
    void switchTable(nextSlug)
      .then((nextSession) => {
        if (nextSession) {
          navigate(`/mesa/${nextSession.tableSlug}`);
        }
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Não foi possível trocar de mesa.');
      });
  };

  const handleSignOut = () => {
    signOut();
  };

  if (!isReady || (!session && !terminalAccessError)) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-xl rounded-2xl p-8 text-center">
          <LoaderCircle className="mx-auto size-10 animate-spin text-sky-200" />
          <h1 className="mt-5 font-display text-4xl text-white">Carregando a mesa</h1>
          {openError ? <p className="mt-4 text-sm text-rose-200">{openError}</p> : null}
          <p className="mt-3 text-sm leading-6 text-soft">Carregando permissões, membros e estado da campanha.</p>
        </Panel>
      </div>
    );
  }

  if (!session || !table) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-2xl rounded-2xl p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Mesa indisponível</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-white">Não foi possível abrir /mesa/{slug}</h1>
          <div className="mt-4 flex max-w-2xl gap-3 rounded-2xl border border-rose-300/18 bg-rose-500/10 px-4 py-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-rose-200" />
            <div className="text-sm leading-6 text-soft">
              <p>{terminalAccessError || 'Você precisa participar da mesa ou usar um convite válido.'}</p>
              {online.error && online.error !== terminalAccessError ? <p className="mt-2 text-rose-200">{online.error}</p> : null}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => navigate('/mesas')}>Voltar ao hub</Button>
            <Button
              variant="secondary"
              onClick={() => {
                attemptRef.current = '';
                setOpenError('');
                setRetryNonce((value) => value + 1);
              }}
            >
              Tentar novamente
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  const activeSystem = getGameSystem(table.systemKey);

  return (
    <div className={cn('relative min-h-screen overflow-hidden', activeSystem.themeClassName)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(87,187,255,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(143,228,255,0.06),transparent_16%),linear-gradient(180deg,rgba(3,7,12,0.7),rgba(4,8,15,0.94))]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1840px] grid-cols-1 gap-5 px-4 py-4 xl:grid-cols-[318px_minmax(0,1fr)] xl:px-6 xl:py-5">
        <aside className="app-sidebar-shell hidden xl:flex xl:min-h-[calc(100svh-2.5rem)] xl:flex-col">
          <MesaSidebarContent
            table={table}
            session={session}
            members={members}
            slug={slug}
            user={user}
            currentTableSummary={currentTableSummary}
            tables={tables}
            onSwitchTable={handleSwitchTable}
            onLeave={() => void handleLeaveTable()}
            onOpenProfile={() => navigate('/perfil')}
            onSignOut={handleSignOut}
          />
        </aside>

        <div className="flex min-h-screen flex-col gap-5 xl:min-h-[calc(100svh-2.5rem)]">
          <header className="app-topbar sticky top-4 z-30">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <button className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-3 text-soft transition hover:text-white xl:hidden">
                      <Menu className="size-5" />
                      <span className="sr-only">Abrir navegação</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[min(88vw,380px)] p-4">
                    <MesaSidebarContent
                      table={table}
                      session={session}
                      members={members}
                      slug={slug}
                      user={user}
                      currentTableSummary={currentTableSummary}
                      tables={tables}
                      onSwitchTable={handleSwitchTable}
                      onLeave={() => void handleLeaveTable()}
                      onOpenProfile={() => {
                        setMobileNavOpen(false);
                        navigate('/perfil');
                      }}
                      onSignOut={() => {
                        setMobileNavOpen(false);
                        handleSignOut();
                      }}
                      onNavigate={() => setMobileNavOpen(false)}
                    />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{activeSystem.name}</p>
                  <h1 className="mt-2 text-balance font-display text-4xl leading-none text-white sm:text-5xl">
                    {MESA_SECTION_LABELS[currentSection]}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-soft">{sectionDescriptions[currentSection]}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <UtilityPanel className="rounded-2xl px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesa</p>
                  <p className="mt-2 text-sm font-semibold text-white">{table.name}</p>
                </UtilityPanel>
                <UtilityPanel className="rounded-2xl px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
                  <p className="mt-2 text-sm font-semibold text-white">{currentTableSummary?.status || table.currentSession?.status || 'Sem sessão'}</p>
                </UtilityPanel>
                <UtilityPanel className="rounded-2xl px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Presença</p>
                  <p className="mt-2 text-sm font-semibold text-white">{members.length} visíveis</p>
                </UtilityPanel>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => navigate('/mesas')}>
                    Hub
                  </Button>
                  <Button onClick={() => navigate(`/mesa/${slug}/configuracoes`)}>
                    Configurações
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="app-content-shell min-h-0 flex-1 px-4 py-4 sm:px-6 xl:px-8">
            <AnimatePresence mode="wait">
              <motion.main
                key={location.pathname + location.search}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="page-grid pb-8"
              >
                <Outlet />
              </motion.main>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
