import { ArrowRight, DoorOpen, IdCard, RadioTower, Sparkles, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Panel, UtilityPanel } from '@components/ui/panel';
import { usePlatformHub } from '@features/workspace/hooks/use-workspace-segments';
import { getGameSystem } from '@features/systems/registry';
import type { TableListItem, UserCharacterSummary } from '@/types/domain';

type HubActivityItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  href: string;
  tone: 'table' | 'character' | 'session';
};

function formatDate(value: string) {
  if (!value) return 'Agora';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function buildActivityItems(
  tables: TableListItem[],
  characters: UserCharacterSummary[],
  tableById: Map<string, TableListItem>
): HubActivityItem[] {
  const tableItems = tables.map((table) => ({
    id: `table:${table.id}`,
    title: table.name,
    body: `${getGameSystem(table.systemKey).name} · ${table.status || 'Sem sessão'} · ${table.role === 'gm' ? 'Você gerencia esta mesa' : 'Você participa desta mesa'}`,
    timestamp: table.updatedAt,
    href: `/mesa/${table.slug}`,
    tone: 'table' as const
  }));

  const characterItems = characters.map((character) => ({
    id: `character:${character.id}`,
    title: character.name,
    body: character.tableName
      ? `Ficha vinculada a ${character.tableName}`
      : 'Núcleo pessoal pronto para entrar em uma mesa',
    timestamp: character.updatedAt,
    href: character.tableId && tableById.get(character.tableId) ? `/mesa/${tableById.get(character.tableId)?.slug}/fichas` : '/personagens',
    tone: 'character' as const
  }));

  const items = [...tableItems, ...characterItems];
  return items
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 6);
}

export function HubPage() {
  const navigate = useNavigate();
  const { user, profile, tables, online, listUserCharacters } = usePlatformHub();
  const [characters, setCharacters] = useState<UserCharacterSummary[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      setLoadingCharacters(true);
      try {
        const nextCharacters = await listUserCharacters();
        if (mounted) {
          setCharacters(nextCharacters);
        }
      } finally {
        if (mounted) {
          setLoadingCharacters(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [listUserCharacters]);

  const activeTable = useMemo(
    () => tables.find((table) => table.slug === online.session?.tableSlug) || tables[0] || null,
    [online.session?.tableSlug, tables]
  );
  const tableById = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);
  const activityItems = useMemo(() => buildActivityItems(tables, characters, tableById), [characters, tableById, tables]);
  const displayName = profile?.displayName || user?.displayName || user?.username || 'Feiticeiro';

  return (
    <div className="grid gap-4 pb-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
      <div className="grid gap-4">
        <Panel className="rounded-[28px] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Hub pessoal</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-white sm:text-3xl">Retome o que importa sem atravessar dashboards inflados.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-soft">
                Sua plataforma agora concentra atividade real: mesas recentes, sessão ativa, personagens prontos para uso e atalhos claros para continuar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate('/mesas')}>
                <Users className="size-4" />
                Abrir mesas
              </Button>
              <Button variant="secondary" onClick={() => navigate('/convites')}>
                <DoorOpen className="size-4" />
                Aceitar convite
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <UtilityPanel className="rounded-2xl px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Mesas</p>
              <p className="mt-2 text-lg font-semibold text-white">{tables.length}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-2xl px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Personagens</p>
              <p className="mt-2 text-lg font-semibold text-white">{loadingCharacters ? '...' : characters.length}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-2xl px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Sessão ativa</p>
              <p className="mt-2 truncate text-lg font-semibold text-white">{online.session?.tableName || 'Nenhuma em curso'}</p>
            </UtilityPanel>
          </div>
        </Panel>

        <Panel className="rounded-[28px] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Atividade recente</p>
              <h3 className="mt-1.5 text-xl font-semibold text-white">Fluxo de continuidade</h3>
            </div>
            <Sparkles className="size-4 text-sky-200" />
          </div>

          <div className="mt-5 grid gap-3">
            {activityItems.length ? (
              activityItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-sky-300/18 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-soft">{item.body}</p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
                    <span>{item.tone === 'table' ? 'Mesa' : item.tone === 'session' ? 'Sessão' : 'Personagem'}</span>
                    <span>{formatDate(item.timestamp)}</span>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState title="Sem atividade recente." body="Assim que você entrar em mesas ou salvar personagens, o hub passa a organizar seus próximos passos aqui." />
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4">
        <Panel className="rounded-[28px] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Avatar src={profile?.avatarUrl || user?.avatarUrl || undefined} name={displayName} size="lg" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Conta ativa</p>
              <h3 className="mt-1.5 truncate text-xl font-semibold text-white">{displayName}</h3>
              <p className="mt-1 truncate text-sm text-soft">@{profile?.username || user?.username}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            <Button variant="secondary" onClick={() => navigate('/conta')}>
              Editar conta
            </Button>
            <Button variant="ghost" onClick={() => navigate('/personagens')}>
              <IdCard className="size-4" />
              Abrir biblioteca
            </Button>
          </div>
        </Panel>

        <Panel className="rounded-[28px] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Mesa ativa</p>
              <h3 className="mt-1.5 text-xl font-semibold text-white">{activeTable?.name || 'Nenhuma mesa aberta'}</h3>
            </div>
            <RadioTower className="size-4 text-sky-200" />
          </div>

          {activeTable ? (
            <div className="mt-5 grid gap-3">
              <UtilityPanel className="rounded-2xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Sistema</p>
                <p className="mt-2 text-sm font-semibold text-white">{getGameSystem(activeTable.systemKey).name}</p>
              </UtilityPanel>
              <UtilityPanel className="rounded-2xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Estado</p>
                <p className="mt-2 text-sm font-semibold text-white">{activeTable.status || 'Sem sessão'}</p>
              </UtilityPanel>
              <Button onClick={() => navigate(`/mesa/${activeTable.slug}`)}>
                Abrir mesa
              </Button>
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState title="Nenhuma mesa ativa." body="Crie ou entre em uma mesa para habilitar o fluxo rápido do hub." />
            </div>
          )}
        </Panel>

        <Panel className="rounded-[28px] p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Personagens prontos</p>
          <h3 className="mt-1.5 text-xl font-semibold text-white">Biblioteca pessoal</h3>

          <div className="mt-5 grid gap-3">
            {loadingCharacters ? (
              <UtilityPanel className="rounded-2xl p-4">
                <p className="text-sm text-soft">Carregando personagens...</p>
              </UtilityPanel>
            ) : characters.length ? (
              characters.slice(0, 4).map((character) => (
                <UtilityPanel key={character.id} className="rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={character.avatarUrl || undefined} name={character.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{character.name}</p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted">
                        {character.grade || 'Sem grau'} · {character.clan || 'Sem clã'}
                      </p>
                      <p className="mt-2 text-sm text-soft">
                        {character.tableName ? `Em ${character.tableName}` : 'Disponível para vincular'}
                      </p>
                    </div>
                  </div>
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Nenhum personagem salvo." body="Crie um núcleo em Personagens para deixá-lo pronto para uso em qualquer mesa." />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
