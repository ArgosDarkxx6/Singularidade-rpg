import type {
  AuthUser,
  Character,
  GameSession,
  GameSystemKey,
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

export interface JoinCodePendingResult {
  requiresCharacter: true;
  role: TableRole;
  table: Pick<TableState, 'id' | 'slug' | 'name' | 'meta' | 'systemKey'>;
  characters: Pick<Character, 'id' | 'name' | 'grade' | 'clan'>[];
}

export interface JoinCodeConnectedResult {
  requiresCharacter?: false;
  session: TableSession;
  table: TableState;
}

export type JoinCodeBackendResult = JoinCodePendingResult | JoinCodeConnectedResult;

export interface UploadAvatarResult {
  url: string;
  path: string;
}

export interface WorkspaceBackend {
  loadWorkspace: (user: AuthUser) => Promise<WorkspaceState>;
  saveWorkspace: (user: AuthUser, state: WorkspaceState) => Promise<void>;
  listUserTables: (user: AuthUser) => Promise<TableListItem[]>;
  listUserCharacters: (user: AuthUser) => Promise<UserCharacterSummary[]>;
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
  joinByCode: (input: { user: AuthUser; code: string; nickname: string; characterId?: string }) => Promise<JoinCodeBackendResult>;
  createInvite: (input: {
    session: TableSession;
    role: TableRole;
    characterId: string;
    label: string;
    origin: string;
  }) => Promise<TableInvite>;
  createJoinCode: (input: { session: TableSession; role: TableRole; label: string; characterId?: string }) => Promise<TableJoinCode>;
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
  saveCharacter: (input: { session: TableSession; userId: string; character: Character }) => Promise<void>;
  appendTableLog: (input: { session: TableSession; userId: string; entry: LogEntry }) => Promise<void>;
  clearTableLogs: (input: { session: TableSession; userId: string }) => Promise<void>;
  transferTableOwnership: (input: { session: TableSession; targetMembershipId: string }) => Promise<TableState>;
  deleteTable: (input: { session: TableSession }) => Promise<void>;
  leaveTable: (input: { session: TableSession; userId: string }) => Promise<void>;
  disconnectSession: (input: { session: TableSession; userId: string }) => Promise<void>;
  uploadCharacterAvatar: (input: { user: AuthUser; characterId: string; file: File }) => Promise<UploadAvatarResult>;
}
