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
  SlidersHorizontal,
  Sparkles,
  Swords,
  Users
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
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
                'group flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold transition',
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
  onSignOut: () => void;
  showActions?: boolean;
}) {
  return (
    <>
      <Panel className="rounded-[28px] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Servidor atual</p>
        <h2 className="mt-2 font-display text-3xl leading-none text-white">{table.name}</h2>
        <p className="mt-3 text-sm text-soft">
          {table.meta.seriesName || 'Sem série'} · {table.meta.campaignName || 'Sem campanha'}
        </p>
        <div className="mt-5 grid gap-2">
          <Link to="/mesas" className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-soft transition hover:text-white">
            Voltar ao portal de mesas
          </Link>
          <Link
            to={`/mesa/${slug}/configuracoes`}
            className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-soft transition hover:text-white"
          >
            Abrir configurações
          </Link>
        </div>
      </Panel>

      <Panel className="rounded-[28px] p-5">
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
              <UtilityPanel key={member.id} className="rounded-[20px] px-4 py-3">
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

      <Panel className="rounded-[28px] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Contexto da sessão</p>
        <div className="mt-4 grid gap-3">
          <UtilityPanel className="rounded-[20px] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Seu papel</p>
            <p className="mt-2 text-base font-semibold text-white">{formatRoleLabel(session.role)}</p>
          </UtilityPanel>
          <UtilityPanel className="rounded-[20px] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Nickname de presença</p>
            <p className="mt-2 text-base font-semibold text-white">{session.nickname}</p>
          </UtilityPanel>
            <UtilityPanel className="rounded-[20px] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
              <p className="mt-2 text-base font-semibold text-white">{currentTableSummary?.status || table.currentSession?.status || 'Sem sessão'}</p>
            </UtilityPanel>
          <UtilityPanel className="rounded-[20px] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Último sync</p>
            <p className="mt-2 text-base font-semibold text-white">{formatRelativeDate(table.updatedAt)}</p>
          </UtilityPanel>
          <UtilityPanel className="rounded-[20px] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Snapshots</p>
            <p className="mt-2 text-base font-semibold text-white">{table.snapshots.length}</p>
          </UtilityPanel>
        </div>
      </Panel>

      {showActions ? (
        <Panel className="rounded-[28px] p-5">
          <div className="flex items-start gap-3">
            <Avatar name={user?.displayName || user?.username || 'Usuário'} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.displayName || 'Usuário'}</p>
              <p className="truncate text-xs uppercase tracking-[0.18em] text-muted">@{user?.username}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
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
  const { mobileNavOpen, utilityOpen, setMobileNavOpen, setUtilityOpen } = useMesaShellStore();
  const { isReady, online, tables, switchTable, connectToInvite, leaveCurrentTable } = useWorkspace();
  const attemptRef = useRef('');
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
    setUtilityOpen(false);
  }, [location.pathname, setMobileNavOpen, setUtilityOpen]);

  useEffect(() => {
    if (!isReady || !slug || online.session?.tableSlug === slug || accessError) return;

    const attemptKey = `${slug}|${inviteToken || ''}|${tables.map((table) => table.slug).join(',')}`;
    if (attemptRef.current === attemptKey) return;
    attemptRef.current = attemptKey;

    void (async () => {
      try {
        if (inviteToken) {
          await connectToInvite(window.location.href, user?.displayName || user?.username || 'Feiticeiro');
          return;
        }

        await switchTable(slug);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Não foi possível abrir a mesa solicitada.');
      }
    })();
  }, [accessError, connectToInvite, inviteToken, isReady, online.session?.tableSlug, slug, switchTable, tables, user?.displayName, user?.username]);

  const session = online.session?.tableSlug === slug ? online.session : null;
  const table = online.session?.tableSlug === slug ? online.table : null;
  const currentTableSummary = tables.find((item) => item.slug === slug) || tables.find((item) => item.slug === session?.tableSlug) || null;
  const members = useMemo(() => (online.members.length ? online.members : table?.memberships || []).slice(0, 6), [online.members, table?.memberships]);

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

  if (!isReady || (!session && !accessError)) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-xl rounded-[30px] p-8 text-center">
          <LoaderCircle className="mx-auto size-10 animate-spin text-sky-200" />
          <h1 className="mt-5 font-display text-4xl text-white">Carregando a mesa</h1>
          <p className="mt-3 text-sm leading-6 text-soft">Sincronizando permissão, membros e estado compartilhado para abrir a shell contextual.</p>
        </Panel>
      </div>
    );
  }

  if (!session || !table) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-2xl rounded-[30px] p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Mesa indisponível</p>
          <h1 className="mt-3 font-display text-5xl leading-none text-white">Não foi possível abrir /mesa/{slug}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-soft">
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(87,187,255,0.16),transparent_24%),radial-gradient(circle_at_left,rgba(78,140,255,0.12),transparent_22%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,12,0.65),rgba(4,8,15,0.92))]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1760px] grid-cols-1 gap-5 px-4 py-4 xl:grid-cols-[280px_minmax(0,1fr)_320px] xl:px-6 xl:py-5">
        <aside className="surface-shell hidden rounded-[30px] xl:flex xl:h-[calc(100vh-2.5rem)] xl:flex-col xl:p-5">
          <div className="flex items-center justify-between gap-3">
            <LogoLockup />
            <span className="rounded-full border border-sky-300/18 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
              {formatRoleLabel(session.role)}
            </span>
          </div>

          <div className="mt-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-sky-300/20 hover:bg-white/[0.06]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Mesa atual</p>
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
                      <p className="text-xs text-soft">{formatRoleLabel(entry.role)}</p>
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

          <div className="mt-6 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-2">
              <MesaNavigation slug={slug} />
            </ScrollArea>
          </div>

          <UtilityPanel className="rounded-[24px] p-4">
            <div className="flex items-start gap-3">
              <Avatar name={user?.displayName || user?.username || 'Usuário'} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.displayName || 'Usuário'}</p>
                <p className="truncate text-xs uppercase tracking-[0.18em] text-muted">@{user?.username}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" onClick={() => void handleLeaveTable()}>
                Sair da mesa
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>
                Encerrar sessão
              </Button>
            </div>
          </UtilityPanel>
        </aside>

        <div className="flex min-h-screen flex-col gap-5">
          <header className="surface-shell sticky top-4 z-20 rounded-[28px] px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <button className="inline-flex rounded-[18px] border border-white/10 bg-white/[0.04] p-3 text-soft transition hover:text-white xl:hidden">
                      <Menu className="size-5" />
                      <span className="sr-only">Abrir navegação</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <div className="pr-8">
                      <LogoLockup />
                    </div>
                    <div className="mt-6">
                      <MesaNavigation slug={slug} onNavigate={() => setMobileNavOpen(false)} />
                    </div>
                    <div className="mt-6 grid gap-2">
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          await handleLeaveTable();
                          setMobileNavOpen(false);
                        }}
                      >
                        Sair da mesa
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setMobileNavOpen(false);
                          handleSignOut();
                        }}
                      >
                        Encerrar sessão
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Mesa atual</p>
                  <h1 className="mt-2 font-display text-4xl leading-none text-white text-balance">
                    {MESA_SECTION_LABELS[currentSection]} <span className="text-sky-200">/ {table.name}</span>
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-soft">{sectionDescriptions[currentSection]}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-stretch gap-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <UtilityPanel className="rounded-[20px] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
                    <p className="mt-2 text-sm font-semibold text-white">{currentTableSummary?.status || table.currentSession?.status || 'Sem sessão'}</p>
                  </UtilityPanel>
                  <UtilityPanel className="rounded-[20px] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Membros</p>
                    <p className="mt-2 text-sm font-semibold text-white">{members.length} visíveis</p>
                  </UtilityPanel>
                  <UtilityPanel className="rounded-[20px] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Último sync</p>
                    <p className="mt-2 text-sm font-semibold text-white">{formatRelativeDate(table.updatedAt)}</p>
                  </UtilityPanel>
                </div>

                <Sheet open={utilityOpen} onOpenChange={setUtilityOpen}>
                  <SheetTrigger asChild>
                    <button className="inline-flex rounded-[18px] border border-white/10 bg-white/[0.04] p-3 text-soft transition hover:text-white xl:hidden">
                      <SlidersHorizontal className="size-5" />
                      <span className="sr-only">Abrir utilidades da mesa</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="overflow-y-auto">
                    <div className="grid gap-4 pr-8">
                      <MesaUtilityContent
                        table={table}
                        session={session}
                        members={members}
                        slug={slug}
                        user={user}
                        currentTableSummary={currentTableSummary}
                        onLeave={() => void handleLeaveTable()}
                        onSignOut={handleSignOut}
                        showActions
                      />
                    </div>
                  </SheetContent>
                </Sheet>
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

        <aside className="page-right-rail hidden xl:grid">
          <MesaUtilityContent
            table={table}
            session={session}
            members={members}
            slug={slug}
            user={user}
            currentTableSummary={currentTableSummary}
            onLeave={() => void handleLeaveTable()}
            onSignOut={handleSignOut}
          />
        </aside>
      </div>
    </div>
  );
}
