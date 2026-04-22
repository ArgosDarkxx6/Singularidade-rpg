import type {
  AuthUser,
  AttributeKey,
  Character,
  CharacterCoreSummary,
  CharacterGalleryImage,
  GameSession,
  GameSystemKey,
  InvitePreview,
  LogEntry,
  TableInvite,
  TableJoinCode,
  TableListItem,
  TableMeta,
  SessionAttendanceStatus,
  TableRole,
  TableSession,
  TableState,
  UserCharacterSummary,
  WorkspaceState
} from '@/types/domain';

export interface JoinCodeConnectedResult {
  session: TableSession;
  table: TableState;
}

export type JoinCodeBackendResult = JoinCodeConnectedResult;

export interface UploadAvatarResult {
  url: string;
  path: string;
}

export interface UploadCharacterGalleryImageResult extends UploadAvatarResult {
  image: CharacterGalleryImage;
}

export interface ResourceSyncResult {
  characterId: string;
  resourceKey: 'hp' | 'energy' | 'sanity';
  current: number;
  max: number;
}

export interface WorkspaceBackend {
  loadWorkspace: (user: AuthUser) => Promise<WorkspaceState>;
  saveWorkspace: (user: AuthUser, state: WorkspaceState) => Promise<void>;
  listUserTables: (user: AuthUser) => Promise<TableListItem[]>;
  listUserCharacters: (user: AuthUser) => Promise<UserCharacterSummary[]>;
  listCharacterCores: (user: AuthUser) => Promise<CharacterCoreSummary[]>;
  createCharacterCore: (input: { user: AuthUser; core: Pick<Character, 'name' | 'age' | 'appearance' | 'lore' | 'clan' | 'grade'> }) => Promise<CharacterCoreSummary>;
  importCharacterCore: (input: { user: AuthUser; core: Character }) => Promise<CharacterCoreSummary>;
  createTableCharacterFromCore: (input: { session: TableSession; user: AuthUser; coreId: string }) => Promise<Character>;
  transferCharacterCoreOwnership: (input: { user: AuthUser; coreId: string; targetUsername: string; currentPassword: string }) => Promise<void>;
  getTable: (session: TableSession) => Promise<TableState>;
  switchTable: (input: { user: AuthUser; tableSlug: string }) => Promise<{ table: TableState; session: TableSession }>;
  subscribeToTable: (session: TableSession, callback: (table: TableState) => void) => Promise<() => void> | (() => void);
  createTable: (input: {
    user: AuthUser;
    nickname: string;
    systemKey: GameSystemKey;
    meta: TableMeta;
    state: WorkspaceState;
  }) => Promise<{ table: TableState; session: TableSession }>;
  updateTableMeta: (input: { session: TableSession; meta: TableMeta }) => Promise<TableState>;
  joinByInvite: (input: { user: AuthUser; inviteUrl: string; nickname: string }) => Promise<{ table: TableState; session: TableSession }>;
  previewInvite: (token: string) => Promise<InvitePreview | null>;
  joinByCode: (input: { user: AuthUser; code: string; nickname: string }) => Promise<JoinCodeBackendResult>;
  createInvite: (input: {
    session: TableSession;
    role: TableRole;
    origin: string;
  }) => Promise<TableInvite>;
  createJoinCode: (input: { session: TableSession; role: TableRole }) => Promise<TableJoinCode>;
  revokeJoinCode: (session: TableSession, joinCodeId: string) => Promise<TableState>;
  createSnapshot: (input: { session: TableSession; label: string; actor: string; state: WorkspaceState }) => Promise<TableState>;
  restoreSnapshot: (input: { session: TableSession; snapshotId: string }) => Promise<TableState>;
  syncTableState: (input: { session: TableSession; state: WorkspaceState; actor: string }) => Promise<TableState>;
  createGameSession: (input: {
    session: TableSession;
    gameSession: Omit<GameSession, 'id' | 'tableId' | 'createdAt' | 'updatedAt'> & Partial<Pick<GameSession, 'isActive'>>;
  }) => Promise<TableState>;
  updateGameSession: (input: {
    session: TableSession;
    sessionId: string;
    patch: Partial<Omit<GameSession, 'id' | 'tableId' | 'createdAt' | 'updatedAt'>>;
  }) => Promise<TableState>;
  startGameSession: (input: { session: TableSession; sessionId: string }) => Promise<TableState>;
  endGameSession: (input: { session: TableSession; sessionId?: string }) => Promise<TableState>;
  markSessionAttendance: (input: {
    session: TableSession;
    sessionId: string;
    membershipId: string;
    status: SessionAttendanceStatus;
  }) => Promise<TableState>;
  clearSessionAttendance: (input: { session: TableSession; sessionId?: string }) => Promise<TableState>;
  adjustCharacterResource: (input: {
    session: TableSession;
    userId: string;
    characterId: string;
    resourceKey: 'hp' | 'energy' | 'sanity';
    delta: number;
  }) => Promise<ResourceSyncResult>;
  recordGuidedRoll: (input: {
    session: TableSession;
    userId: string;
    characterId: string;
    characterName: string;
    attributeKey: AttributeKey;
    attributeLabel: string;
    context: string;
    natural: number;
    effectiveModifier: number;
    extraBonus: number;
    total: number;
    tn: number | null;
    outcomeLabel: string;
    margin: number | null;
    meta: string;
    text: string;
    title: string;
  }) => Promise<void>;
  saveCharacter: (input: { session: TableSession; userId: string; character: Character }) => Promise<void>;
  appendTableLog: (input: { session: TableSession; userId: string; entry: LogEntry }) => Promise<void>;
  clearTableLogs: (input: { session: TableSession; userId: string }) => Promise<void>;
  transferTableOwnership: (input: {
    user: AuthUser;
    session: TableSession;
    targetUsername: string;
    currentPassword: string;
  }) => Promise<TableState>;
  deleteTable: (input: { session: TableSession }) => Promise<void>;
  leaveTable: (input: { session: TableSession; userId: string }) => Promise<void>;
  disconnectSession: (input: { session: TableSession; userId: string }) => Promise<void>;
  uploadCharacterAvatar: (input: { user: AuthUser; characterId: string; file: File }) => Promise<UploadAvatarResult>;
  uploadCharacterGalleryImage: (input: { user: AuthUser; characterId: string; file: File; caption?: string; sortOrder?: number }) => Promise<UploadCharacterGalleryImageResult>;
}
