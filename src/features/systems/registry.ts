import { DEFAULT_GAME_SYSTEM_KEY, DEFAULT_TABLE_META } from '@lib/domain/constants';
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
}

export const GAME_SYSTEMS = {
  singularidade: {
    key: 'singularidade',
    name: 'Singularidade',
    tagline: 'Energia amaldiçoada, ordem tática e drama de mesa.',
    description:
      'Sistema focado em campanhas inspiradas por maldições, técnicas especiais, domínios, rolagens guiadas, ordem de combate e livro próprio.',
    status: 'enabled',
    themeClassName: 'system-theme-singularidade',
    accentLabel: 'Energia amaldiçoada',
    assets: {
      icon: '/assets/icon.png',
      cover: '/assets/cover.png',
      rulebook: '/assets/Singularidade_Livro_de_Regras.pdf'
    },
    modules: ['overview', 'sessao', 'fichas', 'rolagens', 'ordem', 'livro', 'membros', 'configuracoes'],
    defaults: {
      tableMeta: {
        ...DEFAULT_TABLE_META,
        tableName: 'Mesa Singularidade',
        seriesName: 'Jujutsu Kaisen'
      }
    }
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
