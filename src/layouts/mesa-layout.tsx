import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftRight,
  BookOpenText,
  CalendarClock,
  ChevronDown,
  DoorOpen,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
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
  overview: 'Resumo vivo da campanha, status atual e leitura rápida da sessão.',
  sessao: 'Episódio, presença, andamento da sessão e histórico recente da mesa.',
  fichas: 'Roster, ficha ativa e operação de personagens dentro da mesa.',
  rolagens: 'Composer de testes, TN e histórico compartilhado da sessão.',
  ordem: 'Fluxo tático de iniciativa, turnos e controle de confronto.',
  livro: 'Compêndio da mesa com busca, glossário e referência editorial.',
  membros: 'Pessoas, convites, códigos e acesso ao servidor de campanha.',
  configuracoes: 'Metadados, snapshots, preferências e administração da mesa.'
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
                'group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition',
                isActive ? 'bg-sky-400/14 text-white' : 'text-soft hover:bg-white/[0.05] hover:text-white'
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function MesaUtilityContent({
  table,
  session,
  members,
  slug,
  user,
  currentTableSummary,
  onLeave,
  onOpenProfile,
  onSignOut,
  showActions = false
}: {
  table: TableState;
  session: TableSession;
  members: PresenceMember[];
  slug: string;
  user: AuthUser | null;
  currentTableSummary: { status?: string } | null;
  onLeave: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  showActions?: boolean;
}) {
  return (
    <>
      <Panel className="rounded-lg p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Servidor atual</p>
        <h2 className="mt-2 font-display text-3xl leading-none text-white">{table.name}</h2>
        <p className="mt-3 text-sm text-soft">
          {table.meta.seriesName || 'Sem série'} · {table.meta.campaignName || 'Sem campanha'}
        </p>
        <div className="mt-5 grid gap-2">
          <Link to="/mesas" className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-soft transition hover:text-white">
            Voltar ao Project Nexus
          </Link>
          <Link
            to={`/mesa/${slug}/configuracoes`}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-soft transition hover:text-white"
          >
            Abrir configurações
          </Link>
        </div>
      </Panel>

      <Panel className="rounded-lg p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Presença</p>
            <h2 className="mt-2 font-display text-3xl leading-none text-white">Quem está aqui</h2>
          </div>
          <span className="rounded-full border border-sky-300/18 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
            {members.length}
          </span>
        </div>
        <div className="mt-5 grid gap-3">
          {members.length ? (
            members.map((member) => (
              <UtilityPanel key={member.id} className="rounded-lg px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{member.nickname}</p>
                    <p className="truncate text-xs uppercase tracking-[0.18em] text-muted">
                      {formatRoleLabel(member.role)}
                      {member.characterName ? ` · ${member.characterName}` : ''}
                    </p>
                  </div>
                  {member.role === 'gm' ? <Shield className="size-4 text-sky-200" /> : <Users className="size-4 text-soft" />}
                </div>
              </UtilityPanel>
            ))
          ) : (
            <EmptyState title="Sem presença ao vivo." body="A utility rail mostra membros online assim que outros clientes entram nesta mesa." />
          )}
        </div>
      </Panel>

      <Panel className="rounded-lg p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Contexto da sessão</p>
        <div className="mt-4 grid gap-3">
          <UtilityPanel className="rounded-lg px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Seu papel</p>
            <p className="mt-2 text-base font-semibold text-white">{formatRoleLabel(session.role)}</p>
          </UtilityPanel>
          <UtilityPanel className="rounded-lg px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Nickname de presença</p>
            <p className="mt-2 text-base font-semibold text-white">{session.nickname}</p>
          </UtilityPanel>
            <UtilityPanel className="rounded-lg px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
              <p className="mt-2 text-base font-semibold text-white">{currentTableSummary?.status || table.currentSession?.status || 'Sem sessão'}</p>
            </UtilityPanel>
          <UtilityPanel className="rounded-lg px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Último sync</p>
            <p className="mt-2 text-base font-semibold text-white">{formatRelativeDate(table.updatedAt)}</p>
          </UtilityPanel>
          <UtilityPanel className="rounded-lg px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Snapshots</p>
            <p className="mt-2 text-base font-semibold text-white">{table.snapshots.length}</p>
          </UtilityPanel>
        </div>
      </Panel>

      {showActions ? (
        <Panel className="rounded-lg p-5">
          <div className="flex items-start gap-3">
            <Avatar src={user?.avatarUrl || undefined} name={user?.displayName || user?.username || 'Usuário'} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.displayName || 'Usuário'}</p>
              <p className="truncate text-xs uppercase tracking-[0.18em] text-muted">@{user?.username}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
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
        </Panel>
      ) : null}
    </>
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
            setOpenError('A mesa nao respondeu com uma sessao valida para este convite.');
          }
          return;
        }

        const nextSession = await switchTable(slug);
        if (!nextSession) {
          setOpenError('A mesa nao respondeu com uma sessao valida para esta rota.');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Nao foi possivel abrir a mesa solicitada.';
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

  const handleSignOut = () => {
    signOut();
  };

  if (!isReady || (!session && !terminalAccessError)) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-xl rounded-lg p-8 text-center">
          <LoaderCircle className="mx-auto size-10 animate-spin text-sky-200" />
          <h1 className="mt-5 font-display text-4xl text-white">Carregando a mesa</h1>
          {openError ? <p className="mt-4 text-sm text-rose-200">{openError}</p> : null}
          <p className="mt-3 text-sm leading-6 text-soft">Sincronizando permissão, membros e estado compartilhado para abrir a shell contextual.</p>
        </Panel>
      </div>
    );
  }

  if (!session || !table) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-2xl rounded-lg p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Mesa indisponivel</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-white">Nao foi possivel abrir /mesa/{slug}</h1>
          <div className="mt-4 flex max-w-2xl gap-3 rounded-lg border border-rose-300/18 bg-rose-500/10 px-4 py-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-rose-200" />
            <div className="text-sm leading-6 text-soft">
              <p>{terminalAccessError || 'Esta rota precisa de uma membership valida ou de um convite com token ainda ativo.'}</p>
              {online.error && online.error !== terminalAccessError ? <p className="mt-2 text-rose-200">{online.error}</p> : null}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => navigate('/mesas')}>Voltar ao portal</Button>
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

  /*
  if (!session || !table) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-2xl rounded-lg p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Mesa indisponível</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-white">Não foi possível abrir /mesa/{slug}</h1>
          <div className="mt-4 flex max-w-2xl gap-3 rounded-lg border border-rose-300/18 bg-rose-500/10 px-4 py-4">
            {accessError || 'Esta rota precisa de uma membership válida ou de um convite com token ainda ativo.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => navigate('/mesas')}>Voltar ao portal</Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </Panel>
      </div>
    );
  }
  */

  const activeSystem = getGameSystem(table.systemKey);

  return (
    <div className={cn('relative min-h-screen overflow-hidden', activeSystem.themeClassName)}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,0.65),rgba(4,8,15,0.92))]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1860px] grid-cols-1 gap-5 px-4 py-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:px-6 xl:py-5">
        <aside className="surface-shell hidden rounded-lg xl:sticky xl:top-5 xl:flex xl:h-[calc(100svh-2.5rem)] xl:min-h-0 xl:flex-col xl:p-5">
          <div className="flex items-center justify-between gap-3">
            <LogoLockup variant="system" systemKey={table.systemKey} />
            <span className="rounded-full border border-sky-300/18 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
              {formatRoleLabel(session.role)}
            </span>
          </div>

          <div className="mt-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-sky-300/20 hover:bg-white/[0.06]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{activeSystem.name}</p>
                    <p className="mt-2 text-base font-semibold text-white">{table.name}</p>
                  </div>
                  <ChevronDown className="size-4 text-soft" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {tables.map((entry) => (
                  <DropdownMenuItem
                    key={entry.id}
                    onClick={() => {
                      void switchTable(entry.slug).then((nextSession) => {
                        if (nextSession) navigate(`/mesa/${nextSession.tableSlug}`);
                      });
                    }}
                  >
                    <ArrowLeftRight className="size-4" />
                    <div>
                      <p className="font-semibold text-white">{entry.name}</p>
                      <p className="text-xs text-soft">
                        {getGameSystem(entry.systemKey).name} · {formatRoleLabel(entry.role)}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => navigate('/mesas')}>
                  <DoorOpen className="size-4" />
                  <span>Portal de mesas</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-6 min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-2">
              <div className="grid gap-4">
                <MesaNavigation slug={slug} />
                <MesaUtilityContent
                  table={table}
                  session={session}
                  members={members}
                  slug={slug}
                  user={user}
                  currentTableSummary={currentTableSummary}
                  onLeave={() => void handleLeaveTable()}
                  onOpenProfile={() => navigate('/perfil')}
                  onSignOut={handleSignOut}
                  showActions
                />
              </div>
            </ScrollArea>
          </div>

        </aside>

        <div className="flex min-h-screen flex-col gap-5">
          <header className="surface-shell sticky top-4 z-20 rounded-lg px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <button className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-3 text-soft transition hover:text-white xl:hidden">
                      <Menu className="size-5" />
                      <span className="sr-only">Abrir navegação</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <div className="pr-8">
                      <LogoLockup variant="system" systemKey={table.systemKey} />
                    </div>
                    <div className="mt-6 grid gap-4">
                      <MesaNavigation slug={slug} onNavigate={() => setMobileNavOpen(false)} />
                      <MesaUtilityContent
                        table={table}
                        session={session}
                        members={members}
                        slug={slug}
                        user={user}
                        currentTableSummary={currentTableSummary}
                        onLeave={() => void handleLeaveTable()}
                        onOpenProfile={() => {
                          setMobileNavOpen(false);
                          navigate('/perfil');
                        }}
                        onSignOut={() => {
                          setMobileNavOpen(false);
                          handleSignOut();
                        }}
                        showActions
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{activeSystem.name}</p>
                  <h1 className="mt-2 font-display text-4xl leading-none text-white text-balance">
                    {MESA_SECTION_LABELS[currentSection]} <span className="text-sky-200">/ {table.name}</span>
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-soft">{sectionDescriptions[currentSection]}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-stretch gap-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <UtilityPanel className="rounded-lg px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
                    <p className="mt-2 text-sm font-semibold text-white">{currentTableSummary?.status || table.currentSession?.status || 'Sem sessão'}</p>
                  </UtilityPanel>
                  <UtilityPanel className="rounded-lg px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Membros</p>
                    <p className="mt-2 text-sm font-semibold text-white">{members.length} visíveis</p>
                  </UtilityPanel>
                  <UtilityPanel className="rounded-lg px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Último sync</p>
                    <p className="mt-2 text-sm font-semibold text-white">{formatRelativeDate(table.updatedAt)}</p>
                  </UtilityPanel>
                </div>

              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname + location.search}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="min-h-0"
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
