import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CalendarClock, Dices, Plus, ScrollText, Settings, Swords, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { UtilityPanel } from '@components/ui/panel';
import {
  MesaActionCard,
  MesaKeyValueRow,
  MesaLeadMeta,
  MesaPageLead,
  MesaSectionPanel
} from '@features/mesa/components/mesa-page-primitives';
import { useMesaOverview } from '@features/workspace/hooks/use-workspace-segments';
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

const QUICK_LINKS = [
  {
    label: 'Fichas',
    description: 'Operar personagens, recursos e coleções sem esmagar o corpo principal da mesa.',
    icon: ScrollText,
    section: 'fichas'
  },
  {
    label: 'Rolagens',
    description: 'Abrir o console compartilhado e acompanhar o log ao vivo da campanha.',
    icon: Dices,
    section: 'rolagens'
  },
  {
    label: 'Ordem',
    description: 'Controlar iniciativa, turnos e pressão tática em sessão.',
    icon: Swords,
    section: 'ordem'
  },
  {
    label: 'Configurações',
    description: 'Ajustar metadados, snapshots e administração da mesa.',
    icon: Settings,
    section: 'configuracoes'
  }
] as const;

export function MesaOverviewPage() {
  const {
    online,
    createInviteLink,
    createJoinCode,
    createCloudSnapshot,
    createGameSession
  } = useMesaOverview();
  const [searchParams] = useSearchParams();
  const table = online.table;
  const session = online.session;
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const currentSession = table?.currentSession;
  const members = online.members.length ? online.members : table?.memberships || [];
  const owner = table?.memberships.find((member) => member.isOwner) || members.find((member) => member.isOwner) || null;
  const canManage = session?.role === 'gm';
  const activeJoinCodes = table?.joinCodes.filter((code) => code.active) || [];

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

  const handleCreateSnapshot = async () => {
    try {
      await createCloudSnapshot(`Checkpoint ${new Date().toLocaleString('pt-BR')}`);
      toast.success('Snapshot salvo para esta mesa.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel salvar o snapshot.');
    }
  };

  return (
    <div className="page-shell pb-8">
      <MesaPageLead
        eyebrow="Geral da mesa"
        title={table.name}
        description={
          table.meta.description ||
          currentSession?.recap ||
          'Hub operacional da campanha: estado atual, sessão em foco, membros e atalhos do que realmente importa na mesa.'
        }
        meta={
          <>
            <MesaLeadMeta label="Papel" value={formatRoleLabel(session.role)} accent />
            <MesaLeadMeta label="Campanha" value={table.meta.campaignName || 'Sem campanha'} />
            <MesaLeadMeta label="Sessão" value={currentSession?.status || 'Sem sessão'} />
            <MesaLeadMeta label="Membros" value={members.length} />
          </>
        }
        actions={
          canManage ? (
            <>
              <Button variant="secondary" onClick={() => setSessionModalOpen(true)}>
                <CalendarClock className="size-4" />
                Nova sessão
              </Button>
              <Button variant="secondary" onClick={() => setInviteModalOpen(true)}>
                <Users className="size-4" />
                Convidar
              </Button>
              <Button onClick={() => void handleCreateSnapshot()}>
                <Plus className="size-4" />
                Salvar snapshot
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_360px]">
        <div className="grid gap-4">
          <MesaSectionPanel
            eyebrow="Estado da campanha"
            title="Leitura clara do momento"
            description="Cada bloco responde a uma missão só: contexto, sessão, pessoas e próximos módulos."
          >
            <MesaKeyValueRow
              label="Contexto narrativo"
              value={table.meta.description || 'Sem descrição central registrada.'}
              helper={`${table.meta.seriesName || 'Sem série'} · ${table.meta.campaignName || 'Sem campanha'}`}
              accent
              className="sm:items-start"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <MesaKeyValueRow label="Owner" value={owner?.nickname || 'Não identificado'} helper="Responsável principal pela mesa." />
              <MesaKeyValueRow
                label="Último sync"
                value={formatDateTime(table.updatedAt)}
                helper="Última atualização refletida na leitura da mesa."
              />
            </div>
            {currentSession ? (
              <div className="grid gap-3 md:grid-cols-2">
                <MesaKeyValueRow
                  label="Recap"
                  value={currentSession.recap || 'Sem recap registrado.'}
                  helper={currentSession.episodeTitle || 'Sessão atual'}
                />
                <MesaKeyValueRow
                  label="Objetivo"
                  value={currentSession.objective || 'Sem objetivo definido.'}
                  helper={currentSession.location || 'Local não informado'}
                />
              </div>
            ) : (
              <EmptyState
                title="Nenhuma sessão aberta."
                body="Crie uma sessão para registrar recap, objetivo, presença e estado atual da campanha."
              />
            )}
          </MesaSectionPanel>

          <MesaSectionPanel
            eyebrow="Sessão ativa"
            title={currentSession ? currentSession.episodeTitle || 'Sessão atual' : 'Preparar próxima sessão'}
            description="Sessões e presença agora ficam dentro de Geral, sem virar uma guia solta."
            actions={
              canManage ? (
                <Button variant="secondary" onClick={() => setSessionModalOpen(true)}>
                  <CalendarClock className="size-4" />
                  {currentSession ? 'Registrar outra sessão' : 'Criar sessão'}
                </Button>
              ) : undefined
            }
          >
            {currentSession ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <MesaKeyValueRow label="Status" value={currentSession.status || 'Sem status'} helper="Estado oficial da sessão atual." />
                  <MesaKeyValueRow
                    label="Quando"
                    value={formatDateTime(currentSession.sessionDate)}
                    helper={currentSession.location || 'Local não informado'}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <MesaKeyValueRow label="Recap" value={currentSession.recap || 'Sem recap'} helper="Resumo do capítulo em andamento." />
                  <MesaKeyValueRow label="Objetivo" value={currentSession.objective || 'Sem objetivo'} helper="Direção operacional da cena." />
                </div>
              </>
            ) : (
              <EmptyState
                title="A mesa ainda não tem sessão ativa."
                body="Use o modal de sessão para criar o próximo episódio, registrar status e manter a leitura da campanha organizada."
              />
            )}
          </MesaSectionPanel>

          <MesaSectionPanel
            eyebrow="Próximos módulos"
            title="Entradas rápidas da mesa"
            description="A navegação muda de linguagem, mas a missão de cada área continua explícita."
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {QUICK_LINKS.map((action) => {
                const Icon = action.icon;
                return (
                  <MesaActionCard
                    key={action.section}
                    title={action.label}
                    description={action.description}
                    icon={<Icon className="size-4" />}
                    action={
                      <Link
                        to={`/mesa/${table.slug}/${action.section}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-sky-100 transition hover:text-white"
                      >
                        Abrir módulo
                        <ArrowRight className="size-4" />
                      </Link>
                    }
                  />
                );
              })}
            </div>
          </MesaSectionPanel>
        </div>

        <div className="grid gap-4">
          <MesaSectionPanel
            eyebrow="Pessoas"
            title="Membros e acessos"
            description="A leitura social da mesa fica aqui, sem competir com o módulo de fichas."
            actions={
              canManage ? (
                <Button variant="secondary" onClick={() => setInviteModalOpen(true)}>
                  <Users className="size-4" />
                  Novo convite
                </Button>
              ) : undefined
            }
          >
            {members.length ? (
              members.map((member) => (
                <UtilityPanel key={member.id} className="rounded-lg px-3.5 py-3.5">
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
              <EmptyState title="Sem membros visíveis." body="A presença da mesa aparece aqui assim que o estado online é carregado." />
            )}

            <div className="grid gap-3">
              <MesaKeyValueRow
                label="Códigos ativos"
                value={activeJoinCodes.length}
                helper="Convites por código ainda válidos nesta mesa."
              />
              <MesaKeyValueRow
                label="Snapshots"
                value={table.snapshots.length}
                helper="Pontos de restauração salvos para segurança da campanha."
              />
            </div>
          </MesaSectionPanel>

          <MesaSectionPanel
            eyebrow="Proteção"
            title="Snapshots recentes"
            description="Restauração rápida sem transformar Geral em uma dashboard inflada."
          >
            {table.snapshots.length ? (
              table.snapshots.slice(0, 4).map((snapshot) => (
                <MesaKeyValueRow
                  key={snapshot.id}
                  label={snapshot.label}
                  value={formatDateTime(snapshot.createdAt)}
                  helper={snapshot.actorName || 'Autor não identificado'}
                />
              ))
            ) : (
              <EmptyState
                title="Nenhum snapshot salvo."
                body="Use o botão de snapshot para guardar um ponto seguro antes de uma mudança crítica."
              />
            )}
          </MesaSectionPanel>
        </div>
      </div>

      <Dialog open={sessionModalOpen} onOpenChange={setSessionModalOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogTitle className="text-2xl font-semibold text-white">Criar sessão</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">
            Sessões e presença agora vivem dentro de Geral em vez de ocuparem uma guia separada.
          </DialogDescription>
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
                toast.success('Sessão criada.');
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Nao foi possivel criar a sessao.');
              }
            })}
          >
            <Field label="Número do episódio">
              <Input {...sessionForm.register('episodeNumber')} />
            </Field>
            <Field label="Nome do episódio">
              <Input {...sessionForm.register('episodeTitle')} />
            </Field>
            <Field label="Status">
              <Select {...sessionForm.register('status')}>
                <option value="Planejamento">Planejamento</option>
                <option value="Em sessão">Em sessão</option>
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
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Criar sessão</Button>
              <Button type="button" variant="ghost" onClick={() => setSessionModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogTitle className="text-2xl font-semibold text-white">Convidar membro</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">
            Convites seguem simples: escolha o papel e o formato, sem vincular personagem no ato.
          </DialogDescription>
          <form
            className="mt-6 grid gap-4"
            onSubmit={inviteForm.handleSubmit(async (values) => {
              try {
                if (values.kind === 'code') {
                  const code = await createJoinCode({ role: values.role });
                  if (code) {
                    toast.success(`Código ${code.code} criado.`);
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
                <option value="code">Código</option>
              </Select>
            </Field>
            <Field label="Papel concedido">
              <Select {...inviteForm.register('role')}>
                <option value="player">Player</option>
                <option value="viewer">Viewer</option>
                <option value="gm">GM</option>
              </Select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Criar convite</Button>
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
