import { Link } from 'react-router-dom';
import { Avatar } from '@components/ui/avatar';
import { EmptyState } from '@components/ui/empty-state';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaMetricTile, MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { useWorkspace } from '@features/workspace/use-workspace';

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Player';
  return 'Viewer';
}

function formatDateTime(value: string) {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function MesaOverviewPage() {
  const { state, activeCharacter, online } = useWorkspace();
  const table = online.table;
  const session = online.session;
  const currentSession = table?.currentSession;
  const members = online.members.length ? online.members : table?.memberships || [];

  if (!table || !session) {
    return <EmptyState title="Mesa offline." body="Abra uma mesa pelo portal para carregar o dashboard contextual." />;
  }

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Overview da mesa"
        title={table.name}
        description={
          currentSession?.recap ||
          currentSession?.objective ||
          table.meta.description ||
          'Use este dashboard para se localizar rapidamente antes de entrar nos módulos de ficha, rolagem, ordem e administração.'
        }
        actions={
          <>
            <Link
              to={`/mesa/${table.slug}/rolagens`}
              className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-sky-300/18 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-sky-300/28 hover:bg-sky-500/14"
            >
              Abrir rolagens
            </Link>
            <Link
              to={`/mesa/${table.slug}/membros`}
              className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.08]"
            >
              Gerenciar membros
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MesaMetricTile label="Membros visíveis" value={members.length} hint="Presença em tempo real quando disponível." />
        <MesaMetricTile label="Personagens" value={state.characters.length} hint="Fichas registradas na mesa atual." />
        <MesaMetricTile label="Join codes" value={table.joinCodes.length} hint="Acessos rápidos ainda ativos." />
        <MesaMetricTile label="Snapshots" value={table.snapshots.length} hint="Pontos de restauração da campanha." />
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6">
          <Panel className="rounded-[28px] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Sessão atual</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">
                  {table.meta.seriesName || 'Série não definida'} <span className="text-sky-200">/ {table.meta.campaignName || 'Campanha principal'}</span>
                </h2>
                <p className="mt-3 text-sm leading-6 text-soft">
                  {currentSession?.episodeTitle || 'Sem título de episódio'} · status {currentSession?.status || 'Sem sessão'} · último sync {formatDateTime(table.updatedAt)}.
                </p>
              </div>
              <Link
                to={`/mesa/${table.slug}/configuracoes`}
                className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.08]"
              >
                Ajustar metadados
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <UtilityPanel className="rounded-[22px] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Recapitulação</p>
                <p className="mt-3 text-sm leading-6 text-soft">{currentSession?.recap || 'Nenhum recap preenchido ainda para esta sessão.'}</p>
              </UtilityPanel>
              <UtilityPanel className="rounded-[22px] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Objetivo de jogo</p>
                <p className="mt-3 text-sm leading-6 text-soft">{currentSession?.objective || 'Defina um objetivo tático ou narrativo em Sessão.'}</p>
              </UtilityPanel>
            </div>
          </Panel>

          <Panel className="rounded-[28px] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Roster em foco</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Leitura rápida de personagens</h2>
              </div>
              <Link
                to={`/mesa/${table.slug}/fichas`}
                className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.08]"
              >
                Abrir fichas
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {state.characters.slice(0, 4).map((character) => (
                <UtilityPanel key={character.id} className="rounded-[22px] p-4">
                  <div className="flex items-start gap-4">
                    <Avatar src={character.avatar || undefined} name={character.name} />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-white">{character.name}</p>
                      <p className="mt-1 text-sm text-soft">
                        {character.clan || 'Sem clã'} · {character.grade || 'Sem grau'}
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-soft">
                        <div className="rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2">
                          PV {character.resources.hp.current}/{character.resources.hp.max}
                        </div>
                        <div className="rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2">
                          EA {character.resources.energy.current}/{character.resources.energy.max}
                        </div>
                        <div className="rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2">
                          SAN {character.resources.sanity.current}/{character.resources.sanity.max}
                        </div>
                      </div>
                    </div>
                  </div>
                </UtilityPanel>
              ))}
            </div>
          </Panel>

          <Panel className="rounded-[28px] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Pontos de segurança</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Snapshots recentes</h2>
              </div>
              <Link
                to={`/mesa/${table.slug}/configuracoes`}
                className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.08]"
              >
                Abrir restauração
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              {table.snapshots.length ? (
                table.snapshots.slice(0, 4).map((snapshot) => (
                  <UtilityPanel key={snapshot.id} className="rounded-[20px] px-4 py-4">
                    <p className="text-sm font-semibold text-white">{snapshot.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                      {snapshot.actorName} · {formatDateTime(snapshot.createdAt)}
                    </p>
                  </UtilityPanel>
                ))
              ) : (
                <EmptyState title="Nenhum snapshot salvo." body="O GM pode criar pontos de restauração em Configurações." />
              )}
            </div>
          </Panel>
        </div>

        <div className="page-right-rail">
          <MesaRailCard eyebrow="Sua presença" title={session.nickname} description={`Você está na mesa como ${formatRoleLabel(session.role)}.`}>
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Personagem vinculado</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {state.characters.find((character) => character.id === session.characterId)?.name || 'Sem vínculo'}
              </p>
            </UtilityPanel>
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Ficha ativa</p>
              <p className="mt-2 text-sm font-semibold text-white">{activeCharacter.name}</p>
            </UtilityPanel>
          </MesaRailCard>

          <MesaRailCard
            eyebrow="Membros"
            title="Presença visível"
            description="Uma right rail de consulta rápida para acompanhar o servidor atual."
          >
            {members.length ? (
              members.slice(0, 6).map((member) => (
                <UtilityPanel key={member.id} className="rounded-[20px] p-4">
                  <p className="text-sm font-semibold text-white">{member.nickname}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                    {formatRoleLabel(member.role)}
                    {member.characterName ? ` · ${member.characterName}` : ''}
                  </p>
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Sem outros membros online." body="Assim que outros clientes entrarem na mesa, a right rail mostra a presença deles aqui." />
            )}
          </MesaRailCard>
        </div>
      </div>
    </div>
  );
}
