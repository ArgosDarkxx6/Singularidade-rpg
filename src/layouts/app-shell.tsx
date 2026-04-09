import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Sparkles, Swords, UserRound } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { NAV_ITEMS, VIEW_LABELS } from '@lib/domain/constants';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useWorkspace } from '@features/workspace/use-workspace';
import { LogoLockup } from '@components/shared/logo-lockup';
import { MetricChip } from '@components/shared/metric-chip';
import { cn } from '@lib/utils';

function navigationClass(isActive: boolean) {
  return cn(
    'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition',
    isActive ? 'bg-sky-400/12 text-white' : 'text-soft hover:bg-white/5 hover:text-white'
  );
}

export function AppShellLayout() {
  const { signOut, user } = useAuth();
  const { online, state, activeCharacter, lastRoll } = useWorkspace();
  const location = useLocation();
  const currentView = NAV_ITEMS.find((item) => location.pathname.startsWith(`/${item.label.toLowerCase()}`));

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(87,187,255,0.16),transparent_30%),radial-gradient(circle_at_left,rgba(63,108,188,0.18),transparent_26%)]" />
      <img
        src="/assets/book_art/ornaments/sigil-azure.png"
        alt=""
        className="pointer-events-none absolute left-[-120px] top-[-120px] w-[320px] opacity-18"
      />
      <img
        src="/assets/book_art/ornaments/ofuda-southwest.png"
        alt=""
        className="pointer-events-none absolute bottom-0 right-0 hidden w-[240px] opacity-30 lg:block"
      />

      <div className="relative mx-auto grid min-h-screen max-w-[1680px] grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-6 xl:px-6 xl:py-5">
        <aside className="surface-shell xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)]">
          <div className="flex h-full flex-col gap-6 px-5 py-5 sm:px-6 xl:px-5">
            <div className="flex items-center justify-between xl:block">
              <LogoLockup />
              <div className="hidden items-center gap-2 xl:flex">
                <span className={cn('size-2 rounded-full', online.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-300')} />
                <span className="text-xs uppercase tracking-[0.2em] text-muted">{online.status === 'connected' ? 'Online' : 'Local'}</span>
              </div>
            </div>

            <nav className="hidden gap-2 xl:grid">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.key} to={`/${item.label.toLowerCase()}`} className={({ isActive }) => navigationClass(isActive)}>
                  <span>{item.label}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted group-hover:text-sky-200">{item.key}</span>
                </NavLink>
              ))}
            </nav>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MetricChip label="Personagens" value={state.characters.length} />
              <MetricChip label="Mesa ativa" value={online.table?.name || 'Offline'} tone={online.status === 'connected' ? 'accent' : 'default'} />
              <MetricChip label="Feiticeiro" value={activeCharacter.name} />
            </div>

            <div className="hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-4 xl:block">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Sessao</p>
                  <h3 className="mt-2 font-display text-3xl text-white">{user?.displayName || 'Visitante'}</h3>
                  <p className="mt-1 text-sm text-soft">@{user?.username}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <UserRound className="size-5 text-sky-100" />
                </div>
              </div>
              <p className="mt-4 text-sm text-soft">
                {online.status === 'connected'
                  ? `Conectado em ${online.table?.name || 'mesa online'} com ${online.members.length} presencas visiveis.`
                  : 'Executando em modo local com fallback persistente enquanto Supabase nao esta configurado.'}
              </p>
              <Button variant="secondary" className="mt-5 w-full" onClick={signOut}>
                <LogOut className="size-4" />
                Encerrar sessao
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col px-4 pb-36 pt-4 sm:px-6 sm:pb-32 xl:px-0 xl:pb-6">
          <header className="surface-shell sticky top-4 z-20 mb-6 flex flex-col gap-4 rounded-[28px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Workspace ativo</p>
              <h2 className="mt-2 font-display text-4xl leading-none text-white">
                {VIEW_LABELS[state.currentView]} <span className="text-sky-200">{currentView ? `/${currentView.label.toLowerCase()}` : ''}</span>
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  <Sparkles className="size-3.5" />
                  Ultima rolagem
                </p>
                <p className="mt-2 text-sm text-soft">{lastRoll ? `${lastRoll.label}: ${lastRoll.total}` : 'Nenhuma ainda'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  <Swords className="size-3.5" />
                  Ordem
                </p>
                <p className="mt-2 text-sm text-soft">{state.order.entries.length ? `${state.order.entries.length} combatentes` : 'Sem confronto aberto'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Presenca</p>
                <p className="mt-2 text-sm text-soft">{online.members.length ? `${online.members.length} conectados` : 'Somente local'}</p>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname + location.search}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="flex-1"
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>

        <div className="fixed inset-x-4 bottom-4 z-30 xl:hidden">
          <div className="surface-shell grid grid-cols-5 rounded-[24px] px-2 py-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.key}
                to={`/${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  cn(
                    'rounded-2xl px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] transition',
                    isActive ? 'bg-sky-400/12 text-white' : 'text-soft'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
