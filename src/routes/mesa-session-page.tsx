import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Clock3, Plus, RotateCcw, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaMetricTile, MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { useWorkspace } from '@features/workspace/use-workspace';
import { SESSION_ATTENDANCE_STATUS_LABELS, SESSION_STATUS_OPTIONS } from '@lib/domain/constants';
import { gameSessionFormSchema } from '@schemas/mesa';
import type { GameSession, PresenceMember, SessionAttendanceStatus } from '@/types/domain';

type GameSessionValues = import('zod').infer<typeof gameSessionFormSchema>;

function sessionDefaults(session?: GameSession | null): GameSessionValues {
  return {
    episodeNumber: session?.episodeNumber || '',
    episodeTitle: session?.episodeTitle || '',
    sessionDate: session?.sessionDate || '',
    location: session?.location || '',
    status: session?.status || SESSION_STATUS_OPTIONS[0],
    recap: session?.recap || '',
    objective: session?.objective || '',
    notes: session?.notes || '',
    isActive: session?.isActive ?? false
  };
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

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Player';
  return 'Viewer';
}

function AttendanceActions({
  activeStatus,
  disabled,
  onChange
}: {
  activeStatus: SessionAttendanceStatus;
  disabled: boolean;
  onChange: (status: SessionAttendanceStatus) => void;
}) {
  const actions: SessionAttendanceStatus[] = ['pending', 'present', 'absent'];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((status) => (
        <Button
          key={status}
          size="sm"
          variant={activeStatus === status ? 'primary' : 'secondary'}
          disabled={disabled}
          onClick={() => onChange(status)}
        >
          {SESSION_ATTENDANCE_STATUS_LABELS[status]}
        </Button>
      ))}
    </div>
  );
}

export function MesaSessionPage() {
  const {
    online,
    createGameSession,
    updateGameSession,
    startGameSession,
    endGameSession,
    markSessionAttendance,
    clearSessionAttendance
  } = useWorkspace();
  const table = online.table;
  const session = online.session;
  const canManage = session?.role === 'gm';
  const availableSessions = useMemo(() => {
    const map = new Map<string, GameSession>();
    if (table?.currentSession) map.set(table.currentSession.id, table.currentSession);
    for (const entry of table?.sessionHistoryPreview || []) {
      map.set(entry.id, entry);
    }
    return [...map.values()];
  }, [table?.currentSession, table?.sessionHistoryPreview]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return availableSessions.find((entry) => entry.id === selectedSessionId) || null;
  }, [availableSessions, selectedSessionId]);

  const sessionForm = useForm<GameSessionValues>({
    resolver: zodResolver(gameSessionFormSchema) as never,
    mode: 'onBlur',
    defaultValues: sessionDefaults(table?.currentSession)
  });

  useEffect(() => {
    if (!table?.currentSession) {
      setSelectedSessionId(null);
      sessionForm.reset(sessionDefaults());
      return;
    }

    setSelectedSessionId((current) => {
      if (current && availableSessions.some((entry) => entry.id === current)) {
        return current;
      }

      return table.currentSession?.id || null;
    });
  }, [availableSessions, sessionForm, table?.currentSession]);

  useEffect(() => {
    sessionForm.reset(sessionDefaults(selectedSession));
  }, [selectedSession, sessionForm]);

  if (!table || !session) {
    return <EmptyState title="Mesa offline." body="Abra uma mesa válida para controlar episódio, presença e andamento da sessão." />;
  }

  const activeAttendances = selectedSession?.id === table.currentSession?.id ? table.sessionAttendances : [];
  const attendanceMap = new Map(activeAttendances.map((entry) => [entry.membershipId, entry]));
  const members = table.memberships;
  const presentCount = activeAttendances.filter((entry) => entry.status === 'present').length;
  const absentCount = activeAttendances.filter((entry) => entry.status === 'absent').length;
  const pendingCount = activeAttendances.filter((entry) => entry.status === 'pending').length;

  const handleSubmit = sessionForm.handleSubmit(async (values) => {
    if (!canManage) return;
    try {

    if (selectedSession) {
      await updateGameSession({
        sessionId: selectedSession.id,
        patch: values
      });
      toast.success('Sessão atualizada.');
      return;
    }

    await createGameSession({
      gameSession: {
        ...values,
        createdBy: session.nickname
      }
    });
    toast.success('Sessão criada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel salvar a sessao.');
    }
  });

  const markAttendance = async (member: PresenceMember, status: SessionAttendanceStatus) => {
    if (!selectedSession) return;

    if (!canManage && member.id !== session.membershipId) {
      toast.error('Você só pode marcar a própria presença.');
      return;
    }

    try {
      await markSessionAttendance({
        sessionId: selectedSession.id,
        membershipId: member.id,
        status
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar a presenca.');
    }
  };

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Sessão da mesa"
        title={selectedSession?.episodeTitle || 'Fluxo de episódio e presença'}
        description={
          selectedSession
            ? `${selectedSession.episodeNumber || 'Sem número'} · ${selectedSession.status} · ${selectedSession.location || 'Local não definido'}.`
            : 'Mesa e sessão agora são camadas separadas: a mesa guarda contexto geral e a sessão concentra episódio, presença e andamento.'
        }
        actions={
          canManage ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedSessionId(null);
                  sessionForm.reset(sessionDefaults());
                }}
              >
                <Plus className="size-4" />
                Nova sessão
              </Button>
              <Button onClick={() => void handleSubmit()}>
                <Save className="size-4" />
                {selectedSession ? 'Salvar sessão' : 'Criar sessão'}
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MesaMetricTile label="Sessão em foco" value={selectedSession?.episodeTitle || 'Nenhuma'} hint={selectedSession?.episodeNumber || 'Crie ou selecione uma sessão.'} />
        <MesaMetricTile label="Presentes" value={presentCount} hint="Membros confirmados para a sessão em foco." />
        <MesaMetricTile label="Pendentes" value={pendingCount} hint="Presenças ainda não marcadas." />
        <MesaMetricTile label="Histórico" value={availableSessions.length} hint="Episódios recentes já registrados." />
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6">
          <Panel className="rounded-[28px] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Estrutura da sessão</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">
                  {selectedSession ? 'Editar episódio atual' : 'Criar o próximo episódio'}
                </h2>
              </div>
              {selectedSession ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                  {selectedSession.isActive ? 'Sessão em andamento' : 'Sessão pausada'}
                </span>
              ) : null}
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Número do episódio">
                  <Input disabled={!canManage} {...sessionForm.register('episodeNumber')} />
                </Field>
                <Field label="Nome do episódio">
                  <Input disabled={!canManage} {...sessionForm.register('episodeTitle')} />
                </Field>
                <Field label="Data da sessão">
                  <Input disabled={!canManage} type="date" {...sessionForm.register('sessionDate')} />
                </Field>
                <Field label="Status">
                  <Select disabled={!canManage} {...sessionForm.register('status')}>
                    {SESSION_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Local" className="md:col-span-2">
                  <Input disabled={!canManage} {...sessionForm.register('location')} />
                </Field>
                <Field label="Objetivo" className="md:col-span-2">
                  <Textarea disabled={!canManage} {...sessionForm.register('objective')} />
                </Field>
                <Field label="Recap" className="md:col-span-2">
                  <Textarea disabled={!canManage} {...sessionForm.register('recap')} />
                </Field>
                <Field label="Notas internas" className="md:col-span-2">
                  <Textarea disabled={!canManage} {...sessionForm.register('notes')} />
                </Field>
              </div>

              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={sessionForm.formState.isSubmitting}>
                    <Save className="size-4" />
                    {selectedSession ? 'Salvar sessão' : 'Criar sessão'}
                  </Button>
                  {selectedSession ? (
                    selectedSession.isActive ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await endGameSession({ sessionId: selectedSession.id });
                            toast.success('Sessão encerrada.');
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : 'Nao foi possivel encerrar a sessao.');
                          }
                        }}
                      >
                        <Clock3 className="size-4" />
                        Encerrar sessão
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await startGameSession({ sessionId: selectedSession.id });
                            toast.success('Sessão iniciada.');
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : 'Nao foi possivel iniciar a sessao.');
                          }
                        }}
                      >
                        <CalendarDays className="size-4" />
                        Iniciar sessão
                      </Button>
                    )
                  ) : null}
                </div>
              ) : (
                <UtilityPanel className="rounded-[20px] p-4">
                  <p className="text-sm text-soft">Seu papel atual é de leitura operacional. O GM controla criação e edição de sessões.</p>
                </UtilityPanel>
              )}
            </form>
          </Panel>

          <Panel className="rounded-[28px] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Presença</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Confirmação por membro</h2>
              </div>
              {selectedSession ? (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                  {SESSION_ATTENDANCE_STATUS_LABELS[attendanceMap.get(session.membershipId)?.status || 'pending']}
                </span>
              ) : null}
            </div>

            {selectedSession ? (
              <div className="mt-6 grid gap-3">
                {members.map((member) => {
                  const attendance = attendanceMap.get(member.id);
                  const activeStatus = attendance?.status || 'pending';
                  const canUpdateMember = canManage || member.id === session.membershipId;

                  return (
                    <UtilityPanel key={member.id} className="rounded-[22px] p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-base font-semibold text-white">{member.nickname}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                            {formatRoleLabel(member.role)}
                            {member.characterName ? ` · ${member.characterName}` : ''}
                          </p>
                          <p className="mt-2 text-sm text-soft">
                            Marcado como {SESSION_ATTENDANCE_STATUS_LABELS[activeStatus].toLowerCase()}
                            {attendance?.markedAt ? ` em ${formatDateTime(attendance.markedAt)}` : '.'}
                          </p>
                        </div>
                        <AttendanceActions activeStatus={activeStatus} disabled={!canUpdateMember} onChange={(status) => void markAttendance(member, status)} />
                      </div>
                    </UtilityPanel>
                  );
                })}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    disabled={!selectedSession || (!canManage && !attendanceMap.get(session.membershipId))}
                    onClick={async () => {
                      try {
                        await clearSessionAttendance({ sessionId: selectedSession.id });
                        toast.success(canManage ? 'Presenças resetadas.' : 'Sua presença foi limpa.');
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Nao foi possivel limpar a presenca.');
                      }
                    }}
                  >
                    <RotateCcw className="size-4" />
                    {canManage ? 'Limpar presença da sessão' : 'Limpar minha presença'}
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState title="Crie ou selecione uma sessão." body="A presença existe dentro da sessão, não na mesa. Primeiro escolha o episódio em foco." />
            )}
          </Panel>
        </div>

        <div className="page-right-rail">
          <MesaRailCard
            eyebrow="Histórico"
            title="Sessões recentes"
            description="Cada episódio vive dentro da mesa, com fluxo próprio e presença separada."
          >
            {availableSessions.length ? (
              availableSessions.map((entry) => (
                <UtilityPanel key={entry.id} className="rounded-[20px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{entry.episodeTitle || 'Sessão sem título'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                        {entry.episodeNumber || 'Sem número'} · {entry.status}
                      </p>
                      <p className="mt-2 text-sm text-soft">{entry.location || 'Local não informado'}</p>
                    </div>
                    <Button size="sm" variant={selectedSessionId === entry.id ? 'primary' : 'secondary'} onClick={() => setSelectedSessionId(entry.id)}>
                      Selecionar
                    </Button>
                  </div>
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Nenhuma sessão criada." body="O GM pode registrar o primeiro episódio desta mesa aqui." />
            )}
          </MesaRailCard>

          <MesaRailCard
            eyebrow="Resumo"
            title={selectedSession?.episodeTitle || 'Sem sessão em foco'}
            description={selectedSession ? `Última atualização em ${formatDateTime(selectedSession.updatedAt)}.` : 'Selecione uma sessão para ver o resumo rápido do episódio.'}
          >
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Presentes</p>
              <p className="mt-2 text-sm font-semibold text-white">{presentCount}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Ausentes</p>
              <p className="mt-2 text-sm font-semibold text-white">{absentCount}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Sessão ativa</p>
              <p className="mt-2 text-sm font-semibold text-white">{selectedSession?.isActive ? 'Sim' : 'Não'}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Seu papel</p>
              <p className="mt-2 text-sm font-semibold text-white">{formatRoleLabel(session.role)}</p>
            </UtilityPanel>
          </MesaRailCard>

          {!canManage ? (
            <MesaRailCard eyebrow="Participação" title="Presença individual" description="Players e viewers acompanham a sessão aqui; players podem marcar apenas a própria presença.">
              <UtilityPanel className="rounded-[20px] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Seu status</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {SESSION_ATTENDANCE_STATUS_LABELS[attendanceMap.get(session.membershipId)?.status || 'pending']}
                </p>
              </UtilityPanel>
            </MesaRailCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
