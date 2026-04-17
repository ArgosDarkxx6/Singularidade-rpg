import type {
  AttributeKey,
  GameSession,
  GameSystemKey,
  MesaMeta,
  Rank,
  ResourceKey,
  RollContext,
  SessionAttendanceStatus,
  TableMeta
} from '@/types/domain';
import {
  SINGULARIDADE_ATTRIBUTE_CONFIG,
  SINGULARIDADE_ATTRIBUTE_LABELS,
  SINGULARIDADE_CONDITION_COLORS,
  SINGULARIDADE_DEFAULT_MESA_META,
  SINGULARIDADE_DEFAULT_TABLE_META,
  SINGULARIDADE_GRADE_OPTIONS,
  SINGULARIDADE_MESA_SECTION_LABELS,
  SINGULARIDADE_RANKS,
  SINGULARIDADE_RESOURCE_KEYS,
  SINGULARIDADE_RESOURCE_LABELS,
  SINGULARIDADE_ROLL_CONTEXTS,
  SINGULARIDADE_ROLL_TN_PRESETS,
  SINGULARIDADE_SESSION_ATTENDANCE_STATUS_LABELS,
  SINGULARIDADE_TECHNIQUE_TYPES
} from '@features/systems/singularidade/adapter';

export const CURRENT_VERSION = 8;
export const DEFAULT_GAME_SYSTEM_KEY: GameSystemKey = 'singularidade';
export const STORAGE_KEY = 'project-nexus-state-v8';
export const AUTH_STORAGE_KEY = 'project-nexus-auth-v1';
export const USERS_STORAGE_KEY = 'project-nexus-users-v1';
export const TABLES_STORAGE_KEY = 'project-nexus-tables-v1';
export const ONLINE_SESSION_STORAGE_KEY = 'project-nexus-online-session-v1';
export const LEGACY_MIGRATION_STORAGE_KEY = 'project-nexus-legacy-migration-v1';

export const LEGACY_STORAGE_KEY = 'singularidade-remake-state-v8';
export const LEGACY_AUTH_STORAGE_KEY = 'singularidade-remake-auth-v1';
export const LEGACY_USERS_STORAGE_KEY = 'singularidade-remake-users-v1';
export const LEGACY_TABLES_STORAGE_KEY = 'singularidade-remake-tables-v1';
export const LEGACY_ONLINE_SESSION_STORAGE_KEY = 'singularidade-remake-online-session-v1';
export const LEGACY_MIGRATION_DISMISSAL_STORAGE_KEY = 'singularidade-remake-legacy-migration-v1';

export const RESOURCE_KEYS: ResourceKey[] = SINGULARIDADE_RESOURCE_KEYS;

export const RESOURCE_LABELS: Record<ResourceKey, string> = SINGULARIDADE_RESOURCE_LABELS;

export const ATTRIBUTE_CONFIG: Array<{ key: AttributeKey; label: string; isMental: boolean }> = SINGULARIDADE_ATTRIBUTE_CONFIG;

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = SINGULARIDADE_ATTRIBUTE_LABELS;

export const RANKS: Rank[] = SINGULARIDADE_RANKS;
export const TECHNIQUE_TYPES = SINGULARIDADE_TECHNIQUE_TYPES;
export const GRADE_OPTIONS = SINGULARIDADE_GRADE_OPTIONS;
export const ROLL_TN_PRESETS = SINGULARIDADE_ROLL_TN_PRESETS;
export const TABLE_STATUS_OPTIONS = ['Planejamento', 'Em sessão', 'Intervalo', 'Finalizada'];
export const SESSION_STATUS_OPTIONS = ['Planejamento', 'Em sessão', 'Intervalo', 'Finalizada'] as const;

export const SESSION_ATTENDANCE_STATUS_LABELS: Record<SessionAttendanceStatus, string> = SINGULARIDADE_SESSION_ATTENDANCE_STATUS_LABELS;

export const MESA_SECTION_LABELS = SINGULARIDADE_MESA_SECTION_LABELS;

export const ROLL_CONTEXTS: Array<{ value: RollContext; label: string }> = SINGULARIDADE_ROLL_CONTEXTS;

export const CONDITION_COLORS = SINGULARIDADE_CONDITION_COLORS;

export const DEFAULT_MESA_META: MesaMeta = SINGULARIDADE_DEFAULT_MESA_META;

export const DEFAULT_TABLE_META: TableMeta = SINGULARIDADE_DEFAULT_TABLE_META;

export const DEFAULT_GAME_SESSION: GameSession = {
  id: '',
  tableId: '',
  episodeNumber: '',
  episodeTitle: '',
  status: 'Planejamento',
  sessionDate: '',
  location: '',
  objective: '',
  recap: '',
  notes: '',
  isActive: false,
  createdBy: '',
  createdAt: '',
  updatedAt: ''
};
