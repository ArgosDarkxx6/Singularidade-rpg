import { zodResolver } from '@hookform/resolvers/zod';
import { DoorOpen, RefreshCcw, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { useWorkspace } from '@features/workspace/use-workspace';
import { TABLE_STATUS_OPTIONS } from '@lib/domain/constants';
import { snapshotSchema, tableMetaSchema } from '@schemas/mesa';

type TableMetaValues = import('zod').infer<typeof tableMetaSchema>;
type SnapshotValues = import('zod').infer<typeof snapshotSchema>;

function formatDateTime(value: string) {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function MesaSettingsPage() {
  const navigate = useNavigate();
  const { online, updateTableMeta, createCloudSnapshot, restoreCloudSnapshot, leaveCurrentTable } = useWorkspace();
  const table = online.table;
  const session = online.session;
  const canManage = session?.role === 'gm';

  const metaForm = useForm<TableMetaValues>({
    resolver: zodResolver(tableMetaSchema) as never,
    mode: 'onBlur',
    defaultValues: table?.meta
  });

  const snapshotForm = useForm<SnapshotValues>({
    resolver: zodResolver(snapshotSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      label: 'Snapshot manual'
    }
  });

  useEffect(() => {
    if (table?.meta) {
      metaForm.reset(table.meta);
    }
  }, [metaForm, table?.meta]);

  if (!table || !session) {
    return <EmptyState title="Mesa offline." body="Abra uma mesa válida para editar configurações e snapshots." />;
  }

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Configurações da mesa"
        title="Administração, metadados e segurança"
        description="Separe aqui o que é estrutural da campanha: cabeçalho, objetivo da sessão, snapshots e saída da mesa."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <div className="grid gap-6">
          <Panel className="rounded-[28px] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Metadados</p>
            <h2 className="mt-2 font-display text-4xl leading-none text-white">Identidade e briefing da mesa</h2>
            <p className="mt-3 text-sm leading-6 text-soft">
              O cabeçalho da mesa alimenta overview, right rail e contexto para quem entra no servidor.
            </p>

            <form
              className="mt-6 grid gap-4"
              onSubmit={metaForm.handleSubmit(async (values) => {
                await updateTableMeta(values);
                toast.success('Metadados atualizados.');
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
                <Field label="Status">
                  <Select disabled={!canManage} {...metaForm.register('status')}>
                    {TABLE_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Episódio">
                  <Input disabled={!canManage} {...metaForm.register('episodeNumber')} />
                </Field>
                <Field label="Título do episódio">
                  <Input disabled={!canManage} {...metaForm.register('episodeTitle')} />
                </Field>
                <Field label="Data da sessão">
                  <Input disabled={!canManage} type="date" {...metaForm.register('sessionDate')} />
                </Field>
                <Field label="Local">
                  <Input disabled={!canManage} {...metaForm.register('location')} />
                </Field>
                <Field label="Elenco esperado" className="md:col-span-2">
                  <Textarea disabled={!canManage} {...metaForm.register('expectedRoster')} />
                </Field>
                <Field label="Recap" className="md:col-span-2">
                  <Textarea disabled={!canManage} {...metaForm.register('recap')} />
                </Field>
                <Field label="Objetivo" className="md:col-span-2">
                  <Textarea disabled={!canManage} {...metaForm.register('objective')} />
                </Field>
              </div>

              {canManage ? (
                <Button type="submit" disabled={metaForm.formState.isSubmitting}>
                  <Save className="size-4" />
                  Salvar configurações
                </Button>
              ) : (
                <UtilityPanel className="rounded-[20px] p-4">
                  <p className="text-sm text-soft">Seu papel atual é de leitura. Apenas GMs podem alterar metadados e controlar snapshots.</p>
                </UtilityPanel>
              )}
            </form>
          </Panel>

          <Panel className="rounded-[28px] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Snapshots</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Restauração e versionamento</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                {table.snapshots.length} salvos
              </span>
            </div>

            {canManage ? (
              <form
                className="mt-6 flex flex-col gap-3 sm:flex-row"
                onSubmit={snapshotForm.handleSubmit(async (values) => {
                  const result = await createCloudSnapshot(values.label);
                  if (!result) return;
                  toast.success('Snapshot salvo.');
                })}
              >
                <Input {...snapshotForm.register('label')} />
                <Button type="submit" variant="secondary" disabled={snapshotForm.formState.isSubmitting}>
                  Salvar snapshot
                </Button>
              </form>
            ) : null}

            <div className="mt-6 grid gap-3">
              {table.snapshots.length ? (
                table.snapshots.map((snapshot) => (
                  <UtilityPanel key={snapshot.id} className="rounded-[22px] p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-base font-semibold text-white">{snapshot.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                          {snapshot.actorName} · {formatDateTime(snapshot.createdAt)}
                        </p>
                      </div>
                      {canManage ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            await restoreCloudSnapshot(snapshot.id);
                            toast.success('Snapshot restaurado.');
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
                <EmptyState title="Nenhum snapshot salvo." body="Salve um ponto de restauração antes de alterações críticas na campanha." />
              )}
            </div>
          </Panel>
        </div>

        <div className="page-right-rail">
          <MesaRailCard eyebrow="Sessão atual" title={table.name} description={`Último sync em ${formatDateTime(table.updatedAt)}.`}>
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Seu papel</p>
              <p className="mt-2 text-sm font-semibold capitalize text-white">{session.role}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-[20px] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status da campanha</p>
              <p className="mt-2 text-sm font-semibold text-white">{table.meta.status || 'Planejamento'}</p>
            </UtilityPanel>
          </MesaRailCard>

          <MesaRailCard
            eyebrow="Saída"
            title="Deixar esta mesa"
            description="Saia do servidor atual quando quiser. O fluxo limpa a sessão da mesa e devolve você ao portal."
          >
            <Button
              variant="danger"
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
          </MesaRailCard>
        </div>
      </div>
    </div>
  );
}
