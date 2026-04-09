import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageIntro } from '@components/shared/page-intro';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { useAuth } from '@features/auth/hooks/use-auth';
import { TableDashboard } from '@features/mesa/components/table-dashboard';
import { useWorkspace } from '@features/workspace/use-workspace';
import { useSyncView } from '@hooks/use-sync-view';
import { createTableSchema, joinCodeSchema, joinInviteSchema } from '@schemas/mesa';
import { DEFAULT_TABLE_META, TABLE_STATUS_OPTIONS } from '@lib/domain/constants';

type CreateTableValues = import('zod').infer<typeof createTableSchema>;
type JoinInviteValues = import('zod').infer<typeof joinInviteSchema>;
type JoinCodeValues = import('zod').infer<typeof joinCodeSchema>;

export function MesaPage() {
  useSyncView('mesa');

  const navigate = useNavigate();
  const { user } = useAuth();
  const { online, createTableSession, connectToInvite, connectToJoinCode, completeJoinCode, clearPendingJoinCode, disconnectOnline } = useWorkspace();

  const createForm = useForm<CreateTableValues>({
    resolver: zodResolver(createTableSchema) as never,
    mode: 'onChange',
    defaultValues: {
      nickname: user?.displayName || user?.username || 'Feiticeiro',
      meta: {
        ...DEFAULT_TABLE_META,
        seriesName: 'Jujutsu Kaisen',
        status: TABLE_STATUS_OPTIONS[0]
      }
    }
  });

  const inviteForm = useForm<JoinInviteValues>({
    resolver: zodResolver(joinInviteSchema) as never,
    mode: 'onChange',
    defaultValues: {
      inviteUrl: '',
      nickname: user?.displayName || user?.username || 'Feiticeiro'
    }
  });

  const codeForm = useForm<JoinCodeValues>({
    resolver: zodResolver(joinCodeSchema) as never,
    mode: 'onChange',
    defaultValues: {
      code: '',
      nickname: user?.displayName || user?.username || 'Feiticeiro'
    }
  });

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Mesa online"
        title="Criacao, acesso e persistencia compartilhada."
        description="Abra uma sala nova, entre por convite ou codigo e acompanhe presenca, snapshots e sincronizacao do estado."
        chips={[
          online.session ? `Conectado em ${online.table?.name || online.session.tableSlug}` : 'Offline',
          online.members.length ? `${online.members.length} presencas` : 'Sem presenca remota',
          online.joinCodes.length ? `${online.joinCodes.length} codigos ativos` : 'Sem codigos'
        ]}
        actions={
          online.session ? (
            <>
              <Button variant="secondary" onClick={() => navigate(`/mesa/${online.session?.tableSlug}`)}>
                Abrir rota da mesa
              </Button>
              <Button variant="ghost" onClick={() => void disconnectOnline()}>
                Desconectar
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="p-6">
          <SectionTitle eyebrow="Criar sala" title="Nova mesa" description="O estado atual de fichas, rolagens e ordem passa a ser a base da sala criada." />

          <form
            className="mt-6 grid gap-4"
            onSubmit={createForm.handleSubmit(async (values) => {
              const session = await createTableSession(values.meta, values.nickname);
              if (session) {
                toast.success('Mesa criada e conectada.');
                navigate(`/mesa/${session.tableSlug}`);
              }
            })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome de presenca">
                <Input {...createForm.register('nickname')} />
              </Field>
              <Field label="Nome da mesa">
                <Input {...createForm.register('meta.tableName')} />
              </Field>
              <Field label="Serie">
                <Input {...createForm.register('meta.seriesName')} />
              </Field>
              <Field label="Campanha">
                <Input {...createForm.register('meta.campaignName')} />
              </Field>
              <Field label="Episodio">
                <Input {...createForm.register('meta.episodeNumber')} />
              </Field>
              <Field label="Titulo do episodio">
                <Input {...createForm.register('meta.episodeTitle')} />
              </Field>
              <Field label="Data">
                <Input type="date" {...createForm.register('meta.sessionDate')} />
              </Field>
              <Field label="Local">
                <Input {...createForm.register('meta.location')} />
              </Field>
              <Field label="Status">
                <Select {...createForm.register('meta.status')}>
                  {TABLE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Elenco esperado">
                <Input {...createForm.register('meta.expectedRoster')} />
              </Field>
            </div>
            <Field label="Recap">
              <Textarea {...createForm.register('meta.recap')} />
            </Field>
            <Field label="Objetivo">
              <Textarea {...createForm.register('meta.objective')} />
            </Field>

            <Button type="submit" disabled={!createForm.formState.isValid || createForm.formState.isSubmitting}>
              Criar mesa com o estado atual
            </Button>
          </form>
        </Card>

        <div className="grid gap-6">
          <Card className="p-6">
            <SectionTitle eyebrow="Entrar em sala" title="Convite ou codigo" description="Cole a URL de convite completa ou use um join code de 6 digitos." />

            <form
              className="mt-5 grid gap-4"
              onSubmit={inviteForm.handleSubmit(async (values) => {
                try {
                  const session = await connectToInvite(values.inviteUrl, values.nickname);
                  if (session) {
                    toast.success('Convite aceito.');
                    navigate(`/mesa/${session.tableSlug}`);
                  }
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Nao foi possivel entrar pelo convite.');
                }
              })}
            >
              <Field label="URL de convite">
                <Input placeholder="https://..." {...inviteForm.register('inviteUrl')} />
              </Field>
              <Field label="Apelido da sessao">
                <Input {...inviteForm.register('nickname')} />
              </Field>
              <Button type="submit" variant="secondary">
                Entrar por convite
              </Button>
            </form>

            <form
              className="mt-6 grid gap-4"
              onSubmit={codeForm.handleSubmit(async (values) => {
                try {
                  const result = await connectToJoinCode(values.code, values.nickname);
                  if (result.connected && result.session) {
                    toast.success('Codigo aceito.');
                    navigate(`/mesa/${result.session.tableSlug}`);
                  }
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Nao foi possivel entrar pelo codigo.');
                }
              })}
            >
              <Field label="Codigo">
                <Input placeholder="123456" {...codeForm.register('code')} />
              </Field>
              <Field label="Apelido da sessao">
                <Input {...codeForm.register('nickname')} />
              </Field>
              <Button type="submit">Entrar por codigo</Button>
            </form>

            {online.pendingCodeJoin ? (
              <div className="mt-6 rounded-[24px] border border-sky-300/18 bg-sky-500/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Selecao exigida</p>
                <h3 className="mt-2 font-display text-3xl">Escolha o personagem vinculado</h3>
                <p className="mt-2 text-sm text-soft">O codigo atual exige selecao de personagem antes de concluir o acesso.</p>
                <div className="mt-4 grid gap-3">
                  {online.pendingCodeJoin.characters.map((character) => (
                    <button
                      key={character.id}
                      type="button"
                      onClick={async () => {
                        const session = await completeJoinCode(character.id);
                        if (session) {
                          toast.success('Entrada por codigo concluida.');
                          navigate(`/mesa/${session.tableSlug}`);
                        }
                      }}
                      className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-left transition hover:border-sky-300/22 hover:bg-white/6"
                    >
                      <p className="text-sm font-semibold text-white">{character.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-soft">
                        {character.grade || 'Sem grau'} {character.clan ? `· ${character.clan}` : ''}
                      </p>
                    </button>
                  ))}
                </div>
                <Button variant="ghost" className="mt-4" onClick={clearPendingJoinCode}>
                  Cancelar
                </Button>
              </div>
            ) : null}
          </Card>

          {online.session ? (
            <Card className="p-6">
              <SectionTitle eyebrow="Sessao corrente" title={online.table?.name || online.session.tableSlug} description={`Voce esta conectado como ${online.session.role}.`} />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => navigate(`/mesa/${online.session?.tableSlug}`)}>
                  Abrir dashboard da mesa
                </Button>
                <Button variant="ghost" onClick={() => void disconnectOnline()}>
                  Desconectar desta sala
                </Button>
              </div>
            </Card>
          ) : (
            <EmptyState title="Nenhuma sessao online ativa." body="Crie uma mesa nova ou entre por convite/codigo para habilitar o dashboard compartilhado." />
          )}
        </div>
      </div>

      {online.session ? <TableDashboard /> : null}
    </div>
  );
}
