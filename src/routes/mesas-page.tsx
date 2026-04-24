import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, DoorOpen, Plus, RadioTower, Shield, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
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
  if (role === 'player') return 'Player';
  return 'Viewer';
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
  const {
    tables,
    online,
    createTableSession,
    connectToInvite,
    connectToJoinCode,
    switchTable
  } = usePlatformTables();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [openingTableSlug, setOpeningTableSlug] = useState<string | null>(null);
  const [tableActionError, setTableActionError] = useState('');
  const defaultNickname = user?.displayName || user?.username || 'Feiticeiro';

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

  const currentOrLatestTable = online.session
    ? tables.find((table) => table.slug === online.session?.tableSlug) || tables[0]
    : tables[0];
  const currentOrLatestSystem = currentOrLatestTable ? getGameSystem(currentOrLatestTable.systemKey) : null;

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
    <div className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <Panel className="rounded-3xl p-6 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Portal de mesas</p>
              <h2 className="mt-3 text-balance font-display text-5xl leading-none text-white sm:text-6xl">Central de comando</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-soft sm:text-base">
                Crie campanhas, retome mesas ativas e entre por convite sem depender de telas isoladas. O hub agora concentra leitura, contexto e ação.
              </p>
            </div>
            <div className="grid min-w-[240px] gap-2">
              <Button
                onClick={() => {
                  createForm.reset(buildCreateDefaults(defaultNickname));
                  setCreateOpen(true);
                }}
              >
                <Plus className="size-4" />
                Criar mesa
              </Button>
              <Button variant="secondary" onClick={() => setJoinOpen(true)}>
                <DoorOpen className="size-4" />
                Entrar em mesa
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <UtilityPanel className="rounded-2xl px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesas</p>
              <p className="mt-2 text-lg font-semibold text-white">{tables.length}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-2xl px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Conectada</p>
              <p className="mt-2 text-lg font-semibold text-white">{online.session ? online.session.tableName : 'Nenhuma'}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-2xl px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Sistemas ativos</p>
              <p className="mt-2 text-lg font-semibold text-white">{GAME_SYSTEM_OPTIONS.filter((system) => system.status === 'enabled').length}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-2xl px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Seu acesso</p>
              <p className="mt-2 text-lg font-semibold text-white">{user?.displayName || user?.username || 'Conta ativa'}</p>
            </UtilityPanel>
          </div>
        </Panel>

        <Panel className="rounded-3xl p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Retomar agora</p>
              <h3 className="mt-2 font-display text-4xl leading-none text-white">Mesa em foco</h3>
            </div>
            <RadioTower className="size-5 text-sky-200" />
          </div>

          {currentOrLatestTable ? (
            <div className="mt-6 grid gap-3">
              <UtilityPanel className="rounded-2xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesa</p>
                <p className="mt-2 text-xl font-semibold text-white">{currentOrLatestTable.name}</p>
                <p className="mt-2 text-sm text-soft">
                  {currentOrLatestSystem?.name || 'Sistema'} · {currentOrLatestTable.seriesName || 'Sem série'} · {currentOrLatestTable.campaignName || 'Sem campanha'}
                </p>
              </UtilityPanel>
              <UtilityPanel className="rounded-2xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
                <p className="mt-2 text-base font-semibold text-white">{currentOrLatestTable.status || 'Planejamento'}</p>
              </UtilityPanel>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button disabled={openingTableSlug === currentOrLatestTable.slug} onClick={() => void handleContinueTable(currentOrLatestTable.slug)}>
                  <ArrowRight className="size-4" />
                  {openingTableSlug === currentOrLatestTable.slug ? 'Abrindo...' : 'Continuar'}
                </Button>
                <Button variant="secondary" onClick={() => setJoinOpen(true)}>
                  <Compass className="size-4" />
                  Entrar em outra
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState title="Nenhuma mesa pronta." body="Crie a primeira campanha ou entre usando um código ou convite." />
            </div>
          )}
        </Panel>
      </section>

      {tableActionError ? (
        <UtilityPanel className="rounded-2xl border border-rose-300/18 bg-rose-500/10 px-4 py-4">
          <p className="text-sm leading-6 text-soft">{tableActionError}</p>
        </UtilityPanel>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
        <Panel className="rounded-3xl p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Suas mesas</p>
              <h3 className="mt-2 font-display text-4xl leading-none text-white">Campanhas e espaços ativos</h3>
            </div>
            <Button variant="secondary" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Nova mesa
            </Button>
          </div>

          <div className="mt-6 grid gap-3">
            {tables.length ? (
              tables.map((table, index) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 transition hover:border-sky-300/18 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-sky-300/18 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                          {formatRoleLabel(table.role)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                          {getGameSystem(table.systemKey).name}
                        </span>
                        {table.isOwner ? (
                          <span className="rounded-full border border-amber-300/18 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100">
                            Criador
                          </span>
                        ) : null}
                      </div>
                      <h4 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">{table.name}</h4>
                      <p className="mt-2 text-sm leading-6 text-soft">
                        {table.seriesName || 'Sem série'} · {table.campaignName || 'Sem campanha'} · atualizado em {formatDate(table.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={openingTableSlug === table.slug} onClick={() => void handleContinueTable(table.slug)}>
                        <ArrowRight className="size-4" />
                        {openingTableSlug === table.slug ? 'Abrindo...' : 'Abrir mesa'}
                      </Button>
                      {online.session?.tableSlug === table.slug ? (
                        <Button variant="secondary" onClick={() => navigate(`/mesa/${table.slug}`)}>
                          Sessão ativa
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <EmptyState title="Você ainda não participa de nenhuma mesa." body="Crie uma campanha ou entre usando um código de convite." />
            )}
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel className="rounded-3xl p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Sistemas ativos</p>
            <h3 className="mt-2 font-display text-4xl leading-none text-white">Camada de jogo</h3>
            <div className="mt-6 grid gap-3">
              <UtilityPanel className="rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 size-4 text-sky-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">Singularidade disponível</p>
                    <p className="mt-1 text-sm leading-6 text-soft">O primeiro sistema ativo já está pronto para novas mesas e campanhas.</p>
                  </div>
                </div>
              </UtilityPanel>
              <UtilityPanel className="rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 size-4 text-sky-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">Controle por papel</p>
                    <p className="mt-1 text-sm leading-6 text-soft">GM administra. Players operam fichas. Viewers acompanham com leitura controlada.</p>
                  </div>
                </div>
              </UtilityPanel>
              <UtilityPanel className="rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <RadioTower className="mt-0.5 size-4 text-sky-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">Estado compartilhado</p>
                    <p className="mt-1 text-sm leading-6 text-soft">Presença, snapshots, códigos e sessão ficam centralizados na mesa ativa.</p>
                  </div>
                </div>
              </UtilityPanel>
            </div>
          </Panel>

          <Panel className="rounded-3xl p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Sessão conectada</p>
            <h3 className="mt-2 font-display text-4xl leading-none text-white">Status atual</h3>
            <div className="mt-6 grid gap-3">
              <UtilityPanel className="rounded-2xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesa</p>
                <p className="mt-2 text-base font-semibold text-white">{online.session ? online.session.tableName : 'Nenhuma conectada'}</p>
              </UtilityPanel>
              <UtilityPanel className="rounded-2xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Seu papel</p>
                <p className="mt-2 text-base font-semibold text-white">{online.session ? formatRoleLabel(online.session.role) : 'Sem sessão'}</p>
              </UtilityPanel>
              <UtilityPanel className="rounded-2xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Membros online</p>
                <p className="mt-2 text-base font-semibold text-white">{online.members.length || 0}</p>
              </UtilityPanel>
            </div>
          </Panel>
        </div>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogTitle className="font-display text-4xl text-white">Criar uma mesa</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">Ao concluir, você entra como GM.</DialogDescription>

          <form className="mt-6 grid gap-4" onSubmit={handleCreateTable}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome de presença">
                <Input {...createForm.register('nickname')} />
              </Field>
              <Field label="Sistema" hint="Apenas Singularidade está habilitado agora.">
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

            <UtilityPanel className="grid gap-4 rounded-2xl border border-sky-300/18 bg-sky-500/10 p-4 sm:grid-cols-[96px_minmax(0,1fr)]">
              <img src={selectedSystem.assets.cover} alt={selectedSystem.name} className="h-24 w-full rounded-xl object-cover sm:w-24" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Sistema selecionado</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{selectedSystem.name}</h3>
                <p className="mt-2 text-sm leading-6 text-soft">{selectedSystem.tagline}</p>
              </div>
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
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogTitle className="font-display text-4xl text-white">Entrar em uma mesa</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">Use um código ou cole o link recebido.</DialogDescription>

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
