import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftRight,
  BookOpenText,
  CalendarClock,
  Dices,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  ScrollText,
  Settings,
  Shield,
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
import { MESA_NAV_ITEMS, buildMesaSectionPath, getMesaSectionFromPath } from '@features/mesa/lib/mesa-routing';
import { useMesaShellStore } from '@features/mesa/store/use-mesa-shell-store';
import { CharacterRosterPanel } from '@features/sheets/components/character-roster-panel';
import { getGameSystem } from '@features/systems/registry';
import { useMesaShell } from '@features/workspace/hooks/use-workspace-segments';
import { MESA_SECTION_LABELS } from '@lib/domain/constants';
import { cn } from '@lib/utils';
import type { AuthUser, InvitePreview, MesaSection, PresenceMember, TableSession, TableState } from '@/types/domain';

const sectionIcons: Record<MesaSection, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  sessao: CalendarClock,
  fichas: ScrollText,
  rolagens: Dices,
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
    <nav className="grid gap-1.5">
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
                'rail-nav-link group flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-semibold transition',
                isActive ? 'bg-sky-400/14 text-white' : 'text-soft hover:bg-white/[0.05] hover:text-white'
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

const MOBILE_PRIMARY_SECTIONS: MesaSection[] = ['overview', 'fichas', 'rolagens', 'ordem'];

function MesaMobileBottomNav({
  slug,
  currentSection,
  role
}: {
  slug: string;
  currentSection: MesaSection;
  role: 'gm' | 'player' | 'viewer';
}) {
  const sections = MOBILE_PRIMARY_SECTIONS.filter((section) => role !== 'viewer' || section !== 'fichas');
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-[rgba(7,12,24,0.94)] px-2 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-2 backdrop-blur sm:hidden">
      <ul className={cn('mx-auto grid max-w-[560px] gap-1.5', sections.length === 4 ? 'grid-cols-4' : 'grid-cols-3')}>
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
                  isActive
                    ? 'border-sky-300/35 bg-sky-500/18 text-white'
                    : 'border-white/10 bg-white/[0.03] text-soft hover:text-white'
                )}
                aria-label={navItem.label}
              >
                <Icon className="size-4" />
                <span>{navItem.label}</span>
              </NavLink>
            </li>
          );
        })}
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
  currentTableSummary,
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
  currentTableSummary: { status?: string } | null;
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <LogoLockup compact={compact} variant="system" systemKey={table.systemKey} className="min-w-0" />
        <span className={cn('rounded-full border border-sky-300/18 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-100', compact && 'rail-expanded-block')}>
          {formatRoleLabel(session.role)}
        </span>
      </div>

      <ScrollArea className="mt-6 min-h-0 flex-1 pr-2">
        <div className="grid gap-6 pb-4">
          <section className={cn('grid gap-3', compact && 'rail-expanded-block')}>
            <p className="section-label">Mesa atual</p>
            <Panel className="rounded-lg p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{activeSystem.name}</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{table.name}</h2>
              <p className="mt-2 text-sm text-soft">
                {table.meta.seriesName || 'Sem série'} · {table.meta.campaignName || 'Sem campanha'}
              </p>
              <div className="mt-4 grid gap-2">
                <Link
                  to="/mesas"
                  onClick={onNavigate}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-soft transition hover:border-white/18 hover:text-white"
                >
                  Voltar ao hub
                </Link>
                <Link
                  to={`/mesa/${slug}/configuracoes`}
                  onClick={onNavigate}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-soft transition hover:border-white/18 hover:text-white"
                >
                  Abrir configurações
                </Link>
              </div>
            </Panel>
          </section>

          <section className="grid gap-2">
            <p className={cn('section-label', compact && 'rail-expanded-block')}>Módulos</p>
            <MesaNavigation slug={slug} role={session.role} compact={compact} onNavigate={onNavigate} />
          </section>

          <section className={cn('grid gap-3', compact && 'rail-expanded-block')}>
            <div className="flex items-center justify-between gap-3">
              <p className="section-label">Leitura rápida</p>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                live
              </span>
            </div>
            <div className="grid gap-2.5">
              <UtilityPanel className="rounded-lg px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
                <p className="mt-2 text-sm font-semibold text-white">{currentTableSummary?.status || table.currentSession?.status || 'Sem sessão'}</p>
              </UtilityPanel>
              <UtilityPanel className="rounded-lg px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Presença</p>
                <p className="mt-2 text-sm font-semibold text-white">{members.length} membro(s) visíveis</p>
              </UtilityPanel>
              <UtilityPanel className="rounded-lg px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Último sync</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatRelativeDate(table.updatedAt)}</p>
              </UtilityPanel>
            </div>
          </section>

          <section className={cn('grid gap-3', compact && 'rail-expanded-block')}>
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
                    'rounded-lg border px-3.5 py-3 text-left transition',
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

          <section className={cn('grid gap-3', compact && 'rail-expanded-block')}>
            <div className="flex items-center justify-between gap-3">
              <p className="section-label">Membros visíveis</p>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                {members.length}
              </span>
            </div>
            <div className="grid gap-2">
              {members.length ? (
                members.map((member) => (
                  <UtilityPanel key={member.id} className="rounded-lg px-3 py-2.5">
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

          {session.role === 'gm' && currentSection === 'fichas' ? (
            <section className={cn('grid gap-3', compact && 'rail-expanded-block')}>
              <CharacterRosterPanel variant="rail" onNavigate={onNavigate} />
            </section>
          ) : null}
        </div>
      </ScrollArea>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
          <Avatar src={user?.avatarUrl || undefined} name={user?.displayName || user?.username || 'Usuário'} size="sm" />
          <div className={cn('min-w-0 flex-1', compact && 'rail-label')}>
            <p className="truncate text-sm font-semibold text-white">{user?.displayName || 'Usuário'}</p>
            <p className="truncate text-xs uppercase tracking-[0.16em] text-muted">@{user?.username}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">{session.nickname}</p>
          </div>
        </div>
        <div className={cn('mt-3 grid gap-2', compact && 'rail-expanded-block')}>
          <Button size="sm" variant="secondary" onClick={onOpenProfile}>
            Minha conta
          </Button>
          <Button size="sm" variant="secondary" onClick={onLeave}>
            Sair da mesa
          </Button>
          <Button size="sm" variant="ghost" onClick={onSignOut}>
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
          setOpenError('Convite invalido ou expirado.');
          return;
        }
        setInvitePreview(preview);
      })
      .catch((error) => {
        if (!disposed) {
          setOpenError(error instanceof Error ? error.message : 'Nao foi possivel carregar o convite.');
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
  }, [accessError, connectToInvite, inviteToken, isReady, online.session?.tableSlug, retryNonce, slug, switchTable, tables, user?.displayName, user?.username]);

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

  const handleSignOut = () => {
    signOut();
  };

  const handleAcceptInvite = async () => {
    if (!inviteToken) return;
    setAcceptingInvite(true);
    setOpenError('');
    try {
      const joinedSession = await connectToInvite(window.location.href, user?.displayName || user?.username || 'Feiticeiro');
      if (!joinedSession) {
        setOpenError('A mesa nao respondeu com uma sessao valida para este convite.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel aceitar este convite.';
      setOpenError(message);
      toast.error(message);
    } finally {
      setAcceptingInvite(false);
    }
  };

  if (!isReady || (!session && !terminalAccessError && !inviteToken)) {
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

  if (shouldShowInvitePreview) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <Panel className="w-full max-w-2xl rounded-2xl p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Preview do convite</p>
          {invitePreviewLoading ? (
            <>
              <h1 className="mt-3 font-display text-5xl leading-none text-white">Carregando convite</h1>
              <p className="mt-4 text-sm leading-6 text-soft">Validando token e contexto da mesa...</p>
            </>
          ) : invitePreview ? (
            <>
              <h1 className="mt-3 font-display text-5xl leading-none text-white">{invitePreview.tableName}</h1>
              <p className="mt-4 text-sm leading-6 text-soft">
                {invitePreview.tableDescription || 'Sem descricao publica cadastrada para esta mesa.'}
              </p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Papel concedido</p>
                <p className="mt-1 text-base font-semibold text-white">{formatRoleLabel(invitePreview.role)}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button disabled={acceptingInvite} onClick={() => void handleAcceptInvite()}>
                  {acceptingInvite ? 'Aceitando...' : 'Aceitar convite'}
                </Button>
                <Button variant="secondary" onClick={() => navigate('/mesas')}>
                  Voltar ao hub
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-3 font-display text-5xl leading-none text-white">Convite indisponivel</h1>
              <p className="mt-4 text-sm leading-6 text-soft">Este token nao esta mais disponivel para entrada.</p>
              <div className="mt-6">
                <Button variant="secondary" onClick={() => navigate('/mesas')}>
                  Voltar ao hub
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
    <div className={cn('app-shell-root relative overflow-hidden', activeSystem.themeClassName)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(87,187,255,0.12),transparent_21%),radial-gradient(circle_at_top_right,rgba(143,228,255,0.08),transparent_14%),linear-gradient(180deg,rgba(4,8,16,0.74),rgba(4,8,15,0.94))]" />

      <div className="app-shell-grid relative mx-auto grid h-full max-w-[1840px] grid-cols-1 gap-3 px-3 py-3 xl:grid-cols-[min-content_minmax(0,1fr)] xl:px-4 xl:py-4">
        <aside
          className="app-sidebar-shell rail-shell hidden xl:flex xl:flex-col"
          data-shell-layer="rail"
          aria-label="Navegação lateral da mesa"
        >
          <div className="rail-shell-content">
            <MesaSidebarContent
              table={table}
              session={session}
              members={members}
              slug={slug}
              user={user}
              currentTableSummary={currentTableSummary}
              tables={tables}
              currentSection={currentSection}
              onSwitchTable={handleSwitchTable}
              onLeave={() => void handleLeaveTable()}
              onOpenProfile={() => navigate('/conta')}
              onSignOut={handleSignOut}
              compact
            />
          </div>
        </aside>

        <div className="app-main-column flex h-full min-h-0 flex-col gap-3">
          <header className="app-topbar" data-shell-layer="header">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <button className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-soft transition hover:text-white xl:hidden">
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
                      currentSection={currentSection}
                      onSwitchTable={handleSwitchTable}
                      onLeave={() => void handleLeaveTable()}
                      onOpenProfile={() => {
                        setMobileNavOpen(false);
                        navigate('/conta');
                      }}
                      onSignOut={() => {
                        setMobileNavOpen(false);
                        handleSignOut();
                      }}
                      compact={false}
                      onNavigate={() => setMobileNavOpen(false)}
                    />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{activeSystem.name}</p>
                  <h1 className="mt-1 text-balance text-lg font-semibold leading-tight text-white sm:text-xl">
                    {MESA_SECTION_LABELS[currentSection]}
                  </h1>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-soft sm:text-sm">{sectionDescriptions[currentSection]}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <UtilityPanel className="rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesa</p>
                  <p className="mt-1 text-sm font-semibold text-white">{table.name}</p>
                </UtilityPanel>
                <UtilityPanel className="rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
                  <p className="mt-1 text-sm font-semibold text-white">{currentTableSummary?.status || table.currentSession?.status || 'Sem sessão'}</p>
                </UtilityPanel>
                <UtilityPanel className="rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Presença</p>
                  <p className="mt-1 text-sm font-semibold text-white">{members.length} visíveis</p>
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
      <MesaMobileBottomNav slug={slug} currentSection={currentSection} role={session.role} />
    </div>
  );
}
