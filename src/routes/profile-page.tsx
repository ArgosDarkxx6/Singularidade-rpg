import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, PencilLine, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input } from '@components/ui/field';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { MesaHero, MesaMetricTile } from '@features/mesa/components/mesa-section-primitives';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useWorkspace } from '@features/workspace/use-workspace';
import { profileUpdateSchema } from '@schemas/auth';
import type { UserCharacterSummary } from '@/types/domain';

type ProfileValues = import('zod').infer<typeof profileUpdateSchema>;

function formatDate(value: string) {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ProfilePage() {
  const { user, profile, updateProfile, uploadProfileAvatar, clearProfileAvatar } = useAuth();
  const { tables, listUserCharacters } = useWorkspace();
  const [characters, setCharacters] = useState<UserCharacterSummary[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileUpdateSchema) as never,
    mode: 'onBlur',
    defaultValues: {
      displayName: profile?.displayName || user?.displayName || ''
    }
  });

  useEffect(() => {
    form.reset({
      displayName: profile?.displayName || user?.displayName || ''
    });
  }, [form, profile?.displayName, user?.displayName]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      setCharactersLoading(true);
      try {
        const nextCharacters = await listUserCharacters();
        if (mounted) {
          setCharacters(nextCharacters);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Nao foi possivel carregar seus personagens.');
      } finally {
        if (mounted) {
          setCharactersLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [listUserCharacters]);

  const linkedTablesById = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);

  return (
    <div className="page-shell pb-8">
      <MesaHero
        eyebrow="Conta do usuário"
        title={profile?.displayName || user?.displayName || 'Perfil'}
        description="Edite seu nome público, gerencie sua foto de perfil e acompanhe as mesas e personagens vinculados à sua conta."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MesaMetricTile label="Mesas ativas" value={tables.length} hint="Campanhas nas quais sua conta participa hoje." />
        <MesaMetricTile label="Personagens próprios" value={characters.length} hint="Personagens preservados na sua conta, mesmo fora de uma mesa." />
        <MesaMetricTile label="Última atualização" value={formatDate(profile?.updatedAt || '')} hint="Reflete dados do perfil autenticado." />
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6">
          <Panel className="rounded-[28px] p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <Avatar src={profile?.avatarUrl || user?.avatarUrl || undefined} name={profile?.displayName || user?.displayName || 'Perfil'} size="lg" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Identidade da conta</p>
                  <h2 className="mt-2 font-display text-4xl leading-none text-white">{profile?.displayName || user?.displayName || 'Feiticeiro'}</h2>
                  <p className="mt-3 text-sm text-soft">@{profile?.username || user?.username}</p>
                  <p className="mt-1 text-sm text-soft">{profile?.email || user?.email}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={avatarBusy}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    setAvatarBusy(true);
                    try {
                      await uploadProfileAvatar(file);
                      toast.success('Avatar atualizado.');
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar o avatar.');
                    } finally {
                      setAvatarBusy(false);
                      event.currentTarget.value = '';
                    }
                  }}
                />
                <Button type="button" variant="secondary" disabled={avatarBusy} onClick={() => fileInputRef.current?.click()}>
                  <Camera className="size-4" />
                  {avatarBusy ? 'Enviando...' : 'Trocar foto'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={avatarBusy || !(profile?.avatarUrl || user?.avatarUrl)}
                  onClick={async () => {
                    setAvatarBusy(true);
                    try {
                      await clearProfileAvatar();
                      toast.success('Avatar removido.');
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Nao foi possivel remover o avatar.');
                    } finally {
                      setAvatarBusy(false);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                  Remover foto
                </Button>
              </div>
            </div>

            <form
              className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  await updateProfile(values);
                  toast.success('Perfil atualizado.');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar o perfil.');
                }
              })}
            >
              <Field label="Nome de exibição" error={form.formState.errors.displayName?.message}>
                <Input {...form.register('displayName')} />
              </Field>
              <div className="flex items-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <PencilLine className="size-4" />
                  Salvar nome
                </Button>
              </div>
            </form>
          </Panel>

          <Panel className="rounded-[28px] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Suas mesas</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-white">Campanhas vinculadas à sua conta</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {tables.length ? (
                tables.map((table) => (
                  <UtilityPanel key={table.id} className="rounded-[22px] p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-base font-semibold text-white">{table.name}</p>
                        <p className="mt-1 text-sm text-soft">
                          {table.seriesName || 'Sem série'} · {table.campaignName || 'Sem campanha'} · {table.status || 'Sem sessão'}
                        </p>
                      </div>
                      <Link
                        to={`/mesa/${table.slug}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-soft transition hover:text-white"
                      >
                        Abrir mesa
                      </Link>
                    </div>
                  </UtilityPanel>
                ))
              ) : (
                <EmptyState title="Nenhuma mesa vinculada." body="Entre em uma campanha ou crie uma nova mesa para ela aparecer aqui." />
              )}
            </div>
          </Panel>
        </div>

        <div className="page-right-rail">
          <Panel className="rounded-[28px] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Personagens próprios</p>
            <h2 className="mt-2 font-display text-4xl leading-none text-white">Acervo da conta</h2>
            <div className="mt-6 grid gap-3">
              {charactersLoading ? (
                <UtilityPanel className="rounded-[20px] p-4">
                  <p className="text-sm text-soft">Carregando personagens...</p>
                </UtilityPanel>
              ) : characters.length ? (
                characters.map((character) => {
                  const linkedTable = character.tableId ? linkedTablesById.get(character.tableId) : null;

                  return (
                    <UtilityPanel key={character.id} className="rounded-[22px] p-4">
                      <div className="flex items-start gap-3">
                        <Avatar src={character.avatarUrl || undefined} name={character.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{character.name}</p>
                          <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-muted">
                            {character.grade || 'Sem grau'} · {character.clan || 'Sem clã'}
                          </p>
                          <p className="mt-2 text-sm text-soft">
                            {character.tableName ? `Vinculado a ${character.tableName}` : 'Preservado fora de uma mesa'}
                          </p>
                          <p className="mt-1 text-xs text-muted">Atualizado em {formatDate(character.updatedAt)}</p>
                        </div>
                      </div>
                      {linkedTable ? (
                        <Link
                          to={`/mesa/${linkedTable.slug}/fichas`}
                          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-soft transition hover:text-white"
                        >
                          Abrir ficha
                        </Link>
                      ) : null}
                    </UtilityPanel>
                  );
                })
              ) : (
                <EmptyState title="Nenhum personagem próprio." body="Assim que um personagem for vinculado à sua conta, ele aparecerá nesta área." />
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
