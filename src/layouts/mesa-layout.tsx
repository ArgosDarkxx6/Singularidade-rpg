import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpenText,
  DoorOpen,
  Dices,
  House,
  LoaderCircle,
  Menu,
  ScrollText,
  Settings,
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
import { Panel, UtilityPanel } from '@components/ui/panel';
import { ScrollArea } from '@components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@components/ui/sheet';
import { useAuth } from '@features/auth/hooks/use-auth';
import { MESA_NAV_ITEMS, buildMesaSectionPath, getMesaSectionFromPath } from '@features/mesa/lib/mesa-routing';
import { useMesaShellStore } from '@features/mesa/store/use-mesa-shell-store';
import { CharacterRosterPanel } from '@features/sheets/components/character-roster-panel';
import { getGameSystem } from '@features/systems/registry';
import { useMesaShell } from '@features/workspace/hooks/use-workspace-segments';
import { cn } from '@lib/utils';
import type { AuthUser, InvitePreview, MesaSection, PresenceMember, TableSession, TableState } from '@/types/domain';

const sectionIcons: Record<MesaSection, typeof House> = {
  overview: House,
  sessao: House,
  fichas: ScrollText,
  rolagens: Dices,
  ordem: Swords,
  livro: BookOpenText,
  membros: Users,
  configuracoes: Settings
};

const MOBILE_PRIMARY_SECTIONS: MesaSection[] = ['overview', 'fichas', 'rolagens', 'ordem'];

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Player';
  return 'Viewer';
}

function MesaNavigation({
  slug,
  role,
  compact = false,
  onNavigate
}: {
  slug: string;
  role: 'gm' | 'player' | 'viewer';
  compact?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-2">
      {MESA_NAV_ITEMS.filter((item) => role !== 'viewer' || item.section !== 'fichas').map((item) => {
        const Icon = sectionIcons[item.section];
        return (
          <NavLink
            key={item.section}
            to={item.href(slug)}
            onClick={onNavigate}
            aria-label={item.label}
            className={({ isActive }) =>
              cn(
                'rail-nav-link group flex items-center gap-3 text-sm font-semibold transition',
                isActive ? 'border border-blue-300/18 bg-blue-500/14 text-white' : 'border border-transparent text-soft hover:border-white/8 hover:bg-white/[0.04] hover:text-white'
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span className={cn('min-w-0 flex-1 truncate', compact && 'rail-label')}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function MesaMobileBottomNav({
  slug,
  currentSection,
  role,
  onOpenMore
}: {
  slug: string;
  currentSection: MesaSection;
  role: 'gm' | 'player' | 'viewer';
  onOpenMore: () => void;
}) {
  const sections = MOBILE_PRIMARY_SECTIONS.filter((section) => role !== 'viewer' || section !== 'fichas');
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(7,12,21,0.96)] px-2 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-2 backdrop-blur sm:hidden">
      <ul className="mx-auto grid max-w-[620px] grid-cols-5 gap-1.5">
        {sections.map((section) => {
          const navItem = MESA_NAV_ITEMS.find((item) => item.section === section);
          if (!navItem) return null;
          const Icon = sectionIcons[section];
          const isActive = currentSection === section;
          return (
            <li key={section}>
              <NavLink
                to={buildMesaSectionPath(slug, section)}
                className={cn(
                  'flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border text-[11px] font-semibold transition',
                  isActive ? 'border-blue-300/24 bg-blue-500/14 text-white' : 'border-white/8 bg-white/[0.03] text-soft hover:text-white'
                )}
                aria-label={navItem.label}
              >
                <Icon className="size-4" />
                <span>{navItem.label}</span>
              </NavLink>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onOpenMore}
            className="flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-lg border border-white/8 bg-white/[0.03] text-[11px] font-semibold text-soft transition hover:text-white"
            aria-label="Mais"
          >
            <Menu className="size-4" />
            <span>Mais</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

function MesaSidebarContent({
  table,
  session,
  members,
  slug,
  user,
  tables,
  currentSection,
  onSwitchTable,
  onLeave,
  onOpenProfile,
  onSignOut,
  compact = false,
  onNavigate
}: {
  table: TableState;
  session: TableSession;
  members: PresenceMember[];
  slug: string;
  user: AuthUser | null;
  tables: Array<{ id: string; slug: string; name: string; systemKey: string; role: 'gm' | 'player' | 'viewer'; status?: string }>;
  currentSection: MesaSection;
  onSwitchTable: (nextSlug: string) => void;
  onLeave: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const activeSystem = getGameSystem(table.systemKey);
  const otherTables = tables.filter((entry) => entry.slug !== slug).slice(0, 4);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/mesa/${slug}`}
          onClick={onNavigate}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white transition hover:border-white/18 hover:bg-white/[0.06]"
          aria-label={table.name}
        >
          <LogoLockup compact variant="system" systemKey={table.systemKey} className="scale-[0.82]" />
        </Link>
        <span className={cn('rail-expanded-block rounded-lg border border-blue-300/16 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white', compact && 'rail-expanded-block')}>
          {formatRoleLabel(session.role)}
        </span>
      </div>

      <ScrollArea className="mt-6 min-h-0 flex-1 pr-1">
        <div className="grid gap-3 pb-4">
          <MesaNavigation slug={slug} role={session.role} compact={compact} onNavigate={onNavigate} />

          <div className={cn('grid gap-3', compact ? 'rail-expanded-block' : '')}>
            <Panel className="p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{activeSystem.name}</p>
              <h2 className="mt-1.5 text-sm font-semibold text-white">{table.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                {table.currentSession?.status || 'Planejamento'}
              </p>
            </Panel>

            {members.length ? (
              <Panel className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Presença</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {members.slice(0, 5).map((member) => (
                    <Avatar key={member.id} name={member.nickname} size="sm" />
                  ))}
                </div>
              </Panel>
            ) : null}

            {otherTables.length ? (
              <Panel className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Trocar mesa</p>
                <div className="mt-3 grid gap-2">
                  {otherTables.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        onSwitchTable(entry.slug);
                        onNavigate?.();
                      }}
                      className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-blue-300/16 hover:bg-white/[0.05]"
                    >
                      <p className="truncate text-sm font-semibold text-white">{entry.name}</p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted">
                        {formatRoleLabel(entry.role)}
                      </p>
                    </button>
                  ))}
                </div>
              </Panel>
            ) : null}

            {session.role === 'gm' && currentSection === 'fichas' ? (
              <CharacterRosterPanel variant="rail" onNavigate={onNavigate} />
            ) : null}
          </div>
        </div>
      </ScrollArea>

      <div className="mt-auto grid gap-3">
        <Panel className="border border-white/7 bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatarUrl || undefined} name={user?.displayName || user?.username || 'Usuário'} size="sm" />
            <div className="rail-label min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.displayName || 'Usuário'}</p>
              <p className="truncate text-xs uppercase tracking-[0.16em] text-muted">{session.nickname}</p>
            </div>
          </div>
          <div className={cn('mt-2 grid gap-1.5', compact ? 'rail-expanded-block' : '')}>
            <Button size="sm" variant="secondary" onClick={onOpenProfile}>
              Conta
            </Button>
            <Button size="sm" variant="secondary" onClick={onLeave}>
              <DoorOpen className="size-4" />
              Sair da mesa
            </Button>
            <Button size="sm" variant="ghost" onClick={onSignOut}>
              Encerrar sessão
            </Button>
          </div>
        </Panel>
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
  const { isReady, online, tables, switchTable, connectToInvite, previewInvite, leaveCurrentTable } = useMesaShell();
  const attemptRef = useRef('');
  const [openError, setOpenError] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null);
  const [invitePreviewLoading, setInvitePreviewLoading] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
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
    setInvitePreview(null);
  }, [inviteToken, slug]);

  useEffect(() => {
    if (!isReady || !inviteToken || online.session?.tableSlug === slug) return;
    let disposed = false;
    setInvitePreviewLoading(true);
    setOpenError('');

    void previewInvite(inviteToken)
      .then((preview) => {
        if (disposed) return;
        if (!preview) {
          setOpenError('Convite inválido ou expirado.');
          return;
        }
        setInvitePreview(preview);
      })
      .catch((error) => {
        if (!disposed) {
          setOpenError(error instanceof Error ? error.message : 'Não foi possível carregar o convite.');
        }
      })
      .finally(() => {
        if (!disposed) {
          setInvitePreviewLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, [inviteToken, isReady, online.session?.tableSlug, previewInvite, slug]);

  useEffect(() => {
    if (!isReady || !slug || online.session?.tableSlug === slug || accessError) return;

    const attemptKey = `${slug}|${inviteToken || ''}|${tables.map((table) => table.slug).join(',')}|${retryNonce}`;
    if (attemptRef.current === attemptKey) return;
    attemptRef.current = attemptKey;
    setOpenError('');

    void (async () => {
      try {
        if (inviteToken) return;
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
  }, [accessError, inviteToken, isReady, online.session?.tableSlug, retryNonce, slug, switchTable, tables]);

  const session = online.session?.tableSlug === slug ? online.session : null;
  const table = online.session?.tableSlug === slug ? online.table : null;
  const currentTableSummary = tables.find((item) => item.slug === slug) || tables.find((item) => item.slug === session?.tableSlug) || null;
  const members = useMemo(() => (online.members.length ? online.members : table?.memberships || []).slice(0, 6), [online.members, table?.memberships]);
  const terminalAccessError = openError || accessError;
  const shouldShowInvitePreview = Boolean(inviteToken && !session && !terminalAccessError);

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

  const handleAcceptInvite = async () => {
    if (!inviteToken) return;
    setAcceptingInvite(true);
    setOpenError('');
    try {
      const joinedSession = await connectToInvite(window.location.href, user?.displayName || user?.username || 'Jogador');
      if (!joinedSession) {
        setOpenError('A mesa não respondeu com uma sessão válida para este convite.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível aceitar este convite.';
      setOpenError(message);
      toast.error(message);
    } finally {
      setAcceptingInvite(false);
    }
  };

  if (!isReady || (!session && !terminalAccessError && !inviteToken)) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-lg p-5 text-center">
          <LoaderCircle className="mx-auto size-10 animate-spin text-accent" />
          <h1 className="mt-4 font-display text-2xl text-white">Carregando mesa</h1>
          {openError ? <p className="mt-3 text-sm text-rose-200">{openError}</p> : null}
          <p className="mt-3 text-sm leading-6 text-soft">Abrindo dados da mesa.</p>
        </Panel>
      </div>
    );
  }

  if (shouldShowInvitePreview) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-[720px] p-5">
          {invitePreviewLoading ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Convite</p>
              <h1 className="mt-2 font-display text-2xl text-white">Abrindo convite</h1>
              <p className="mt-3 text-sm leading-6 text-soft">Buscando dados da mesa.</p>
            </>
          ) : invitePreview ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Convite</p>
                <h1 className="mt-2 font-display text-2xl text-white sm:text-3xl">{invitePreview.tableName}</h1>
                <p className="mt-3 text-sm leading-6 text-soft">
                  {invitePreview.tableDescription || 'Mesa sem descrição pública.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip-accent inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                    {formatRoleLabel(invitePreview.role)}
                  </span>
                </div>
              </div>

              <Panel className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Entrar</p>
                <div className="mt-4 grid gap-2">
                  <Button disabled={acceptingInvite} onClick={() => void handleAcceptInvite()}>
                    {acceptingInvite ? 'Aceitando...' : 'Aceitar convite'}
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/mesas')}>
                    Voltar às mesas
                  </Button>
                </div>
              </Panel>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Convite</p>
              <h1 className="mt-2 font-display text-2xl text-white sm:text-3xl">Convite indisponível</h1>
              <p className="mt-3 text-sm leading-6 text-soft">Este link não está mais disponível para entrada.</p>
              <div className="mt-5">
                <Button variant="secondary" onClick={() => navigate('/mesas')}>
                  Voltar às mesas
                </Button>
              </div>
            </>
          )}
        </Panel>
      </div>
    );
  }

  if (!session || !table) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-2xl p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">Mesa indisponível</p>
          <h1 className="mt-3 font-display text-2xl leading-none text-white sm:text-3xl">Não foi possível abrir /mesa/{slug}</h1>
          <div className="mt-4 flex max-w-2xl gap-3 rounded-lg border border-rose-300/18 bg-rose-500/10 px-4 py-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-rose-200" />
            <div className="text-sm leading-6 text-soft">
              <p>{terminalAccessError || 'Você precisa participar da mesa ou usar um convite válido.'}</p>
              {online.error && online.error !== terminalAccessError ? <p className="mt-2 text-rose-200">{online.error}</p> : null}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => navigate('/mesas')}>Voltar às mesas</Button>
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
    <div className={cn('app-shell-root relative overflow-hidden', activeSystem.themeClassName)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(35,88,218,0.14),transparent_20%),radial-gradient(circle_at_top_right,rgba(16,30,66,0.2),transparent_22%),linear-gradient(180deg,rgba(5,9,16,0.98),rgba(3,6,11,0.99))]" />

      <div className="app-shell-grid relative mx-auto grid h-full max-w-[1840px] grid-cols-1 gap-3 px-3 py-3 xl:grid-cols-[min-content_minmax(0,1fr)] xl:px-4 xl:py-4">
        <aside className="app-sidebar-shell rail-shell hidden xl:flex xl:flex-col" data-shell-layer="rail" aria-label="Navegação lateral da mesa">
          <div className="rail-shell-content">
            <MesaSidebarContent
              table={table}
              session={session}
              members={members}
              slug={slug}
              user={user}
              tables={tables}
              currentSection={currentSection}
              onSwitchTable={handleSwitchTable}
              onLeave={() => void handleLeaveTable()}
              onOpenProfile={() => navigate('/conta')}
              onSignOut={signOut}
              compact
            />
          </div>
        </aside>

        <div className="app-main-column flex h-full min-h-0 flex-col gap-3">
          <header className="app-topbar" data-shell-layer="header">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <button className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-2 text-soft transition hover:text-white xl:hidden">
                      <Menu className="size-5" />
                      <span className="sr-only">Abrir navegação</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[min(88vw,360px)] border-white/10 bg-[rgba(6,11,20,0.98)] p-4">
                    <MesaSidebarContent
                      table={table}
                      session={session}
                      members={members}
                      slug={slug}
                      user={user}
                      tables={tables}
                      currentSection={currentSection}
                      onSwitchTable={handleSwitchTable}
                      onLeave={() => void handleLeaveTable()}
                      onOpenProfile={() => {
                        setMobileNavOpen(false);
                        navigate('/conta');
                      }}
                      onSignOut={() => {
                        setMobileNavOpen(false);
                        signOut();
                      }}
                      compact={false}
                      onNavigate={() => setMobileNavOpen(false)}
                    />
                  </SheetContent>
                </Sheet>

                <button
                  type="button"
                  onClick={() => navigate('/mesas')}
                  className="hidden rounded-lg border border-white/8 bg-white/[0.03] p-2 text-soft transition hover:text-white sm:inline-flex"
                  aria-label="Voltar às mesas"
                >
                  <ArrowLeft className="size-4" />
                </button>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesa ativa</p>
                  <h1 className="truncate font-display text-lg font-semibold text-white sm:text-xl">{table.name}</h1>
                </div>

                {table.currentSession?.episodeTitle ? (
                  <UtilityPanel className="hidden rounded-lg px-2.5 py-1.5 lg:flex">
                    <span className="text-xs font-semibold text-white">{table.currentSession.episodeTitle}</span>
                  </UtilityPanel>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <span className="chip-muted inline-flex rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {currentTableSummary?.status || table.currentSession?.status || 'Planejamento'}
                </span>
                <UtilityPanel className="hidden rounded-lg px-2.5 py-1.5 md:flex md:items-center md:gap-1.5">
                  {members.slice(0, 5).map((member) => (
                    <Avatar key={member.id} name={member.nickname} size="sm" className="size-8 text-xs" />
                  ))}
                  <span className="text-xs font-semibold text-soft">{members.length}</span>
                </UtilityPanel>
                {session.role === 'gm' ? (
                  <Button variant="secondary" onClick={() => navigate(`/mesa/${slug}?focus=membros`)}>
                    <Users className="size-4" />
                    Convidar
                  </Button>
                ) : null}
                <Button variant="ghost" onClick={() => navigate(`/mesa/${slug}/configuracoes`)}>
                  <Settings className="size-4" />
                  Mais
                </Button>
              </div>
            </div>
          </header>

          <div className="app-content-shell px-3 py-3 sm:px-4 xl:px-5" data-shell-layer="content" data-scroll-region="content">
            <AnimatePresence mode="wait">
              <motion.main
                key={location.pathname + location.search}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="page-grid pb-24 sm:pb-8"
              >
                <Outlet />
              </motion.main>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <MesaMobileBottomNav
        slug={slug}
        currentSection={currentSection}
        role={session.role}
        onOpenMore={() => setMobileNavOpen(true)}
      />
    </div>
  );
}
