import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { createLogEntry, createDefaultState, makeCharacter, normalizeState, uniquifyCharacterName } from '@lib/domain/state';
import {
  buildNpcInitiative,
  buildPcInitiative,
  buildRollMeta,
  buildRollOutcome,
  parseDiceNotation,
  rollDice,
  sortOrderEntries
} from '@lib/domain/rules';
import { parseCharacterSheetsText, serializeCharacterToText } from '@lib/domain/parsers';
import { copyText, downloadTextFile, readFileAsText } from '@lib/domain/utils';
import { workspaceStateSchema } from '@schemas/domain';
import { DEFAULT_GAME_SYSTEM_KEY, ONLINE_SESSION_STORAGE_KEY } from '@lib/domain/constants';
import { useAuth } from '@features/auth/hooks/use-auth';
import { supabase } from '@integrations/supabase/client';
import { type WorkspaceBackend } from '@features/workspace/backend';
import { normalizeWorkspaceError } from '@features/workspace/invite-rules';
import { runtimeWorkspaceBackend } from '@features/workspace/runtime-backend';
import type {
  AuthUser,
  Character,
  CharacterGalleryImage,
  Condition,
  CustomRollInput,
  GuidedRollInput,
  LogEntry,
  OnlineState,
  OrderEntry,
  Passive,
  PresenceMember,
  GameSession,
  GameSystemKey,
  RollResult,
  SessionAttendanceStatus,
  TableJoinCode,
  TableListItem,
  TableMeta,
  TableSession,
  TableState,
  Technique,
  UserCharacterSummary,
  Vow,
  Weapon,
  InventoryItem,
  WorkspaceState
} from '@/types/domain';

type CollectionKey = 'weapons' | 'techniques' | 'passives' | 'vows' | 'inventory';

interface WorkspaceContextValue {
  isReady: boolean;
  state: WorkspaceState;
  activeCharacter: Character;
  lastRoll: RollResult | null;
  compendiumQuery: string;
  compendiumCategory: string;
  online: OnlineState;
  tables: TableListItem[];
  listUserCharacters: () => Promise<UserCharacterSummary[]>;
  setActiveCharacter: (characterId: string) => void;
  setCompendiumQuery: (query: string) => void;
  setCompendiumCategory: (category: string) => void;
  adjustResource: (characterId: string, resourceKey: 'hp' | 'energy' | 'sanity', delta: number) => void;
  setResourceCurrent: (characterId: string, resourceKey: 'hp' | 'energy' | 'sanity', value: number) => void;
  setResourceMax: (characterId: string, resourceKey: 'hp' | 'energy' | 'sanity', value: number) => void;
  updateCharacterField: (characterId: string, field: string, value: string | number) => void;
  setCharacterAvatar: (characterId: string, avatar: string, mode: Character['avatarMode']) => void;
  uploadCharacterAvatar: (characterId: string, file: File) => Promise<void>;
  clearCharacterAvatar: (characterId: string) => void;
  updateCharacterLore: (characterId: string, lore: string) => void;
  addCharacterGalleryImage: (characterId: string, image: CharacterGalleryImage) => void;
  uploadCharacterGalleryImage: (characterId: string, file: File, caption?: string) => Promise<void>;
  updateCharacterGalleryImage: (characterId: string, imageId: string, patch: Partial<Pick<CharacterGalleryImage, 'caption' | 'sortOrder' | 'url' | 'path'>>) => void;
  removeCharacterGalleryImage: (characterId: string, imageId: string) => void;
  reorderCharacterGallery: (characterId: string, orderedIds: string[]) => void;
  setAttributeValue: (characterId: string, attributeKey: keyof Character['attributes'], value: number) => void;
  setAttributeRank: (
    characterId: string,
    attributeKey: keyof Character['attributes'],
    rank: Character['attributes'][keyof Character['attributes']]['rank']
  ) => void;
  addCondition: (characterId: string, condition: Omit<Condition, 'id'>) => void;
  removeCondition: (characterId: string, conditionId: string) => void;
  saveCollectionItem: (collectionKey: CollectionKey, item: Weapon | Technique | Passive | Vow | InventoryItem) => void;
  removeCollectionItem: (collectionKey: CollectionKey, itemId: string) => void;
  setInventoryMoney: (characterId: string, money: number) => void;
  executeAttributeRoll: (input: GuidedRollInput) => RollResult | null;
  executeCustomRoll: (input: CustomRollInput) => RollResult | null;
  clearLog: () => Promise<void>;
  addCharacter: (payload: Partial<Character>) => void;
  removeCharacter: (characterId: string) => void;
  addCombatant: (payload: { type: 'pc' | 'npc'; characterId?: string; name?: string; modifier?: number; notes?: string }) => void;
  removeCombatant: (entryId: string) => void;
  updateOrderNotes: (entryId: string, notes: string) => void;
  rollOrderInitiative: () => void;
  manualSortOrder: () => void;
  goToNextTurn: (step?: number) => void;
  resetOrder: () => void;
  adjustCriticalFailures: (step: number) => void;
  importCharactersFromText: (text: string) => void;
  importStateFromText: (text: string) => void;
  importStateFromFile: (file: File) => Promise<void>;
  exportState: () => void;
  resetState: () => void;
  createTableSession: (
    meta: TableMeta,
    nickname: string,
    initialState?: WorkspaceState,
    systemKey?: GameSystemKey
  ) => Promise<TableSession | null>;
  switchTable: (tableSlug: string) => Promise<TableSession | null>;
  refreshTables: () => Promise<TableListItem[]>;
  updateTableMeta: (meta: TableMeta) => Promise<TableState | null>;
  connectToInvite: (inviteUrl: string, nickname: string) => Promise<TableSession | null>;
  connectToJoinCode: (
    code: string,
    nickname: string,
    characterId?: string
  ) => Promise<{ connected: boolean; pending: boolean; session: TableSession | null }>;
  completeJoinCode: (characterId: string) => Promise<TableSession | null>;
  clearPendingJoinCode: () => void;
  flushPersistence: () => Promise<void>;
  createInviteLink: (payload: { role: TableSession['role']; characterId: string; label: string }) => Promise<string | null>;
  createJoinCode: (payload: { role: TableSession['role']; label: string; characterId?: string }) => Promise<TableJoinCode | null>;
  revokeJoinCode: (joinCodeId: string) => Promise<TableState | null>;
  createCloudSnapshot: (label: string) => Promise<TableState | null>;
  restoreCloudSnapshot: (snapshotId: string) => Promise<TableState | null>;
  createGameSession: (
    payload: {
      gameSession: Omit<GameSession, 'id' | 'tableId' | 'createdAt' | 'updatedAt'> & Partial<Pick<GameSession, 'isActive'>>;
    }
  ) => Promise<TableState | null>;
  updateGameSession: (
    payload: {
      sessionId: string;
      patch: Partial<Omit<GameSession, 'id' | 'tableId' | 'createdAt' | 'updatedAt'>>;
    }
  ) => Promise<TableState | null>;
  startGameSession: (payload: { sessionId: string }) => Promise<TableState | null>;
  endGameSession: (payload?: { sessionId?: string }) => Promise<TableState | null>;
  markSessionAttendance: (payload: {
    sessionId: string;
    membershipId: string;
    status: SessionAttendanceStatus;
  }) => Promise<TableState | null>;
  clearSessionAttendance: (payload?: { sessionId?: string }) => Promise<TableState | null>;
  transferTableOwnership: (targetMembershipId: string) => Promise<TableState | null>;
  deleteCurrentTable: () => Promise<void>;
  leaveCurrentTable: () => Promise<void>;
  disconnectOnline: () => Promise<void>;
  copyActiveCharacterText: () => Promise<void>;
  downloadActiveCharacterText: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const DEFAULT_ONLINE_STATE: OnlineState = {
  platformAvailable: true,
  status: 'offline',
  session: null,
  table: null,
  currentSession: null,
  sessionAttendances: [],
  members: [],
  snapshots: [],
  joinCodes: [],
  pendingCodeJoin: null,
  lastInvite: null,
  references: [],
  referencesLoading: false,
  lastSyncAt: '',
  error: ''
};

function readStoredSession(userId: string): TableSession | null {
  try {
    const raw =
      localStorage.getItem(`${ONLINE_SESSION_STORAGE_KEY}:${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TableSession>;
    return {
      tableId: parsed.tableId || '',
      membershipId: parsed.membershipId || '',
      tableSlug: parsed.tableSlug || '',
      tableName: parsed.tableName || '',
      systemKey: parsed.systemKey || DEFAULT_GAME_SYSTEM_KEY,
      role: parsed.role || 'viewer',
      nickname: parsed.nickname || '',
      characterId: parsed.characterId || '',
      lastJoinedAt: parsed.lastJoinedAt
    };
  } catch {
    return null;
  }
}

function writeStoredSession(userId: string, session: TableSession | null) {
  if (session) {
    localStorage.setItem(`${ONLINE_SESSION_STORAGE_KEY}:${userId}`, JSON.stringify(session));
    return;
  }

  localStorage.removeItem(`${ONLINE_SESSION_STORAGE_KEY}:${userId}`);
}

function setCharacterField(character: Character, field: string, value: string | number): Character {
  if (field === 'name') return { ...character, name: String(value) };
  if (field === 'age') return { ...character, age: Number(value) };
  if (field === 'appearance') return { ...character, appearance: String(value) };
  if (field === 'lore') return { ...character, lore: String(value) };
  if (field === 'clan') return { ...character, clan: String(value) };
  if (field === 'grade') return { ...character, grade: String(value) };
  if (field === 'identity.scar') return { ...character, identity: { ...character.identity, scar: String(value) } };
  if (field === 'identity.anchor') return { ...character, identity: { ...character.identity, anchor: String(value) } };
  if (field === 'identity.trigger') return { ...character, identity: { ...character.identity, trigger: String(value) } };
  return character;
}

function normalizeGalleryOrder(gallery: CharacterGalleryImage[]) {
  return gallery
    .map((image, index) => ({
      ...image,
      sortOrder: index
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function buildOnlineState(session: TableSession, table: TableState, current: OnlineState): OnlineState {
  return {
    ...DEFAULT_ONLINE_STATE,
    status: 'connected',
    session,
    table,
    currentSession: table.currentSession,
    sessionAttendances: table.sessionAttendances,
    sessionHistoryPreview: table.sessionHistoryPreview,
    members: current.members.length ? current.members : table.memberships,
    snapshots: table.snapshots,
    joinCodes: table.joinCodes,
    pendingCodeJoin: null,
    lastInvite: current.lastInvite,
    lastSyncAt: table.updatedAt
  };
}

function mapPresenceMembers(payload: Record<string, PresenceMember[]>): PresenceMember[] {
  return Object.values(payload)
    .flat()
    .filter(Boolean)
    .map((member) => ({
      id: member.id,
      userId: member.userId || '',
      nickname: member.nickname,
      role: member.role,
      characterId: member.characterId,
      characterName: member.characterName,
      isOwner: member.isOwner
    }));
}

function getWorkspaceErrorMessage(error: unknown, fallback: string) {
  return normalizeWorkspaceError(error, fallback);
}

function toConnectionFailureState(current: OnlineState, error: unknown, fallback: string): OnlineState {
  return {
    ...current,
    status: current.session ? 'connected' : 'error',
    pendingCodeJoin: null,
    error: getWorkspaceErrorMessage(error, fallback)
  };
}

function syncTableIntoOnlineState(current: OnlineState, table: TableState, status: OnlineState['status'] = 'connected') {
  return {
    ...current,
    table,
    currentSession: table.currentSession,
    sessionAttendances: table.sessionAttendances,
    sessionHistoryPreview: table.sessionHistoryPreview,
    snapshots: table.snapshots,
    joinCodes: table.joinCodes,
    lastSyncAt: table.updatedAt,
    status,
    error: '',
    members: current.members.length ? current.members : table.memberships
  } satisfies OnlineState;
}

function alignStateToSession(state: WorkspaceState, session: TableSession | null): WorkspaceState {
  if (!session || session.role !== 'player' || !session.characterId) {
    return normalizeState(state);
  }

  return normalizeState({
    ...state,
    activeCharacterId: session.characterId
  });
}

export function WorkspaceProvider({ children, backend }: { children: ReactNode; backend?: WorkspaceBackend }) {
  const workspaceBackend = useMemo(() => backend ?? runtimeWorkspaceBackend, [backend]);
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [state, setState] = useState<WorkspaceState>(createDefaultState());
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [compendiumQuery, setCompendiumQuery] = useState('');
  const [compendiumCategory, setCompendiumCategory] = useState('all');
  const [online, setOnline] = useState<OnlineState>(DEFAULT_ONLINE_STATE);
  const [tables, setTables] = useState<TableListItem[]>([]);
  const stateRef = useRef(state);
  const onlineRef = useRef(online);
  const tableSubscriptionRef = useRef<null | (() => void)>(null);
  const presenceChannelRef = useRef<null | { unsubscribe: () => Promise<'ok' | 'timed out' | 'error'> }>(null);
  const workspaceSaveRef = useRef<{ user: AuthUser; state: WorkspaceState } | null>(null);
  const workspaceSaveRunningRef = useRef(false);
  const tableSyncRef = useRef<{ session: TableSession; state: WorkspaceState; actor: string } | null>(null);
  const tableSyncRunningRef = useRef(false);
  const characterSaveRef = useRef<{ session: TableSession; userId: string; character: Character } | null>(null);
  const characterSaveRunningRef = useRef(false);
  const tableLogRef = useRef<{ session: TableSession; userId: string; entry: LogEntry } | null>(null);
  const tableLogRunningRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    onlineRef.current = online;
  }, [online]);

  const applyRemoteTable = useCallback(
    async (table: TableState, session: TableSession) => {
      const nextState = alignStateToSession(table.state, session);
      const nextTable = {
        ...table,
        state: nextState
      };
      stateRef.current = nextState;
      setState(nextState);
      setOnline((current) => buildOnlineState(session, nextTable, current));
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    tableSubscriptionRef.current?.();
    tableSubscriptionRef.current = null;

    if (!user) {
      const nextState = createDefaultState();
      stateRef.current = nextState;
      setState(nextState);
      setOnline(DEFAULT_ONLINE_STATE);
      setTables([]);
      setIsReady(true);
      return () => undefined;
    }

    setIsReady(false);
    setOnline((current) => ({
      ...current,
      status: 'connecting',
      error: ''
    }));

    void (async () => {
      try {
          const [workspace, userTables] = await Promise.all([workspaceBackend.loadWorkspace(user), workspaceBackend.listUserTables(user)]);
        if (!isMounted) return;
        const nextState = normalizeState(workspace);
        setTables(userTables);

        const storedSession = readStoredSession(user.id);
        if (!storedSession) {
          stateRef.current = nextState;
          setState(nextState);
          setOnline(DEFAULT_ONLINE_STATE);
          setIsReady(true);
          return;
        }

        try {
          const table = await workspaceBackend.getTable(storedSession);
          if (!isMounted) return;
          await applyRemoteTable(table, storedSession);
          setTables(await workspaceBackend.listUserTables(user));
          if (isMounted) setIsReady(true);
        } catch {
          writeStoredSession(user.id, null);
          if (isMounted) {
            stateRef.current = nextState;
            setState(nextState);
            setOnline(DEFAULT_ONLINE_STATE);
            setIsReady(true);
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setOnline((current) => ({
          ...current,
          status: 'error',
          error: error instanceof Error ? error.message : 'Nao foi possivel carregar o workspace.'
        }));
        setIsReady(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [applyRemoteTable, user, workspaceBackend]);

  useEffect(() => {
    let disposed = false;

    tableSubscriptionRef.current?.();
    tableSubscriptionRef.current = null;

    if (!online.session) return () => undefined;

    void Promise.resolve(
      workspaceBackend.subscribeToTable(online.session, (table) => {
        if (disposed) return;
        const nextState = alignStateToSession(table.state, online.session);
        const nextTable = {
          ...table,
          state: nextState
        };
        stateRef.current = nextState;
        setState(nextState);
        setOnline((current) => syncTableIntoOnlineState(current, nextTable));
      })
    ).then((unsubscribe) => {
      if (disposed) {
        unsubscribe();
        return;
      }

      tableSubscriptionRef.current = unsubscribe;
    });

    return () => {
      disposed = true;
      tableSubscriptionRef.current?.();
      tableSubscriptionRef.current = null;
    };
  }, [online.session, user, workspaceBackend]);

  useEffect(() => {
    const client = supabase;
    const session = online.session;

    if (!client || !session || !user) {
      return () => undefined;
    }

    const channel = client.channel(`presence:${session.tableId}`, {
      config: {
        presence: {
          key: `${user.id}:${session.membershipId}`
        }
      }
    });

    const syncMembers = () => {
      const members = mapPresenceMembers(channel.presenceState<PresenceMember>());
      setOnline((current) => ({
        ...current,
        members
      }));
    };

    channel
      .on('presence', { event: 'sync' }, syncMembers)
      .on('presence', { event: 'join' }, syncMembers)
      .on('presence', { event: 'leave' }, syncMembers)
      .subscribe(async (status) => {
        if (String(status) !== 'SUBSCRIBED') return;

        const liveState = onlineRef.current.table?.state || stateRef.current;
        const character = liveState.characters.find((entry) => entry.id === session.characterId);

        await channel.track({
          id: session.membershipId,
          userId: user.id,
          nickname: session.nickname,
          role: session.role,
          characterId: session.characterId,
          characterName: character?.name || '',
          isOwner: onlineRef.current.table?.ownerId === user.id
        } satisfies PresenceMember);
      });

    presenceChannelRef.current = channel;

    return () => {
      const activeChannel = presenceChannelRef.current;
      presenceChannelRef.current = null;
      if (activeChannel) {
        void activeChannel.unsubscribe();
      }
    };
  }, [online.session, user]);

  const activeCharacter =
    state.characters.find((character) => character.id === state.activeCharacterId) || state.characters[0] || createDefaultState().characters[0];

  const flushWorkspaceSave = useCallback(() => {
    if (workspaceSaveRunningRef.current || !workspaceSaveRef.current) return;

    workspaceSaveRunningRef.current = true;

    void (async () => {
      try {
        while (workspaceSaveRef.current) {
          const payload = workspaceSaveRef.current;
          workspaceSaveRef.current = null;
          await workspaceBackend.saveWorkspace(payload.user, payload.state);
        }
      } catch (error) {
        setOnline((current) => ({
          ...current,
          status: current.session ? 'error' : current.status,
          error: error instanceof Error ? error.message : 'Nao foi possivel salvar o workspace.'
        }));
      } finally {
        workspaceSaveRunningRef.current = false;
        if (workspaceSaveRef.current) {
          flushWorkspaceSave();
        }
      }
    })();
  }, [workspaceBackend]);

  const queueWorkspaceSave = useCallback(
    (payload: { user: AuthUser; state: WorkspaceState }) => {
      workspaceSaveRef.current = payload;
      flushWorkspaceSave();
    },
    [flushWorkspaceSave]
  );

  const flushTableSync = useCallback(() => {
    if (tableSyncRunningRef.current || !tableSyncRef.current) return;

    tableSyncRunningRef.current = true;

    void (async () => {
      try {
        while (tableSyncRef.current) {
          const payload = tableSyncRef.current;
          const hasQueuedSync = Boolean(tableSyncRef.current);
          tableSyncRef.current = null;
          const table = await workspaceBackend.syncTableState(payload);

          setOnline((current) => syncTableIntoOnlineState(current, table, hasQueuedSync ? 'syncing' : 'connected'));
        }
      } catch (error) {
        setOnline((current) => ({
          ...current,
          status: 'error',
          error: error instanceof Error ? error.message : 'Nao foi possivel sincronizar a mesa.'
        }));
      } finally {
        tableSyncRunningRef.current = false;
        if (tableSyncRef.current) {
          flushTableSync();
        }
      }
    })();
  }, [workspaceBackend]);

  const queueTableSync = useCallback(
    (payload: { session: TableSession; state: WorkspaceState; actor: string }) => {
      tableSyncRef.current = payload;
      flushTableSync();
    },
    [flushTableSync]
  );

  const flushCharacterSave = useCallback(() => {
    if (characterSaveRunningRef.current || !characterSaveRef.current) return;

    characterSaveRunningRef.current = true;

    void (async () => {
      try {
        while (characterSaveRef.current) {
          const payload = characterSaveRef.current;
          characterSaveRef.current = null;
          await workspaceBackend.saveCharacter(payload);
        }
      } catch (error) {
        setOnline((current) => ({
          ...current,
          status: 'error',
          error: error instanceof Error ? error.message : 'Nao foi possivel salvar a ficha vinculada.'
        }));
      } finally {
        characterSaveRunningRef.current = false;
        if (characterSaveRef.current) {
          flushCharacterSave();
        }
      }
    })();
  }, [workspaceBackend]);

  const queueCharacterSave = useCallback(
    (payload: { session: TableSession; userId: string; character: Character }) => {
      characterSaveRef.current = payload;
      flushCharacterSave();
    },
    [flushCharacterSave]
  );

  const flushTableLog = useCallback(() => {
    if (tableLogRunningRef.current || !tableLogRef.current) return;

    tableLogRunningRef.current = true;

    void (async () => {
      try {
        while (tableLogRef.current) {
          const payload = tableLogRef.current;
          tableLogRef.current = null;
          await workspaceBackend.appendTableLog(payload);
        }
      } catch (error) {
        setOnline((current) => ({
          ...current,
          status: 'error',
          error: error instanceof Error ? error.message : 'Nao foi possivel registrar o log desta mesa.'
        }));
      } finally {
        tableLogRunningRef.current = false;
        if (tableLogRef.current) {
          flushTableLog();
        }
      }
    })();
  }, [workspaceBackend]);

  const queueTableLog = useCallback(
    (payload: { session: TableSession; userId: string; entry: LogEntry }) => {
      tableLogRef.current = payload;
      flushTableLog();
    },
    [flushTableLog]
  );

  const persistState = useCallback(
    (nextState: WorkspaceState, reason = 'Atualizacao local') => {
      if (!user) return;

      const currentSession = onlineRef.current.session;
      const currentTable = onlineRef.current.table;

      if (currentSession?.role === 'viewer') {
        setOnline((current) => ({
          ...current,
          status: 'error',
          error: 'Seu papel atual permite apenas leitura.'
        }));
        return;
      }

      if (currentSession?.role === 'player') {
        setOnline((current) => ({
          ...current,
          status: 'error',
          error: 'Players só podem editar a própria ficha vinculada.'
        }));
        return;
      }

      const normalized = normalizeState(nextState);
      stateRef.current = normalized;
      setState(normalized);

      if (!currentSession) {
        queueWorkspaceSave({
          user,
          state: normalized
        });
        return;
      }

      if (currentTable) {
        const optimisticTable: TableState = {
          ...currentTable,
          state: normalized,
          lastEditor: currentSession.nickname || reason,
          updatedAt: new Date().toISOString()
        };

        setOnline((current) => syncTableIntoOnlineState(current, optimisticTable, 'syncing'));
      }

        queueTableSync({
          session: currentSession,
          state: normalized,
          actor: currentSession.nickname || reason
        });
    },
    [queueTableSync, queueWorkspaceSave, user]
  );

  const flushPersistence = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const waitUntilIdle = () => {
          if (
            !workspaceSaveRunningRef.current &&
            !workspaceSaveRef.current &&
            !tableSyncRunningRef.current &&
            !tableSyncRef.current &&
            !characterSaveRunningRef.current &&
            !characterSaveRef.current &&
            !tableLogRunningRef.current &&
            !tableLogRef.current
          ) {
            resolve();
            return;
          }

          window.setTimeout(waitUntilIdle, 40);
        };

        waitUntilIdle();
      }),
    []
  );

  const refreshTables = useCallback(async () => {
    if (!user) {
      setTables([]);
      return [];
    }

    const nextTables = await workspaceBackend.listUserTables(user);
    setTables(nextTables);
    return nextTables;
  }, [user, workspaceBackend]);

  const setLocalActiveCharacter = useCallback(
    (characterId: string) => {
      const nextState = normalizeState({
        ...stateRef.current,
        activeCharacterId: characterId
      });

      stateRef.current = nextState;
      setState(nextState);

      if (!user) return;

      const currentSession = onlineRef.current.session;
      if (!currentSession) {
        queueWorkspaceSave({
          user,
          state: nextState
        });
        return;
      }

      setOnline((current) =>
        current.table
          ? {
              ...current,
              table: {
                ...current.table,
                state: nextState
              }
            }
          : current
      );
    },
    [queueWorkspaceSave, user]
  );

  const updateCharacters = useCallback(
    (updater: (characters: Character[]) => Character[], reason: string) => {
      const currentSession = onlineRef.current.session;
      const currentCharacters = stateRef.current.characters;

      if (currentSession?.role === 'viewer') {
        setOnline((current) => ({
          ...current,
          status: 'error',
          error: 'Seu papel atual permite apenas leitura.'
        }));
        return;
      }

      let nextCharacters = updater(currentCharacters);

      if (currentSession?.role === 'player') {
        const ownedCharacter = currentCharacters.find((character) => character.id === currentSession.characterId);
        const nextOwnedCharacter = nextCharacters.find((character) => character.id === currentSession.characterId);

        if (!ownedCharacter || !nextOwnedCharacter) {
          setOnline((current) => ({
            ...current,
            status: 'error',
            error: 'Sua membership nao possui uma ficha vinculada valida para edicao.'
          }));
          return;
        }

        nextCharacters = currentCharacters.map((character) =>
          character.id === currentSession.characterId ? nextOwnedCharacter : character
        );
      }

      const nextState = normalizeState({
        ...stateRef.current,
        characters: nextCharacters
      });

      stateRef.current = nextState;
      setState(nextState);

      if (!user) return;

      if (!currentSession) {
        queueWorkspaceSave({
          user,
          state: nextState
        });
        return;
      }

      if (currentSession.role === 'gm') {
        const currentTable = onlineRef.current.table;
        if (currentTable) {
          const optimisticTable: TableState = {
            ...currentTable,
            state: nextState,
            lastEditor: currentSession.nickname || reason,
            updatedAt: new Date().toISOString()
          };

          setOnline((current) => syncTableIntoOnlineState(current, optimisticTable, 'syncing'));
        }

        queueTableSync({
          session: currentSession,
          state: nextState,
          actor: currentSession.nickname || reason
        });
        return;
      }

      if (currentSession.role === 'player' && currentSession.characterId) {
        const ownedCharacter = nextState.characters.find((character) => character.id === currentSession.characterId);
        if (!ownedCharacter) return;

        queueCharacterSave({
          session: currentSession,
          userId: user.id,
          character: ownedCharacter
        });
      }
    },
    [queueCharacterSave, queueTableSync, queueWorkspaceSave, user]
  );

  const appendLog = useCallback(
    (entry: LogEntry) => {
      const nextState = normalizeState({
        ...stateRef.current,
        log: [entry, ...stateRef.current.log]
      });
      stateRef.current = nextState;
      setState(nextState);

      if (!user) return;

      const currentSession = onlineRef.current.session;
      if (!currentSession) {
        queueWorkspaceSave({
          user,
          state: nextState
        });
        return;
      }

      if (currentSession.role === 'viewer') return;

      if (currentSession.role === 'gm') {
        const currentTable = onlineRef.current.table;
        if (currentTable) {
          const optimisticTable: TableState = {
            ...currentTable,
            state: nextState,
            lastEditor: currentSession.nickname || entry.title,
            updatedAt: new Date().toISOString()
          };

          setOnline((current) => ({
            ...current,
            table: optimisticTable,
            snapshots: optimisticTable.snapshots,
            joinCodes: optimisticTable.joinCodes,
            lastSyncAt: optimisticTable.updatedAt,
            status: 'syncing'
          }));
        }

        queueTableLog({
          session: currentSession,
          userId: user.id,
          entry
        });
        queueTableSync({
          session: currentSession,
          state: nextState,
          actor: currentSession.nickname || entry.title
        });
        return;
      }

      queueTableLog({
        session: currentSession,
        userId: user.id,
        entry
      });
    },
    [queueTableLog, queueTableSync, queueWorkspaceSave, user]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      isReady,
      state,
      activeCharacter,
      lastRoll,
      compendiumQuery,
      compendiumCategory,
      online,
      tables,
      listUserCharacters: async () => {
        if (!user) return [];
        return workspaceBackend.listUserCharacters(user);
      },
      setActiveCharacter: (characterId) => {
        const currentSession = onlineRef.current.session;

        if (currentSession?.role === 'player' && currentSession.characterId && currentSession.characterId !== characterId) {
          setOnline((current) => ({
            ...current,
            status: 'error',
            error: 'Players só podem acessar a própria ficha vinculada.'
          }));
          return;
        }

        setLocalActiveCharacter(characterId);
      },
      setCompendiumQuery,
      setCompendiumCategory,
      adjustResource: (characterId, resourceKey, delta) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    resources: {
                      ...character.resources,
                      [resourceKey]: {
                        ...character.resources[resourceKey],
                        current: Math.max(0, character.resources[resourceKey].current + delta)
                      }
                    }
                  }
                : character
            ),
          'Ajuste de recurso'
        ),
      setResourceCurrent: (characterId, resourceKey, value) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    resources: {
                      ...character.resources,
                      [resourceKey]: {
                        ...character.resources[resourceKey],
                        current: Number(value)
                      }
                    }
                  }
                : character
            ),
          'Atualizacao de recurso'
        ),
      setResourceMax: (characterId, resourceKey, value) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    resources: {
                      ...character.resources,
                      [resourceKey]: {
                        ...character.resources[resourceKey],
                        max: Number(value)
                      }
                    }
                  }
                : character
            ),
          'Atualizacao de maximo'
        ),
      updateCharacterField: (characterId, field, value) =>
        updateCharacters(
          (characters) => characters.map((character) => (character.id === characterId ? setCharacterField(character, field, value) : character)),
          'Atualizacao de ficha'
        ),
      setCharacterAvatar: (characterId, avatar, mode) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    avatar,
                    avatarMode: mode,
                    avatarPath: mode === 'upload' ? character.avatarPath || '' : ''
                  }
                : character
            ),
          'Atualizacao de avatar'
        ),
      uploadCharacterAvatar: async (characterId, file) => {
        if (!user) throw new Error('Voce precisa estar autenticado para enviar avatar.');
        const uploaded = await workspaceBackend.uploadCharacterAvatar({
          user,
          characterId,
          file
        });

        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    avatar: uploaded.url,
                    avatarMode: 'upload',
                    avatarPath: uploaded.path
                  }
                : character
            ),
          'Upload de avatar'
        );
      },
      clearCharacterAvatar: (characterId) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId ? { ...character, avatar: '', avatarMode: 'none', avatarPath: '' } : character
            ),
          'Remocao de avatar'
        ),
      updateCharacterLore: (characterId, lore) =>
        updateCharacters(
          (characters) => characters.map((character) => (character.id === characterId ? { ...character, lore } : character)),
          'Atualizacao de lore'
        ),
      addCharacterGalleryImage: (characterId, image) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    gallery: normalizeGalleryOrder([...character.gallery, image])
                  }
                : character
            ),
          'Nova imagem de galeria'
        ),
      uploadCharacterGalleryImage: async (characterId, file, caption = '') => {
        if (!user) throw new Error('Voce precisa estar autenticado para enviar imagens.');
        const uploaded = await workspaceBackend.uploadCharacterGalleryImage({
          user,
          characterId,
          file,
          caption,
          sortOrder: stateRef.current.characters.find((character) => character.id === characterId)?.gallery.length || 0
        });

        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    gallery: normalizeGalleryOrder([...character.gallery, uploaded.image])
                  }
                : character
            ),
          'Upload de imagem de galeria'
        );
      },
      updateCharacterGalleryImage: (characterId, imageId, patch) =>
        updateCharacters(
          (characters) =>
            characters.map((character) => {
              if (character.id !== characterId) return character;
              return {
                ...character,
                gallery: normalizeGalleryOrder(
                  character.gallery.map((image) => (image.id === imageId ? { ...image, ...patch } : image))
                )
              };
            }),
          'Atualizacao de imagem de galeria'
        ),
      removeCharacterGalleryImage: (characterId, imageId) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    gallery: normalizeGalleryOrder(character.gallery.filter((image) => image.id !== imageId))
                  }
                : character
            ),
          'Remocao de imagem de galeria'
        ),
      reorderCharacterGallery: (characterId, orderedIds) =>
        updateCharacters(
          (characters) =>
            characters.map((character) => {
              if (character.id !== characterId) return character;
              const imageMap = new Map(character.gallery.map((image) => [image.id, image]));
              const reordered = orderedIds.map((id) => imageMap.get(id)).filter(Boolean) as CharacterGalleryImage[];
              const remaining = character.gallery.filter((image) => !orderedIds.includes(image.id));
              return {
                ...character,
                gallery: normalizeGalleryOrder([...reordered, ...remaining])
              };
            }),
          'Reordenacao de galeria'
        ),
      setAttributeValue: (characterId, attributeKey, value) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    attributes: {
                      ...character.attributes,
                      [attributeKey]: {
                        ...character.attributes[attributeKey],
                        value: Number(value)
                      }
                    }
                  }
                : character
            ),
          'Atualizacao de atributo'
        ),
      setAttributeRank: (characterId, attributeKey, rank) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    attributes: {
                      ...character.attributes,
                      [attributeKey]: {
                        ...character.attributes[attributeKey],
                        rank
                      }
                    }
                  }
                : character
            ),
          'Atualizacao de rank'
        ),
      addCondition: (characterId, condition) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId ? { ...character, conditions: [{ id: crypto.randomUUID(), ...condition }, ...character.conditions] } : character
            ),
          'Nova condicao'
        ),
      removeCondition: (characterId, conditionId) =>
        updateCharacters(
          (characters) =>
            characters.map((character) =>
              character.id === characterId ? { ...character, conditions: character.conditions.filter((condition) => condition.id !== conditionId) } : character
            ),
          'Remocao de condicao'
        ),
      saveCollectionItem: (collectionKey, item) =>
        updateCharacters(
          (characters) =>
            characters.map((character) => {
              if (character.id !== stateRef.current.activeCharacterId) return character;
              const currentItems = collectionKey === 'inventory' ? character.inventory.items : character[collectionKey];
              const nextItems = currentItems.some((entry) => entry.id === item.id)
                ? currentItems.map((entry) => (entry.id === item.id ? item : entry))
                : [{ ...item, id: item.id || crypto.randomUUID() }, ...currentItems];

              if (collectionKey === 'inventory') {
                return {
                  ...character,
                  inventory: {
                    ...character.inventory,
                    items: nextItems as InventoryItem[]
                  }
                };
              }

              return {
                ...character,
                [collectionKey]: nextItems
              };
            }),
          'Atualizacao de colecao'
        ),
      removeCollectionItem: (collectionKey, itemId) =>
        updateCharacters(
          (characters) =>
            characters.map((character) => {
              if (character.id !== stateRef.current.activeCharacterId) return character;
              if (collectionKey === 'inventory') {
                return {
                  ...character,
                  inventory: {
                    ...character.inventory,
                    items: character.inventory.items.filter((item) => item.id !== itemId)
                  }
                };
              }

              return {
                ...character,
                [collectionKey]: character[collectionKey].filter((item) => item.id !== itemId)
              };
            }),
          'Remocao de colecao'
        ),
      setInventoryMoney: (characterId, money) =>
        updateCharacters(
          (characters) =>
            characters.map((character) => (character.id === characterId ? { ...character, inventory: { ...character.inventory, money: Number(money) } } : character)),
          'Atualizacao de dinheiro'
        ),
      executeAttributeRoll: (input) => {
        const character = stateRef.current.characters.find((entry) => entry.id === input.characterId);
        if (!character) return null;
        const result = buildRollOutcome(character, input.attributeKey, input.context, input.extraBonus, Math.random, input.tn);
        setLastRoll(result);
        appendLog(
          createLogEntry({
            category: 'Rolagem',
            title: `${result.attributeLabel} - ${character.name}`,
            text: `d20 ${result.natural} ${result.effectiveModifier && result.effectiveModifier >= 0 ? '+' : ''}${result.effectiveModifier ?? 0} = ${result.total}`,
            meta: buildRollMeta(result)
          })
        );
        return result;
      },
      executeCustomRoll: (input) => {
        const parsed = parseDiceNotation(input.expression);
        if (!parsed) return null;
        const rolls = rollDice(parsed);
        const subtotal = rolls.reduce((total, item) => total + item, 0);
        const total = subtotal + input.bonus;
        const result: RollResult = {
          custom: true,
          label: input.label || input.expression,
          expression: input.expression,
          rolls,
          subtotal,
          bonus: input.bonus,
          total,
          tn: input.tn,
          margin: input.tn === null ? null : total - input.tn,
          tnResult: input.tn === null ? undefined : total >= input.tn ? 'success' : 'failure',
          outcomeLabel: input.tn === null ? 'Sem TN' : total >= input.tn ? 'Sucesso' : 'Falha',
          notes: []
        };
        setLastRoll(result);
        appendLog(
          createLogEntry({
            category: 'Rolagem',
            title: input.label || 'Rolagem customizada',
            text: `${input.expression} = ${total}`,
            meta: result.outcomeLabel
          })
        );
        return result;
      },
      clearLog: async () => {
        const currentSession = onlineRef.current.session;

        if (!currentSession || !user) {
          persistState({ ...stateRef.current, log: [] }, 'Limpeza de log');
          return;
        }

        if (currentSession.role !== 'gm') {
          setOnline((current) => ({
            ...current,
            status: 'error',
            error: 'Apenas GMs podem limpar o log compartilhado da mesa.'
          }));
          return;
        }

        await workspaceBackend.clearTableLogs({
          session: currentSession,
          userId: user.id
        });

        persistState({ ...stateRef.current, log: [] }, 'Limpeza de log');
      },
      addCharacter: (payload) => {
        const base = makeCharacter({
          ...payload,
          id: crypto.randomUUID()
        });
        const nextCharacter = {
          ...base,
          name: uniquifyCharacterName(payload.name || base.name, stateRef.current.characters)
        };
        persistState(
          {
            ...stateRef.current,
            characters: [...stateRef.current.characters, nextCharacter],
            activeCharacterId: nextCharacter.id
          },
          'Novo personagem'
        );
      },
      removeCharacter: (characterId) => {
        const nextCharacters = stateRef.current.characters.filter((character) => character.id !== characterId);
        if (!nextCharacters.length) return;
        persistState(
          {
            ...stateRef.current,
            characters: nextCharacters,
            activeCharacterId: nextCharacters[0].id,
            order: {
              ...stateRef.current.order,
              entries: stateRef.current.order.entries.filter((entry) => entry.characterId !== characterId)
            }
          },
          'Remocao de personagem'
        );
      },
      addCombatant: ({ type, characterId, name, modifier, notes }) => {
        const character = stateRef.current.characters.find((entry) => entry.id === characterId);
        const entry: OrderEntry = {
          id: crypto.randomUUID(),
          type,
          characterId: type === 'pc' ? characterId || null : null,
          name: type === 'pc' ? character?.name || 'Combatente' : name || 'NPC',
          init: null,
          modifier: modifier || 0,
          notes: notes || ''
        };
        persistState(
          {
            ...stateRef.current,
            order: {
              ...stateRef.current.order,
              entries: [...stateRef.current.order.entries, entry]
            }
          },
          'Novo combatente'
        );
      },
      removeCombatant: (entryId) =>
        persistState(
          {
            ...stateRef.current,
            order: {
              ...stateRef.current.order,
              entries: stateRef.current.order.entries.filter((entry) => entry.id !== entryId)
            }
          },
          'Remocao de combatente'
        ),
      updateOrderNotes: (entryId, notes) =>
        persistState(
          {
            ...stateRef.current,
            order: {
              ...stateRef.current.order,
              entries: stateRef.current.order.entries.map((entry) => (entry.id === entryId ? { ...entry, notes } : entry))
            }
          },
          'Atualizacao de notas'
        ),
      rollOrderInitiative: () =>
        persistState(
          {
            ...stateRef.current,
            order: {
              ...stateRef.current.order,
              entries: sortOrderEntries(
                stateRef.current.order.entries.map((entry) =>
                  entry.type === 'pc' && entry.characterId
                    ? { ...entry, init: buildPcInitiative(stateRef.current.characters.find((character) => character.id === entry.characterId) || activeCharacter) }
                    : { ...entry, init: buildNpcInitiative(entry.modifier) }
                )
              )
            }
          },
          'Rolagem de iniciativa'
        ),
      manualSortOrder: () =>
        persistState(
          {
            ...stateRef.current,
            order: {
              ...stateRef.current.order,
              entries: sortOrderEntries(stateRef.current.order.entries)
            }
          },
          'Ordenacao manual'
        ),
      goToNextTurn: (step = 1) =>
        persistState(
          {
            ...stateRef.current,
            order: {
              ...stateRef.current.order,
              turn: stateRef.current.order.entries.length
                ? (stateRef.current.order.turn + step + stateRef.current.order.entries.length) % stateRef.current.order.entries.length
                : 0,
              round:
                step > 0 &&
                stateRef.current.order.entries.length &&
                stateRef.current.order.turn === stateRef.current.order.entries.length - 1
                  ? stateRef.current.order.round + 1
                  : stateRef.current.order.round
            }
          },
          'Avanco de turno'
        ),
      resetOrder: () =>
        persistState(
          {
            ...stateRef.current,
            order: {
              round: 1,
              turn: 0,
              entries: stateRef.current.order.entries
            }
          },
          'Reset de ordem'
        ),
      adjustCriticalFailures: (step) =>
        persistState(
          {
            ...stateRef.current,
            disaster: {
              ...stateRef.current.disaster,
              criticalFailures: Math.max(0, stateRef.current.disaster.criticalFailures + step)
            }
          },
          'Ajuste do caos'
        ),
      importCharactersFromText: (text) => {
        const imported = parseCharacterSheetsText(text);
        if (!imported.length) return;
        persistState(
          {
            ...stateRef.current,
            characters: [...stateRef.current.characters, ...imported]
          },
          'Importacao de personagens'
        );
      },
      importStateFromText: (text) => {
        const parsed = workspaceStateSchema.safeParse(JSON.parse(text));
        if (!parsed.success) throw new Error('O arquivo JSON nao corresponde ao formato esperado do remake.');
        persistState(normalizeState(parsed.data), 'Importacao de estado');
      },
      importStateFromFile: async (file) => {
        const text = await readFileAsText(file);
        const parsed = workspaceStateSchema.safeParse(JSON.parse(text));
        if (!parsed.success) throw new Error('O arquivo JSON nao corresponde ao formato esperado do remake.');
        persistState(normalizeState(parsed.data), 'Importacao de arquivo');
      },
      exportState: () => downloadTextFile('project-nexus-state.json', JSON.stringify(stateRef.current, null, 2), 'application/json;charset=utf-8'),
      resetState: () => persistState(createDefaultState(), 'Reset de estado'),
      createTableSession: async (meta, nickname, initialState, systemKey = DEFAULT_GAME_SYSTEM_KEY) => {
        if (!user) return null;
        setOnline((current) => ({ ...current, status: 'connecting', error: '' }));
        try {
          const created = await workspaceBackend.createTable({
            user,
            nickname,
            systemKey,
            meta,
            state: initialState ? normalizeState(initialState) : stateRef.current
          });
          writeStoredSession(user.id, created.session);
          await applyRemoteTable(created.table, created.session);
          await refreshTables();
          return created.session;
        } catch (error) {
          setOnline((current) => toConnectionFailureState(current, error, 'Nao foi possivel criar a mesa.'));
          throw error;
        }
      },
      switchTable: async (tableSlug) => {
        if (!user) return null;
        setOnline((current) => ({ ...current, status: 'connecting', error: '' }));
        try {
          const next = await workspaceBackend.switchTable({
            user,
            tableSlug
          });
          writeStoredSession(user.id, next.session);
          await applyRemoteTable(next.table, next.session);
          await refreshTables();
          return next.session;
        } catch (error) {
          setOnline((current) => toConnectionFailureState(current, error, 'Nao foi possivel abrir esta mesa.'));
          throw error;
        }
      },
      refreshTables,
      updateTableMeta: async (meta) => {
        if (!onlineRef.current.session) return null;
        const table = await workspaceBackend.updateTableMeta({
          session: onlineRef.current.session,
          meta
        });
        setOnline((current) => syncTableIntoOnlineState(current, table));
        return table;
      },
      connectToInvite: async (inviteUrl, nickname) => {
        if (!user) return null;
        setOnline((current) => ({ ...current, status: 'connecting', error: '' }));
        try {
          const joined = await workspaceBackend.joinByInvite({
            user,
            inviteUrl,
            nickname
          });
          writeStoredSession(user.id, joined.session);
          await applyRemoteTable(joined.table, joined.session);
          await refreshTables();
          return joined.session;
        } catch (error) {
          setOnline((current) => toConnectionFailureState(current, error, 'Nao foi possivel aceitar este convite.'));
          throw error;
        }
      },
      connectToJoinCode: async (code, nickname, characterId) => {
        if (!user) return { connected: false, pending: false, session: null };
        setOnline((current) => ({ ...current, status: 'connecting', error: '' }));
        try {
          const result = await workspaceBackend.joinByCode({
            user,
            code,
            nickname,
            characterId
          });

          if ('requiresCharacter' in result && result.requiresCharacter) {
            setOnline((current) => ({
              ...current,
              status: 'connected',
              pendingCodeJoin: {
                code,
                nickname,
                role: result.role,
                table: result.table,
                characters: result.characters
              }
            }));
            return { connected: false, pending: true, session: null };
          }

          writeStoredSession(user.id, result.session);
          await applyRemoteTable(result.table, result.session);
          await refreshTables();
          return { connected: true, pending: false, session: result.session };
        } catch (error) {
          setOnline((current) => toConnectionFailureState(current, error, 'Nao foi possivel entrar com este codigo.'));
          throw error;
        }
      },
      completeJoinCode: async (characterId) => {
        const pending = onlineRef.current.pendingCodeJoin;
        if (!pending || !user) return null;
        setOnline((current) => ({ ...current, status: 'connecting', error: '' }));
        try {
          const result = await workspaceBackend.joinByCode({
            user,
            code: pending.code,
            nickname: pending.nickname,
            characterId
          });

          if ('requiresCharacter' in result && result.requiresCharacter) {
            setOnline((current) => ({
              ...current,
              status: 'connected',
              pendingCodeJoin: {
                code: pending.code,
                nickname: pending.nickname,
                role: result.role,
                table: result.table,
                characters: result.characters
              }
            }));
            return null;
          }

          writeStoredSession(user.id, result.session);
          await applyRemoteTable(result.table, result.session);
          await refreshTables();
          return result.session;
        } catch (error) {
          setOnline((current) => toConnectionFailureState(current, error, 'Nao foi possivel concluir a entrada nesta mesa.'));
          throw error;
        }
      },
      clearPendingJoinCode: () => setOnline((current) => ({ ...current, pendingCodeJoin: null })),
      flushPersistence,
      createInviteLink: async ({ role, characterId, label }) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const invite = await workspaceBackend.createInvite({
          session: currentSession,
          role,
          characterId,
          label,
          origin: window.location.origin
        });
        setOnline((current) =>
          current.table
            ? {
                ...syncTableIntoOnlineState(current, {
                  ...current.table,
                  invites: [invite, ...current.table.invites],
                  updatedAt: new Date().toISOString()
                }),
                lastInvite: invite.url
              }
            : {
                ...current,
                lastInvite: invite.url
              }
        );
        return invite.url;
      },
      createJoinCode: async ({ role, label, characterId }) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const joinCode = await workspaceBackend.createJoinCode({
          session: currentSession,
          role,
          label,
          characterId
        });
        setOnline((current) =>
          current.table
            ? syncTableIntoOnlineState(
                current,
                {
                  ...current.table,
                  joinCodes: [joinCode, ...current.table.joinCodes],
                  updatedAt: new Date().toISOString()
                }
              )
            : current
        );
        return joinCode;
      },
      revokeJoinCode: async (joinCodeId) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.revokeJoinCode(currentSession, joinCodeId);
        setOnline((current) => syncTableIntoOnlineState(current, table));
        return table;
      },
      createCloudSnapshot: async (label) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.createSnapshot({
          session: currentSession,
          label,
          actor: currentSession.nickname,
          state: stateRef.current
        });
        setOnline((current) => syncTableIntoOnlineState(current, table));
        return table;
      },
      createGameSession: async ({ gameSession }) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.createGameSession({
          session: currentSession,
          gameSession
        });
        setOnline((current) => syncTableIntoOnlineState(current, table));
        return table;
      },
      updateGameSession: async ({ sessionId, patch }) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.updateGameSession({
          session: currentSession,
          sessionId,
          patch
        });
        setOnline((current) => syncTableIntoOnlineState(current, table));
        return table;
      },
      startGameSession: async ({ sessionId }) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.startGameSession({
          session: currentSession,
          sessionId
        });
        setOnline((current) => syncTableIntoOnlineState(current, table));
        return table;
      },
      endGameSession: async (payload) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.endGameSession({
          session: currentSession,
          sessionId: payload?.sessionId
        });
        setOnline((current) => syncTableIntoOnlineState(current, table));
        return table;
      },
      markSessionAttendance: async ({ sessionId, membershipId, status }) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.markSessionAttendance({
          session: currentSession,
          sessionId,
          membershipId,
          status
        });
        setOnline((current) => syncTableIntoOnlineState(current, table));
        return table;
      },
      clearSessionAttendance: async (payload) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.clearSessionAttendance({
          session: currentSession,
          sessionId: payload?.sessionId
        });
        setOnline((current) => syncTableIntoOnlineState(current, table));
        return table;
      },
      transferTableOwnership: async (targetMembershipId) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.transferTableOwnership({
          session: currentSession,
          targetMembershipId
        });
        setOnline((current) => syncTableIntoOnlineState(current, table));
        await refreshTables();
        return table;
      },
      deleteCurrentTable: async () => {
        const currentSession = onlineRef.current.session;
        if (!currentSession || !user) return;
        await workspaceBackend.deleteTable({
          session: currentSession
        });
        writeStoredSession(user.id, null);
        const fallbackState = createDefaultState();
        stateRef.current = fallbackState;
        setState(fallbackState);
        setOnline(DEFAULT_ONLINE_STATE);
        await refreshTables();
      },
      restoreCloudSnapshot: async (snapshotId) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.restoreSnapshot({
          session: currentSession,
          snapshotId
        });
        await applyRemoteTable(table, currentSession);
        return table;
      },
      leaveCurrentTable: async () => {
        if (!onlineRef.current.session || !user) return;
        await workspaceBackend.leaveTable({
          session: onlineRef.current.session,
          userId: user.id
        });
        writeStoredSession(user.id, null);
        const fallbackState = createDefaultState();
        stateRef.current = fallbackState;
        setState(fallbackState);
        setOnline(DEFAULT_ONLINE_STATE);
        await refreshTables();
      },
      disconnectOnline: async () => {
        if (!onlineRef.current.session || !user) return;
        await workspaceBackend.disconnectSession({
          session: onlineRef.current.session,
          userId: user.id
        });
        writeStoredSession(user.id, null);
        const fallbackState = createDefaultState();
        stateRef.current = fallbackState;
        setState(fallbackState);
        setOnline(DEFAULT_ONLINE_STATE);
      },
      copyActiveCharacterText: async () => {
        await copyText(serializeCharacterToText(activeCharacter));
      },
      downloadActiveCharacterText: () => {
        downloadTextFile(`${activeCharacter.name || 'personagem'}.txt`, serializeCharacterToText(activeCharacter));
      }
    }),
    [activeCharacter, appendLog, applyRemoteTable, compendiumCategory, compendiumQuery, flushPersistence, isReady, lastRoll, online, persistState, refreshTables, setLocalActiveCharacter, state, tables, updateCharacters, user, workspaceBackend]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
