import type {
  AuthUser,
  Character,
  GameSession,
  PresenceMember,
  SessionAttendance,
  TableInvite,
  TableJoinCode,
  TableListItem,
  TableMeta,
  TableRole,
  TableSession,
  TableSnapshot,
  TableState,
  WorkspaceState
} from '@/types/domain';
import { DEFAULT_GAME_SESSION, DEFAULT_TABLE_META } from '@lib/domain/constants';
import { createDefaultState, makeCharacter, normalizeLogEntry, normalizeState } from '@lib/domain/state';
import { deepClone, sanitizeJoinCode, slugify, uid } from '@lib/domain/utils';
import type { JoinCodeBackendResult, UploadAvatarResult, WorkspaceBackend } from './backend';

const STORE_KEY = 'singularidade-local-workspace-backend-v2';

type Store = {
  workspaces: Record<string, WorkspaceState>;
  tables: Record<string, LocalTable>;
};

type LocalMembership = {
  id: string;
  userId: string;
  role: TableRole;
  characterId: string;
  nickname: string;
  active: boolean;
  joinedAt: string;
  updatedAt: string;
};

type LocalInvite = {
  id: string;
  token: string;
  role: TableRole;
  characterId: string;
  label: string;
  revokedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type LocalJoinCode = {
  id: string;
  code: string;
  role: TableRole;
  characterId: string;
  label: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
};

type LocalTable = {
  table: TableState;
  memberships: LocalMembership[];
  invites: LocalInvite[];
  joinCodes: LocalJoinCode[];
  snapshots: TableSnapshot[];
  sessionHistory: GameSession[];
  attendanceBySession: Record<string, SessionAttendance[]>;
};

const memory: Store = { workspaces: {}, tables: {} };
const subscribers = new Map<string, Set<(table: TableState) => void>>();

function now() {
  return new Date().toISOString();
}

function canUseStorage() {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function loadStore(): Store {
  if (!canUseStorage()) return memory;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return memory;
    const parsed = JSON.parse(raw) as Store;
    return { workspaces: parsed.workspaces || {}, tables: parsed.tables || {} };
  } catch {
    return memory;
  }
}

function saveStore(store: Store) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function clone<T>(value: T): T {
  return deepClone(value);
}

function toGameSession(input: Partial<GameSession> & Pick<GameSession, 'id' | 'tableId' | 'createdAt' | 'updatedAt'>): GameSession {
  return {
    ...DEFAULT_GAME_SESSION,
    ...input,
    episodeNumber: input.episodeNumber || '',
    episodeTitle: input.episodeTitle || '',
    status: input.status || 'Planejamento',
    sessionDate: input.sessionDate || '',
    location: input.location || '',
    objective: input.objective || '',
    recap: input.recap || '',
    notes: input.notes || '',
    isActive: input.isActive ?? false,
    createdBy: input.createdBy || ''
  };
}

function toPresenceMembers(memberships: LocalMembership[], state: WorkspaceState): PresenceMember[] {
  return memberships
    .filter((membership) => membership.active)
    .map((membership) => ({
      id: membership.id,
      nickname: membership.nickname,
      role: membership.role,
      characterId: membership.characterId,
      characterName: state.characters.find((character) => character.id === membership.characterId)?.name || ''
    }));
}

function toInvites(invites: LocalInvite[], tableSlug: string): TableInvite[] {
  return invites
    .filter((invite) => !invite.revokedAt)
    .map((invite) => ({
      id: invite.id,
      role: invite.role,
      characterId: invite.characterId,
      label: invite.label,
      url: `/mesa/${tableSlug}?token=${invite.token}`
    }));
}

function toJoinCodes(joinCodes: LocalJoinCode[], tableSlug: string): TableJoinCode[] {
  return joinCodes
    .filter((joinCode) => joinCode.active)
    .map((joinCode) => ({
      id: joinCode.id,
      tableSlug,
      role: joinCode.role,
      code: joinCode.code,
      label: joinCode.label,
      active: joinCode.active,
      characterId: joinCode.characterId,
      createdAt: joinCode.createdAt,
      updatedAt: joinCode.updatedAt
    }));
}

function createPendingAttendance(sessionId: string, membershipId: string): SessionAttendance {
  return {
    id: uid('attendance'),
    sessionId,
    membershipId,
    status: 'pending',
    markedAt: now()
  };
}

function synthesizeAttendances(session: GameSession, memberships: LocalMembership[], rows: SessionAttendance[]): SessionAttendance[] {
  const map = new Map(rows.map((row) => [row.membershipId, row]));
  return memberships.filter((membership) => membership.active).map((membership) =>
    map.get(membership.id) || createPendingAttendance(session.id, membership.id)
  );
}

function buildPublicTable(record: LocalTable): TableState {
  const currentSession = record.table.currentSession;
  const sessionAttendances = currentSession
    ? synthesizeAttendances(currentSession, record.memberships, record.attendanceBySession[currentSession.id] || [])
    : [];

  return {
    ...record.table,
    currentSession,
    sessionAttendances,
    sessionHistoryPreview: record.sessionHistory.slice(0, 5),
    memberships: toPresenceMembers(record.memberships, record.table.state),
    invites: toInvites(record.invites, record.table.slug),
    joinCodes: toJoinCodes(record.joinCodes, record.table.slug),
    snapshots: clone(record.snapshots)
  };
}

function ensureRecord(tableId: string) {
  const store = loadStore();
  const record = store.tables[tableId];
  if (!record) throw new Error('Mesa nao encontrada.');
  return record;
}

function emitTable(tableId: string) {
  const record = ensureRecord(tableId);
  const set = subscribers.get(tableId);
  if (!set?.size) return;
  const payload = clone(buildPublicTable(record));
  for (const callback of set) callback(payload);
}

function upsertTableSession(record: LocalTable, session: GameSession) {
  const index = record.sessionHistory.findIndex((entry) => entry.id === session.id);
  if (index >= 0) {
    record.sessionHistory[index] = session;
  } else {
    record.sessionHistory.unshift(session);
  }
  record.table.currentSession = session;
  if (!record.attendanceBySession[session.id]) {
    record.attendanceBySession[session.id] = [];
  }
  record.table.sessionAttendances = synthesizeAttendances(session, record.memberships, record.attendanceBySession[session.id]);
  record.table.sessionHistoryPreview = record.sessionHistory.slice(0, 5);
}

function refreshDerived(record: LocalTable) {
  record.table.updatedAt = now();
  record.table.memberships = toPresenceMembers(record.memberships, record.table.state);
  record.table.invites = toInvites(record.invites, record.table.slug);
  record.table.joinCodes = toJoinCodes(record.joinCodes, record.table.slug);
  record.table.snapshots = clone(record.snapshots);
  record.table.sessionHistoryPreview = record.sessionHistory.slice(0, 5);
  if (record.table.currentSession) {
    record.table.sessionAttendances = synthesizeAttendances(
      record.table.currentSession,
      record.memberships,
      record.attendanceBySession[record.table.currentSession.id] || []
    );
  }
}

function mutateTable(tableId: string, mutator: (record: LocalTable) => void) {
  const store = loadStore();
  const record = store.tables[tableId];
  if (!record) throw new Error('Mesa nao encontrada.');
  mutator(record);
  refreshDerived(record);
  saveStore(store);
  emitTable(tableId);
}

function makeTableSession(input: {
  tableId: string;
  tableSlug: string;
  tableName: string;
  membershipId: string;
  role: TableRole;
  nickname: string;
  characterId?: string;
}): TableSession {
  return {
    tableId: input.tableId,
    membershipId: input.membershipId,
    tableSlug: input.tableSlug,
    tableName: input.tableName,
    role: input.role,
    nickname: input.nickname,
    characterId: input.characterId || '',
    lastJoinedAt: now()
  };
}

function createTableRecord(input: {
  tableId: string;
  slug: string;
  name: string;
  meta: TableMeta;
  state: WorkspaceState;
  user: AuthUser;
  nickname: string;
}): LocalTable {
  const createdAt = now();
  const state = normalizeState(input.state);
  const gmMembership: LocalMembership = {
    id: uid('membership'),
    userId: input.user.id,
    role: 'gm',
    characterId: '',
    nickname: input.nickname,
    active: true,
    joinedAt: createdAt,
    updatedAt: createdAt
  };
  const table: TableState = {
    id: input.tableId,
    slug: input.slug,
    name: input.name,
    meta: clone(input.meta),
    updatedAt: createdAt,
    createdAt,
    lastEditor: input.nickname,
    state,
    currentSession: null,
    sessionAttendances: [],
    sessionHistoryPreview: [],
    memberships: [
      {
        id: gmMembership.id,
        nickname: gmMembership.nickname,
        role: gmMembership.role,
        characterId: gmMembership.characterId,
        characterName: ''
      }
    ],
    invites: [],
    joinCodes: [],
    snapshots: []
  };

  return {
    table,
    memberships: [gmMembership],
    invites: [],
    joinCodes: [],
    snapshots: [],
    sessionHistory: [],
    attendanceBySession: {}
  };
}

function findTableBySlug(store: Store, slug: string) {
  return Object.values(store.tables).find((record) => record.table.slug === slug) || null;
}

function ensureWorkspaceDraft(store: Store, user: AuthUser) {
  const existing = store.workspaces[user.id];
  if (existing) return clone(existing);
  const next = createDefaultState();
  store.workspaces[user.id] = clone(next);
  saveStore(store);
  return next;
}

function updateWorkspaceDraft(store: Store, user: AuthUser, state: WorkspaceState) {
  store.workspaces[user.id] = clone(state);
  saveStore(store);
}

function uniqueSlug(base: string, store: Store) {
  const normalized = slugify(base || DEFAULT_TABLE_META.tableName);
  let candidate = normalized;
  let counter = 1;
  while (Object.values(store.tables).some((record) => record.table.slug === candidate)) {
    candidate = `${normalized}-${counter += 1}`.slice(0, 48);
  }
  return candidate;
}

function toInviteToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

function toJoinCode() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

function patchCharacter(character: Character): Character {
  return makeCharacter(character);
}

function assertCanManageTable(session: TableSession) {
  if (session.role !== 'gm') {
    throw new Error('Apenas GMs podem alterar esta parte da mesa.');
  }
}

function refreshMembershipSessionAttendances(record: LocalTable, membershipId: string) {
  for (const session of record.sessionHistory) {
    const rows = record.attendanceBySession[session.id] || [];
    if (!rows.some((entry) => entry.membershipId === membershipId)) {
      rows.push(createPendingAttendance(session.id, membershipId));
    }
    record.attendanceBySession[session.id] = rows;
  }
}

function assertCanEditCharacter(session: TableSession, characterId: string) {
  if (session.role === 'viewer') {
    throw new Error('Seu papel atual permite apenas leitura.');
  }

  if (session.role === 'player' && session.characterId !== characterId) {
    throw new Error('Players só podem editar a própria ficha vinculada.');
  }
}

function assertCanMarkAttendance(session: TableSession, membershipId: string) {
  if (session.role === 'gm') return;
  if (session.membershipId !== membershipId) {
    throw new Error('Você só pode marcar a própria presença.');
  }
}

export function createLocalWorkspaceBackend(): WorkspaceBackend {
  return {
    async loadWorkspace(user) {
      const store = loadStore();
      return ensureWorkspaceDraft(store, user);
    },
    async saveWorkspace(user, state) {
      const store = loadStore();
      updateWorkspaceDraft(store, user, normalizeState(state));
    },
    async listUserTables(user) {
      const store = loadStore();
      return Object.values(store.tables)
        .map((record) => {
          const membership = record.memberships.find((entry) => entry.userId === user.id && entry.active);
          if (!membership) return null;
          return {
            id: record.table.id,
            slug: record.table.slug,
            name: record.table.name,
            role: membership.role,
            nickname: membership.nickname,
            characterId: membership.characterId,
            createdAt: record.table.createdAt,
            updatedAt: record.table.updatedAt,
            joinedAt: membership.joinedAt,
            isOwner: membership.role === 'gm',
            seriesName: record.table.meta.seriesName,
            campaignName: record.table.meta.campaignName,
            status: record.table.currentSession?.status || 'Sem sessão'
          } satisfies TableListItem;
        })
        .filter((entry): entry is TableListItem => Boolean(entry))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async getTable(session) {
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async switchTable({ user, tableSlug }) {
      const store = loadStore();
      const record = findTableBySlug(store, tableSlug);
      if (!record) throw new Error('Mesa nao encontrada.');
      const membership = record.memberships.find((entry) => entry.userId === user.id && entry.active);
      if (!membership) throw new Error('Voce nao participa desta mesa.');
      return {
        table: clone(buildPublicTable(record)),
        session: makeTableSession({
          tableId: record.table.id,
          tableSlug: record.table.slug,
          tableName: record.table.name,
          membershipId: membership.id,
          role: membership.role,
          nickname: membership.nickname,
          characterId: membership.characterId
        })
      };
    },
    async subscribeToTable(session, callback) {
      const set = subscribers.get(session.tableId) || new Set<(table: TableState) => void>();
      set.add(callback);
      subscribers.set(session.tableId, set);
      return () => {
        const current = subscribers.get(session.tableId);
        current?.delete(callback);
        if (!current?.size) subscribers.delete(session.tableId);
      };
    },
    async createTable({ user, nickname, meta, state }) {
      const store = loadStore();
      const tableId = uid('table');
      const slug = uniqueSlug(meta.tableName || DEFAULT_TABLE_META.tableName, store);
      const record = createTableRecord({ tableId, slug, name: meta.tableName || DEFAULT_TABLE_META.tableName, meta, state, user, nickname });
      store.tables[tableId] = record;
      saveStore(store);
      emitTable(tableId);
      return {
        table: clone(buildPublicTable(record)),
        session: makeTableSession({
          tableId,
          tableSlug: slug,
          tableName: record.table.name,
          membershipId: record.memberships[0].id,
          role: 'gm',
          nickname
        })
      };
    },
    async updateTableMeta({ session, meta }) {
      assertCanManageTable(session);
      mutateTable(session.tableId, (record) => {
        record.table.name = meta.tableName || DEFAULT_TABLE_META.tableName;
        record.table.meta = clone(meta);
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async joinByInvite({ user, inviteUrl, nickname }) {
      const token = new URL(inviteUrl).searchParams.get('token');
      if (!token) throw new Error('Convite invalido.');
      const store = loadStore();
      const record = Object.values(store.tables).find((entry) => entry.invites.some((invite) => invite.token === token && !invite.revokedAt));
      if (!record) throw new Error('Convite invalido ou expirado.');
      const invite = record.invites.find((entry) => entry.token === token && !entry.revokedAt);
      if (!invite) throw new Error('Convite invalido ou expirado.');
      const membershipId = uid('membership');
      const membership: LocalMembership = {
        id: membershipId,
        userId: user.id,
        role: invite.role,
        characterId: invite.characterId,
        nickname,
        active: true,
        joinedAt: now(),
        updatedAt: now()
      };
      record.memberships.push(membership);
      invite.acceptedAt = now();
      refreshMembershipSessionAttendances(record, membershipId);
      saveStore(store);
      emitTable(record.table.id);
      return {
        table: clone(buildPublicTable(record)),
        session: makeTableSession({
          tableId: record.table.id,
          tableSlug: record.table.slug,
          tableName: record.table.name,
          membershipId,
          role: invite.role,
          nickname,
          characterId: invite.characterId
        })
      };
    },
    async joinByCode({ user, code, nickname, characterId }) {
      const normalized = sanitizeJoinCode(code);
      if (!normalized) throw new Error('Codigo invalido.');
      const store = loadStore();
      const record = Object.values(store.tables).find((entry) => entry.joinCodes.some((joinCode) => joinCode.code === normalized && joinCode.active));
      if (!record) throw new Error('Codigo invalido ou revogado.');
      const joinCode = record.joinCodes.find((entry) => entry.code === normalized && entry.active);
      if (!joinCode) throw new Error('Codigo invalido ou revogado.');
      if (joinCode.role === 'player' && !joinCode.characterId && !characterId) {
        return {
          requiresCharacter: true,
          role: joinCode.role,
          table: { id: record.table.id, slug: record.table.slug, name: record.table.name, meta: clone(record.table.meta) },
          characters: record.table.state.characters.map((character) => ({ id: character.id, name: character.name, grade: character.grade, clan: character.clan }))
        };
      }
      const membershipId = uid('membership');
      const membership: LocalMembership = {
        id: membershipId,
        userId: user.id,
        role: joinCode.role,
        characterId: characterId || joinCode.characterId,
        nickname,
        active: true,
        joinedAt: now(),
        updatedAt: now()
      };
      record.memberships.push(membership);
      joinCode.lastUsedAt = now();
      joinCode.updatedAt = now();
      refreshMembershipSessionAttendances(record, membershipId);
      saveStore(store);
      emitTable(record.table.id);
      return {
        table: clone(buildPublicTable(record)),
        session: makeTableSession({
          tableId: record.table.id,
          tableSlug: record.table.slug,
          tableName: record.table.name,
          membershipId,
          role: joinCode.role,
          nickname,
          characterId: characterId || joinCode.characterId
        })
      } satisfies JoinCodeBackendResult;
    },
    async createInvite({ session, role, characterId, label, origin }) {
      assertCanManageTable(session);
      const store = loadStore();
      const record = store.tables[session.tableId];
      if (!record) throw new Error('Mesa nao encontrada.');
      const invite: LocalInvite = { id: uid('invite'), token: toInviteToken(), role, characterId: characterId || '', label, revokedAt: null, acceptedAt: null, createdAt: now(), updatedAt: now() };
      record.invites.unshift(invite);
      refreshDerived(record);
      saveStore(store);
      emitTable(session.tableId);
      return { id: invite.id, role, characterId, label, url: `${origin}/mesa/${session.tableSlug}?token=${invite.token}` };
    },
    async createJoinCode({ session, role, label, characterId }) {
      assertCanManageTable(session);
      const store = loadStore();
      const record = store.tables[session.tableId];
      if (!record) throw new Error('Mesa nao encontrada.');
      let code = toJoinCode();
      while (record.joinCodes.some((entry) => entry.code === code && entry.active)) code = toJoinCode();
      const joinCode: LocalJoinCode = { id: uid('join-code'), code, role, characterId: characterId || '', label, active: true, createdAt: now(), updatedAt: now(), expiresAt: null, lastUsedAt: null };
      record.joinCodes.unshift(joinCode);
      refreshDerived(record);
      saveStore(store);
      emitTable(session.tableId);
      return { id: joinCode.id, tableSlug: session.tableSlug, role: joinCode.role, code: joinCode.code, label: joinCode.label, active: joinCode.active, characterId: joinCode.characterId, createdAt: joinCode.createdAt, updatedAt: joinCode.updatedAt };
    },
    async revokeJoinCode(session, joinCodeId) {
      assertCanManageTable(session);
      mutateTable(session.tableId, (record) => {
        const joinCode = record.joinCodes.find((entry) => entry.id === joinCodeId);
        if (joinCode) {
          joinCode.active = false;
          joinCode.updatedAt = now();
        }
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async createSnapshot({ session, label, actor, state }) {
      assertCanManageTable(session);
      mutateTable(session.tableId, (record) => {
        record.snapshots.unshift({ id: uid('snapshot'), label: label.trim() || 'Snapshot manual', actorName: actor, createdAt: now(), state: normalizeState(state) });
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async restoreSnapshot({ session, snapshotId }) {
      assertCanManageTable(session);
      mutateTable(session.tableId, (record) => {
        const snapshot = record.snapshots.find((entry) => entry.id === snapshotId);
        if (!snapshot) throw new Error('Snapshot nao encontrado.');
        record.table.state = normalizeState(snapshot.state);
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async syncTableState({ session, state, actor }) {
      assertCanManageTable(session);
      mutateTable(session.tableId, (record) => {
        record.table.state = normalizeState(state);
        record.table.lastEditor = actor;
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async createGameSession({ session, gameSession }) {
      assertCanManageTable(session);
      mutateTable(session.tableId, (record) => {
        const next = toGameSession({
          id: uid('session'),
          tableId: session.tableId,
          episodeNumber: gameSession.episodeNumber || '',
          episodeTitle: gameSession.episodeTitle || '',
          status: gameSession.status || 'Planejamento',
          sessionDate: gameSession.sessionDate || '',
          location: gameSession.location || '',
          objective: gameSession.objective || '',
          recap: gameSession.recap || '',
          notes: gameSession.notes || '',
          isActive: gameSession.isActive ?? false,
          createdBy: gameSession.createdBy || session.nickname,
          createdAt: now(),
          updatedAt: now()
        });
        upsertTableSession(record, next);
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async updateGameSession({ session, sessionId, patch }) {
      if (session.role !== 'gm') throw new Error('Apenas GMs podem editar sessoes.');
      mutateTable(session.tableId, (record) => {
        const current = record.sessionHistory.find((entry) => entry.id === sessionId);
        if (!current) throw new Error('Sessao nao encontrada.');
        const next = toGameSession({ ...current, ...patch, updatedAt: now() });
        record.sessionHistory = record.sessionHistory.map((entry) => (entry.id === sessionId ? next : entry));
        if (record.table.currentSession?.id === sessionId) record.table.currentSession = next;
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async startGameSession({ session, sessionId }) {
      if (session.role !== 'gm') throw new Error('Apenas GMs podem iniciar sessoes.');
      mutateTable(session.tableId, (record) => {
        const current = record.sessionHistory.find((entry) => entry.id === sessionId);
        if (!current) throw new Error('Sessao nao encontrada.');
        const next = toGameSession({ ...current, isActive: true, updatedAt: now() });
        record.sessionHistory = record.sessionHistory.map((entry) => (entry.id === sessionId ? next : entry));
        upsertTableSession(record, next);
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async endGameSession({ session, sessionId }) {
      if (session.role !== 'gm') throw new Error('Apenas GMs podem encerrar sessoes.');
      mutateTable(session.tableId, (record) => {
        const targetId = sessionId || record.table.currentSession?.id;
        if (!targetId) throw new Error('Sessao nao encontrada.');
        const current = record.sessionHistory.find((entry) => entry.id === targetId);
        if (!current) throw new Error('Sessao nao encontrada.');
        const next = toGameSession({ ...current, isActive: false, updatedAt: now() });
        record.sessionHistory = record.sessionHistory.map((entry) => (entry.id === targetId ? next : entry));
        record.table.currentSession = next;
        if (!record.attendanceBySession[next.id]) record.attendanceBySession[next.id] = synthesizeAttendances(next, record.memberships, []);
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async markSessionAttendance({ session, sessionId, membershipId, status }) {
      assertCanMarkAttendance(session, membershipId);
      mutateTable(session.tableId, (record) => {
        const rows = record.attendanceBySession[sessionId] || [];
        const existing = rows.find((entry) => entry.membershipId === membershipId);
        if (existing) {
          existing.status = status;
          existing.markedAt = now();
        } else {
          rows.push({ id: uid('attendance'), sessionId, membershipId, status, markedAt: now() });
        }
        record.attendanceBySession[sessionId] = rows;
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async clearSessionAttendance({ session, sessionId }) {
      mutateTable(session.tableId, (record) => {
        const targetSessionId = sessionId || record.table.currentSession?.id;
        if (!targetSessionId) return;
        if (session.role === 'gm') {
          delete record.attendanceBySession[targetSessionId];
          return;
        }
        assertCanMarkAttendance(session, session.membershipId);
        record.attendanceBySession[targetSessionId] = (record.attendanceBySession[targetSessionId] || []).filter(
          (entry) => entry.membershipId !== session.membershipId
        );
      });
      return clone(buildPublicTable(ensureRecord(session.tableId)));
    },
    async saveCharacter({ session, character }) {
      assertCanEditCharacter(session, character.id);
      mutateTable(session.tableId, (record) => {
        const nextCharacter = patchCharacter(character);
        record.table.state = normalizeState({
          ...record.table.state,
          characters: [nextCharacter, ...record.table.state.characters.filter((entry) => entry.id !== nextCharacter.id)]
        });
      });
    },
    async appendTableLog({ session, entry }) {
      if (session.role === 'viewer') {
        throw new Error('Seu papel atual permite apenas leitura.');
      }
      mutateTable(session.tableId, (record) => {
        const nextEntry = normalizeLogEntry(entry);
        record.table.state = { ...record.table.state, log: [nextEntry, ...record.table.state.log.filter((item) => item.id !== nextEntry.id)] };
      });
    },
    async clearTableLogs({ session }) {
      assertCanManageTable(session);
      mutateTable(session.tableId, (record) => {
        record.table.state = { ...record.table.state, log: [] };
      });
    },
    async leaveTable({ session, userId }) {
      mutateTable(session.tableId, (record) => {
        const membership = record.memberships.find((entry) => entry.userId === userId && entry.active);
        if (!membership) return;
        if (membership.role === 'gm') {
          const otherGm = record.memberships.some((entry) => entry.userId !== userId && entry.active && entry.role === 'gm');
          if (!otherGm) throw new Error('Promova outro GM antes de sair desta mesa.');
        }
        membership.active = false;
        membership.updatedAt = now();
      });
    },
    async disconnectSession() {
      return;
    },
    async uploadCharacterAvatar({ characterId, file }): Promise<UploadAvatarResult> {
      return { url: URL.createObjectURL(file), path: `local/${characterId}/${file.name}` };
    }
  };
}
