import { DEFAULT_TABLE_META, STORAGE_KEY, TABLES_STORAGE_KEY } from '@lib/domain/constants';
import { createDefaultState, normalizeState } from '@lib/domain/state';
import { deepClone, readFileAsDataUrl, sanitizeJoinCode, slugify, uid } from '@lib/domain/utils';
import type {
  AuthUser,
  PresenceMember,
  TableInvite,
  TableJoinCode,
  TableSnapshot,
  TableState,
  WorkspaceState
} from '@/types/domain';
import type { JoinCodeBackendResult, UploadAvatarResult, WorkspaceBackend } from './backend';

interface StoredInvite extends TableInvite {
  token: string;
}

interface StoredMembership extends PresenceMember {
  userId: string;
}

interface StoredTableRecord extends TableState {
  ownerUserId: string;
  invites: StoredInvite[];
  memberships: StoredMembership[];
}

function workspaceKey(userId: string): string {
  return `${STORAGE_KEY}:${userId}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readTables(): StoredTableRecord[] {
  return readJson<StoredTableRecord[]>(TABLES_STORAGE_KEY, []);
}

function writeTables(tables: StoredTableRecord[]) {
  writeJson(TABLES_STORAGE_KEY, tables);
}

function createTableChannel(tableId: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(`singularidade:table:${tableId}`);
}

function publishTableUpdate(tableId: string, table: StoredTableRecord) {
  const channel = createTableChannel(tableId);
  channel?.postMessage({ type: 'table.update', payload: table });
  channel?.close();
}

function toPublicTable(table: StoredTableRecord): TableState {
  return {
    id: table.id,
    slug: table.slug,
    name: table.name,
    meta: table.meta,
    updatedAt: table.updatedAt,
    createdAt: table.createdAt,
    lastEditor: table.lastEditor,
    state: normalizeState(table.state),
    memberships: table.memberships.map(({ userId, ...member }) => {
      void userId;
      return member;
    }),
    invites: table.invites.map(({ token, ...invite }) => {
      void token;
      return invite;
    }),
    joinCodes: table.joinCodes,
    snapshots: table.snapshots
  };
}

function uniqueSlug(name: string): string {
  const base = slugify(name);
  const tables = readTables();
  if (!tables.some((table) => table.slug === base)) return base;

  let index = 2;
  while (tables.some((table) => table.slug === `${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function getTableRecordById(tableId: string): StoredTableRecord {
  const table = readTables().find((entry) => entry.id === tableId);
  if (!table) throw new Error('Mesa nao encontrada.');
  return table;
}

function writeUpdatedTable(nextTable: StoredTableRecord) {
  const tables = readTables();
  const index = tables.findIndex((entry) => entry.id === nextTable.id);
  if (index < 0) throw new Error('Mesa nao encontrada.');
  tables[index] = nextTable;
  writeTables(tables);
  publishTableUpdate(nextTable.id, nextTable);
}

function upsertMembership(table: StoredTableRecord, membership: StoredMembership): StoredTableRecord {
  return {
    ...table,
    memberships: [...table.memberships.filter((entry) => !(entry.userId === membership.userId && entry.role === membership.role)), membership]
  };
}

export function createLocalWorkspaceBackend(): WorkspaceBackend {
  return {
    async loadWorkspace(user: AuthUser) {
      return normalizeState(readJson<WorkspaceState | null>(workspaceKey(user.id), null) || createDefaultState());
    },
    async saveWorkspace(user, state) {
      writeJson(workspaceKey(user.id), state);
    },
    async getTable(session) {
      return toPublicTable(getTableRecordById(session.tableId));
    },
    subscribeToTable(session, callback) {
      const channel = createTableChannel(session.tableId);
      if (!channel) return () => undefined;

      channel.onmessage = (event) => {
        if (event.data?.type === 'table.update') {
          callback(toPublicTable(event.data.payload as StoredTableRecord));
        }
      };

      return () => channel.close();
    },
    async createTable({ user, nickname, meta, state }) {
      const now = new Date().toISOString();
      const membershipId = uid('membership');
      const table: StoredTableRecord = {
        id: crypto.randomUUID(),
        ownerUserId: user.id,
        slug: uniqueSlug(meta.tableName || DEFAULT_TABLE_META.tableName),
        name: meta.tableName || DEFAULT_TABLE_META.tableName,
        meta: { ...DEFAULT_TABLE_META, ...meta },
        updatedAt: now,
        createdAt: now,
        lastEditor: nickname,
        state: deepClone(state),
        invites: [],
        joinCodes: [],
        snapshots: [
          {
            id: uid('snapshot'),
            label: 'Snapshot inicial',
            actorName: nickname,
            createdAt: now,
            state: deepClone(state)
          }
        ],
        memberships: [
          {
            id: membershipId,
            userId: user.id,
            nickname,
            role: 'gm',
            characterId: '',
            characterName: ''
          }
        ]
      };

      writeTables([...readTables(), table]);
      publishTableUpdate(table.id, table);

      return {
        table: toPublicTable(table),
        session: {
          tableId: table.id,
          membershipId,
          tableSlug: table.slug,
          tableName: table.name,
          role: 'gm',
          nickname,
          characterId: '',
          lastJoinedAt: now
        }
      };
    },
    async updateTableMeta({ session, meta }) {
      const table = getTableRecordById(session.tableId);
      if (session.role !== 'gm') throw new Error('Somente o mestre pode editar a mesa.');
      const updated = {
        ...table,
        name: meta.tableName || table.name,
        meta: { ...DEFAULT_TABLE_META, ...meta },
        updatedAt: new Date().toISOString(),
        lastEditor: session.nickname
      };
      writeUpdatedTable(updated);
      return toPublicTable(updated);
    },
    async joinByInvite({ user, inviteUrl, nickname }) {
      const url = new URL(inviteUrl);
      const token = url.searchParams.get('token');
      if (!token) throw new Error('Convite invalido.');
      const tables = readTables();
      const table = tables.find((entry) => entry.invites.some((invite) => invite.token === token));
      if (!table) throw new Error('Convite invalido ou expirado.');
      const invite = table.invites.find((entry) => entry.token === token);
      if (!invite) throw new Error('Convite invalido ou expirado.');

      const membershipId = uid('membership');
      const character = table.state.characters.find((entry) => entry.id === invite.characterId);
      const nextTable = upsertMembership(table, {
        id: membershipId,
        userId: user.id,
        nickname,
        role: invite.role,
        characterId: invite.characterId,
        characterName: character?.name || ''
      });
      nextTable.updatedAt = new Date().toISOString();
      writeUpdatedTable(nextTable);

      return {
        table: toPublicTable(nextTable),
        session: {
          tableId: table.id,
          membershipId,
          tableSlug: table.slug,
          tableName: table.name,
          role: invite.role,
          nickname,
          characterId: invite.characterId,
          lastJoinedAt: new Date().toISOString()
        }
      };
    },
    async joinByCode({ user, code, nickname, characterId }) {
      const normalizedCode = sanitizeJoinCode(code);
      const tables = readTables();

      for (const table of tables) {
        const joinCode = table.joinCodes.find((entry) => entry.code === normalizedCode && entry.active);
        if (!joinCode) continue;

        if (joinCode.role === 'player' && !joinCode.characterId && !characterId) {
          return {
            requiresCharacter: true,
            role: 'player',
            table: {
              id: table.id,
              slug: table.slug,
              name: table.name,
              meta: table.meta
            },
            characters: table.state.characters.map((character) => ({
              id: character.id,
              name: character.name,
              grade: character.grade,
              clan: character.clan
            }))
          };
        }

        const resolvedCharacterId = joinCode.characterId || characterId || '';
        const resolvedCharacter = table.state.characters.find((entry) => entry.id === resolvedCharacterId);
        const membershipId = uid('membership');
        const nextTable = upsertMembership(table, {
          id: membershipId,
          userId: user.id,
          nickname,
          role: joinCode.role,
          characterId: resolvedCharacterId,
          characterName: resolvedCharacter?.name || ''
        });
        nextTable.updatedAt = new Date().toISOString();
        writeUpdatedTable(nextTable);

        return {
          session: {
            tableId: table.id,
            membershipId,
            tableSlug: table.slug,
            tableName: table.name,
            role: joinCode.role,
            nickname,
            characterId: resolvedCharacterId,
            lastJoinedAt: new Date().toISOString()
          },
          table: toPublicTable(nextTable)
        } satisfies JoinCodeBackendResult;
      }

      throw new Error('Codigo invalido ou revogado.');
    },
    async createInvite({ session, role, characterId, label, origin }) {
      const table = getTableRecordById(session.tableId);
      if (session.role !== 'gm') throw new Error('Somente o mestre pode gerar convites.');
      const token = uid('token');
      const invite: StoredInvite = {
        id: uid('invite'),
        role,
        characterId,
        label,
        token,
        url: `${origin}/mesa/${table.slug}?token=${token}`
      };

      const nextTable = {
        ...table,
        invites: [invite, ...table.invites],
        updatedAt: new Date().toISOString()
      };
      writeUpdatedTable(nextTable);

      return {
        id: invite.id,
        role: invite.role,
        characterId: invite.characterId,
        label: invite.label,
        url: invite.url
      };
    },
    async createJoinCode({ session, role, label, characterId }) {
      const table = getTableRecordById(session.tableId);
      if (session.role !== 'gm') throw new Error('Somente o mestre pode gerar codigos.');

      const existingCodes = new Set(table.joinCodes.map((entry) => entry.code));
      let code = '';
      while (!code || existingCodes.has(code)) {
        code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
      }

      const joinCode: TableJoinCode = {
        id: uid('join-code'),
        tableSlug: table.slug,
        role,
        code,
        label,
        active: true,
        characterId: characterId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const nextTable = {
        ...table,
        joinCodes: [joinCode, ...table.joinCodes],
        updatedAt: new Date().toISOString()
      };
      writeUpdatedTable(nextTable);
      return joinCode;
    },
    async revokeJoinCode(session, joinCodeId) {
      const table = getTableRecordById(session.tableId);
      if (session.role !== 'gm') throw new Error('Somente o mestre pode revogar codigos.');

      const nextTable = {
        ...table,
        joinCodes: table.joinCodes.filter((entry) => entry.id !== joinCodeId),
        updatedAt: new Date().toISOString()
      };
      writeUpdatedTable(nextTable);
      return toPublicTable(nextTable);
    },
    async createSnapshot({ session, label, actor, state }) {
      const table = getTableRecordById(session.tableId);
      if (session.role === 'viewer') throw new Error('Seu papel nao permite salvar snapshots.');
      const snapshot: TableSnapshot = {
        id: uid('snapshot'),
        label: label.trim() || 'Snapshot manual',
        actorName: actor,
        createdAt: new Date().toISOString(),
        state: deepClone(state)
      };
      const nextTable = {
        ...table,
        snapshots: [snapshot, ...table.snapshots],
        updatedAt: new Date().toISOString()
      };
      writeUpdatedTable(nextTable);
      return toPublicTable(nextTable);
    },
    async restoreSnapshot({ session, snapshotId }) {
      const table = getTableRecordById(session.tableId);
      if (session.role !== 'gm') throw new Error('Somente o mestre pode restaurar snapshots.');
      const snapshot = table.snapshots.find((entry) => entry.id === snapshotId);
      if (!snapshot) throw new Error('Snapshot nao encontrado.');
      const nextTable = {
        ...table,
        state: deepClone(snapshot.state),
        updatedAt: new Date().toISOString(),
        lastEditor: session.nickname
      };
      writeUpdatedTable(nextTable);
      return toPublicTable(nextTable);
    },
    async syncTableState({ session, state, actor }) {
      const table = getTableRecordById(session.tableId);
      if (session.role === 'viewer') throw new Error('Seu papel nao pode editar a mesa.');
      const nextTable = {
        ...table,
        state: deepClone(state),
        updatedAt: new Date().toISOString(),
        lastEditor: actor
      };
      writeUpdatedTable(nextTable);
      return toPublicTable(nextTable);
    },
    async disconnectSession({ session, userId }) {
      const table = getTableRecordById(session.tableId);
      const nextTable = {
        ...table,
        memberships: table.memberships.filter((entry) => !(entry.userId === userId && entry.id === session.membershipId)),
        updatedAt: new Date().toISOString()
      };
      writeUpdatedTable(nextTable);
    },
    async uploadCharacterAvatar({ file }): Promise<UploadAvatarResult> {
      const url = await readFileAsDataUrl(file);
      return {
        url,
        path: ''
      };
    }
  };
}
