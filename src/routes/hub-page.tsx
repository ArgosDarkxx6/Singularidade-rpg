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
  label: string;
  title: string;
  body: string;
  timestamp: string;
  href: string;
  actionLabel: string;
};

function formatDate(value: string) {
  if (!value) return 'Recente';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function buildActivityItems(tables: TableListItem[], characters: UserCharacterSummary[]): HubActivityItem[] {
  const tableItems = tables.map((table) => ({
    id: `table:${table.id}`,
    label: table.status || 'Mesa',
    title: table.name,
    body: `${getGameSystem(table.systemKey).name} · ${table.role === 'gm' ? 'Você administra' : 'Você participa'}`,
    timestamp: table.updatedAt,
    href: `/mesa/${table.slug}`,
    actionLabel: 'Entrar'
  }));

  const characterItems = characters.map((character) => ({
    id: `character:${character.id}`,
    label: 'Personagem',
    title: character.name,
    body: character.tableName ? `Vinculado a ${character.tableName}` : 'Disponível para vincular',
    timestamp: character.updatedAt,
    href: '/personagens',
    actionLabel: 'Abrir'
  }));

  return [...tableItems, ...characterItems]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 8);
}

export function HubPage() {
  const navigate = useNavigate();
  const { user, profile, tables, listUserCharacters } = usePlatformHub();
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

  const displayName = profile?.displayName || user?.displayName || user?.username || 'Usuário';
  const activityItems = useMemo(() => buildActivityItems(tables, characters), [characters, tables]);

  return (
    <div className="grid items-start gap-4 pb-8 xl:grid-cols-[minmax(0,1.55fr)_320px]">
      <div className="grid gap-4">
        <Panel className="p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Hub</p>
              <h1 className="mt-1 font-display text-xl font-semibold leading-tight text-white sm:text-2xl">Atividade recente</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate('/mesas')}>
                <Users className="size-4" />
                Mesas
              </Button>
              <Button variant="secondary" onClick={() => navigate('/personagens')}>
                <IdCard className="size-4" />
                Personagens
              </Button>
            </div>
          </div>
        </Panel>

        <Panel className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Feed</p>
              <h2 className="mt-1 font-display text-lg font-semibold text-white">Continuidade</h2>
            </div>
            <Sparkles className="size-4 text-accent" />
          </div>

          <div className="feed-list mt-4">
            {activityItems.length ? (
              activityItems.map((item) => (
                <Link key={item.id} to={item.href} className="feed-row flex min-w-0 flex-col gap-3 overflow-hidden px-3.5 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar name={item.title} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{item.label}</span>
                        <span className="text-[11px] text-muted">{formatDate(item.timestamp)}</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 truncate text-sm leading-6 text-soft">{item.body}</p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 self-start text-sm font-semibold text-white sm:self-center">
                    {item.actionLabel}
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              ))
            ) : (
              <EmptyState title="Sem atividade recente." body="Mesas e personagens aparecem aqui quando houver movimento." />
            )}
          </div>
        </Panel>
      </div>

      <div className="page-right-rail xl:grid-cols-1">
        <Panel className="p-3.5">
          <div className="flex items-start gap-3">
            <Avatar src={profile?.avatarUrl || user?.avatarUrl || undefined} name={displayName} size="lg" className="size-14 text-lg" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Conta</p>
              <h2 className="mt-1 truncate text-lg font-semibold text-white">{displayName}</h2>
              <p className="truncate text-sm text-soft">@{profile?.username || user?.username}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Button variant="secondary" onClick={() => navigate('/conta')}>
              Editar conta
            </Button>
            <Button variant="ghost" onClick={() => navigate('/personagens')}>
              <IdCard className="size-4" />
              Biblioteca
            </Button>
          </div>
        </Panel>

        <Panel className="p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Mesas ativas</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{tables.length}</h2>
            </div>
            <RadioTower className="size-4 text-accent" />
          </div>
          <div className="mt-4 grid gap-2">
            {tables.length ? (
              tables.slice(0, 4).map((table) => (
                <Link
                  key={table.id}
                  to={`/mesa/${table.slug}`}
                  className="rounded-lg border border-white/8 bg-white/[0.025] px-3.5 py-3 transition hover:border-blue-300/16 hover:bg-white/[0.04]"
                >
                  <p className="truncate text-sm font-semibold text-white">{table.name}</p>
                  <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted">
                    {table.status || 'Planejamento'} · {table.role === 'gm' ? 'GM' : table.role === 'player' ? 'Player' : 'Viewer'}
                  </p>
                </Link>
              ))
            ) : (
              <EmptyState title="Nenhuma mesa." body="Crie ou entre em uma mesa para começar." />
            )}
          </div>
        </Panel>

        <Panel className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Convites</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Entrada rápida</h2>
          <div className="mt-4 grid gap-2">
            <UtilityPanel className="rounded-lg px-3.5 py-3">
              <p className="text-sm leading-6 text-soft">Link ou código de mesa.</p>
            </UtilityPanel>
            <Button variant="secondary" onClick={() => navigate('/convites')}>
              <DoorOpen className="size-4" />
              Abrir convites
            </Button>
          </div>
        </Panel>

        <Panel className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Personagens</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Biblioteca</h2>
          <div className="mt-4 grid gap-2">
            {loadingCharacters ? (
              <UtilityPanel className="rounded-lg px-3.5 py-3">
                <p className="text-sm text-soft">Carregando personagens...</p>
              </UtilityPanel>
            ) : characters.length ? (
              characters.slice(0, 3).map((character) => (
                <UtilityPanel key={character.id} className="rounded-lg px-3.5 py-3">
                  <div className="flex items-start gap-3">
                    <Avatar src={character.avatarUrl || undefined} name={character.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{character.name}</p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-muted">
                        {character.grade || 'Sem grau'} · {character.clan || 'Sem clã'}
                      </p>
                    </div>
                  </div>
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Sem personagens." body="Crie um personagem para usar em mesa." />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
