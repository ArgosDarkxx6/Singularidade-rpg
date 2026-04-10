import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';
import type {
  AuthUser,
  Character,
  LogEntry,
  PresenceMember,
  TableInvite,
  TableJoinCode,
  TableListItem,
  TableMeta,
  TableSession,
  TableSnapshot,
  TableState,
  WorkspaceState
} from '@/types/domain';
import { DEFAULT_TABLE_META } from '@lib/domain/constants';
import { createDefaultState, makeCharacter, normalizeLogEntry, normalizeState } from '@lib/domain/state';
import { deepClone, sanitizeJoinCode, slugify, uid } from '@lib/domain/utils';
import { workspaceStateSchema } from '@schemas/domain';
import { supabase } from '@integrations/supabase/client';
import type { Json } from '@integrations/supabase/database.types';
import type { JoinCodeBackendResult, UploadAvatarResult, WorkspaceBackend } from './backend';

const DRAFT_KIND = 'workspace-draft';

function assertClient() {
  if (!supabase) {
    throw new Error('Supabase nao configurado para este runtime.');
  }

  return supabase;
}

function isPermissionError(error: PostgrestError | null) {
  if (!error) return false;
  return error.code === '42501' || error.message.toLowerCase().includes('permission');
}

function isMissingFunctionError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return error.code === 'PGRST202' || message.includes('could not find the function') || message.includes('function public.');
}

function serializeStateForStorage(state: WorkspaceState): WorkspaceState {
  const nextState = deepClone(state);
  nextState.characters = nextState.characters.map((character) =>
    character.avatarMode === 'upload' && character.avatarPath
      ? {
          ...character,
          avatar: ''
        }
      : character
  );

  return nextState;
}

async function createSignedAvatarUrl(path: string): Promise<string> {
  if (!path) return '';
  const client = assertClient();
  const { data, error } = await client.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 30);
  if (error) return '';
  return data.signedUrl;
}

async function hydrateStateAvatars(state: WorkspaceState): Promise<WorkspaceState> {
  const nextState = deepClone(state);
  nextState.characters = await Promise.all(
    nextState.characters.map(async (character) => {
      if (character.avatarMode !== 'upload' || !character.avatarPath) return character;
      const signedUrl = await createSignedAvatarUrl(character.avatarPath);
      return {
        ...character,
        avatar: signedUrl || character.avatar
      };
    })
  );

  return nextState;
}

function parseWorkspaceState(input: Json | null | undefined): WorkspaceState {
  const parsed = workspaceStateSchema.safeParse(input);
  if (parsed.success) return normalizeState(parsed.data);
  return normalizeState((input as Partial<WorkspaceState> | null | undefined) ?? createDefaultState());
}

function toTableMeta(row: {
  name: string;
  series_name: string;
  campaign_name: string;
  episode_number: string;
  episode_title: string;
  session_date: string | null;
  location: string;
  status: string;
  expected_roster: string;
  recap: string;
  objective: string;
}): TableMeta {
  return {
    tableName: row.name,
    seriesName: row.series_name,
    campaignName: row.campaign_name,
    episodeNumber: row.episode_number,
    episodeTitle: row.episode_title,
    sessionDate: row.session_date || '',
    location: row.location,
    status: row.status,
    expectedRoster: row.expected_roster,
    recap: row.recap,
    objective: row.objective
  };
}

function toTableInsert(meta: TableMeta, state: WorkspaceState, ownerId: string, lastEditor: string, slug: string, kind?: string) {
  return {
    slug,
    name: meta.tableName || DEFAULT_TABLE_META.tableName,
    series_name: meta.seriesName || DEFAULT_TABLE_META.seriesName,
    campaign_name: meta.campaignName || '',
    episode_number: meta.episodeNumber || '',
    episode_title: meta.episodeTitle || '',
    session_date: meta.sessionDate || null,
    location: meta.location || '',
    status: meta.status || DEFAULT_TABLE_META.status,
    expected_roster: meta.expectedRoster || '',
    recap: meta.recap || '',
    objective: meta.objective || '',
    meta: {
      ...meta,
      ...(kind ? { kind } : {})
    },
    state: serializeStateForStorage(state) as unknown as Json,
    owner_id: ownerId,
    current_round: state.order.round,
    current_turn_index: state.order.turn,
    last_editor: lastEditor
  };
}

type CharacterRow = {
  id: string;
  table_id: string;
  owner_id: string | null;
  name: string;
  age: number;
  clan: string;
  grade: string;
  appearance: string;
  identity_scar: string;
  identity_anchor: string;
  identity_trigger: string;
  avatar_url: string;
  avatar_path: string;
  money: number;
  archived: boolean;
  sort_order: number;
};

type CharacterResourceRow = {
  character_id: string;
  resource_key: 'hp' | 'energy' | 'sanity';
  current_value: number;
  max_value: number;
  sort_order: number;
};

type CharacterAttributeRow = {
  character_id: string;
  attribute_key: keyof Character['attributes'];
  value: number;
  rank: Character['attributes'][keyof Character['attributes']]['rank'];
  sort_order: number;
};

type CharacterWeaponRow = {
  id: string;
  character_id: string;
  name: string;
  grade: string;
  damage: string;
  tags: string[];
  description: string;
  sort_order: number;
};

type CharacterTechniqueRow = {
  id: string;
  character_id: string;
  name: string;
  cost: number;
  damage: string;
  technique_type: Character['techniques'][number]['type'];
  tags: string[];
  description: string;
  sort_order: number;
};

type CharacterPassiveRow = {
  id: string;
  character_id: string;
  name: string;
  tags: string[];
  description: string;
  sort_order: number;
};

type CharacterVowRow = {
  id: string;
  character_id: string;
  name: string;
  benefit: string;
  restriction: string;
  penalty: string;
  sort_order: number;
};

type CharacterInventoryItemRow = {
  id: string;
  character_id: string;
  name: string;
  quantity: number;
  effect: string;
  sort_order: number;
};

type CharacterConditionRow = {
  id: string;
  character_id: string;
  name: string;
  color: Character['conditions'][number]['color'];
  note: string;
  sort_order: number;
};

function buildCharacterRow(
  tableId: string,
  character: Character,
  sortOrder: number,
  fallbackOwnerId: string,
  existingOwnerId?: string | null
) {
  return {
    id: character.id,
    table_id: tableId,
    owner_id: existingOwnerId ?? fallbackOwnerId,
    name: character.name || 'Personagem',
    age: character.age,
    clan: character.clan || '',
    grade: character.grade || '',
    appearance: character.appearance || '',
    identity_scar: character.identity.scar || '',
    identity_anchor: character.identity.anchor || '',
    identity_trigger: character.identity.trigger || '',
    avatar_url: character.avatarMode === 'url' ? character.avatar : '',
    avatar_path: character.avatarPath || '',
    money: character.inventory.money || 0,
    archived: false,
    sort_order: sortOrder
  };
}

function buildResourceRows(character: Character): CharacterResourceRow[] {
  return ([
    ['hp', character.resources.hp],
    ['energy', character.resources.energy],
    ['sanity', character.resources.sanity]
  ] as const).map(([resourceKey, resource], sortOrder) => ({
    character_id: character.id,
    resource_key: resourceKey,
    current_value: resource.current,
    max_value: resource.max,
    sort_order: sortOrder
  }));
}

function buildAttributeRows(character: Character): CharacterAttributeRow[] {
  return (Object.entries(character.attributes) as Array<
    [keyof Character['attributes'], Character['attributes'][keyof Character['attributes']]]
  >).map(([attributeKey, attribute], sortOrder) => ({
    character_id: character.id,
    attribute_key: attributeKey,
    value: attribute.value,
    rank: attribute.rank,
    sort_order: sortOrder
  }));
}

function buildWeaponRows(character: Character): CharacterWeaponRow[] {
  return character.weapons.map((weapon, sortOrder) => ({
    id: weapon.id,
    character_id: character.id,
    name: weapon.name,
    grade: weapon.grade,
    damage: weapon.damage,
    tags: weapon.tags,
    description: weapon.description,
    sort_order: sortOrder
  }));
}

function buildTechniqueRows(character: Character): CharacterTechniqueRow[] {
  return character.techniques.map((technique, sortOrder) => ({
    id: technique.id,
    character_id: character.id,
    name: technique.name,
    cost: technique.cost,
    damage: technique.damage,
    technique_type: technique.type,
    tags: technique.tags,
    description: technique.description,
    sort_order: sortOrder
  }));
}

function buildPassiveRows(character: Character): CharacterPassiveRow[] {
  return character.passives.map((passive, sortOrder) => ({
    id: passive.id,
    character_id: character.id,
    name: passive.name,
    tags: passive.tags,
    description: passive.description,
    sort_order: sortOrder
  }));
}

function buildVowRows(character: Character): CharacterVowRow[] {
  return character.vows.map((vow, sortOrder) => ({
    id: vow.id,
    character_id: character.id,
    name: vow.name,
    benefit: vow.benefit,
    restriction: vow.restriction,
    penalty: vow.penalty,
    sort_order: sortOrder
  }));
}

function buildInventoryItemRows(character: Character): CharacterInventoryItemRow[] {
  return character.inventory.items.map((item, sortOrder) => ({
    id: item.id,
    character_id: character.id,
    name: item.name,
    quantity: item.quantity,
    effect: item.effect,
    sort_order: sortOrder
  }));
}

function buildConditionRows(character: Character): CharacterConditionRow[] {
  return character.conditions.map((condition, sortOrder) => ({
    id: condition.id,
    character_id: character.id,
    name: condition.name,
    color: condition.color,
    note: condition.note,
    sort_order: sortOrder
  }));
}

async function fetchExistingCharacterOwnership(tableId: string) {
  const client = assertClient();
  const { data, error } = await client.from('characters').select('id, owner_id').eq('table_id', tableId);
  if (error) throw error;
  return new Map((data || []).map((row) => [row.id, row.owner_id]));
}

async function replaceCharacterChildren(character: Character) {
  const client = assertClient();

  const resourceRows = buildResourceRows(character);
  const attributeRows = buildAttributeRows(character);
  const weaponRows = buildWeaponRows(character);
  const techniqueRows = buildTechniqueRows(character);
  const passiveRows = buildPassiveRows(character);
  const vowRows = buildVowRows(character);
  const inventoryRows = buildInventoryItemRows(character);
  const conditionRows = buildConditionRows(character);

  const deleteTables = [
    'character_resources',
    'character_attributes',
    'character_weapons',
    'character_techniques',
    'character_passives',
    'character_vows',
    'character_inventory_items',
    'character_conditions'
  ] as const;

  for (const tableName of deleteTables) {
    const { error } = await client.from(tableName).delete().eq('character_id', character.id);
    if (error) throw error;
  }

  if (resourceRows.length) {
    const { error } = await client.from('character_resources').insert(resourceRows);
    if (error) throw error;
  }

  if (attributeRows.length) {
    const { error } = await client.from('character_attributes').insert(attributeRows);
    if (error) throw error;
  }

  if (weaponRows.length) {
    const { error } = await client.from('character_weapons').insert(weaponRows);
    if (error) throw error;
  }

  if (techniqueRows.length) {
    const { error } = await client.from('character_techniques').insert(techniqueRows);
    if (error) throw error;
  }

  if (passiveRows.length) {
    const { error } = await client.from('character_passives').insert(passiveRows);
    if (error) throw error;
  }

  if (vowRows.length) {
    const { error } = await client.from('character_vows').insert(vowRows);
    if (error) throw error;
  }

  if (inventoryRows.length) {
    const { error } = await client.from('character_inventory_items').insert(inventoryRows);
    if (error) throw error;
  }

  if (conditionRows.length) {
    const { error } = await client.from('character_conditions').insert(conditionRows);
    if (error) throw error;
  }
}

async function syncCharacterRows(tableId: string, ownerId: string, state: WorkspaceState) {
  const client = assertClient();
  const ownershipMap = await fetchExistingCharacterOwnership(tableId);
  const rows = state.characters.map((character, sortOrder) =>
    buildCharacterRow(tableId, character, sortOrder, ownerId, ownershipMap.get(character.id))
  );

  if (rows.length) {
    const { error } = await client.from('characters').upsert(rows, {
      onConflict: 'id'
    });
    if (error) throw error;
  }

  const activeIds = rows.map((row) => row.id);
  const archivedIds = [...ownershipMap.keys()].filter((id) => !activeIds.includes(id));
  if (archivedIds.length) {
    const { error } = await client.from('characters').update({ archived: true }).in('id', archivedIds);
    if (error) throw error;
  }

  for (const character of state.characters) {
    await replaceCharacterChildren(character);
  }
}

async function saveCharacterGraph(tableId: string, userId: string, character: Character) {
  const client = assertClient();
  const { data: existingRows, error: existingError } = await client
    .from('characters')
    .select('sort_order')
    .eq('table_id', tableId)
    .eq('id', character.id)
    .maybeSingle();
  if (existingError) throw existingError;

  const row = buildCharacterRow(tableId, character, existingRows?.sort_order ?? 0, userId, userId);
  const { error } = await client.from('characters').upsert(row, {
    onConflict: 'id'
  });
  if (error) throw error;

  await replaceCharacterChildren(character);
}

async function createUniqueSlug(baseValue: string): Promise<string> {
  const client = assertClient();
  const base = slugify(baseValue);

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`.slice(0, 48);
    const { data, error } = await client.from('tables').select('id').eq('slug', candidate).maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`.slice(0, 48);
}

async function fetchProfilesById(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return new Map<string, { displayName: string; username: string }>();

  const client = assertClient();
  const { data, error } = await client.from('profiles').select('id, display_name, username').in('id', uniqueIds);
  if (error) throw error;

  return new Map(
    (data || []).map((profile) => [
      profile.id,
      {
        displayName: profile.display_name,
        username: profile.username
      }
    ])
  );
}

async function fetchTableRowById(tableId: string) {
  const client = assertClient();
  const { data, error } = await client.from('tables').select('*').eq('id', tableId).single();
  if (error) throw error;
  return data;
}

async function fetchSnapshots(tableId: string): Promise<TableSnapshot[]> {
  const client = assertClient();
  const { data, error } = await client
    .from('table_snapshots')
    .select('id, label, state, created_at, created_by')
    .eq('table_id', tableId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const snapshotRows: Array<{ id: string; label: string; state: Json; created_at: string; created_by: string | null }> = data || [];
  const actorMap = await fetchProfilesById(snapshotRows.map((snapshot) => snapshot.created_by || ''));

  return snapshotRows.map((snapshot) => ({
    id: snapshot.id,
    label: snapshot.label,
    actorName: actorMap.get(snapshot.created_by || '')?.displayName || 'Sistema',
    createdAt: snapshot.created_at,
    state: parseWorkspaceState(snapshot.state)
  }));
}

async function fetchJoinCodes(tableId: string, tableSlug: string): Promise<TableJoinCode[]> {
  const client = assertClient();
  const { data, error } = await client
    .from('table_join_codes')
    .select('id, code, role, label, active, created_at, updated_at, character_id')
    .eq('table_id', tableId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (isPermissionError(error)) return [];
  if (error) throw error;

  return (data || []).map((joinCode) => ({
    id: joinCode.id,
    tableSlug,
    role: joinCode.role as TableJoinCode['role'],
    code: joinCode.code,
    label: joinCode.label,
    active: joinCode.active,
    characterId: joinCode.character_id || '',
    createdAt: joinCode.created_at,
    updatedAt: joinCode.updated_at
  }));
}

async function fetchInvites(tableId: string, tableSlug: string): Promise<TableInvite[]> {
  const client = assertClient();
  const { data, error } = await client
    .from('table_invites')
    .select('id, role, character_id, label, token')
    .eq('table_id', tableId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  if (isPermissionError(error)) return [];
  if (error) throw error;

  return (data || []).map((invite) => ({
    id: invite.id,
    role: invite.role as TableInvite['role'],
    characterId: invite.character_id || '',
    label: invite.label,
    url: `/mesa/${tableSlug}?token=${invite.token}`
  }));
}

function mapMemberships(records: Array<{ id: string; user_id: string; role: string; character_id: string | null; nickname: string; active: boolean }>, state: WorkspaceState): PresenceMember[] {
  return records
    .filter((membership) => membership.active)
    .map((membership) => {
      const character = state.characters.find((entry) => entry.id === membership.character_id);
      return {
        id: membership.id,
        nickname: membership.nickname,
        role: membership.role as PresenceMember['role'],
        characterId: membership.character_id || '',
        characterName: character?.name || ''
      };
    });
}

async function fetchMemberships(tableId: string, state: WorkspaceState): Promise<PresenceMember[]> {
  const client = assertClient();
  const { data, error } = await client
    .from('table_memberships')
    .select('id, user_id, role, character_id, nickname, active')
    .eq('table_id', tableId)
    .eq('active', true)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return mapMemberships(data || [], state);
}

async function fetchRelationalCharacters(tableId: string, fallbackState: WorkspaceState): Promise<Character[]> {
  const client = assertClient();
  const { data, error } = await client
    .from('characters')
    .select('id, table_id, owner_id, name, age, clan, grade, appearance, identity_scar, identity_anchor, identity_trigger, avatar_url, avatar_path, money, archived, sort_order')
    .eq('table_id', tableId)
    .eq('archived', false)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  const rows = ((data || []) as CharacterRow[]).filter((row) => !row.archived);
  if (!rows.length) {
    return hydrateStateAvatars(fallbackState).then((state) => state.characters);
  }

  const characterIds = rows.map((row) => row.id);
  const fallbackMap = new Map(fallbackState.characters.map((character) => [character.id, character]));

  const [
    resourceRowsResult,
    attributeRowsResult,
    weaponRowsResult,
    techniqueRowsResult,
    passiveRowsResult,
    vowRowsResult,
    inventoryRowsResult,
    conditionRowsResult
  ] = await Promise.all([
    client.from('character_resources').select('character_id, resource_key, current_value, max_value, sort_order').in('character_id', characterIds),
    client.from('character_attributes').select('character_id, attribute_key, value, rank, sort_order').in('character_id', characterIds),
    client.from('character_weapons').select('id, character_id, name, grade, damage, tags, description, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    client.from('character_techniques').select('id, character_id, name, cost, damage, technique_type, tags, description, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    client.from('character_passives').select('id, character_id, name, tags, description, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    client.from('character_vows').select('id, character_id, name, benefit, restriction, penalty, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    client.from('character_inventory_items').select('id, character_id, name, quantity, effect, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    client.from('character_conditions').select('id, character_id, name, color, note, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true })
  ]);

  const rowResults = [
    resourceRowsResult,
    attributeRowsResult,
    weaponRowsResult,
    techniqueRowsResult,
    passiveRowsResult,
    vowRowsResult,
    inventoryRowsResult,
    conditionRowsResult
  ];

  for (const result of rowResults) {
    if (result.error) throw result.error;
  }

  const resourceRows = (resourceRowsResult.data || []) as CharacterResourceRow[];
  const attributeRows = (attributeRowsResult.data || []) as CharacterAttributeRow[];
  const weaponRows = (weaponRowsResult.data || []) as CharacterWeaponRow[];
  const techniqueRows = (techniqueRowsResult.data || []) as CharacterTechniqueRow[];
  const passiveRows = (passiveRowsResult.data || []) as CharacterPassiveRow[];
  const vowRows = (vowRowsResult.data || []) as CharacterVowRow[];
  const inventoryRows = (inventoryRowsResult.data || []) as CharacterInventoryItemRow[];
  const conditionRows = (conditionRowsResult.data || []) as CharacterConditionRow[];

  return Promise.all(
    rows.map(async (row) => {
      const fallback = fallbackMap.get(row.id);
      const avatar = row.avatar_path ? await createSignedAvatarUrl(row.avatar_path) : row.avatar_url;
      const resourceEntries = resourceRows.filter((entry) => entry.character_id === row.id);
      const attributeEntries = attributeRows.filter((entry) => entry.character_id === row.id);
      const hpEntry = resourceEntries.find((entry) => entry.resource_key === 'hp');
      const energyEntry = resourceEntries.find((entry) => entry.resource_key === 'energy');
      const sanityEntry = resourceEntries.find((entry) => entry.resource_key === 'sanity');

      return makeCharacter({
        ...fallback,
        id: row.id,
        name: row.name,
        age: row.age,
        clan: row.clan,
        grade: row.grade,
        appearance: row.appearance,
        avatarMode: row.avatar_path ? 'upload' : row.avatar_url ? 'url' : 'none',
        avatar,
        avatarPath: row.avatar_path || '',
        identity: {
          scar: row.identity_scar,
          anchor: row.identity_anchor,
          trigger: row.identity_trigger
        },
        resources: resourceEntries.length
          ? {
              hp: hpEntry
                ? {
                    current: hpEntry.current_value,
                    max: hpEntry.max_value
                  }
                : (fallback?.resources.hp ?? { current: 0, max: 0 }),
              energy: energyEntry
                ? {
                    current: energyEntry.current_value,
                    max: energyEntry.max_value
                  }
                : (fallback?.resources.energy ?? { current: 0, max: 0 }),
              sanity: sanityEntry
                ? {
                    current: sanityEntry.current_value,
                    max: sanityEntry.max_value
                  }
                : (fallback?.resources.sanity ?? { current: 0, max: 0 })
            }
          : fallback?.resources,
        attributes: attributeEntries.length
          ? ({
              strength: attributeEntries.find((entry) => entry.attribute_key === 'strength')
                ? {
                    value: attributeEntries.find((entry) => entry.attribute_key === 'strength')!.value,
                    rank: attributeEntries.find((entry) => entry.attribute_key === 'strength')!.rank
                  }
                : fallback?.attributes.strength,
              resistance: attributeEntries.find((entry) => entry.attribute_key === 'resistance')
                ? {
                    value: attributeEntries.find((entry) => entry.attribute_key === 'resistance')!.value,
                    rank: attributeEntries.find((entry) => entry.attribute_key === 'resistance')!.rank
                  }
                : fallback?.attributes.resistance,
              dexterity: attributeEntries.find((entry) => entry.attribute_key === 'dexterity')
                ? {
                    value: attributeEntries.find((entry) => entry.attribute_key === 'dexterity')!.value,
                    rank: attributeEntries.find((entry) => entry.attribute_key === 'dexterity')!.rank
                  }
                : fallback?.attributes.dexterity,
              speed: attributeEntries.find((entry) => entry.attribute_key === 'speed')
                ? {
                    value: attributeEntries.find((entry) => entry.attribute_key === 'speed')!.value,
                    rank: attributeEntries.find((entry) => entry.attribute_key === 'speed')!.rank
                  }
                : fallback?.attributes.speed,
              fight: attributeEntries.find((entry) => entry.attribute_key === 'fight')
                ? {
                    value: attributeEntries.find((entry) => entry.attribute_key === 'fight')!.value,
                    rank: attributeEntries.find((entry) => entry.attribute_key === 'fight')!.rank
                  }
                : fallback?.attributes.fight,
              precision: attributeEntries.find((entry) => entry.attribute_key === 'precision')
                ? {
                    value: attributeEntries.find((entry) => entry.attribute_key === 'precision')!.value,
                    rank: attributeEntries.find((entry) => entry.attribute_key === 'precision')!.rank
                  }
                : fallback?.attributes.precision,
              intelligence: attributeEntries.find((entry) => entry.attribute_key === 'intelligence')
                ? {
                    value: attributeEntries.find((entry) => entry.attribute_key === 'intelligence')!.value,
                    rank: attributeEntries.find((entry) => entry.attribute_key === 'intelligence')!.rank
                  }
                : fallback?.attributes.intelligence,
              charisma: attributeEntries.find((entry) => entry.attribute_key === 'charisma')
                ? {
                    value: attributeEntries.find((entry) => entry.attribute_key === 'charisma')!.value,
                    rank: attributeEntries.find((entry) => entry.attribute_key === 'charisma')!.rank
                  }
                : fallback?.attributes.charisma
            }) as Character['attributes']
          : fallback?.attributes,
        weapons: weaponRows
          .filter((entry) => entry.character_id === row.id)
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            grade: entry.grade,
            damage: entry.damage,
            tags: entry.tags || [],
            description: entry.description
          })),
        techniques: techniqueRows
          .filter((entry) => entry.character_id === row.id)
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            cost: entry.cost,
            damage: entry.damage,
            type: entry.technique_type,
            tags: entry.tags || [],
            description: entry.description
          })),
        passives: passiveRows
          .filter((entry) => entry.character_id === row.id)
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            tags: entry.tags || [],
            description: entry.description
          })),
        vows: vowRows
          .filter((entry) => entry.character_id === row.id)
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            benefit: entry.benefit,
            restriction: entry.restriction,
            penalty: entry.penalty
          })),
        inventory: {
          money: row.money || fallback?.inventory.money || 0,
          items: inventoryRows
            .filter((entry) => entry.character_id === row.id)
            .map((entry) => ({
              id: entry.id,
              name: entry.name,
              quantity: entry.quantity,
              effect: entry.effect
            }))
        },
        conditions: conditionRows
          .filter((entry) => entry.character_id === row.id)
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            color: entry.color,
            note: entry.note
          }))
      });
    })
  );
}

async function fetchTableLogs(tableId: string, fallbackLogs: LogEntry[]): Promise<LogEntry[]> {
  const client = assertClient();
  const { data, error } = await client
    .from('table_logs')
    .select('id, category, title, body, meta, created_at')
    .eq('table_id', tableId)
    .order('created_at', { ascending: false });

  if (isPermissionError(error)) return fallbackLogs;
  if (error) throw error;

  const mapped = (data || []).map((entry) =>
    normalizeLogEntry({
      id: entry.id,
      category: entry.category,
      title: entry.title,
      text: entry.body,
      meta: entry.meta,
      timestamp: entry.created_at
    })
  );

  if (!mapped.length) return fallbackLogs;
  const remoteIds = new Set(mapped.map((entry) => entry.id));
  return [...mapped, ...fallbackLogs.filter((entry) => !remoteIds.has(entry.id))];
}

async function fetchTableState(tableId: string): Promise<TableState> {
  const row = await fetchTableRowById(tableId);
  const fallbackState = parseWorkspaceState(row.state);
  const [characters, logs, snapshots, joinCodes, invites] = await Promise.all([
    fetchRelationalCharacters(row.id, fallbackState),
    fetchTableLogs(row.id, fallbackState.log),
    fetchSnapshots(row.id),
    fetchJoinCodes(row.id, row.slug),
    fetchInvites(row.id, row.slug)
  ]);
  const state = normalizeState({
    ...fallbackState,
    characters,
    log: logs
  });
  const memberships = await fetchMemberships(row.id, state);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    meta: toTableMeta(row),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    lastEditor: row.last_editor || '',
    state,
    memberships,
    invites,
    joinCodes,
    snapshots
  };
}

function buildTableSession(input: {
  tableId: string;
  tableSlug: string;
  tableName: string;
  membershipId: string;
  role: TableSession['role'];
  nickname: string;
  characterId?: string | null;
}): TableSession {
  return {
    tableId: input.tableId,
    membershipId: input.membershipId,
    tableSlug: input.tableSlug,
    tableName: input.tableName,
    role: input.role,
    nickname: input.nickname,
    characterId: input.characterId || '',
    lastJoinedAt: new Date().toISOString()
  };
}

async function listUserTableSummaries(user: AuthUser): Promise<TableListItem[]> {
  const client = assertClient();
  const { data, error } = await client
    .from('table_memberships')
    .select(
      `
      id,
      role,
      nickname,
      character_id,
      joined_at,
      tables!inner (
        id,
        slug,
        name,
        owner_id,
        created_at,
        updated_at,
        status,
        series_name,
        campaign_name
      )
    `
    )
    .eq('user_id', user.id)
    .eq('active', true);

  if (error) throw error;

  return (data || [])
    .map((record): TableListItem | null => {
      const table = Array.isArray(record.tables) ? record.tables[0] : record.tables;
      if (!table) return null;

      return {
        id: table.id,
        slug: table.slug,
        name: table.name,
        role: record.role as TableListItem['role'],
        nickname: record.nickname,
        characterId: record.character_id || '',
        createdAt: table.created_at,
        updatedAt: table.updated_at,
        joinedAt: record.joined_at,
        isOwner: table.owner_id === user.id,
        seriesName: table.series_name,
        campaignName: table.campaign_name,
        status: table.status
      } satisfies TableListItem;
    })
    .filter((entry): entry is TableListItem => Boolean(entry))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) as TableListItem[];
}

async function ensureDraftTable(user: AuthUser): Promise<string> {
  const client = assertClient();
  const { data, error } = await client
    .from('tables')
    .select('id')
    .eq('owner_id', user.id)
    .contains('meta', { kind: DRAFT_KIND })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const draftRow = (data as { id: string } | null) || null;
  if (draftRow?.id) return draftRow.id;

  const initialState = createDefaultState();
  const slug = await createUniqueSlug(`workspace-${user.id}`);
  const { data: inserted, error: insertError } = await client
    .from('tables')
    .insert(
      toTableInsert(
        {
          ...DEFAULT_TABLE_META,
          tableName: `Workspace de ${user.username || user.displayName || 'feiticeiro'}`,
          status: 'Planejamento'
        },
        initialState,
        user.id,
        user.displayName,
        slug,
        DRAFT_KIND
      )
    )
    .select('id')
    .single();

  if (insertError) throw insertError;
  const insertedRow = (inserted as { id: string } | null) || null;
  if (!insertedRow?.id) {
    throw new Error('Nao foi possivel criar o workspace pessoal.');
  }

  return insertedRow.id;
}

async function claimInvite(input: { inviteToken: string; nickname: string }) {
  const client = assertClient();
  const { data, error } = await client.rpc('claim_table_invite_v2', {
    invite_token: input.inviteToken,
    session_nickname: input.nickname
  });

  if (isMissingFunctionError(error)) {
    const fallback = await client.rpc('claim_table_invite', {
      invite_token: input.inviteToken
    });
    if (fallback.error) throw fallback.error;
    return fallback.data?.[0];
  }

  if (error) throw error;
  return data?.[0];
}

async function resolveJoinCode(code: string) {
  const client = assertClient();
  const { data, error } = await client.rpc('resolve_join_code', {
    join_code: code
  });

  if (isMissingFunctionError(error)) return null;
  if (error) throw error;
  return data?.[0] || null;
}

async function claimJoinCode(input: { code: string; nickname: string; characterId?: string }) {
  const client = assertClient();
  const { data, error } = await client.rpc('claim_join_code_v2', {
    join_code: input.code,
    session_nickname: input.nickname,
    selected_character_id: input.characterId || undefined
  });

  if (isMissingFunctionError(error)) {
    const fallback = await client.rpc('claim_join_code', {
      join_code: input.code
    });
    if (fallback.error) throw fallback.error;
    return fallback.data?.[0];
  }

  if (error) throw error;
  return data?.[0];
}

function toInviteUrl(origin: string, tableSlug: string, token: string) {
  return `${origin}/mesa/${tableSlug}?token=${token}`;
}

export function createSupabaseWorkspaceBackend(): WorkspaceBackend {
  return {
    async loadWorkspace(user) {
      const client = assertClient();
      const draftTableId = await ensureDraftTable(user);
      const { data, error } = await client.from('tables').select('state').eq('id', draftTableId).single();
      if (error) throw error;
      return hydrateStateAvatars(parseWorkspaceState(data.state));
    },
    async saveWorkspace(user, state) {
      const client = assertClient();
      const draftTableId = await ensureDraftTable(user);
      const { error } = await client
        .from('tables')
        .update({
          state: serializeStateForStorage(state) as unknown as Json,
          current_round: state.order.round,
          current_turn_index: state.order.turn,
          last_editor: user.displayName
        })
        .eq('id', draftTableId);

      if (error) throw error;
    },
    async listUserTables(user) {
      return listUserTableSummaries(user);
    },
    async getTable(session) {
      return fetchTableState(session.tableId);
    },
    async switchTable({ user, tableSlug }) {
      const client = assertClient();
      const { data, error } = await client
        .from('table_memberships')
        .select(
          `
          id,
          role,
          nickname,
          character_id,
          tables!inner (
            id,
            slug,
            name
          )
        `
        )
        .eq('user_id', user.id)
        .eq('active', true)
        .eq('tables.slug', tableSlug)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Voce nao participa desta mesa.');
      const table = Array.isArray(data.tables) ? data.tables[0] : data.tables;
      if (!table) throw new Error('Mesa nao encontrada.');

      return {
        table: await fetchTableState(table.id),
        session: buildTableSession({
          tableId: table.id,
          tableSlug: table.slug,
          tableName: table.name,
          membershipId: data.id,
          role: data.role as TableSession['role'],
          nickname: data.nickname,
          characterId: data.character_id
        })
      };
    },
    async subscribeToTable(session, callback) {
      const client = assertClient();
      const channel = client.channel(`table-sync:${session.tableId}`);
      let disposed = false;

      const reload = async () => {
        if (disposed) return;
        const table = await fetchTableState(session.tableId);
        callback(table);
      };

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `id=eq.${session.tableId}` }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'table_snapshots', filter: `table_id=eq.${session.tableId}` }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'table_join_codes', filter: `table_id=eq.${session.tableId}` }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'table_memberships', filter: `table_id=eq.${session.tableId}` }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'table_logs', filter: `table_id=eq.${session.tableId}` }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `table_id=eq.${session.tableId}` }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'character_resources' }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'character_attributes' }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'character_weapons' }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'character_techniques' }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'character_passives' }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'character_vows' }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'character_inventory_items' }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'character_conditions' }, reload)
        .subscribe();

      return () => {
        disposed = true;
        void client.removeChannel(channel);
      };
    },
    async createTable({ user, nickname, meta, state }) {
      const client = assertClient();
      let insertedTable: { id: string; slug: string; name: string } | null = null;

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const baseSlug = slugify(meta.tableName || DEFAULT_TABLE_META.tableName);
        const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`.slice(0, 48);
        const response = await client
          .from('tables')
          .insert(toTableInsert(meta, state, user.id, nickname, slug))
          .select('id, slug, name')
          .single();

        if (response.error?.code === '23505') continue;
        if (response.error) throw response.error;
        insertedTable = response.data;
        break;
      }

      if (!insertedTable) {
        throw new Error('Nao foi possivel reservar um slug unico para a mesa.');
      }

      const { data: membership, error: membershipError } = await client
        .from('table_memberships')
        .insert({
          table_id: insertedTable.id,
          user_id: user.id,
          role: 'gm',
          character_id: null,
          nickname,
          active: true
        })
        .select('id')
        .single();

      if (membershipError) throw membershipError;

      await syncCharacterRows(insertedTable.id, user.id, state);

      if (state.log.length) {
        const { error: logError } = await client.from('table_logs').insert(
          state.log.map((entry) => ({
            id: entry.id,
            table_id: insertedTable.id,
            actor_id: user.id,
            category: entry.category,
            title: entry.title,
            body: entry.text,
            meta: entry.meta,
            created_at: entry.timestamp
          }))
        );
        if (logError) throw logError;
      }

      const { error: snapshotError } = await client.from('table_snapshots').insert({
        table_id: insertedTable.id,
        created_by: user.id,
        label: 'Snapshot inicial',
        state: serializeStateForStorage(state) as unknown as Json
      });

      if (snapshotError) throw snapshotError;

      const table = await fetchTableState(insertedTable.id);
      return {
        table,
        session: buildTableSession({
          tableId: insertedTable.id,
          membershipId: membership.id,
          tableSlug: insertedTable.slug,
          tableName: insertedTable.name,
          role: 'gm',
          nickname
        })
      };
    },
    async updateTableMeta({ session, meta }) {
      const client = assertClient();
      const { error } = await client
        .from('tables')
        .update({
          name: meta.tableName || DEFAULT_TABLE_META.tableName,
          series_name: meta.seriesName || DEFAULT_TABLE_META.seriesName,
          campaign_name: meta.campaignName || '',
          episode_number: meta.episodeNumber || '',
          episode_title: meta.episodeTitle || '',
          session_date: meta.sessionDate || null,
          location: meta.location || '',
          status: meta.status || DEFAULT_TABLE_META.status,
          expected_roster: meta.expectedRoster || '',
          recap: meta.recap || '',
          objective: meta.objective || '',
          meta: meta as unknown as Json,
          last_editor: session.nickname
        })
        .eq('id', session.tableId);

      if (error) throw error;
      return fetchTableState(session.tableId);
    },
    async joinByInvite({ inviteUrl, nickname }) {
      const url = new URL(inviteUrl);
      const inviteToken = url.searchParams.get('token');
      if (!inviteToken) throw new Error('Convite invalido.');

      const claimed = await claimInvite({
        inviteToken,
        nickname
      });

      if (!claimed) throw new Error('Convite invalido ou expirado.');

      const table = await fetchTableState(claimed.table_id);
      return {
        table,
        session: buildTableSession({
          tableId: claimed.table_id,
          membershipId: claimed.membership_id,
          tableSlug: claimed.table_slug,
          tableName: claimed.table_name,
          role: claimed.role as TableSession['role'],
          nickname,
          characterId: claimed.character_id
        })
      };
    },
    async joinByCode({ code, nickname, characterId }) {
      const normalizedCode = sanitizeJoinCode(code);
      if (!normalizedCode) throw new Error('Codigo invalido.');

      const resolved = await resolveJoinCode(normalizedCode);

      if (resolved?.requires_character && !characterId) {
        return {
          requiresCharacter: true,
          role: resolved.role as TableSession['role'],
          table: {
            id: resolved.table_id,
            slug: resolved.table_slug,
            name: resolved.table_name,
            meta: DEFAULT_TABLE_META
          },
          characters: Array.isArray(resolved.characters)
            ? (resolved.characters as Array<Pick<Character, 'id' | 'name' | 'grade' | 'clan'>>)
            : []
        };
      }

      const claimed = await claimJoinCode({
        code: normalizedCode,
        nickname,
        characterId
      });

      if (!claimed) throw new Error('Codigo invalido ou revogado.');

      const table = await fetchTableState(claimed.table_id);
      return {
        session: buildTableSession({
          tableId: claimed.table_id,
          membershipId: claimed.membership_id,
          tableSlug: claimed.table_slug,
          tableName: claimed.table_name,
          role: claimed.role as TableSession['role'],
          nickname,
          characterId: claimed.character_id
        }),
        table
      } satisfies JoinCodeBackendResult;
    },
    async createInvite({ session, role, characterId, label, origin }) {
      const client = assertClient();
      const token = crypto.randomUUID().replace(/-/g, '');
      const { error } = await client.from('table_invites').insert({
        table_id: session.tableId,
        token,
        role,
        character_id: characterId || null,
        label
      });

      if (error) throw error;
      return {
        id: uid('invite'),
        role,
        characterId,
        label,
        url: toInviteUrl(origin, session.tableSlug, token)
      };
    },
    async createJoinCode({ session, role, label, characterId }) {
      const client = assertClient();

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
        const { data, error } = await client
          .from('table_join_codes')
          .insert({
            table_id: session.tableId,
            code,
            role,
            character_id: characterId || null,
            label,
            active: true
          })
          .select('id, code, role, label, active, created_at, updated_at, character_id')
          .single();

        if (error?.code === '23505') continue;
        if (error) throw error;

        return {
          id: data.id,
          tableSlug: session.tableSlug,
          role: data.role as TableJoinCode['role'],
          code: data.code,
          label: data.label,
          active: data.active,
          characterId: data.character_id || '',
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }

      throw new Error('Nao foi possivel gerar um codigo unico.');
    },
    async revokeJoinCode(session, joinCodeId) {
      const client = assertClient();
      const { error } = await client.from('table_join_codes').delete().eq('id', joinCodeId).eq('table_id', session.tableId);
      if (error) throw error;
      return fetchTableState(session.tableId);
    },
    async createSnapshot({ session, label, actor, state }) {
      if (session.role !== 'gm') {
        throw new Error('Apenas GMs podem salvar snapshots da mesa.');
      }

      const client = assertClient();
      const { data: authUser } = await client.auth.getUser();
      const { error } = await client.from('table_snapshots').insert({
        table_id: session.tableId,
        created_by: authUser.user?.id || null,
        label: label.trim() || 'Snapshot manual',
        state: serializeStateForStorage(state) as unknown as Json
      });

      if (error) throw error;

      const { error: tableError } = await client
        .from('tables')
        .update({
          last_editor: actor
        })
        .eq('id', session.tableId);

      if (tableError) throw tableError;
      return fetchTableState(session.tableId);
    },
    async restoreSnapshot({ session, snapshotId }) {
      const client = assertClient();
      const { data, error } = await client
        .from('table_snapshots')
        .select('state')
        .eq('id', snapshotId)
        .eq('table_id', session.tableId)
        .single();

      if (error) throw error;

      const nextState = parseWorkspaceState(data.state);
      const { data: authState, error: authError } = await client.auth.getUser();
      if (authError) throw authError;

      const { error: updateError } = await client
        .from('tables')
        .update({
          state: serializeStateForStorage(nextState) as unknown as Json,
          current_round: nextState.order.round,
          current_turn_index: nextState.order.turn,
          last_editor: session.nickname
        })
        .eq('id', session.tableId);

      if (updateError) throw updateError;
      if (authState.user?.id) {
        await syncCharacterRows(session.tableId, authState.user.id, nextState);
      }
      return fetchTableState(session.tableId);
    },
    async syncTableState({ session, state, actor }) {
      const client = assertClient();
      if (session.role === 'gm') {
        const { data: authState, error: authError } = await client.auth.getUser();
        if (authError) throw authError;
        if (authState.user?.id) {
          await syncCharacterRows(session.tableId, authState.user.id, state);
        }
      }

      const { error } = await client
        .from('tables')
        .update({
          state: serializeStateForStorage(state) as unknown as Json,
          current_round: state.order.round,
          current_turn_index: state.order.turn,
          last_editor: actor
        })
        .eq('id', session.tableId);

      if (error) throw error;
      return fetchTableState(session.tableId);
    },
    async saveCharacter({ session, userId, character }) {
      await saveCharacterGraph(session.tableId, userId, character);
    },
    async appendTableLog({ session, userId, entry }) {
      const client = assertClient();
      const { error } = await client.from('table_logs').insert({
        id: entry.id,
        table_id: session.tableId,
        actor_id: userId,
        category: entry.category,
        title: entry.title,
        body: entry.text,
        meta: entry.meta,
        created_at: entry.timestamp
      });
      if (error) throw error;
    },
    async clearTableLogs({ session }) {
      const client = assertClient();
      const { error } = await client.from('table_logs').delete().eq('table_id', session.tableId);
      if (error) throw error;
    },
    async leaveTable({ session, userId }) {
      const client = assertClient();
      const { data: currentMembership, error: membershipError } = await client
        .from('table_memberships')
        .select('id, role')
        .eq('table_id', session.tableId)
        .eq('user_id', userId)
        .eq('active', true)
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!currentMembership) return;

      const { data: tableOwner, error: tableError } = await client
        .from('tables')
        .select('owner_id')
        .eq('id', session.tableId)
        .single();
      if (tableError) throw tableError;

      if (tableOwner.owner_id === userId) {
        throw new Error('O criador da mesa nao pode sair sem transferir a administracao.');
      }

      if (currentMembership.role === 'gm') {
        const { count, error: countError } = await client
          .from('table_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('table_id', session.tableId)
          .eq('active', true)
          .eq('role', 'gm');

        if (countError) throw countError;
        if ((count || 0) <= 1) {
          throw new Error('Promova outro GM antes de sair desta mesa.');
        }
      }

      const { error } = await client.rpc('leave_table', {
        p_table_id: session.tableId
      });
      if (error) throw error;
    },
    async disconnectSession() {
      return;
    },
    async uploadCharacterAvatar({ user, characterId, file }): Promise<UploadAvatarResult> {
      const client = assertClient();
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/${characterId}-${crypto.randomUUID()}.${extension}`;

      const { error } = await client.storage.from('avatars').upload(path, file, {
        upsert: true,
        contentType: file.type || 'image/png'
      });

      if (error) throw error;

      const url = await createSignedAvatarUrl(path);
      return {
        url,
        path
      };
    }
  };
}

export type WorkspaceRealtimeChannel = RealtimeChannel;
