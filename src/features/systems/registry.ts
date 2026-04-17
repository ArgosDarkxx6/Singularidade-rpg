import { DEFAULT_GAME_SYSTEM_KEY } from '@lib/domain/constants';
import { SINGULARIDADE_SYSTEM_ADAPTER } from '@features/systems/singularidade/adapter';
import type { GameSystemKey, MesaSection, TableMeta } from '@/types/domain';

export { DEFAULT_GAME_SYSTEM_KEY };

export interface GameSystemDefinition {
  key: GameSystemKey;
  name: string;
  tagline: string;
  description: string;
  status: 'enabled' | 'locked';
  themeClassName: string;
  accentLabel: string;
  assets: {
    icon: string;
    cover: string;
    rulebook: string;
  };
  modules: MesaSection[];
  defaults: {
    tableMeta: TableMeta;
  };
  adapter: typeof SINGULARIDADE_SYSTEM_ADAPTER;
}

export const GAME_SYSTEMS = {
  singularidade: {
    key: 'singularidade',
    name: 'Singularidade',
    tagline: 'Energia amaldiçoada, ordem tática e drama de mesa.',
    description: 'Fichas, rolagens, ordem e livro para campanhas de Singularidade.',
    status: 'enabled',
    themeClassName: 'system-theme-singularidade',
    accentLabel: 'Energia amaldiçoada',
    assets: {
      icon: '/assets/icon.png',
      cover: '/assets/cover.png',
      rulebook: '/assets/Singularidade_Livro_de_Regras.pdf'
    },
    modules: SINGULARIDADE_SYSTEM_ADAPTER.table.modules,
    defaults: {
      tableMeta: {
        ...SINGULARIDADE_SYSTEM_ADAPTER.table.defaults
      }
    },
    adapter: SINGULARIDADE_SYSTEM_ADAPTER
  }
} as const satisfies Record<GameSystemKey, GameSystemDefinition>;

export const GAME_SYSTEM_OPTIONS = Object.values(GAME_SYSTEMS);
export const SUPPORTED_GAME_SYSTEM_KEYS = Object.keys(GAME_SYSTEMS) as GameSystemKey[];

export function isGameSystemKey(value: unknown): value is GameSystemKey {
  return typeof value === 'string' && value in GAME_SYSTEMS;
}

export function resolveGameSystemKey(value: unknown): GameSystemKey {
  return isGameSystemKey(value) ? value : DEFAULT_GAME_SYSTEM_KEY;
}

export function getGameSystem(key: unknown): GameSystemDefinition {
  return GAME_SYSTEMS[resolveGameSystemKey(key)];
}

export function getDefaultTableMetaForSystem(key: unknown): TableMeta {
  return {
    ...getGameSystem(key).defaults.tableMeta
  };
}
