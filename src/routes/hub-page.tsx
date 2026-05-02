import { CalendarDays, DoorOpen, IdCard, RadioTower, Sparkles, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import {
  V2Feed,
  V2List,
  V2ListRow,
  V2Panel,
  V2PanelHeader,
  V2Toolbar,
  type V2FeedItem
} from '@components/nexus-v2';
import { getGameSystem } from '@features/systems/registry';
import { usePlatformHub } from '@features/workspace/hooks/use-workspace-segments';
import type { TableListItem, UserCharacterSummary } from '@/types/domain';

type HubActivityItem = V2FeedItem;
type HubActivityDraft = HubActivityItem & { sortAt: string };
type QuickStripItem = {
  id: string;
  name: string;
  label: string;
  href: string;
  avatarUrl?: string;
};

function formatDateTime(value: string) {
  if (!value) return 'Recente';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRoleLabel(role: TableListItem['role']) {
  if (role === 'gm') return 'GM';
  if (role === 'player') return 'Jogador';
  return 'Visitante';
}

function buildActivityItems(tables: TableListItem[], characters: UserCharacterSummary[]): HubActivityItem[] {
  const tableItems = tables.map((table) => ({
    id: `table:${table.id}`,
    label: table.status || 'Mesa',
    title: table.name,
    body: `${getGameSystem(table.systemKey).name} · ${formatRoleLabel(table.role)}`,
    timestamp: formatDateTime(table.updatedAt),
    sortAt: table.updatedAt,
    href: `/mesa/${table.slug}`,
    actionLabel: 'Entrar'
  }));

  const characterItems = characters.map((character) => ({
    id: `character:${character.id}`,
    label: 'Personagem',
    title: character.name,
    body: character.tableName ? `Vinculado a ${character.tableName}` : 'Disponível para mesa',
    timestamp: formatDateTime(character.updatedAt),
    sortAt: character.updatedAt,
    href: '/personagens',
    actionLabel: 'Abrir',
    avatarUrl: character.avatarUrl || undefined
  }));

  return ([...tableItems, ...characterItems] as HubActivityDraft[])
    .sort((left, right) => new Date(right.sortAt).getTime() - new Date(left.sortAt).getTime())
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      label: item.label,
      title: item.title,
      body: item.body,
      timestamp: item.timestamp,
      href: item.href,
      actionLabel: item.actionLabel,
      avatarUrl: item.avatarUrl
    }));
}

export function HubPage() {
  const navigate = useNavigate();
  const { tables, listUserCharacters } = usePlatformHub();
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

  const activityItems = useMemo(() => buildActivityItems(tables, characters), [characters, tables]);
  const quickStripItems = useMemo<QuickStripItem[]>(
    () =>
      [
        ...tables.slice(0, 4).map((table) => ({
          id: `table:${table.id}`,
          name: table.name,
          label: formatRoleLabel(table.role),
          href: `/mesa/${table.slug}`
        })),
        ...characters.slice(0, 3).map((character) => ({
          id: `character:${character.id}`,
          name: character.name,
          label: character.grade || 'Ficha',
          href: '/personagens',
          avatarUrl: character.avatarUrl || undefined
        }))
      ].slice(0, 6),
    [characters, tables]
  );

  return (
    <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(0,1.54fr)_310px]">
      <div className="grid min-w-0 gap-3">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200/80">Hub</p>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">Atividade recente</h1>
          </div>
          <V2Toolbar>
            <Button onClick={() => navigate('/mesas')}>
              <Sparkles className="size-4" />
              Criar
            </Button>
            <Button onClick={() => navigate('/mesas')}>
              <Users className="size-4" />
              Mesas
            </Button>
            <Button variant="secondary" onClick={() => navigate('/personagens')}>
              <IdCard className="size-4" />
              Personagens
            </Button>
          </V2Toolbar>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            className="rounded-xl border border-blue-300/18 bg-blue-500/10 px-3 py-2.5 text-left transition hover:border-blue-200/34 hover:bg-blue-400/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
            onClick={() => navigate('/mesas')}
          >
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/80">Mesas</span>
            <span className="mt-1 block text-xl font-bold text-white">{tables.length}</span>
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/8 bg-white/[0.026] px-3 py-2.5 text-left transition hover:border-blue-300/24 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
            onClick={() => navigate('/personagens')}
          >
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Fichas</span>
            <span className="mt-1 block text-xl font-bold text-white">{loadingCharacters ? '--' : characters.length}</span>
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/8 bg-white/[0.026] px-3 py-2.5 text-left transition hover:border-blue-300/24 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
            onClick={() => navigate('/convites')}
          >
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Convites</span>
            <span className="mt-1 block text-xl font-bold text-white">0</span>
          </button>
        </div>

        <V2Panel tone="flat" className="p-2.5">
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
            {quickStripItems.length ? (
              quickStripItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="group grid min-w-[86px] justify-items-center gap-2 rounded-lg border border-white/8 bg-white/[0.024] px-2 py-2 text-center transition hover:border-blue-300/25 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
                  onClick={() => navigate(item.href)}
                >
                  <Avatar src={item.avatarUrl} name={item.name} size="md" className="size-11 rounded-xl" />
                  <span className="max-w-[72px] truncate text-xs font-semibold text-slate-200">{item.name}</span>
                </button>
              ))
            ) : (
              <div className="flex min-h-16 items-center rounded-lg border border-white/8 bg-white/[0.024] px-3 text-sm text-slate-300/72">
                Mesas e fichas aparecem aqui quando houver atividade.
              </div>
            )}
          </div>
        </V2Panel>

        <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_260px]">
          <V2Panel className="p-3 sm:p-4">
            <V2PanelHeader
              eyebrow="Feed"
              title="Continuidade"
              action={<Sparkles className="size-4 text-blue-200" />}
            />
            <V2Feed
              className="mt-3"
              items={activityItems}
              empty={<EmptyState title="Sem atividade recente." body="Mesas e personagens aparecem quando houver movimento." />}
            />
          </V2Panel>

          <V2Panel className="p-3 sm:p-4">
            <V2PanelHeader eyebrow="Acesso rápido" title="Agora" action={<CalendarDays className="size-4 text-blue-200" />} />
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/8 bg-white/[0.026] px-3 py-2.5 text-left transition hover:border-blue-300/22 hover:bg-white/[0.045]"
                onClick={() => navigate(tables[0] ? `/mesa/${tables[0].slug}` : '/mesas')}
              >
                <p className="text-sm font-bold text-white">{tables[0]?.name || 'Abrir mesas'}</p>
                <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-slate-400">
                  {tables[0] ? `${getGameSystem(tables[0].systemKey).name} · ${formatRoleLabel(tables[0].role)}` : 'Mesa ativa'}
                </p>
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/8 bg-white/[0.026] px-3 py-2.5 text-left transition hover:border-blue-300/22 hover:bg-white/[0.045]"
                onClick={() => navigate('/personagens')}
              >
                <p className="text-sm font-bold text-white">Biblioteca</p>
                <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-slate-400">{loadingCharacters ? 'Fichas' : `${characters.length} fichas`}</p>
              </button>
            </div>
          </V2Panel>
        </div>

        <V2Panel className="p-3 sm:p-4 xl:hidden">
          <V2PanelHeader
            eyebrow="Mesas ativas"
            title="Sessões recentes"
            action={<RadioTower className="size-4 text-blue-200" />}
          />
          <V2List className="mt-3">
            {tables.length ? (
              tables.slice(0, 3).map((table) => (
                <V2ListRow key={table.id} href={`/mesa/${table.slug}`} action="Abrir">
                  <p className="truncate text-sm font-bold text-white">{table.name}</p>
                  <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-slate-400">
                    {getGameSystem(table.systemKey).name} · {formatRoleLabel(table.role)}
                  </p>
                </V2ListRow>
              ))
            ) : (
              <EmptyState title="Nenhuma mesa ativa." body="Crie ou entre em uma mesa." />
            )}
          </V2List>
        </V2Panel>
      </div>

      <aside className="hidden min-w-0 gap-3 xl:grid">
        <V2Panel className="p-3 sm:p-4">
          <V2PanelHeader eyebrow="Mesas ativas" title="Sessões recentes" action={<RadioTower className="size-4 text-blue-200" />} />
          <V2List className="mt-4">
            {tables.length ? (
              tables.slice(0, 4).map((table) => (
                <V2ListRow key={table.id} href={`/mesa/${table.slug}`} action="Abrir">
                  <p className="truncate text-sm font-bold text-white">{table.name}</p>
                  <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-slate-400">
                    {getGameSystem(table.systemKey).name} · {formatRoleLabel(table.role)}
                  </p>
                </V2ListRow>
              ))
            ) : (
              <EmptyState title="Nenhuma mesa ativa." body="Crie ou entre em uma mesa." />
            )}
          </V2List>
        </V2Panel>

        <V2Panel className="p-3 sm:p-4">
          <V2PanelHeader eyebrow="Convites pendentes" title="Entrada rápida" />
          <div className="mt-4 grid gap-2">
            <p className="rounded-lg border border-white/8 bg-white/[0.026] px-3 py-2.5 text-sm leading-6 text-slate-300/72">Nenhum convite pendente.</p>
            <Button variant="secondary" onClick={() => navigate('/convites')}>
              <DoorOpen className="size-4" />
              Ver convites
            </Button>
          </div>
        </V2Panel>

        <V2Panel className="p-3 sm:p-4">
          <V2PanelHeader eyebrow="Personagens em destaque" title={loadingCharacters ? 'Carregando' : `${characters.length} fichas`} />
          <V2List className="mt-4">
            {loadingCharacters ? (
              <p className="rounded-lg border border-white/8 bg-white/[0.026] px-3 py-2.5 text-sm text-slate-300/72">Carregando personagens...</p>
            ) : characters.length ? (
              characters.slice(0, 3).map((character) => (
                <V2ListRow key={character.id} href="/personagens" action="Abrir">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={character.avatarUrl || undefined} name={character.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{character.name}</p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-slate-400">
                        {character.grade || 'Sem grau'} · {character.clan || 'Sem clã'}
                      </p>
                    </div>
                  </div>
                </V2ListRow>
              ))
            ) : (
              <EmptyState title="Sem personagens." body="Crie uma ficha em Personagens." />
            )}
          </V2List>
        </V2Panel>
      </aside>
    </div>
  );
}
