import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, ChevronRight, Link2, Plus, Ticket, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { UtilityPanel } from '@components/ui/panel';
import { MesaKeyValueRow, MesaLeadMeta, MesaPageLead, MesaSectionPanel } from '@features/mesa/components/mesa-page-primitives';
import { MESA_NAV_ITEMS } from '@features/mesa/lib/mesa-routing';
import { useMesaOverview } from '@features/workspace/hooks/use-workspace-segments';
import { gameSessionFormSchema } from '@schemas/mesa';

type GameSessionValues = import('zod').infer<typeof gameSessionFormSchema>;

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
  const { online, createInviteLink, createJoinCode, createCloudSnapshot, createGameSession } = useMesaOverview();
  const [searchParams] = useSearchParams();
  const table = online.table;
  const session = online.session;
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const currentSession = table?.currentSession;
  const members = online.members.length ? online.members : table?.memberships || [];
  const canManage = session?.role === 'gm';
  const activeJoinCodes = table?.joinCodes.filter((code) => code.active) || [];
  const recentModules = MESA_NAV_ITEMS.filter((item) => !['configuracoes', 'sessao', 'membros'].includes(item.section)).slice(1, 5);

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

  const nextModules = useMemo(
    () =>
      recentModules.map((item) => ({
        ...item,
        href: item.href(table?.slug || '')
      })),
    [recentModules, table?.slug]
  );

  if (!table || !session) {
    return <EmptyState title="Mesa offline." body="Abra uma mesa pelo hub para continuar." />;
  }

  const handleCreateSnapshot = async () => {
    try {
      await createCloudSnapshot(`Checkpoint ${new Date().toLocaleString('pt-BR')}`);
      toast.success('Snapshot salvo.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o snapshot.');
    }
  };

  return (
    <div className="page-shell pb-8">
      <MesaPageLead
        eyebrow="Geral"
        title="Geral"
        meta={
          <>
            <MesaLeadMeta label="Papel" value={formatRoleLabel(session.role)} accent />
            <MesaLeadMeta label="Sessão" value={currentSession?.episodeTitle || 'Sem sessão'} />
            <MesaLeadMeta label="Membros" value={members.length} />
          </>
        }
        actions={
          canManage ? (
            <>
              <Button variant="secondary" onClick={() => setSessionModalOpen(true)}>
                <CalendarClock className="size-4" />
                Sessão
              </Button>
              <Button variant="secondary" onClick={() => setInviteModalOpen(true)}>
                <Users className="size-4" />
                Convidar
              </Button>
              <Button onClick={() => void handleCreateSnapshot()}>
                <Plus className="size-4" />
                Snapshot
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="grid gap-4">
          <MesaSectionPanel eyebrow="Sessão atual" title={currentSession?.episodeTitle || 'Próxima sessão'}>
            {currentSession ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <MesaKeyValueRow
                    label="Status"
                    value={currentSession.status || 'Sem status'}
                    helper={currentSession.location || 'Local não informado'}
                    accent
                  />
                  <MesaKeyValueRow
                    label="Agenda"
                    value={formatDateTime(currentSession.sessionDate)}
                    helper={currentSession.episodeNumber || 'Sem episódio'}
                  />
                </div>
                <MesaKeyValueRow label="Recap" value={currentSession.recap || 'Sem registro'} />
                <MesaKeyValueRow label="Objetivo" value={currentSession.objective || 'Sem registro'} />
              </>
            ) : (
              <EmptyState title="Nenhuma sessão aberta." body="Crie a próxima sessão para registrar o momento atual da mesa." />
            )}
          </MesaSectionPanel>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
            <MesaSectionPanel eyebrow="Mesa" title={table.name}>
              <div className="grid gap-3 md:grid-cols-2">
                <MesaKeyValueRow label="Série" value={table.meta.seriesName || 'Sem série'} />
                <MesaKeyValueRow label="Campanha" value={table.meta.campaignName || 'Sem campanha'} />
              </div>
              <MesaKeyValueRow label="Descrição" value={table.meta.description || 'Sem descrição cadastrada.'} />
              <div className="grid gap-3 md:grid-cols-2">
                <MesaKeyValueRow label="Último sync" value={formatDateTime(table.updatedAt)} />
                <MesaKeyValueRow label="Snapshots" value={table.snapshots.length} />
              </div>
            </MesaSectionPanel>

            <MesaSectionPanel eyebrow="Acesso" title="Convites">
              <MesaKeyValueRow label="Links" value={table.invites.length} />
              <MesaKeyValueRow label="Códigos" value={activeJoinCodes.length} />
              {canManage ? (
                <Button variant="secondary" onClick={() => setInviteModalOpen(true)}>
                  Gerenciar convites
                </Button>
              ) : null}
            </MesaSectionPanel>
          </div>

          <MesaSectionPanel eyebrow="Próximos módulos" title="Abrir módulo">
            <div className="grid gap-2 md:grid-cols-2">
              {nextModules.map((item) => (
                <Link
                  key={item.section}
                  to={item.href}
                  className="rounded-lg border border-white/8 bg-white/[0.025] px-3.5 py-3 transition hover:border-blue-300/16 hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{table.name}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted" />
                  </div>
                </Link>
              ))}
            </div>
          </MesaSectionPanel>
        </div>

        <div className="grid gap-4">
          <MesaSectionPanel eyebrow="Membros" title="Presença">
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
              <EmptyState title="Sem presença ao vivo." body="Os membros aparecem aqui quando entram na mesa." />
            )}
          </MesaSectionPanel>

          <MesaSectionPanel eyebrow="Snapshots" title="Recentes">
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
              <EmptyState title="Nenhum snapshot salvo." body="Crie um checkpoint quando quiser guardar um ponto seguro da mesa." />
            )}
          </MesaSectionPanel>

          <MesaSectionPanel eyebrow="Status" title="Leitura rápida">
            <MesaKeyValueRow label="Sistema" value={table.systemKey} />
            <MesaKeyValueRow label="Owner" value={members.find((member) => member.isOwner)?.nickname || 'Sem owner'} />
            <MesaKeyValueRow label="Vagas" value={table.meta.slotCount || 0} />
          </MesaSectionPanel>
        </div>
      </div>

      <Dialog open={sessionModalOpen} onOpenChange={setSessionModalOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-xl">
          <DialogTitle className="font-display text-2xl text-white">Sessão</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">Preencha os dados do próximo episódio.</DialogDescription>
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
                toast.error(error instanceof Error ? error.message : 'Não foi possível criar a sessão.');
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
              <Button type="submit">Salvar sessão</Button>
              <Button type="button" variant="ghost" onClick={() => setSessionModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-xl">
          <DialogTitle className="font-display text-2xl text-white">Convite</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">Escolha o papel e gere o acesso.</DialogDescription>
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
                toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o convite.');
              }
            })}
          >
            <Field label="Formato">
              <Select {...inviteForm.register('kind')}>
                <option value="link">Link</option>
                <option value="code">Código</option>
              </Select>
            </Field>
            <Field label="Papel">
              <Select {...inviteForm.register('role')}>
                <option value="player">Player</option>
                <option value="viewer">Viewer</option>
                <option value="gm">GM</option>
              </Select>
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              <UtilityPanel className="rounded-lg px-3.5 py-3">
                <div className="flex items-center gap-3">
                  <Link2 className="size-4 text-sky-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">Link</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">Entrada direta</p>
                  </div>
                </div>
              </UtilityPanel>
              <UtilityPanel className="rounded-lg px-3.5 py-3">
                <div className="flex items-center gap-3">
                  <Ticket className="size-4 text-sky-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">Código</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">Entrada manual</p>
                  </div>
                </div>
              </UtilityPanel>
            </div>
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
