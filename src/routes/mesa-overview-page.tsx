import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CalendarClock, Plus, Settings, Sparkles, Swords, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui/dialog';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar } from '@components/ui/avatar';
import { EmptyState } from '@components/ui/empty-state';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaDataRow, MesaHero, MesaMetricTile, MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { useWorkspace } from '@features/workspace/use-workspace';
import { gameSessionFormSchema } from '@schemas/mesa';

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

type GameSessionValues = import('zod').infer<typeof gameSessionFormSchema>;

const QUICK_ACTIONS = [
  {
    label: 'Fichas',
    description: 'Abrir o workspace de personagens e continuar a operação da mesa.',
    icon: Sparkles,
    section: 'fichas'
  },
  {
    label: 'Rolagens',
    description: 'Usar o console recorrente de resolução e acompanhar o ledger.',
    icon: ArrowRight,
    section: 'rolagens'
  },
  {
    label: 'Ordem',
    description: 'Controlar round, turno e leitura tática do combate.',
    icon: Swords,
    section: 'ordem'
  },
  {
    label: 'Configurações',
    description: 'Abrir metadados, snapshots e administração da campanha.',
    icon: Settings,
    section: 'configuracoes'
  }
] as const;

export function MesaOverviewPage() {
  const { state, activeCharacter, online, createInviteLink, createJoinCode, createGameSession } = useWorkspace();
  const [searchParams] = useSearchParams();
  const table = online.table;
  const session = online.session;
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const currentSession = table?.currentSession;
  const members = online.members.length ? online.members : table?.memberships || [];
  const visibleMembers = members.slice(0, 6);
  const owner = table?.memberships.find((member) => member.isOwner) || members.find((member) => member.isOwner) || null;
  const canManage = session?.role === 'gm';

  const sessionForm = useForm<GameSessionValues>({
    resolver: zodResolver(gameSessionFormSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      episodeNumber: '',
      episodeTitle: '',
      sessionDate: '',
      location: '',
      status: currentSession?.status || 'Planejamento',
      recap: '',
      objective: '',
      notes: '',
      isActive: false
    }
  });

  const inviteForm = useForm<{ role: 'gm' | 'player' | 'viewer'; kind: 'link' | 'code' }>({
    mode: 'onBlur',
    defaultValues: {
      role: 'player',
      kind: 'link'
    }
  });

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus === 'sessao' && canManage) {
      setSessionModalOpen(true);
    }
    if (focus === 'membros' && canManage) {
      setInviteModalOpen(true);
    }
  }, [canManage, searchParams]);

  if (!table || !session) {
    return <EmptyState title="Mesa offline." body="Abra uma mesa pelo hub para continuar." />;
  }

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Geral da mesa"
        title={table.name}
        description={
          table.meta.description ||
          currentSession?.recap ||
          currentSession?.objective ||
          'Centro operacional da campanha: contexto da mesa, leitura do estado atual e acesso rápido aos módulos profundos.'
        }
        actions={
          <>
            {canManage ? (
              <Button variant="secondary" onClick={() => setSessionModalOpen(true)}>
                <CalendarClock className="size-4" />
                Criar sessao
              </Button>
            ) : null}
            {canManage ? (
              <Button onClick={() => setInviteModalOpen(true)}>
                <Users className="size-4" />
                Convidar membro
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MesaMetricTile
          label="Campanha"
          value={table.meta.campaignName || 'Sem campanha'}
          hint={table.meta.seriesName || 'Sem série definida.'}
        />
        <MesaMetricTile
          label="Status atual"
          value={currentSession?.status || 'Sem sessão'}
          hint={currentSession?.episodeTitle || 'Nenhum episódio ativo no momento.'}
        />
        <MesaMetricTile label="Presença visível" value={members.length} hint="Membros atualmente refletidos na leitura operacional da mesa." />
        <MesaMetricTile label="Ficha em foco" value={activeCharacter.name} hint={`${activeCharacter.clan || 'Sem clã'} · ${activeCharacter.grade || 'Sem grau'}`} />
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="grid gap-6">
          <Panel className="rounded-3xl p-6 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Mesa & campanha</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Leitura central da operação</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                Geral
              </span>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="grid gap-4">
                <UtilityPanel className="rounded-2xl p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Contexto narrativo</p>
                  <p className="mt-3 text-sm leading-7 text-soft">
                    {table.meta.description || currentSession?.recap || 'Sem descrição central registrada ainda para esta campanha.'}
                  </p>
                </UtilityPanel>

                <div className="grid gap-4 md:grid-cols-2">
                  <UtilityPanel className="rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Recap atual</p>
                    <p className="mt-3 text-sm leading-7 text-soft">{currentSession?.recap || 'Sem recap registrado para a sessão em foco.'}</p>
                  </UtilityPanel>
                  <UtilityPanel className="rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Objetivo atual</p>
                    <p className="mt-3 text-sm leading-7 text-soft">{currentSession?.objective || 'Sem objetivo central definido para a sessão atual.'}</p>
                  </UtilityPanel>
                </div>
              </div>

              <MesaRailCard
                eyebrow="Estrutura"
                title="Dados centrais"
                description="Leitura rápida da campanha, do papel atual e do estado operacional da mesa."
              >
                <MesaDataRow label="Mesa" value={table.name} tone="accent" />
                <MesaDataRow label="Série" value={table.meta.seriesName || 'Sem série'} />
                <MesaDataRow label="Campanha" value={table.meta.campaignName || 'Sem campanha'} />
                <MesaDataRow label="Seu papel" value={formatRoleLabel(session.role)} />
                <MesaDataRow label="Status" value={currentSession?.status || 'Sem sessão'} />
                <MesaDataRow label="Último sync" value={formatDateTime(table.updatedAt)} />
              </MesaRailCard>
            </div>
          </Panel>

          <Panel className="rounded-3xl p-6 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Operação contínua</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Ações rápidas importantes</h2>
              </div>
              <Link
                to={`/mesa/${table.slug}/configuracoes`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.08]"
              >
                Ajustar campanha
              </Link>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.section}
                    to={`/mesa/${table.slug}/${action.section}`}
                    className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition hover:border-sky-300/18 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl border border-sky-300/18 bg-sky-500/10 p-3 text-sky-100">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-white">{action.label}</p>
                        <p className="mt-2 text-sm leading-6 text-soft">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6">
          <MesaRailCard
            eyebrow="Presença"
            title="Membros em foco"
            description="Leitura social e operacional resumida com gestao consolidada em Geral."
          >
            {visibleMembers.length ? (
              visibleMembers.map((member) => (
                <UtilityPanel key={member.id} className="rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={member.nickname} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{member.nickname}</p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-muted">
                        {formatRoleLabel(member.role)}
                        {member.characterName ? ` · ${member.characterName}` : ''}
                      </p>
                    </div>
                  </div>
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Sem membros visíveis." body="A presença da mesa aparece aqui conforme a leitura operacional é carregada." />
            )}
            {canManage ? (
              <div className="mt-3 grid gap-2">
                <Button variant="secondary" onClick={() => setInviteModalOpen(true)}>
                  <Plus className="size-4" />
                  Novo convite
                </Button>
                <UtilityPanel className="rounded-lg p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Codigos ativos</p>
                  <p className="mt-1 text-sm font-semibold text-white">{table.joinCodes.length}</p>
                </UtilityPanel>
              </div>
            ) : null}
          </MesaRailCard>

          <MesaRailCard
            eyebrow="Campanha"
            title="Governança rápida"
            description="Resumo administrativo e pontos de estabilidade da mesa em um bloco compacto."
          >
            <MesaDataRow label="Owner" value={owner?.nickname || 'Não identificado'} tone="accent" />
            <MesaDataRow label="Snapshots" value={table.snapshots.length} />
            <MesaDataRow label="Fichas" value={state.characters.length} />
            <MesaDataRow label="Membros" value={members.length} />
            <MesaDataRow label="Módulos" value={QUICK_ACTIONS.length + 1} />
          </MesaRailCard>

          <MesaRailCard
            eyebrow="Personagem em foco"
            title={activeCharacter.name}
            description="A ficha ativa continua disponível na leitura executiva da campanha."
          >
            <UtilityPanel className="rounded-2xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Lore</p>
              <p className="mt-3 line-clamp-6 whitespace-pre-line text-sm leading-7 text-soft">
                {activeCharacter.lore || 'Sem lore registrada ainda para este personagem.'}
              </p>
            </UtilityPanel>
            <Link
              to={`/mesa/${table.slug}/fichas`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.08]"
            >
              Abrir fichas
            </Link>
          </MesaRailCard>

          <MesaRailCard
            eyebrow="Proteção"
            title="Snapshots recentes"
            description="Resumo rápido de restauração sem competir com a área profunda de configurações."
          >
            {table.snapshots.length ? (
              table.snapshots.slice(0, 4).map((snapshot) => (
                <UtilityPanel key={snapshot.id} className="rounded-2xl p-4">
                  <p className="text-sm font-semibold text-white">{snapshot.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                    {snapshot.actorName} · {formatDateTime(snapshot.createdAt)}
                  </p>
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Nenhum snapshot salvo." body="Salve um ponto de restauração em Configurações quando precisar proteger a campanha." />
            )}
          </MesaRailCard>
        </div>
      </section>

      <Dialog open={sessionModalOpen} onOpenChange={setSessionModalOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogTitle className="font-display text-4xl text-white">Criar sessao</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">Sessao e presenca agora ficam consolidadas em Geral.</DialogDescription>
          <form
            className="mt-6 grid gap-4"
            onSubmit={sessionForm.handleSubmit(async (values) => {
              if (!session) return;
              try {
                await createGameSession({
                  gameSession: {
                    ...values,
                    createdBy: session.nickname
                  }
                });
                setSessionModalOpen(false);
                sessionForm.reset();
                toast.success('Sessao criada.');
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Nao foi possivel criar a sessao.');
              }
            })}
          >
            <Field label="Numero do episodio">
              <Input {...sessionForm.register('episodeNumber')} />
            </Field>
            <Field label="Nome do episodio">
              <Input {...sessionForm.register('episodeTitle')} />
            </Field>
            <Field label="Status">
              <Select {...sessionForm.register('status')}>
                <option value="Planejamento">Planejamento</option>
                <option value="Em sessão">Em sessao</option>
                <option value="Intervalo">Intervalo</option>
                <option value="Finalizada">Finalizada</option>
              </Select>
            </Field>
            <Field label="Local">
              <Input {...sessionForm.register('location')} />
            </Field>
            <Field label="Recap">
              <Textarea {...sessionForm.register('recap')} />
            </Field>
            <Field label="Objetivo">
              <Textarea {...sessionForm.register('objective')} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">Criar sessao</Button>
              <Button type="button" variant="ghost" onClick={() => setSessionModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogTitle className="font-display text-4xl text-white">Convidar membro</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">Escolha papel e formato de convite.</DialogDescription>
          <form
            className="mt-6 grid gap-4"
            onSubmit={inviteForm.handleSubmit(async (values) => {
              try {
                if (values.kind === 'code') {
                  const code = await createJoinCode({ role: values.role });
                  if (code) {
                    toast.success(`Codigo ${code.code} criado.`);
                  }
                } else {
                  const url = await createInviteLink({ role: values.role });
                  if (url) {
                    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(url).catch(() => null);
                    }
                    toast.success('Link de convite criado.');
                  }
                }
                setInviteModalOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Nao foi possivel gerar o convite.');
              }
            })}
          >
            <Field label="Tipo">
              <Select {...inviteForm.register('kind')}>
                <option value="link">Link</option>
                <option value="code">Codigo</option>
              </Select>
            </Field>
            <Field label="Papel concedido">
              <Select {...inviteForm.register('role')}>
                <option value="player">Player</option>
                <option value="viewer">Viewer</option>
                <option value="gm">GM</option>
              </Select>
            </Field>
            <div className="flex gap-2">
              <Button type="submit">Gerar</Button>
              <Button type="button" variant="ghost" onClick={() => setInviteModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
