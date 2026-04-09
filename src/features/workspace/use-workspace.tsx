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
import { ONLINE_SESSION_STORAGE_KEY } from '@lib/domain/constants';
import { useAuth } from '@features/auth/hooks/use-auth';
import { shouldUseSupabaseRuntime } from '@integrations/supabase/env';
import { supabase } from '@integrations/supabase/client';
import { createLocalWorkspaceBackend } from '@features/workspace/local-backend';
import { type WorkspaceBackend } from '@features/workspace/backend';
import { createSupabaseWorkspaceBackend } from '@features/workspace/supabase-backend';
import type {
  AppView,
  Character,
  Condition,
  CustomRollInput,
  GuidedRollInput,
  LogEntry,
  OnlineState,
  OrderEntry,
  Passive,
  PresenceMember,
  RollResult,
  TableJoinCode,
  TableMeta,
  TableSession,
  TableState,
  Technique,
  Vow,
  Weapon,
  InventoryItem,
  WorkspaceState
} from '@/types/domain';

type CollectionKey = 'weapons' | 'techniques' | 'passives' | 'vows' | 'inventory';

interface WorkspaceContextValue {
  state: WorkspaceState;
  activeCharacter: Character;
  editMode: boolean;
  lastRoll: RollResult | null;
  compendiumQuery: string;
  compendiumCategory: string;
  online: OnlineState;
  setView: (view: AppView) => void;
  setActiveCharacter: (characterId: string) => void;
  toggleEditMode: () => void;
  setCompendiumQuery: (query: string) => void;
  setCompendiumCategory: (category: string) => void;
  adjustResource: (characterId: string, resourceKey: 'hp' | 'energy' | 'sanity', delta: number) => void;
  setResourceCurrent: (characterId: string, resourceKey: 'hp' | 'energy' | 'sanity', value: number) => void;
  setResourceMax: (characterId: string, resourceKey: 'hp' | 'energy' | 'sanity', value: number) => void;
  updateCharacterField: (characterId: string, field: string, value: string | number) => void;
  setCharacterAvatar: (characterId: string, avatar: string, mode: Character['avatarMode']) => void;
  uploadCharacterAvatar: (characterId: string, file: File) => Promise<void>;
  clearCharacterAvatar: (characterId: string) => void;
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
  clearLog: () => void;
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
  createTableSession: (meta: TableMeta, nickname: string) => Promise<TableSession | null>;
  updateTableMeta: (meta: TableMeta) => Promise<TableState | null>;
  connectToInvite: (inviteUrl: string, nickname: string) => Promise<TableSession | null>;
  connectToJoinCode: (
    code: string,
    nickname: string,
    characterId?: string
  ) => Promise<{ connected: boolean; pending: boolean; session: TableSession | null }>;
  completeJoinCode: (characterId: string) => Promise<TableSession | null>;
  clearPendingJoinCode: () => void;
  createInviteLink: (payload: { role: TableSession['role']; characterId: string; label: string }) => Promise<string | null>;
  createJoinCode: (payload: { role: TableSession['role']; label: string; characterId?: string }) => Promise<TableJoinCode | null>;
  revokeJoinCode: (joinCodeId: string) => Promise<TableState | null>;
  createCloudSnapshot: (label: string) => Promise<TableState | null>;
  restoreCloudSnapshot: (snapshotId: string) => Promise<TableState | null>;
  disconnectOnline: () => Promise<void>;
  copyActiveCharacterText: () => Promise<void>;
  downloadActiveCharacterText: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const defaultWorkspaceBackend = shouldUseSupabaseRuntime ? createSupabaseWorkspaceBackend() : createLocalWorkspaceBackend();

const DEFAULT_ONLINE_STATE: OnlineState = {
  platformAvailable: true,
  status: 'offline',
  session: null,
  table: null,
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
    const raw = localStorage.getItem(`${ONLINE_SESSION_STORAGE_KEY}:${userId}`);
    return raw ? (JSON.parse(raw) as TableSession) : null;
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
  if (field === 'clan') return { ...character, clan: String(value) };
  if (field === 'grade') return { ...character, grade: String(value) };
  if (field === 'identity.scar') return { ...character, identity: { ...character.identity, scar: String(value) } };
  if (field === 'identity.anchor') return { ...character, identity: { ...character.identity, anchor: String(value) } };
  if (field === 'identity.trigger') return { ...character, identity: { ...character.identity, trigger: String(value) } };
  return character;
}

function buildOnlineState(session: TableSession, table: TableState, current: OnlineState): OnlineState {
  return {
    ...DEFAULT_ONLINE_STATE,
    status: 'connected',
    session,
    table,
    members: shouldUseSupabaseRuntime ? current.members : table.memberships,
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
      nickname: member.nickname,
      role: member.role,
      characterId: member.characterId,
      characterName: member.characterName
    }));
}

export function WorkspaceProvider({ children, backend }: { children: ReactNode; backend?: WorkspaceBackend }) {
  const workspaceBackend = useMemo(() => backend ?? defaultWorkspaceBackend, [backend]);
  const { user } = useAuth();
  const [state, setState] = useState<WorkspaceState>(createDefaultState());
  const [editMode, setEditMode] = useState(false);
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [compendiumQuery, setCompendiumQuery] = useState('');
  const [compendiumCategory, setCompendiumCategory] = useState('all');
  const [online, setOnline] = useState<OnlineState>(DEFAULT_ONLINE_STATE);
  const stateRef = useRef(state);
  const onlineRef = useRef(online);
  const tableSubscriptionRef = useRef<null | (() => void)>(null);
  const presenceChannelRef = useRef<null | { unsubscribe: () => Promise<'ok' | 'timed out' | 'error'> }>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    onlineRef.current = online;
  }, [online]);

  const applyRemoteTable = useCallback(
    async (table: TableState, session: TableSession) => {
      const nextState = normalizeState(table.state);
      setState(nextState);
      setOnline((current) => buildOnlineState(session, table, current));

      if (user) {
        await workspaceBackend.saveWorkspace(user, nextState);
      }
    },
    [user, workspaceBackend]
  );

  useEffect(() => {
    let isMounted = true;

    tableSubscriptionRef.current?.();
    tableSubscriptionRef.current = null;

    if (!user) {
      setState(createDefaultState());
      setOnline(DEFAULT_ONLINE_STATE);
      return () => undefined;
    }

    setOnline((current) => ({
      ...current,
      status: 'connecting',
      error: ''
    }));

    void (async () => {
      try {
        const workspace = await workspaceBackend.loadWorkspace(user);
        if (!isMounted) return;
        setState(normalizeState(workspace));

        const storedSession = readStoredSession(user.id);
        if (!storedSession) {
          setOnline(DEFAULT_ONLINE_STATE);
          return;
        }

        try {
          const table = await workspaceBackend.getTable(storedSession);
          if (!isMounted) return;
          await applyRemoteTable(table, storedSession);
        } catch {
          writeStoredSession(user.id, null);
          if (isMounted) setOnline(DEFAULT_ONLINE_STATE);
        }
      } catch (error) {
        if (!isMounted) return;
        setOnline((current) => ({
          ...current,
          status: 'error',
          error: error instanceof Error ? error.message : 'Nao foi possivel carregar o workspace.'
        }));
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
        const nextState = normalizeState(table.state);
        setState(nextState);
        setOnline((current) => ({
          ...current,
          table,
          snapshots: table.snapshots,
          joinCodes: table.joinCodes,
          lastSyncAt: table.updatedAt,
          status: 'connected',
          error: '',
          members: shouldUseSupabaseRuntime ? current.members : table.memberships
        }));

        if (user) {
          void workspaceBackend.saveWorkspace(user, nextState);
        }
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

    if (!shouldUseSupabaseRuntime || !client || !session || !user) {
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
          nickname: session.nickname,
          role: session.role,
          characterId: session.characterId,
          characterName: character?.name || ''
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

  const persistState = useCallback(
    (nextState: WorkspaceState, reason = 'Atualizacao local') => {
      if (!user) return;

      const normalized = normalizeState(nextState);
      setState(normalized);

      void workspaceBackend.saveWorkspace(user, normalized).catch((error) => {
        setOnline((current) => ({
          ...current,
          status: current.session ? 'error' : current.status,
          error: error instanceof Error ? error.message : 'Nao foi possivel salvar o workspace.'
        }));
      });

      const currentSession = onlineRef.current.session;
      const currentTable = onlineRef.current.table;
      if (currentSession && currentSession.role !== 'viewer' && currentTable) {
        const optimisticTable: TableState = {
          ...currentTable,
          state: normalized,
          lastEditor: currentSession.nickname || reason,
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

        void workspaceBackend
          .syncTableState({
            session: currentSession,
            state: normalized,
            actor: currentSession.nickname || reason
          })
          .then((table) => {
            setOnline((current) => ({
              ...current,
              table,
              snapshots: table.snapshots,
              joinCodes: table.joinCodes,
              lastSyncAt: table.updatedAt,
              status: 'connected',
              error: '',
              members: shouldUseSupabaseRuntime ? current.members : table.memberships
            }));
          })
          .catch((error) => {
            setOnline((current) => ({
              ...current,
              status: 'error',
              error: error instanceof Error ? error.message : 'Nao foi possivel sincronizar a mesa.'
            }));
          });
      }
    },
    [user, workspaceBackend]
  );

  const updateCharacters = useCallback(
    (updater: (characters: Character[]) => Character[], reason: string) => {
      const nextCharacters = updater(stateRef.current.characters);
      persistState(
        {
          ...stateRef.current,
          characters: nextCharacters
        },
        reason
      );
    },
    [persistState]
  );

  const appendLog = useCallback(
    (entry: LogEntry) => {
      persistState(
        {
          ...stateRef.current,
          log: [entry, ...stateRef.current.log]
        },
        entry.title
      );
    },
    [persistState]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      state,
      activeCharacter,
      editMode,
      lastRoll,
      compendiumQuery,
      compendiumCategory,
      online,
      setView: (view) => {
        if (stateRef.current.currentView === view) return;
        persistState({ ...stateRef.current, currentView: view }, `Mudanca de tela: ${view}`);
      },
      setActiveCharacter: (characterId) => persistState({ ...stateRef.current, activeCharacterId: characterId }, 'Troca de personagem ativo'),
      toggleEditMode: () => setEditMode((current) => !current),
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
      clearLog: () => persistState({ ...stateRef.current, log: [] }, 'Limpeza de log'),
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
      exportState: () => downloadTextFile('singularidade-state.json', JSON.stringify(stateRef.current, null, 2), 'application/json;charset=utf-8'),
      resetState: () => persistState(createDefaultState(), 'Reset de estado'),
      createTableSession: async (meta, nickname) => {
        if (!user) return null;
        setOnline((current) => ({ ...current, status: 'connecting', error: '' }));
        const created = await workspaceBackend.createTable({
          user,
          nickname,
          meta,
          state: stateRef.current
        });
        writeStoredSession(user.id, created.session);
        await applyRemoteTable(created.table, created.session);
        return created.session;
      },
      updateTableMeta: async (meta) => {
        if (!onlineRef.current.session) return null;
        const table = await workspaceBackend.updateTableMeta({
          session: onlineRef.current.session,
          meta
        });
        setOnline((current) => ({
          ...current,
          table,
          snapshots: table.snapshots,
          joinCodes: table.joinCodes,
          lastSyncAt: table.updatedAt,
          status: 'connected'
        }));
        return table;
      },
      connectToInvite: async (inviteUrl, nickname) => {
        if (!user) return null;
        setOnline((current) => ({ ...current, status: 'connecting', error: '' }));
        const joined = await workspaceBackend.joinByInvite({
          user,
          inviteUrl,
          nickname
        });
        writeStoredSession(user.id, joined.session);
        await applyRemoteTable(joined.table, joined.session);
        return joined.session;
      },
      connectToJoinCode: async (code, nickname, characterId) => {
        if (!user) return { connected: false, pending: false, session: null };
        setOnline((current) => ({ ...current, status: 'connecting', error: '' }));
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
        return { connected: true, pending: false, session: result.session };
      },
      completeJoinCode: async (characterId) => {
        const pending = onlineRef.current.pendingCodeJoin;
        if (!pending || !user) return null;
        const result = await workspaceBackend.joinByCode({
          user,
          code: pending.code,
          nickname: pending.nickname,
          characterId
        });

        if ('requiresCharacter' in result && result.requiresCharacter) {
          return null;
        }

        writeStoredSession(user.id, result.session);
        await applyRemoteTable(result.table, result.session);
        return result.session;
      },
      clearPendingJoinCode: () => setOnline((current) => ({ ...current, pendingCodeJoin: null })),
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
        setOnline((current) => ({
          ...current,
          lastInvite: invite.url
        }));
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
        setOnline((current) => ({
          ...current,
          joinCodes: [joinCode, ...current.joinCodes]
        }));
        return joinCode;
      },
      revokeJoinCode: async (joinCodeId) => {
        const currentSession = onlineRef.current.session;
        if (!currentSession) return null;
        const table = await workspaceBackend.revokeJoinCode(currentSession, joinCodeId);
        setOnline((current) => ({
          ...current,
          table,
          joinCodes: table.joinCodes
        }));
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
        setOnline((current) => ({
          ...current,
          table,
          snapshots: table.snapshots
        }));
        return table;
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
      disconnectOnline: async () => {
        if (!onlineRef.current.session || !user) return;
        await workspaceBackend.disconnectSession({
          session: onlineRef.current.session,
          userId: user.id
        });
        writeStoredSession(user.id, null);
        setOnline(DEFAULT_ONLINE_STATE);
      },
      copyActiveCharacterText: async () => {
        await copyText(serializeCharacterToText(activeCharacter));
      },
      downloadActiveCharacterText: () => {
        downloadTextFile(`${activeCharacter.name || 'personagem'}.txt`, serializeCharacterToText(activeCharacter));
      }
    }),
    [activeCharacter, appendLog, applyRemoteTable, compendiumCategory, compendiumQuery, editMode, lastRoll, online, persistState, state, updateCharacters, user, workspaceBackend]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
