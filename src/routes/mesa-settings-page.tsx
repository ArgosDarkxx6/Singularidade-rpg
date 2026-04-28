import { zodResolver } from '@hookform/resolvers/zod';
import { Crown, DoorOpen, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Textarea } from '@components/ui/field';
import { UtilityPanel } from '@components/ui/panel';
import { useAuth } from '@features/auth/hooks/use-auth';
import { MesaKeyValueRow, MesaLeadMeta, MesaPageLead, MesaSectionPanel } from '@features/mesa/components/mesa-page-primitives';
import { useMesaSettings } from '@features/workspace/hooks/use-workspace-segments';
import { ownershipTransferSchema, snapshotSchema, tableMetaSchema } from '@schemas/mesa';

type TableMetaValues = import('zod').infer<typeof tableMetaSchema>;
type SnapshotValues = import('zod').infer<typeof snapshotSchema>;
type OwnershipTransferValues = import('zod').infer<typeof ownershipTransferSchema>;

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
  if (role === 'player') return 'Jogador';
  return 'Visitante';
}

function formatPointLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized === 'snapshot inicial') return 'Ponto inicial';
  if (normalized === 'snapshot manual') return 'Ponto manual';
  return label;
}

export function MesaSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { online, updateTableMeta, createCloudSnapshot, restoreCloudSnapshot, transferTableOwnership, deleteCurrentTable, leaveCurrentTable } =
    useMesaSettings();
  const table = online.table;
  const session = online.session;
  const canManage = session?.role === 'gm';
  const isPrimaryOwner = Boolean(user?.id && table?.ownerId === user.id);
  const [dangerBusy, setDangerBusy] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const metaForm = useForm<TableMetaValues>({
    resolver: zodResolver(tableMetaSchema) as never,
    mode: 'onBlur',
    defaultValues: table?.meta
  });

  const snapshotForm = useForm<SnapshotValues>({
    resolver: zodResolver(snapshotSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      label: 'Ponto manual'
    }
  });

  const transferForm = useForm<OwnershipTransferValues>({
    resolver: zodResolver(ownershipTransferSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      targetUsername: '',
      currentPassword: ''
    }
  });

  useEffect(() => {
    if (table?.meta) {
      metaForm.reset(table.meta);
    }
  }, [metaForm, table?.meta]);

  if (!table || !session) {
    return <EmptyState title="Mesa offline." body="Abra uma mesa válida." />;
  }

  return (
    <div className="page-shell pb-8">
      <MesaPageLead
        eyebrow="Configurações"
        title="Configurações"
        meta={
          <>
            <MesaLeadMeta label="Papel" value={formatRoleLabel(session.role)} accent />
            <MesaLeadMeta label="Pontos" value={table.snapshots.length} />
            <MesaLeadMeta label="Atualizado" value={formatDateTime(table.updatedAt)} />
          </>
        }
        actions={
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await leaveCurrentTable();
                navigate('/mesas');
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Não foi possível sair desta mesa.');
              }
            }}
          >
            <DoorOpen className="size-4" />
            Sair da mesa
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <div className="grid gap-4">
          <MesaSectionPanel eyebrow="Mesa" title="Dados básicos">
            <form
              className="grid gap-4"
              onSubmit={metaForm.handleSubmit(async (values) => {
                try {
                  await updateTableMeta(values);
                  toast.success('Dados salvos.');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Não foi possível salvar os dados.');
                }
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome da mesa">
                  <Input disabled={!canManage} {...metaForm.register('tableName')} />
                </Field>
                <Field label="Série">
                  <Input disabled={!canManage} {...metaForm.register('seriesName')} />
                </Field>
                <Field label="Campanha">
                  <Input disabled={!canManage} {...metaForm.register('campaignName')} />
                </Field>
                <Field label="Vagas">
                  <Input disabled={!canManage} type="number" min={0} {...metaForm.register('slotCount', { valueAsNumber: true })} />
                </Field>
                <Field label="Descrição" className="md:col-span-2">
                  <Textarea disabled={!canManage} {...metaForm.register('description')} />
                </Field>
              </div>

              {canManage ? (
                <Button type="submit" disabled={metaForm.formState.isSubmitting}>
                  <Save className="size-4" />
                  Salvar
                </Button>
              ) : (
                <UtilityPanel className="rounded-[10px] p-4">
                  <p className="text-sm text-soft">Somente GMs podem alterar os dados da mesa.</p>
                </UtilityPanel>
              )}
            </form>
          </MesaSectionPanel>

          <MesaSectionPanel eyebrow="Pontos salvos" title="Restauração">
            {canManage ? (
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={snapshotForm.handleSubmit(async (values) => {
                  try {
                    const result = await createCloudSnapshot(values.label);
                    if (!result) return;
                    toast.success('Ponto salvo.');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o ponto.');
                  }
                })}
              >
                <Input {...snapshotForm.register('label')} />
                <Button type="submit" variant="secondary" disabled={snapshotForm.formState.isSubmitting}>
                  Salvar ponto
                </Button>
              </form>
            ) : null}

            <div className="grid gap-3">
              {table.snapshots.length ? (
                table.snapshots.map((snapshot) => (
                  <UtilityPanel key={snapshot.id} className="rounded-[10px] p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-base font-semibold text-white">{formatPointLabel(snapshot.label)}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          {snapshot.actorName} · {formatDateTime(snapshot.createdAt)}
                        </p>
                      </div>
                      {canManage ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            try {
                              await restoreCloudSnapshot(snapshot.id);
                              toast.success('Ponto restaurado.');
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : 'Não foi possível restaurar o ponto.');
                            }
                          }}
                        >
                          <RefreshCcw className="size-4" />
                          Restaurar
                        </Button>
                      ) : null}
                    </div>
                  </UtilityPanel>
                ))
              ) : (
                <EmptyState title="Nenhum ponto salvo." body="Salve um ponto antes de alterações críticas." />
              )}
            </div>
          </MesaSectionPanel>

          {isPrimaryOwner ? (
            <MesaSectionPanel eyebrow="Área crítica" title="Administração" className="border border-rose-300/18 bg-rose-500/10">
              <div className="grid gap-4 xl:grid-cols-2">
                <UtilityPanel className="rounded-[10px] p-4">
                  <p className="text-sm font-semibold text-white">Transferir administração</p>
                  <form
                    className="mt-4 grid gap-3"
                    onSubmit={transferForm.handleSubmit(async (values) => {
                      setDangerBusy(true);
                      try {
                        await transferTableOwnership({
                          targetUsername: values.targetUsername,
                          currentPassword: values.currentPassword
                        });
                        transferForm.reset();
                        toast.success('Administração transferida.');
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Não foi possível transferir a administração.');
                      } finally {
                        setDangerBusy(false);
                      }
                    })}
                  >
                    <Field label="Username de destino" error={transferForm.formState.errors.targetUsername?.message}>
                      <Input autoComplete="off" placeholder="usuario_destino" {...transferForm.register('targetUsername')} />
                    </Field>
                    <Field label="Sua senha atual" error={transferForm.formState.errors.currentPassword?.message}>
                      <Input type="password" autoComplete="current-password" {...transferForm.register('currentPassword')} />
                    </Field>
                    <Button className="mt-1" type="submit" variant="secondary" disabled={dangerBusy || transferForm.formState.isSubmitting}>
                      <Crown className="size-4" />
                      Transferir
                    </Button>
                  </form>
                </UtilityPanel>

                <UtilityPanel className="rounded-[10px] p-4">
                  <p className="text-sm font-semibold text-white">Excluir mesa</p>
                  <p className="mt-2 text-sm text-soft">
                    Digite <span className="font-semibold text-white">{table.name}</span> para confirmar.
                  </p>
                  <Field label="Confirmação" className="mt-4">
                    <Input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} />
                  </Field>
                  <Button
                    className="mt-4"
                    variant="danger"
                    disabled={dangerBusy || deleteConfirmation !== table.name}
                    onClick={async () => {
                      setDangerBusy(true);
                      try {
                        await deleteCurrentTable();
                        toast.success('Mesa excluída.');
                        navigate('/mesas');
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a mesa.');
                      } finally {
                        setDangerBusy(false);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                    Excluir mesa
                  </Button>
                </UtilityPanel>
              </div>
            </MesaSectionPanel>
          ) : null}
        </div>

        <div className="grid gap-4">
          <MesaSectionPanel eyebrow="Resumo" title={table.name}>
            <MesaKeyValueRow label="Seu papel" value={formatRoleLabel(session.role)} />
            <MesaKeyValueRow label="Sessão" value={table.currentSession?.status || 'Sem sessão ativa'} />
            <MesaKeyValueRow label="Sistema" value={table.systemKey} />
          </MesaSectionPanel>
        </div>
      </div>
    </div>
  );
}
