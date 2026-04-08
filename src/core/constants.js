export const CURRENT_VERSION = 7;
export const STORAGE_KEY = 'singularidade-web-state-v7';
export const BROWSER_CACHE_KEY = 'singularidade-web-cache-v7';

export const RESOURCE_KEYS = ['hp', 'energy', 'sanity'];
export const RESOURCE_LABELS = {
  hp: 'PV',
  energy: 'EA',
  sanity: 'SAN'
};

export const RESOURCE_COLORS = {
  hp: 'var(--blood)',
  energy: 'var(--curse-violet)',
  sanity: 'var(--curse-cyan)'
};

export const ATTRIBUTE_CONFIG = [
  { key: 'strength', label: 'Força', isMental: false },
  { key: 'resistance', label: 'Resistência', isMental: false },
  { key: 'dexterity', label: 'Destreza', isMental: false },
  { key: 'speed', label: 'Velocidade', isMental: false },
  { key: 'fight', label: 'Lutar', isMental: false },
  { key: 'precision', label: 'Precisão', isMental: false },
  { key: 'intelligence', label: 'Inteligência', isMental: true },
  { key: 'charisma', label: 'Carisma', isMental: true }
];

export const ATTRIBUTE_LABELS = Object.fromEntries(
  ATTRIBUTE_CONFIG.map((item) => [item.key, item.label])
);

export const RANKS = ['C', 'B', 'A', 'S', 'SS', 'SSS'];
export const TECHNIQUE_TYPES = ['Ofensiva', 'Suporte', 'Controle', 'Toque'];
export const GRADE_OPTIONS = ['Grau 4', 'Grau 3', 'Grau 2', 'Grau 1', 'Grau Especial'];
export const ROLL_TN_PRESETS = [10, 13, 15, 17, 20];
export const TABLE_STATUS_OPTIONS = ['Planejamento', 'Em sessão', 'Intervalo', 'Finalizada'];
export const JOIN_CODE_ROLE_OPTIONS = [
  { key: 'player', label: 'Jogador' },
  { key: 'viewer', label: 'Espectador' },
  { key: 'gm', label: 'Mestre' }
];
export const REFERENCE_SCOPE_OPTIONS = [
  { key: 'all', label: 'Tudo' },
  { key: 'lore', label: 'Lore' },
  { key: 'media', label: 'Mídia' }
];

export const NAV_ITEMS = [
  { key: 'sheet', label: 'Fichas', icon: 'sheet' },
  { key: 'rolls', label: 'Rolagens', icon: 'dice' },
  { key: 'order', label: 'Ordem', icon: 'order' },
  { key: 'compendium', label: 'Livro', icon: 'book' },
  { key: 'mesa', label: 'Mesa', icon: 'users' }
];

export const CONDITION_COLORS = {
  purple: { label: 'Roxo', bg: 'rgba(127, 83, 255, 0.16)', border: 'rgba(127, 83, 255, 0.34)' },
  red: { label: 'Vermelho', bg: 'rgba(255, 83, 114, 0.16)', border: 'rgba(255, 83, 114, 0.34)' },
  blue: { label: 'Azul', bg: 'rgba(70, 206, 255, 0.16)', border: 'rgba(70, 206, 255, 0.34)' },
  green: { label: 'Verde', bg: 'rgba(113, 219, 165, 0.16)', border: 'rgba(113, 219, 165, 0.34)' },
  gray: { label: 'Cinza', bg: 'rgba(177, 169, 199, 0.16)', border: 'rgba(177, 169, 199, 0.3)' }
};

export const ORDER_ENTRY_TYPE_LABEL = {
  pc: 'PC',
  npc: 'NPC'
};

export const ITEM_TYPE_LABEL = {
  techniques: 'Técnica',
  weapons: 'Arma',
  passives: 'Passiva',
  vows: 'Voto',
  inventory: 'Item'
};

export const VIEW_LABELS = {
  sheet: 'Fichas',
  rolls: 'Rolagens',
  order: 'Ordem',
  compendium: 'Livro',
  mesa: 'Mesa'
};

export const DEFAULT_TABLE_META = {
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
