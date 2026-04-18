import type {
  AttributeKey,
  GameSystemKey,
  MesaSection,
  MesaMeta,
  Rank,
  ResourceKey,
  RollContext,
  SessionAttendanceStatus,
  TableMeta
} from '@/types/domain';

export const SINGULARIDADE_SYSTEM_KEY: GameSystemKey = 'singularidade';

export const SINGULARIDADE_RESOURCE_KEYS: ResourceKey[] = ['hp', 'energy', 'sanity'];

export const SINGULARIDADE_RESOURCE_LABELS: Record<ResourceKey, string> = {
  hp: 'PV',
  energy: 'EA',
  sanity: 'SAN'
};

export const SINGULARIDADE_ATTRIBUTE_CONFIG: Array<{ key: AttributeKey; label: string; isMental: boolean }> = [
  { key: 'strength', label: 'Força', isMental: false },
  { key: 'resistance', label: 'Resistência', isMental: false },
  { key: 'dexterity', label: 'Destreza', isMental: false },
  { key: 'speed', label: 'Velocidade', isMental: false },
  { key: 'fight', label: 'Lutar', isMental: false },
  { key: 'precision', label: 'Precisão', isMental: false },
  { key: 'intelligence', label: 'Inteligência', isMental: true },
  { key: 'charisma', label: 'Carisma', isMental: true }
];

export const SINGULARIDADE_ATTRIBUTE_LABELS = Object.fromEntries(
  SINGULARIDADE_ATTRIBUTE_CONFIG.map((item) => [item.key, item.label])
) as Record<AttributeKey, string>;

export const SINGULARIDADE_RANKS: Rank[] = ['C', 'B', 'A', 'S', 'SS', 'SSS'];
export const SINGULARIDADE_TECHNIQUE_TYPES = ['Ofensiva', 'Suporte', 'Controle', 'Toque'] as const;
export const SINGULARIDADE_GRADE_OPTIONS = ['Grau 4', 'Grau 3', 'Grau 2', 'Grau 1', 'Grau Especial'];
export const SINGULARIDADE_ROLL_TN_PRESETS = [10, 13, 15, 17, 20];

export const SINGULARIDADE_SESSION_ATTENDANCE_STATUS_LABELS: Record<SessionAttendanceStatus, string> = {
  pending: 'Pendente',
  present: 'Presente',
  absent: 'Ausente'
};

export const SINGULARIDADE_MESA_SECTION_LABELS: Record<MesaSection, string> = {
  overview: 'Geral',
  sessao: 'Sessão',
  fichas: 'Fichas',
  rolagens: 'Rolagens',
  ordem: 'Ordem',
  livro: 'Livro',
  membros: 'Membros',
  configuracoes: 'Configurações'
};

export const SINGULARIDADE_ROLL_CONTEXTS: Array<{ value: RollContext; label: string }> = [
  { value: 'standard', label: 'Teste padrão' },
  { value: 'physical-attack', label: 'Ataque físico' },
  { value: 'ranged-attack', label: 'Ataque à distância' },
  { value: 'domain-clash', label: 'Conflito de domínio' }
];

export const SINGULARIDADE_CONDITION_COLORS = {
  purple: { label: 'Roxo', bg: 'rgba(113, 96, 255, 0.16)', border: 'rgba(113, 96, 255, 0.4)' },
  red: { label: 'Vermelho', bg: 'rgba(255, 89, 101, 0.16)', border: 'rgba(255, 89, 101, 0.4)' },
  blue: { label: 'Azul', bg: 'rgba(77, 182, 255, 0.16)', border: 'rgba(77, 182, 255, 0.4)' },
  green: { label: 'Verde', bg: 'rgba(89, 204, 145, 0.16)', border: 'rgba(89, 204, 145, 0.4)' },
  gray: { label: 'Cinza', bg: 'rgba(180, 194, 214, 0.16)', border: 'rgba(180, 194, 214, 0.4)' }
} as const;

export const SINGULARIDADE_DEFAULT_MESA_META: MesaMeta = {
  tableName: 'Mesa Singularidade',
  description: '',
  slotCount: 0,
  seriesName: 'Jujutsu Kaisen',
  campaignName: ''
};

export const SINGULARIDADE_DEFAULT_TABLE_META: TableMeta = {
  ...SINGULARIDADE_DEFAULT_MESA_META
};

export const SINGULARIDADE_MODULES: MesaSection[] = ['overview', 'sessao', 'fichas', 'rolagens', 'ordem', 'livro', 'membros', 'configuracoes'];

export const SINGULARIDADE_SYSTEM_ADAPTER = {
  key: SINGULARIDADE_SYSTEM_KEY,
  sheet: {
    resourceKeys: SINGULARIDADE_RESOURCE_KEYS,
    resourceLabels: SINGULARIDADE_RESOURCE_LABELS,
    attributeConfig: SINGULARIDADE_ATTRIBUTE_CONFIG,
    attributeLabels: SINGULARIDADE_ATTRIBUTE_LABELS,
    ranks: SINGULARIDADE_RANKS,
    techniqueTypes: SINGULARIDADE_TECHNIQUE_TYPES,
    gradeOptions: SINGULARIDADE_GRADE_OPTIONS,
    rollContexts: SINGULARIDADE_ROLL_CONTEXTS,
    conditionColors: SINGULARIDADE_CONDITION_COLORS
  },
  table: {
    modules: SINGULARIDADE_MODULES,
    defaults: SINGULARIDADE_DEFAULT_TABLE_META
  }
} as const;
