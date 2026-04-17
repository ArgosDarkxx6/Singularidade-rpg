import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, DoorOpen, Plus, RadioTower, Shield, Sparkles, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { MesaHero, MesaMetricTile, MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { hasMeaningfulLegacyWorkspace } from '@features/mesa/lib/legacy-workspace';
import { useWorkspace } from '@features/workspace/use-workspace';
import { GAME_SYSTEM_OPTIONS, getDefaultTableMetaForSystem, getGameSystem } from '@features/systems/registry';
import { LEGACY_MIGRATION_DISMISSAL_STORAGE_KEY, LEGACY_MIGRATION_STORAGE_KEY } from '@lib/domain/constants';
import { createTableSchema, joinCodeSchema, joinInviteSchema } from '@schemas/mesa';
import type { WorkspaceState } from '@/types/domain';

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
    legacyState,
    tables,
    online,
    createTableSession,
    connectToInvite,
    connectToJoinCode,
    completeJoinCode,
    clearPendingJoinCode,
    switchTable
  } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createFromLegacy, setCreateFromLegacy] = useState(false);
  const [legacyDismissed, setLegacyDismissed] = useState(false);
  const [openingTableSlug, setOpeningTableSlug] = useState<string | null>(null);
  const [tableActionError, setTableActionError] = useState('');
  const defaultNickname = user?.displayName || user?.username || 'Feiticeiro';

  useEffect(() => {
    setLegacyDismissed(
      localStorage.getItem(LEGACY_MIGRATION_STORAGE_KEY) === 'dismissed' ||
        localStorage.getItem(LEGACY_MIGRATION_DISMISSAL_STORAGE_KEY) === 'dismissed'
    );
  }, []);

  const shouldOfferMigration = useMemo(
    () => Boolean(legacyState && hasMeaningfulLegacyWorkspace(legacyState) && !legacyDismissed),
    [legacyDismissed, legacyState]
  );

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
        setTableActionError('A mesa nao respondeu com uma sessao valida. Tente novamente.');
        return;
      }

      navigate(`/mesa/${session.tableSlug}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel abrir esta mesa.';
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
      const nextState: WorkspaceState | undefined = createFromLegacy && legacyState ? legacyState : undefined;
      const session = await createTableSession(values.meta, values.nickname, nextState, values.systemKey);
      if (!session) return;

      if (createFromLegacy) {
        localStorage.setItem(LEGACY_MIGRATION_STORAGE_KEY, 'dismissed');
        setLegacyDismissed(true);
      }

      setCreateOpen(false);
      setCreateFromLegacy(false);
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
    <div className="page-shell pb-10">
      <MesaHero
        eyebrow="Project Nexus"
        title="Suas mesas"
        description="Crie uma campanha ou entre por convite."
        actions={
          <>
            <Button
              size="lg"
              onClick={() => {
                setCreateFromLegacy(false);
                createForm.reset(buildCreateDefaults(defaultNickname));
                setCreateOpen(true);
              }}
            >
              <Plus className="size-4" />
              Criar uma mesa
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setJoinOpen(true)}>
              <DoorOpen className="size-4" />
              Entrar em uma mesa
            </Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('/perfil')}>
              <Users className="size-4" />
              Minha conta
            </Button>
          </>
        }
      />

      <div className="grid gap-6">
        <div className="grid gap-6">
          {tableActionError ? (
            <UtilityPanel className="rounded-lg border border-rose-300/18 bg-rose-500/10 px-4 py-4">
              <p className="text-sm leading-6 text-soft">{tableActionError}</p>
            </UtilityPanel>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <MesaMetricTile label="Mesas" value={tables.length} hint="Campanhas em que voce participa." />
            <MesaMetricTile
              label="Mesa conectada"
              value={online.session ? online.session.tableName : 'Nenhuma'}
              hint={online.session ? formatRoleLabel(online.session.role) : 'Escolha uma mesa para continuar.'}
            />
            <MesaMetricTile
              label="Sistemas ativos"
              value={GAME_SYSTEM_OPTIONS.filter((system) => system.status === 'enabled').length}
              hint="Singularidade esta disponivel agora."
            />
          </div>

          {currentOrLatestTable ? (
            <Panel className="rounded-lg p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Retomar campanha</p>
                  <h2 className="mt-3 font-display text-5xl leading-none text-white">{currentOrLatestTable.name}</h2>
                  <p className="mt-4 text-sm leading-6 text-soft">
                    {currentOrLatestSystem?.name || 'Sistema'} · {currentOrLatestTable.seriesName || 'Mesa sem série definida'} · {currentOrLatestTable.campaignName || 'Sem arco nomeado'} · status{' '}
                    {currentOrLatestTable.status || 'Planejamento'}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={openingTableSlug === currentOrLatestTable.slug} onClick={() => void handleContinueTable(currentOrLatestTable.slug)}>
                    <ArrowRight className="size-4" />
                    {openingTableSlug === currentOrLatestTable.slug ? 'Abrindo...' : 'Continuar nesta mesa'}
                  </Button>
                  <Button variant="secondary" onClick={() => setJoinOpen(true)}>
                    <Compass className="size-4" />
                    Entrar em outra
                  </Button>
                </div>
              </div>
            </Panel>
          ) : null}

          {shouldOfferMigration ? (
            <Panel className="rounded-lg border-sky-300/18 bg-sky-500/10 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Migração do legado</p>
                  <h2 className="mt-3 font-display text-4xl leading-none text-white">Seu rascunho global ainda existe.</h2>
                  <p className="mt-4 text-sm leading-6 text-soft">
                    Voce pode transformar esse rascunho em uma mesa e continuar a campanha.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      setCreateFromLegacy(true);
                      createForm.reset({
                        ...buildCreateDefaults(defaultNickname),
                        meta: {
                          ...buildCreateDefaults(defaultNickname).meta,
                          tableName: 'Mesa migrada do workspace'
                        }
                      });
                      setCreateOpen(true);
                    }}
                  >
                    <Sparkles className="size-4" />
                    Transformar em mesa
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      localStorage.setItem(LEGACY_MIGRATION_STORAGE_KEY, 'dismissed');
                      setLegacyDismissed(true);
                    }}
                  >
                    Ignorar por enquanto
                  </Button>
                </div>
              </div>
            </Panel>
          ) : null}

          <Panel className="rounded-lg p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Suas mesas</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Espaços em que você participa</h2>
              </div>
              <Button variant="secondary" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Nova mesa
              </Button>
            </div>

            <div className="mt-6 grid gap-4">
              {tables.length ? (
                tables.map((table, index) => (
                  <motion.div
                    key={table.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-lg border border-white/10 bg-white/[0.025] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
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
                        <h3 className="mt-4 font-display text-4xl leading-none text-white">{table.name}</h3>
                        <p className="mt-3 text-sm leading-6 text-soft">
                          {table.seriesName || 'Sem série'} · {table.campaignName || 'Sem campanha'} · atualizado em {formatDate(table.updatedAt)}.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button disabled={openingTableSlug === table.slug} onClick={() => void handleContinueTable(table.slug)}>
                          <ArrowRight className="size-4" />
                          {openingTableSlug === table.slug ? 'Abrindo...' : 'Abrir mesa'}
                        </Button>
                        {online.session?.tableSlug === table.slug ? (
                          <Button variant="secondary" onClick={() => navigate(`/mesa/${table.slug}`)}>
                            Ir para a sessão atual
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState title="Você ainda não participa de nenhuma mesa." body="Crie um servidor de campanha ou entre usando um código de convite." />
              )}
            </div>
          </Panel>
        </div>

        <div className="page-right-rail">
          <MesaRailCard
            eyebrow="Sistemas"
            title="Singularidade"
            description="Disponivel para novas mesas."
          >
            <img
              src={getGameSystem('singularidade').assets.cover}
              alt="Singularidade"
              className="h-40 w-full rounded-lg object-cover"
            />
            <UtilityPanel className="rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Mesas por sistema</p>
                  <p className="mt-1 text-sm text-soft">Cada mesa guarda seu sistema e suas regras.</p>
                </div>
              </div>
            </UtilityPanel>
            <UtilityPanel className="rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 size-4 text-sky-200" />
                <div>
                  <p className="text-sm font-semibold text-white">Controle por papel</p>
                  <p className="mt-1 text-sm text-soft">GM administra a mesa. Players operam suas fichas. Viewers acompanham.</p>
                </div>
              </div>
            </UtilityPanel>
            <UtilityPanel className="rounded-lg p-4">
              <div className="flex items-start gap-3">
                <RadioTower className="mt-0.5 size-4 text-sky-200" />
                <div>
                  <p className="text-sm font-semibold text-white">Presença e estado</p>
                  <p className="mt-1 text-sm text-soft">Presenca, snapshots e historico ficam na mesa ativa.</p>
                </div>
              </div>
            </UtilityPanel>
          </MesaRailCard>

          <MesaRailCard
            eyebrow="Sessão atual"
            title={online.session ? online.session.tableName : 'Nenhuma mesa conectada'}
            description={online.session ? `Voce esta como ${formatRoleLabel(online.session.role)}.` : 'Abra uma mesa para continuar.'}
          >
            <MesaMetricTile label="Membros online" value={online.members.length || 0} hint="Sincronização ao vivo da mesa atual." />
            <MesaMetricTile label="Join codes ativos" value={online.joinCodes.length || 0} hint="Visíveis quando a mesa estiver conectada." />
          </MesaRailCard>
        </div>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateFromLegacy(false);
        }}
      >
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogTitle className="font-display text-4xl text-white">{createFromLegacy ? 'Migrar rascunho para uma mesa' : 'Criar uma mesa'}</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">
            Ao concluir, voce entra como GM.
          </DialogDescription>

          <form className="mt-6 grid gap-4" onSubmit={handleCreateTable}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome de presença">
                <Input {...createForm.register('nickname')} />
              </Field>
              <Field label="Sistema" hint="Apenas Singularidade esta habilitado agora.">
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

            <UtilityPanel className="grid gap-4 rounded-lg border border-sky-300/18 bg-sky-500/10 p-4 sm:grid-cols-[96px_minmax(0,1fr)]">
              <img src={selectedSystem.assets.cover} alt={selectedSystem.name} className="h-24 w-full rounded-lg object-cover sm:w-24" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Sistema selecionado</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{selectedSystem.name}</h3>
                <p className="mt-2 text-sm leading-6 text-soft">{selectedSystem.tagline}</p>
              </div>
            </UtilityPanel>

            {createFromLegacy ? (
              <UtilityPanel className="rounded-lg border border-sky-300/18 bg-sky-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Migração ligada</p>
                <p className="mt-2 text-sm text-soft">O rascunho antigo sera usado nesta mesa.</p>
              </UtilityPanel>
            ) : null}

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
          <DialogDescription className="mt-2 text-sm leading-6 text-soft">
            Use o codigo ou cole o link recebido.
          </DialogDescription>

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

              {online.pendingCodeJoin ? (
                <Panel className="mt-5 rounded-lg border-sky-300/18 bg-sky-500/10 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Seleção obrigatória</p>
                  <h3 className="mt-3 font-display text-3xl leading-none text-white">Escolha o personagem vinculado ao acesso.</h3>
                  <div className="mt-5 grid gap-3">
                    {online.pendingCodeJoin.characters.map((character) => (
                      <button
                        key={character.id}
                        type="button"
                        onClick={async () => {
                          try {
                            const session = await completeJoinCode(character.id);
                            if (!session) return;
                            setJoinOpen(false);
                            toast.success('Entrada concluída.');
                            navigate(`/mesa/${session.tableSlug}`);
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : 'Não foi possível concluir a entrada.');
                          }
                        }}
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-sky-300/24 hover:bg-white/[0.05]"
                      >
                        <p className="text-base font-semibold text-white">{character.name}</p>
                        <p className="mt-1 text-sm text-soft">
                          {character.grade || 'Sem grau'} {character.clan ? `· ${character.clan}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                  <Button type="button" variant="ghost" className="mt-4" onClick={clearPendingJoinCode}>
                    Cancelar seleção
                  </Button>
                </Panel>
              ) : null}
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
