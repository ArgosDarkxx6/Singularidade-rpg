import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Compass, DoorOpen, Plus, RadioTower } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { NexusPageHeader, NexusPanel, NexusSectionHeader } from '@components/ui/nexus';
import { UtilityPanel } from '@components/ui/panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { useAuth } from '@features/auth/hooks/use-auth';
import { usePlatformTables } from '@features/workspace/hooks/use-workspace-segments';
import { GAME_SYSTEM_OPTIONS, getDefaultTableMetaForSystem, getGameSystem } from '@features/systems/registry';
import { createTableSchema, joinCodeSchema, joinInviteSchema } from '@schemas/mesa';

type CreateTableValues = import('zod').infer<typeof createTableSchema>;
type JoinCodeValues = import('zod').infer<typeof joinCodeSchema>;
type JoinInviteValues = import('zod').infer<typeof joinInviteSchema>;

function formatRoleLabel(role: 'gm' | 'player' | 'viewer') {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Jogador';
  return 'Visitante';
}

function formatDate(value: string) {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function buildCreateDefaults(nickname: string): CreateTableValues {
  const systemKey = 'singularidade';

  return {
    nickname,
    systemKey,
    meta: getDefaultTableMetaForSystem(systemKey)
  };
}

export function MesasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tables, online, createTableSession, connectToInvite, connectToJoinCode, switchTable } = usePlatformTables();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [openingTableSlug, setOpeningTableSlug] = useState<string | null>(null);
  const [tableActionError, setTableActionError] = useState('');
  const defaultNickname = user?.displayName || user?.username || 'Jogador';

  const createForm = useForm<CreateTableValues>({
    resolver: zodResolver(createTableSchema) as never,
    mode: 'onBlur',
    defaultValues: buildCreateDefaults(defaultNickname)
  });

  const codeForm = useForm<JoinCodeValues>({
    resolver: zodResolver(joinCodeSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      code: '',
      nickname: defaultNickname
    }
  });

  const inviteForm = useForm<JoinInviteValues>({
    resolver: zodResolver(joinInviteSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      inviteUrl: '',
      nickname: defaultNickname
    }
  });

  const selectedSystem = getGameSystem(createForm.watch('systemKey'));
  const activeTable = online.session ? tables.find((table) => table.slug === online.session?.tableSlug) || tables[0] : tables[0] || null;

  const handleContinueTable = async (slug: string) => {
    setOpeningTableSlug(slug);
    setTableActionError('');
    try {
      const session = await switchTable(slug);
      if (!session) {
        setTableActionError('A mesa não respondeu com uma sessão válida. Tente novamente.');
        return;
      }

      navigate(`/mesa/${session.tableSlug}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível abrir esta mesa.';
      setTableActionError(message);
      toast.error(message);
    } finally {
      setOpeningTableSlug(null);
    }
  };

  const handleCreateTable = createForm.handleSubmit(async (values) => {
    try {
      const session = await createTableSession(values.meta, values.nickname, undefined, values.systemKey);
      if (!session) return;

      setCreateOpen(false);
      createForm.reset(buildCreateDefaults(defaultNickname));
      toast.success('Mesa criada com sucesso.');
      navigate(`/mesa/${session.tableSlug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar a mesa.');
    }
  });

  const handleJoinCode = codeForm.handleSubmit(async (values) => {
    try {
      const result = await connectToJoinCode(values.code, values.nickname);
      if (result.connected && result.session) {
        setJoinOpen(false);
        toast.success('Entrada na mesa concluída.');
        navigate(`/mesa/${result.session.tableSlug}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível entrar com este código.');
    }
  });

  const handleJoinInvite = inviteForm.handleSubmit(async (values) => {
    try {
      const session = await connectToInvite(values.inviteUrl, values.nickname);
      if (!session) return;
      setJoinOpen(false);
      toast.success('Convite aceito.');
      navigate(`/mesa/${session.tableSlug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível usar este convite.');
    }
  });

  return (
    <div className="grid items-start gap-3 pb-8 xl:grid-cols-[minmax(0,1.6fr)_304px]">
      <div className="grid gap-3">
        <NexusPageHeader
          kicker="Mesas"
          title="Campanhas ativas"
          actions={
            <>
              <Button
                data-action="create-table"
                onClick={() => {
                  createForm.reset(buildCreateDefaults(defaultNickname));
                  setCreateOpen(true);
                }}
              >
                <Plus className="size-4" />
                Nova mesa
              </Button>
              <Button data-action="join-table" variant="secondary" onClick={() => setJoinOpen(true)}>
                <DoorOpen className="size-4" />
                Entrar
              </Button>
            </>
          }
        />

        {tableActionError ? (
          <UtilityPanel className="rounded-[9px] border border-rose-300/18 bg-rose-500/10 px-3.5 py-3">
            <p className="text-sm leading-6 text-soft">{tableActionError}</p>
          </UtilityPanel>
        ) : null}

        <NexusPanel>
          <div className="grid gap-2.5">
            {tables.length ? (
              tables.map((table) => (
                <div
                  key={table.id}
                  className="nexus-row px-3 py-2.5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip-accent inline-flex rounded-[8px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                          {formatRoleLabel(table.role)}
                        </span>
                        <span className="chip-muted inline-flex rounded-[8px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                          {getGameSystem(table.systemKey).name}
                        </span>
                        {table.isOwner ? (
                          <span className="chip-muted inline-flex rounded-[8px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                            Criador
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-2 font-display text-base font-semibold leading-tight text-white sm:text-lg">{table.name}</h2>
                      <p className="mt-1.5 text-sm leading-6 text-soft">
                        {table.seriesName || 'Sem série'} · {table.campaignName || 'Sem campanha'} · atualizado em {formatDate(table.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={openingTableSlug === table.slug} onClick={() => void handleContinueTable(table.slug)}>
                        <ArrowRight className="size-4" />
                        {openingTableSlug === table.slug ? 'Abrindo...' : 'Abrir mesa'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Nenhuma mesa ainda." body="Crie uma campanha ou entre por convite." />
            )}
          </div>
        </NexusPanel>
      </div>

      <div className="page-right-rail xl:grid-cols-1">
        <NexusPanel>
          <NexusSectionHeader kicker="Mesa ativa" title={activeTable?.name || 'Nenhuma mesa aberta'} actions={<RadioTower className="size-4 text-accent" />} />
          <div className="mt-4 grid gap-2">
            {activeTable ? (
              <>
                <UtilityPanel className="rounded-[9px] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
                  <p className="mt-1 text-sm font-semibold text-white">{activeTable.status || 'Planejamento'}</p>
                </UtilityPanel>
                <UtilityPanel className="rounded-[9px] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Seu papel</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatRoleLabel(activeTable.role)}</p>
                </UtilityPanel>
                <Button onClick={() => void handleContinueTable(activeTable.slug)}>Abrir mesa</Button>
              </>
            ) : (
              <EmptyState title="Sem mesa aberta." body="Entre em uma mesa." />
            )}
          </div>
        </NexusPanel>

        <NexusPanel>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Entrar</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Código ou convite</h2>
          <div className="mt-4 grid gap-2">
            <UtilityPanel className="rounded-[9px] px-3 py-2.5">
              <p className="text-sm leading-6 text-soft">Código ou link de convite.</p>
            </UtilityPanel>
            <Button variant="secondary" onClick={() => setJoinOpen(true)}>
              <Compass className="size-4" />
              Abrir entrada
            </Button>
          </div>
        </NexusPanel>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-xl">
          <DialogTitle className="font-display text-2xl text-white">Criar mesa</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">Ao concluir, você entra como GM.</DialogDescription>

          <form className="mt-6 grid gap-4" onSubmit={handleCreateTable}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome de presença">
                <Input {...createForm.register('nickname')} />
              </Field>
              <Field label="Sistema">
                <Select {...createForm.register('systemKey')} aria-label="Sistema da mesa">
                  {GAME_SYSTEM_OPTIONS.map((system) => (
                    <option key={system.key} value={system.key} disabled={system.status !== 'enabled'}>
                      {system.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Nome da mesa">
                <Input {...createForm.register('meta.tableName')} />
              </Field>
              <Field label="Série">
                <Input {...createForm.register('meta.seriesName')} />
              </Field>
              <Field label="Campanha">
                <Input {...createForm.register('meta.campaignName')} />
              </Field>
              <Field label="Vagas">
                <Input type="number" min={0} {...createForm.register('meta.slotCount', { valueAsNumber: true })} />
              </Field>
              <Field label="Descrição" className="md:col-span-2">
                <Textarea {...createForm.register('meta.description')} />
              </Field>
            </div>

            <UtilityPanel className="rounded-lg border border-blue-300/16 bg-blue-500/10 p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">Sistema</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{selectedSystem.name}</h3>
              <p className="mt-2 text-sm leading-6 text-soft">{selectedSystem.tagline}</p>
            </UtilityPanel>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="lg" disabled={createForm.formState.isSubmitting}>
                {createForm.formState.isSubmitting ? 'Criando…' : 'Criar e entrar'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-xl">
          <DialogTitle className="font-display text-2xl text-white">Entrar em uma mesa</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">Use um código ou o link recebido.</DialogDescription>

          <Tabs defaultValue="codigo" className="mt-6">
            <TabsList>
              <TabsTrigger value="codigo">Código</TabsTrigger>
              <TabsTrigger value="convite">Convite</TabsTrigger>
            </TabsList>

            <TabsContent value="codigo" className="mt-5">
              <form className="grid gap-4" onSubmit={handleJoinCode}>
                <Field label="Código da mesa">
                  <Input placeholder="123456" {...codeForm.register('code')} />
                </Field>
                <Field label="Apelido da sessão">
                  <Input {...codeForm.register('nickname')} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="lg" disabled={codeForm.formState.isSubmitting}>
                    Entrar por código
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setJoinOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="convite" className="mt-5">
              <form className="grid gap-4" onSubmit={handleJoinInvite}>
                <Field label="URL de convite">
                  <Input placeholder="https://..." {...inviteForm.register('inviteUrl')} />
                </Field>
                <Field label="Apelido da sessão">
                  <Input {...inviteForm.register('nickname')} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="lg" disabled={inviteForm.formState.isSubmitting}>
                    Entrar por convite
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setJoinOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
