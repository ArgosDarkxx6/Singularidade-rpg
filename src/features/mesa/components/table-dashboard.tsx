import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Link2, RefreshCcw, Save, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { TABLE_STATUS_OPTIONS } from '@lib/domain/constants';
import { formatJoinCodeDisplay } from '@lib/domain/utils';
import { inviteLinkSchema, joinCodeCreateSchema, snapshotSchema, tableMetaSchema } from '@schemas/mesa';
import { copyText } from '@lib/domain/utils';
import { useWorkspace } from '@features/workspace/use-workspace';

type TableMetaValues = import('zod').infer<typeof tableMetaSchema>;
type InviteLinkValues = import('zod').infer<typeof inviteLinkSchema>;
type JoinCodeCreateValues = import('zod').infer<typeof joinCodeCreateSchema>;
type SnapshotValues = import('zod').infer<typeof snapshotSchema>;

export function TableDashboard() {
  const { state, online, updateTableMeta, createInviteLink, createJoinCode, revokeJoinCode, createCloudSnapshot, restoreCloudSnapshot } = useWorkspace();
  const table = online.table;
  const session = online.session;
  const canManage = session?.role === 'gm';
  const canWrite = session?.role !== 'viewer';

  const metaForm = useForm<TableMetaValues>({
    resolver: zodResolver(tableMetaSchema) as never,
    mode: 'onChange',
    defaultValues: table?.meta
  });

  const inviteForm = useForm<InviteLinkValues>({
    resolver: zodResolver(inviteLinkSchema) as never,
    mode: 'onChange',
    defaultValues: {
      role: 'player',
      characterId: '',
      label: 'Convite de mesa'
    }
  });

  const codeForm = useForm<JoinCodeCreateValues>({
    resolver: zodResolver(joinCodeCreateSchema) as never,
    mode: 'onChange',
    defaultValues: {
      role: 'viewer',
      characterId: '',
      label: 'Codigo rapido'
    }
  });

  const snapshotForm = useForm<SnapshotValues>({
    resolver: zodResolver(snapshotSchema) as never,
    mode: 'onChange',
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
    return <EmptyState title="Nenhuma mesa conectada." body="Crie uma mesa nova ou entre por convite/codigo para ativar o dashboard online." />;
  }

  return (
    <div className="grid gap-6">
      <Card className="p-6">
        <SectionTitle
          eyebrow="Mesa ativa"
          title={table.name}
          description={`Slug ${table.slug} · ultimo sync ${new Date(table.updatedAt).toLocaleString('pt-BR')}`}
          actions={
            <Button
              variant="secondary"
              onClick={async () => {
                await copyText(`${window.location.origin}/mesa/${table.slug}`);
                toast.success('Link da mesa copiado.');
              }}
            >
              <Copy className="size-4" />
              Copiar rota
            </Button>
          }
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Presenca</p>
            <div className="mt-3 grid gap-3">
              {online.members.length ? (
                online.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{member.nickname}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        {member.role} {member.characterName ? `· ${member.characterName}` : ''}
                      </p>
                    </div>
                    <Users className="size-4 text-sky-200" />
                  </div>
                ))
              ) : (
                <EmptyState title="Sem presenca remota." body="A mesa esta online, mas ainda nao recebeu outros acessos ativos." />
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/4 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Estado compartilhado</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Personagens</p>
                <p className="mt-2 text-lg font-semibold">{state.characters.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Snapshots</p>
                <p className="mt-2 text-lg font-semibold">{table.snapshots.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Join codes</p>
                <p className="mt-2 text-lg font-semibold">{table.joinCodes.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Papel atual</p>
                <p className="mt-2 text-lg font-semibold">{session.role}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="p-6">
          <SectionTitle
            eyebrow="Metadados"
            title="Sessao e campanha"
            description="Ajuste o cabeçalho da mesa, recapitulação e objetivo. Jogadores e viewers enxergam esses dados em leitura."
            actions={canManage ? <ShieldCheck className="size-4 text-sky-200" /> : <UserCog className="size-4 text-amber-200" />}
          />

          <form
            className="mt-6 grid gap-4 md:grid-cols-2"
            onSubmit={metaForm.handleSubmit(async (values) => {
              await updateTableMeta(values);
              toast.success('Metadados da mesa atualizados.');
            })}
          >
            <Field label="Nome da mesa">
              <Input disabled={!canManage} {...metaForm.register('tableName')} />
            </Field>
            <Field label="Serie">
              <Input disabled={!canManage} {...metaForm.register('seriesName')} />
            </Field>
            <Field label="Campanha">
              <Input disabled={!canManage} {...metaForm.register('campaignName')} />
            </Field>
            <Field label="Episodio">
              <Input disabled={!canManage} {...metaForm.register('episodeNumber')} />
            </Field>
            <Field label="Titulo do episodio">
              <Input disabled={!canManage} {...metaForm.register('episodeTitle')} />
            </Field>
            <Field label="Data da sessao">
              <Input disabled={!canManage} type="date" {...metaForm.register('sessionDate')} />
            </Field>
            <Field label="Local">
              <Input disabled={!canManage} {...metaForm.register('location')} />
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
            <Field label="Elenco esperado" className="md:col-span-2">
              <Textarea disabled={!canManage} {...metaForm.register('expectedRoster')} />
            </Field>
            <Field label="Recap" className="md:col-span-2">
              <Textarea disabled={!canManage} {...metaForm.register('recap')} />
            </Field>
            <Field label="Objetivo" className="md:col-span-2">
              <Textarea disabled={!canManage} {...metaForm.register('objective')} />
            </Field>
            {canManage ? (
              <div className="md:col-span-2">
                <Button type="submit" disabled={!metaForm.formState.isValid || metaForm.formState.isSubmitting}>
                  <Save className="size-4" />
                  Salvar metadados
                </Button>
              </div>
            ) : null}
          </form>
        </Card>

        <div className="grid gap-6">
          <Card className="p-6">
            <SectionTitle eyebrow="Convites" title="Links e codigos" description="Gere acessos por papel, copie URLs ou revogue codigos ativos quando preciso." />

            {canManage ? (
              <div className="mt-5 grid gap-6">
                <form
                  className="grid gap-4"
                  onSubmit={inviteForm.handleSubmit(async (values) => {
                    const invite = await createInviteLink(values);
                    if (invite) {
                      await copyText(invite);
                      toast.success('Convite criado e copiado.');
                    }
                  })}
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Papel">
                      <Select {...inviteForm.register('role')}>
                        <option value="player">Player</option>
                        <option value="viewer">Viewer</option>
                        <option value="gm">GM</option>
                      </Select>
                    </Field>
                    <Field label="Personagem vinculado">
                      <Select {...inviteForm.register('characterId')}>
                        <option value="">Sem vinculo</option>
                        {state.characters.map((character) => (
                          <option key={character.id} value={character.id}>
                            {character.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Rotulo">
                      <Input {...inviteForm.register('label')} />
                    </Field>
                  </div>
                  <Button type="submit" disabled={!inviteForm.formState.isValid}>
                    <Link2 className="size-4" />
                    Criar convite
                  </Button>
                </form>

                <form
                  className="grid gap-4"
                  onSubmit={codeForm.handleSubmit(async (values) => {
                    const code = await createJoinCode(values);
                    if (code) toast.success(`Codigo ${formatJoinCodeDisplay(code.code)} criado.`);
                  })}
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Papel">
                      <Select {...codeForm.register('role')}>
                        <option value="viewer">Viewer</option>
                        <option value="player">Player</option>
                        <option value="gm">GM</option>
                      </Select>
                    </Field>
                    <Field label="Personagem vinculado">
                      <Select {...codeForm.register('characterId')}>
                        <option value="">Escolha na entrada</option>
                        {state.characters.map((character) => (
                          <option key={character.id} value={character.id}>
                            {character.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Rotulo">
                      <Input {...codeForm.register('label')} />
                    </Field>
                  </div>
                  <Button type="submit" variant="secondary" disabled={!codeForm.formState.isValid}>
                    Gerar codigo
                  </Button>
                </form>
              </div>
            ) : (
              <p className="mt-4 text-sm text-soft">Seu papel atual e de leitura. Apenas o mestre pode gerar convites, codigos e editar o cabeçalho da mesa.</p>
            )}

            <div className="mt-5 grid gap-3">
              {table.joinCodes.length ? (
                table.joinCodes.map((joinCode) => (
                  <div key={joinCode.id} className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{joinCode.label}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">{formatJoinCodeDisplay(joinCode.code)}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-soft">{joinCode.role}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={async () => {
                          await copyText(joinCode.code);
                          toast.success('Codigo copiado.');
                        }}
                      >
                        Copiar
                      </Button>
                      {canManage ? (
                        <Button size="sm" variant="danger" type="button" onClick={async () => {
                          await revokeJoinCode(joinCode.id);
                        }}>
                          Revogar
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="Nenhum codigo ativo." body="Gere um codigo acima para permitir acesso rapido por viewer, player ou GM." />
              )}
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle eyebrow="Snapshots" title="Restore e segurança" description="Capture o estado da mesa e restaure versões anteriores quando for necessário." />

            {canWrite ? (
              <form
                className="mt-5 flex flex-col gap-3 sm:flex-row"
                onSubmit={snapshotForm.handleSubmit(async (values) => {
                  const result = await createCloudSnapshot(values.label);
                  if (result) toast.success('Snapshot salvo.');
                })}
              >
                <Input {...snapshotForm.register('label')} />
                <Button type="submit" variant="secondary">
                  Salvar snapshot
                </Button>
              </form>
            ) : null}

            <div className="mt-5 grid gap-3">
              {table.snapshots.length ? (
                table.snapshots.map((snapshot) => (
                  <div key={snapshot.id} className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{snapshot.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-soft">
                        {snapshot.actorName} · {new Date(snapshot.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {canManage ? (
                      <Button size="sm" variant="secondary" type="button" onClick={async () => {
                        await restoreCloudSnapshot(snapshot.id);
                        toast.success('Snapshot restaurado.');
                      }}>
                        <RefreshCcw className="size-4" />
                        Restaurar
                      </Button>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState title="Nenhum snapshot salvo." body="O primeiro snapshot manual pode ser criado agora mesmo." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
