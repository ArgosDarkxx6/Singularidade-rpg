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
import { NexusPanel, NexusSectionHeader } from '@components/ui/nexus';
import { UtilityPanel } from '@components/ui/panel';
import { useAuth } from '@features/auth/hooks/use-auth';
import { useAccountCharacters, usePlatformTables } from '@features/workspace/hooks/use-workspace-segments';
import { getGameSystem } from '@features/systems/registry';
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
  const { tables } = usePlatformTables();
  const { listUserCharacters } = useAccountCharacters();
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
        toast.error(error instanceof Error ? error.message : 'Não foi possível carregar seus personagens.');
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

  const linkedCharacters = useMemo(() => characters.filter((character) => character.tableName), [characters]);

  return (
    <div className="grid items-start gap-3 pb-8 xl:grid-cols-[minmax(0,1.45fr)_304px]">
      <div className="grid gap-3">
        <NexusPanel>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Avatar src={profile?.avatarUrl || user?.avatarUrl || undefined} name={profile?.displayName || user?.displayName || 'Perfil'} size="lg" className="size-16 text-xl" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Conta</p>
                <h1 className="mt-1 font-display text-xl font-semibold leading-tight text-white sm:text-2xl">
                  {profile?.displayName || user?.displayName || 'Perfil'}
                </h1>
                <p className="mt-1 text-sm text-soft">@{profile?.username || user?.username}</p>
                <p className="text-sm text-soft">{profile?.email || user?.email}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:min-w-44">
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
                    toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o avatar.');
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
                    toast.error(error instanceof Error ? error.message : 'Não foi possível remover o avatar.');
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
        </NexusPanel>

        <NexusPanel>
          <h2 className="font-display text-lg font-semibold text-white">Identidade</h2>
          <form
            className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await updateProfile(values);
                toast.success('Perfil atualizado.');
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.');
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
        </NexusPanel>

        <NexusPanel>
          <NexusSectionHeader kicker="Mesas" title="Participação" />

          <div className="mt-3 grid gap-2">
            {tables.length ? (
              tables.map((table) => (
                <UtilityPanel key={table.id} className="rounded-[9px] px-3 py-2.5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{table.name}</p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted">
                        {getGameSystem(table.systemKey).name} · {table.status || 'Sem sessão'} · {table.role === 'gm' ? 'GM' : table.role === 'player' ? 'Jogador' : 'Visitante'}
                      </p>
                    </div>
                    <Link
                      to={`/mesa/${table.slug}`}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-soft transition hover:text-white"
                    >
                      Abrir mesa
                    </Link>
                  </div>
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Nenhuma mesa vinculada." body="Entre ou crie uma mesa." />
            )}
          </div>
        </NexusPanel>
      </div>

      <div className="page-right-rail xl:grid-cols-1">
        <NexusPanel>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Resumo</p>
          <div className="mt-4 grid gap-2">
            <UtilityPanel className="rounded-[9px] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesas</p>
              <p className="mt-1 text-lg font-semibold text-white">{tables.length}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-[9px] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Personagens</p>
              <p className="mt-1 text-lg font-semibold text-white">{characters.length}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-[9px] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Atualização</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatDate(profile?.updatedAt || '')}</p>
            </UtilityPanel>
          </div>
        </NexusPanel>

        <NexusPanel>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Personagens vinculados</p>
          <div className="mt-4 grid gap-2">
            {charactersLoading ? (
              <UtilityPanel className="rounded-[9px] px-3 py-2.5">
                <p className="text-sm text-soft">Carregando personagens...</p>
              </UtilityPanel>
            ) : linkedCharacters.length ? (
              linkedCharacters.slice(0, 4).map((character) => (
                <UtilityPanel key={character.id} className="rounded-[9px] px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <Avatar src={character.avatarUrl || undefined} name={character.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{character.name}</p>
                      <p className="mt-1 text-sm text-soft">{character.tableName}</p>
                    </div>
                  </div>
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Sem vínculos." body="Nenhum personagem vinculado." />
            )}
          </div>
        </NexusPanel>
      </div>
    </div>
  );
}
