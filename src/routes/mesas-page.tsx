import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Compass, DoorOpen, Plus, RadioTower, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import {
  V2AvatarStack,
  V2List,
  V2ListRow,
  V2Panel,
  V2PanelHeader,
  V2StatusChip,
  V2Toolbar
} from '@components/nexus-v2';
import { useAuth } from '@features/auth/hooks/use-auth';
import { GAME_SYSTEM_OPTIONS, getDefaultTableMetaForSystem, getGameSystem } from '@features/systems/registry';
import { usePlatformTables } from '@features/workspace/hooks/use-workspace-segments';
import { createTableSchema, joinCodeSchema, joinInviteSchema } from '@schemas/mesa';
import type { TableListItem } from '@/types/domain';

type CreateTableValues = import('zod').infer<typeof createTableSchema>;
type JoinCodeValues = import('zod').infer<typeof joinCodeSchema>;
type JoinInviteValues = import('zod').infer<typeof joinInviteSchema>;

function formatRoleLabel(role: TableListItem['role']) {
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

function roleTone(role: TableListItem['role']) {
  if (role === 'gm') return 'accent';
  if (role === 'player') return 'success';
  return 'neutral';
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
    <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(0,1.14fr)_minmax(280px,0.9fr)_300px]">
      <div className="grid min-w-0 gap-3">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200/80">Mesas</p>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">Mesas</h1>
            <p className="mt-1 text-sm leading-5 text-slate-300/72">Campanhas, sessões e convites ativos.</p>
          </div>
          <V2Toolbar>
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
          </V2Toolbar>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            className="rounded-xl border border-blue-300/18 bg-blue-500/10 px-3 py-2.5 text-left transition hover:border-blue-200/34 hover:bg-blue-400/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
            onClick={() => activeTable && void handleContinueTable(activeTable.slug)}
            disabled={!activeTable}
          >
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/80">Mesa ativa</span>
            <span className="mt-1 block truncate text-sm font-bold text-white">{activeTable?.name || 'Nenhuma mesa'}</span>
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/8 bg-white/[0.026] px-3 py-2.5 text-left transition hover:border-blue-300/24 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
            onClick={() => {
              createForm.reset(buildCreateDefaults(defaultNickname));
              setCreateOpen(true);
            }}
          >
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Campanhas</span>
            <span className="mt-1 block text-xl font-bold text-white">{tables.length}</span>
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/8 bg-white/[0.026] px-3 py-2.5 text-left transition hover:border-blue-300/24 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
            onClick={() => setJoinOpen(true)}
          >
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Entrada</span>
            <span className="mt-1 block text-sm font-bold text-white">Código ou convite</span>
          </button>
        </div>

        {tableActionError ? (
          <V2Panel tone="flat" className="border-rose-300/18 bg-rose-500/10 px-3.5 py-3">
            <p className="text-sm leading-6 text-rose-100">{tableActionError}</p>
          </V2Panel>
        ) : null}

        <V2Panel className="p-3">
          <V2PanelHeader eyebrow="Suas mesas" title="Campanhas e espaços ativos" />
          <V2List className="mt-3 gap-2">
            {tables.length ? (
              tables.map((table) => (
                <V2ListRow
                  key={table.id}
                  className="px-3 py-2"
                  action={
                    <Button disabled={openingTableSlug === table.slug} onClick={() => void handleContinueTable(table.slug)}>
                      <ArrowRight className="size-4" />
                      {openingTableSlug === table.slug ? 'Abrindo...' : 'Abrir mesa'}
                    </Button>
                  }
                >
                  <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <V2StatusChip tone={roleTone(table.role)}>{formatRoleLabel(table.role)}</V2StatusChip>
                        <V2StatusChip tone="neutral">{getGameSystem(table.systemKey).name}</V2StatusChip>
                        {table.isOwner ? <V2StatusChip tone="warning">Criador</V2StatusChip> : null}
                      </div>
                      <h2 className="mt-1.5 truncate font-display text-base font-bold text-white sm:text-lg">{table.name}</h2>
                      <p className="mt-1 truncate text-sm leading-5 text-slate-300/72">
                        {table.seriesName || 'Sem série'} · {table.campaignName || 'Sem campanha'} · {formatDate(table.updatedAt)}
                      </p>
                    </div>
                    <V2AvatarStack
                      items={[
                        {
                          id: `${table.id}:role`,
                          name: formatRoleLabel(table.role)
                        },
                        {
                          id: `${table.id}:system`,
                          name: getGameSystem(table.systemKey).name
                        }
                      ]}
                      limit={2}
                    />
                  </div>
                </V2ListRow>
              ))
            ) : (
              <EmptyState title="Nenhuma mesa ainda." body="Crie uma campanha ou entre por convite." />
            )}
          </V2List>
        </V2Panel>

        <V2Panel className="p-3">
          <V2PanelHeader eyebrow="Descubra mesas" title="Entrada e descoberta" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-lg border border-white/8 bg-white/[0.026] px-3 py-2.5 text-left transition hover:border-blue-300/22 hover:bg-white/[0.045]"
              onClick={() => setJoinOpen(true)}
            >
              <p className="text-sm font-bold text-white">Código ou convite</p>
              <p className="mt-1 text-sm leading-5 text-slate-300/72">Entrar com acesso recebido.</p>
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/8 bg-white/[0.026] px-3 py-2.5 text-left transition hover:border-blue-300/22 hover:bg-white/[0.045]"
              onClick={() => {
                createForm.reset(buildCreateDefaults(defaultNickname));
                setCreateOpen(true);
              }}
            >
              <p className="text-sm font-bold text-white">Nova mesa</p>
              <p className="mt-1 text-sm leading-5 text-slate-300/72">Criar como GM.</p>
            </button>
          </div>
        </V2Panel>
      </div>

      <div className="grid min-w-0 gap-3">
        <V2Panel tone="strong" className="p-3">
          <V2PanelHeader
            eyebrow="Sessões ativas"
            title={activeTable?.name || 'Nenhuma mesa aberta'}
            action={<RadioTower className="size-4 text-blue-200" />}
          />
          <div className="mt-3 grid gap-2">
            {activeTable ? (
              <>
                <div className="rounded-lg border border-white/8 bg-white/[0.026] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="mt-1 text-sm font-bold text-white">{activeTable.status || 'Planejamento'}</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.026] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Seu papel</p>
                  <p className="mt-1 text-sm font-bold text-white">{formatRoleLabel(activeTable.role)}</p>
                </div>
                <Button onClick={() => void handleContinueTable(activeTable.slug)}>Abrir sessão</Button>
              </>
            ) : (
              <EmptyState title="Sem mesa aberta." body="Entre em uma mesa." />
            )}
          </div>
        </V2Panel>

        <V2Panel className="p-3">
          <V2PanelHeader eyebrow="Sessões recentes" title={`${tables.length} mesas`} />
          <V2List className="mt-3">
            {tables.length ? (
              tables.slice(0, 4).map((table) => (
                <V2ListRow
                  key={table.id}
                  action={
                    <Button variant="secondary" disabled={openingTableSlug === table.slug} onClick={() => void handleContinueTable(table.slug)}>
                      Abrir sessão
                    </Button>
                  }
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <V2AvatarStack
                      items={[
                        {
                          id: `${table.id}:role`,
                          name: formatRoleLabel(table.role)
                        }
                      ]}
                      limit={1}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{table.name}</p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-slate-400">{table.status || 'Planejamento'}</p>
                    </div>
                  </div>
                </V2ListRow>
              ))
            ) : (
              <EmptyState title="Sem sessões." body="Abra uma mesa para iniciar." />
            )}
          </V2List>
        </V2Panel>

        <V2Panel className="p-3">
          <V2PanelHeader eyebrow="Convites pendentes" title="Gerenciar acesso" />
          <V2List className="mt-3">
            <V2ListRow>
              <div className="flex min-w-0 items-center gap-3">
                <Compass className="size-4 shrink-0 text-blue-200" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Código ou convite</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300/72">Cole o acesso recebido.</p>
                </div>
              </div>
            </V2ListRow>
          </V2List>
          <Button className="mt-3 w-full" variant="secondary" onClick={() => setJoinOpen(true)}>
            Abrir entrada
          </Button>
        </V2Panel>
      </div>

      <aside className="grid min-w-0 gap-3">
        <V2Panel className="p-3">
          <V2PanelHeader eyebrow="Sistemas ativos" title="Camada de jogo" />
          <V2List className="mt-3">
            <V2ListRow>
              <div className="flex min-w-0 items-start gap-3">
                <Users className="mt-0.5 size-4 shrink-0 text-blue-200" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Singularidade disponível</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300/72">Pronto para novas campanhas.</p>
                </div>
              </div>
            </V2ListRow>
            <V2ListRow>
              <div className="flex min-w-0 items-start gap-3">
                <RadioTower className="mt-0.5 size-4 shrink-0 text-blue-200" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Estado compartilhado</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300/72">Presença, pontos e sessão ficam na mesa ativa.</p>
                </div>
              </div>
            </V2ListRow>
          </V2List>
        </V2Panel>

        <V2Panel className="p-3">
          <V2PanelHeader eyebrow="Ações rápidas" title="Mesa ativa" />
          <div className="mt-3 grid gap-2">
            <Button
              onClick={() => {
                createForm.reset(buildCreateDefaults(defaultNickname));
                setCreateOpen(true);
              }}
            >
              Criar mesa
            </Button>
            <Button variant="secondary" onClick={() => setJoinOpen(true)}>
              Entrar por convite
            </Button>
            <Button variant="ghost" onClick={() => activeTable && void handleContinueTable(activeTable.slug)} disabled={!activeTable}>
              Abrir mesa ativa
            </Button>
          </div>
        </V2Panel>
      </aside>

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

            <V2Panel tone="flat" className="border-blue-300/16 bg-blue-500/10 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">Sistema</p>
              <h3 className="mt-2 text-lg font-bold text-white">{selectedSystem.name}</h3>
              <p className="mt-2 text-sm leading-6 text-soft">{selectedSystem.tagline}</p>
            </V2Panel>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="lg" disabled={createForm.formState.isSubmitting}>
                {createForm.formState.isSubmitting ? 'Criando...' : 'Criar e entrar'}
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
