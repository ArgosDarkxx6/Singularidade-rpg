import type { AppView, AttributeKey, Rank, ResourceKey, RollContext, TableMeta } from '@/types/domain';

export const CURRENT_VERSION = 8;
export const STORAGE_KEY = 'singularidade-remake-state-v8';
export const AUTH_STORAGE_KEY = 'singularidade-remake-auth-v1';
export const USERS_STORAGE_KEY = 'singularidade-remake-users-v1';
export const TABLES_STORAGE_KEY = 'singularidade-remake-tables-v1';
export const ONLINE_SESSION_STORAGE_KEY = 'singularidade-remake-online-session-v1';

export const RESOURCE_KEYS: ResourceKey[] = ['hp', 'energy', 'sanity'];

export const RESOURCE_LABELS: Record<ResourceKey, string> = {
  hp: 'PV',
  energy: 'EA',
  sanity: 'SAN'
};

export const ATTRIBUTE_CONFIG: Array<{ key: AttributeKey; label: string; isMental: boolean }> = [
  { key: 'strength', label: 'Forca', isMental: false },
  { key: 'resistance', label: 'Resistencia', isMental: false },
  { key: 'dexterity', label: 'Destreza', isMental: false },
  { key: 'speed', label: 'Velocidade', isMental: false },
  { key: 'fight', label: 'Lutar', isMental: false },
  { key: 'precision', label: 'Precisao', isMental: false },
  { key: 'intelligence', label: 'Inteligencia', isMental: true },
  { key: 'charisma', label: 'Carisma', isMental: true }
];

export const ATTRIBUTE_LABELS = Object.fromEntries(ATTRIBUTE_CONFIG.map((item) => [item.key, item.label])) as Record<
  AttributeKey,
  string
>;

export const RANKS: Rank[] = ['C', 'B', 'A', 'S', 'SS', 'SSS'];
export const TECHNIQUE_TYPES = ['Ofensiva', 'Suporte', 'Controle', 'Toque'] as const;
export const GRADE_OPTIONS = ['Grau 4', 'Grau 3', 'Grau 2', 'Grau 1', 'Grau Especial'];
export const ROLL_TN_PRESETS = [10, 13, 15, 17, 20];
export const TABLE_STATUS_OPTIONS = ['Planejamento', 'Em sessao', 'Intervalo', 'Finalizada'];
export const NAV_ITEMS: Array<{ key: AppView; label: string }> = [
  { key: 'sheet', label: 'Fichas' },
  { key: 'rolls', label: 'Rolagens' },
  { key: 'order', label: 'Ordem' },
  { key: 'compendium', label: 'Livro' },
  { key: 'mesa', label: 'Mesa' }
];

export const VIEW_LABELS: Record<AppView, string> = {
  sheet: 'Fichas',
  rolls: 'Rolagens',
  order: 'Ordem',
  compendium: 'Livro',
  mesa: 'Mesa'
};

export const ROLL_CONTEXTS: Array<{ value: RollContext; label: string }> = [
  { value: 'standard', label: 'Teste padrao' },
  { value: 'physical-attack', label: 'Ataque fisico' },
  { value: 'ranged-attack', label: 'Ataque a distancia' },
  { value: 'domain-clash', label: 'Conflito de dominio' }
];

export const CONDITION_COLORS = {
  purple: { label: 'Roxo', bg: 'rgba(113, 96, 255, 0.16)', border: 'rgba(113, 96, 255, 0.4)' },
  red: { label: 'Vermelho', bg: 'rgba(255, 89, 101, 0.16)', border: 'rgba(255, 89, 101, 0.4)' },
  blue: { label: 'Azul', bg: 'rgba(77, 182, 255, 0.16)', border: 'rgba(77, 182, 255, 0.4)' },
  green: { label: 'Verde', bg: 'rgba(89, 204, 145, 0.16)', border: 'rgba(89, 204, 145, 0.4)' },
  gray: { label: 'Cinza', bg: 'rgba(180, 194, 214, 0.16)', border: 'rgba(180, 194, 214, 0.4)' }
} as const;

export const DEFAULT_TABLE_META: TableMeta = {
  tableName: 'Mesa Singularidade',
  seriesName: 'Jujutsu Kaisen',
  campaignName: '',
  episodeNumber: '',
  episodeTitle: '',
  sessionDate: '',
  location: '',
  status: 'Planejamento',
  expectedRoster: '',
  recap: '',
  objective: ''
};

