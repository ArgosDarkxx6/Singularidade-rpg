export type ResourceKey = 'hp' | 'energy' | 'sanity';

export type AttributeKey =
  | 'strength'
  | 'resistance'
  | 'dexterity'
  | 'speed'
  | 'fight'
  | 'precision'
  | 'intelligence'
  | 'charisma';

export type Rank = 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export type TechniqueType = 'Ofensiva' | 'Suporte' | 'Controle' | 'Toque';

export type TableRole = 'gm' | 'player' | 'viewer';

export type GameSystemKey = 'singularidade';

export type MesaSection = 'overview' | 'sessao' | 'fichas' | 'rolagens' | 'ordem' | 'livro' | 'membros' | 'configuracoes';

export type RollContext = 'standard' | 'physical-attack' | 'ranged-attack' | 'domain-clash';

export interface ResourceValue {
  current: number;
  max: number;
}

export interface CharacterAttribute {
  value: number;
  rank: Rank;
}

export interface CharacterIdentity {
  scar: string;
  anchor: string;
  trigger: string;
}

export interface Weapon {
  id: string;
  name: string;
  grade: string;
  damage: string;
  tags: string[];
  description: string;
}

export interface Technique {
  id: string;
  name: string;
  cost: number;
  damage: string;
  type: TechniqueType;
  tags: string[];
  description: string;
}

export interface Passive {
  id: string;
  name: string;
  tags: string[];
  description: string;
}

export interface Vow {
  id: string;
  name: string;
  benefit: string;
  restriction: string;
  penalty: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  effect: string;
}

export type ConditionColor = 'purple' | 'red' | 'blue' | 'green' | 'gray';

export interface Condition {
  id: string;
  name: string;
  color: ConditionColor;
  note: string;
}

export interface CharacterGalleryImage {
  id: string;
  url: string;
  path: string;
  caption: string;
  sortOrder: number;
}

export interface CharacterCore {
  id: string;
  ownerId: string;
  name: string;
  age: number;
  appearance: string;
  lore: string;
  clan: string;
  grade: string;
  avatarMode: 'none' | 'url' | 'upload';
  avatar: string;
  avatarPath?: string;
  gallery: CharacterGalleryImage[];
  identity: CharacterIdentity;
  createdAt: string;
  updatedAt: string;
}

export interface TableCharacter {
  id: string;
  tableId: string;
  coreId: string;
  ownerId: string | null;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  appearance: string;
  lore: string;
  clan: string;
  grade: string;
  avatarMode: 'none' | 'url' | 'upload';
  avatar: string;
  avatarPath?: string;
  gallery: CharacterGalleryImage[];
  identity: CharacterIdentity;
  resources: Record<ResourceKey, ResourceValue>;
  attributes: Record<AttributeKey, CharacterAttribute>;
  weapons: Weapon[];
  techniques: Technique[];
  passives: Passive[];
  vows: Vow[];
  inventory: {
    money: number;
    items: InventoryItem[];
  };
  conditions: Condition[];
}

export interface MesaMeta {
  tableName: string;
  description: string;
  slotCount: number;
  seriesName: string;
  campaignName: string;
}

export interface LegacySessionMeta {
  episodeNumber: string;
  episodeTitle: string;
  sessionDate: string;
  location: string;
  status: string;
  expectedRoster: string;
  recap: string;
  objective: string;
}

export interface DisasterEvent {
  id: string;
  timestamp: string;
  title: string;
  text: string;
}

export interface DisasterState {
  criticalFailures: number;
  threshold: number;
  disastersTriggered: number;
  history: DisasterEvent[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  text: string;
  meta: string;
  event?: {
    kind: string;
    actorMembershipId?: string;
    actorUserId?: string;
    characterId?: string;
    characterName?: string;
    resourceKey?: ResourceKey;
    payload?: Record<string, unknown>;
  } | null;
}

export interface OrderEntry {
  id: string;
  name: string;
  type: 'pc' | 'npc';
  characterId: string | null;
  init: number | null;
  modifier: number;
  notes: string;
}

export interface OrderState {
  round: number;
  turn: number;
  entries: OrderEntry[];
}

export type TableMeta = MesaMeta;

export type SessionAttendanceStatus = 'pending' | 'present' | 'absent';

export interface GameSession {
  id: string;
  tableId: string;
  episodeNumber: string;
  episodeTitle: string;
  status: string;
  sessionDate: string;
  location: string;
  objective: string;
  recap: string;
  notes: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionAttendance {
  id: string;
  sessionId: string;
  membershipId: string;
  status: SessionAttendanceStatus;
  markedAt: string;
}

export interface TableAccessSession {
  tableId: string;
  membershipId: string;
  tableSlug: string;
  tableName: string;
  systemKey: GameSystemKey;
  role: TableRole;
  nickname: string;
  characterId: string;
  lastJoinedAt?: string;
}

export interface ExternalReferenceCard {
  id: string;
  title: string;
  category: string;
  summary: string;
  source: string;
  provider: 'lore' | 'media' | 'all';
  url: string;
  meta?: string;
}

export interface PresenceMember {
  id: string;
  userId: string;
  nickname: string;
  role: TableRole;
  characterId: string;
  characterName: string;
  isOwner?: boolean;
}

export interface TableInvite {
  id: string;
  kind: 'link';
  role: TableRole;
  code: string;
  tableSlug: string;
  tableName?: string;
  tableDescription?: string;
  acceptedAt?: string | null;
  url: string;
}

export interface TableJoinCode {
  id: string;
  kind: 'code';
  tableSlug: string;
  role: TableRole;
  code: string;
  active: boolean;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvitePreview {
  token: string;
  tableId: string;
  tableSlug: string;
  tableName: string;
  tableDescription: string;
  role: TableRole;
  revoked: boolean;
  expired: boolean;
  accepted: boolean;
}

export type TableSession = TableAccessSession;

export interface TableListItem {
  id: string;
  slug: string;
  name: string;
  systemKey: GameSystemKey;
  role: TableRole;
  nickname: string;
  characterId: string;
  createdAt: string;
  updatedAt: string;
  joinedAt: string;
  isOwner: boolean;
  seriesName: string;
  campaignName: string;
  status: string;
}

export interface WorkspaceState {
  version: number;
  characters: Character[];
  order: OrderState;
  disaster: DisasterState;
  log: LogEntry[];
  activeCharacterId: string;
}

export interface TableSnapshot {
  id: string;
  label: string;
  actorName: string;
  createdAt: string;
  state: WorkspaceState;
}

export interface TableState {
  id: string;
  slug: string;
  name: string;
  systemKey: GameSystemKey;
  ownerId: string | null;
  meta: TableMeta;
  updatedAt: string;
  createdAt: string;
  lastEditor: string;
  state: WorkspaceState;
  currentSession: GameSession | null;
  sessionAttendances: SessionAttendance[];
  sessionHistoryPreview?: GameSession[];
  memberships: PresenceMember[];
  invites: TableInvite[];
  joinCodes: TableJoinCode[];
  snapshots: TableSnapshot[];
}

export interface UserCharacterSummary {
  id: string;
  coreId?: string;
  name: string;
  clan: string;
  grade: string;
  avatarUrl: string;
  tableId: string | null;
  tableName: string;
  updatedAt: string;
}

export interface CharacterCoreSummary {
  id: string;
  ownerId: string;
  name: string;
  clan: string;
  grade: string;
  lore: string;
  avatarUrl: string;
  avatarPath?: string;
  gallery: CharacterGalleryImage[];
  updatedAt: string;
  createdAt: string;
}

export interface OnlineState {
  platformAvailable: boolean;
  status: 'offline' | 'connecting' | 'connected' | 'syncing' | 'reconnecting' | 'error';
  session: TableSession | null;
  table: TableState | null;
  currentSession: GameSession | null;
  sessionAttendances: SessionAttendance[];
  sessionHistoryPreview?: GameSession[];
  members: PresenceMember[];
  snapshots: TableSnapshot[];
  joinCodes: TableJoinCode[];
  lastInvite: string | null;
  references: ExternalReferenceCard[];
  referencesLoading: boolean;
  lastSyncAt: string;
  error: string;
}

export interface GuidedRollInput {
  characterId: string;
  attributeKey: AttributeKey;
  context: RollContext;
  extraBonus: number;
  tn: number | null;
}

export interface CustomRollInput {
  expression: string;
  bonus: number;
  label: string;
  tn: number | null;
}

export interface RollResult {
  custom?: boolean;
  label: string;
  expression?: string;
  rolls: number[];
  subtotal?: number;
  bonus?: number;
  total: number;
  tn: number | null;
  margin: number | null;
  tnResult?: 'success' | 'failure';
  outcomeLabel: string;
  natural?: number;
  characterId?: string;
  characterName?: string;
  attributeKey?: AttributeKey;
  attributeLabel?: string;
  effectiveModifier?: number;
  extraBonus?: number;
  context?: RollContext;
  isCritical?: boolean;
  isFumble?: boolean;
  isBlackFlash?: boolean;
  notes: string[];
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  avatarPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  avatarPath: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}
