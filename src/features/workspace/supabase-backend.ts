import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';
import type {
  AuthUser,
  Character,
  CharacterGalleryImage,
  GameSession,
  GameSystemKey,
  LogEntry,
  PresenceMember,
  SessionAttendance,
  SessionAttendanceStatus,
  TableInvite,
  TableJoinCode,
  TableListItem,
  TableMeta,
  TableSession,
  TableSnapshot,
  TableState,
  UserCharacterSummary,
  WorkspaceState
} from '@/types/domain';
import { DEFAULT_GAME_SYSTEM_KEY, DEFAULT_TABLE_META } from '@lib/domain/constants';
import { resolveGameSystemKey } from '@features/systems/registry';
import { createDefaultState, makeCharacter, normalizeLogEntry, normalizeState } from '@lib/domain/state';
import { deepClone, parseTags, sanitizeJoinCode, slugify, uid } from '@lib/domain/utils';
import { workspaceStateSchema } from '@schemas/domain';
import { supabase } from '@integrations/supabase/client';
import { characterOwnershipApiUrl } from '@integrations/supabase/env';
import type { Json } from '@integrations/supabase/database.types';
import type { JoinCodeBackendResult, UploadAvatarResult, WorkspaceBackend } from './backend';
import { toWorkspaceError } from './invite-rules';

const DRAFT_KIND = 'workspace-draft';

function assertClient() {
  if (!supabase) {
    throw new Error('Supabase nao configurado para este runtime.');
  }

  return supabase;
}

function now() {
  return new Date().toISOString();
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

function shouldFallbackToLegacyClaim(error: { code?: string; message?: string; details?: string } | null | undefined) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();

  return (
    isMissingFunctionError(error) ||
    (error.code === '42702' && message.includes('table_id') && details.includes('table column'))
  );
}

function isMissingColumnError(error: { code?: string; message?: string } | null | undefined, column?: string) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  const missing =
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    message.includes('could not find') ||
    message.includes('does not exist');

  return missing && (!column || message.includes(column.toLowerCase()));
}

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined, relation?: string) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  const missing =
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    message.includes('could not find the table') ||
    message.includes('does not exist');

  return missing && (!relation || message.includes(relation.toLowerCase()));
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

function omitLocalId<Row extends { id?: string }>(row: Row): Omit<Row, 'id'> & { id?: string } {
  const payload = { ...row };
  if (!isUuid(payload.id)) {
    delete payload.id;
  }

  return payload;
}

let supportsTableSystemKey = true;
let supportsTableSessions = true;
let supportsSessionAttendances = true;
let supportsCharacterLore = true;
let supportsCharacterGallery = true;

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

function toTableMeta(row: TableRow): TableMeta {
  return {
    tableName: row.name,
    description: row.description || '',
    slotCount: row.slot_count || 0,
    seriesName: row.series_name,
    campaignName: row.campaign_name
  };
}

function toTableInsert(
  meta: TableMeta,
  state: WorkspaceState,
  ownerId: string,
  lastEditor: string,
  slug: string,
  systemKey: GameSystemKey = DEFAULT_GAME_SYSTEM_KEY,
  kind?: string
) {
  const normalizedSystemKey = resolveGameSystemKey(systemKey);

  return {
    slug,
    name: meta.tableName || DEFAULT_TABLE_META.tableName,
    description: meta.description || '',
    slot_count: meta.slotCount || 0,
    series_name: meta.seriesName || DEFAULT_TABLE_META.seriesName,
    campaign_name: meta.campaignName || '',
    episode_number: '',
    episode_title: '',
    session_date: null,
    location: '',
    status: 'Sem sessão',
    expected_roster: '',
    recap: '',
    objective: '',
    meta: {
      ...meta,
      systemKey: normalizedSystemKey,
      ...(kind ? { kind } : {})
    },
    system_key: normalizedSystemKey,
    state: serializeStateForStorage(state) as unknown as Json,
    owner_id: ownerId,
    current_round: state.order.round,
    current_turn_index: state.order.turn,
    last_editor: lastEditor
  };
}

type CharacterRow = {
  id: string;
  table_id: string | null;
  owner_id: string | null;
  name: string;
  age: number;
  clan: string;
  grade: string;
  appearance: string;
  lore?: string;
  identity_scar: string;
  identity_anchor: string;
  identity_trigger: string;
  avatar_url: string;
  avatar_path: string;
  money: number;
  archived: boolean;
  sort_order: number;
};

type CharacterGalleryImageRow = {
  id: string;
  character_id: string;
  image_url: string;
  image_path: string;
  caption: string;
  sort_order: number;
};

function buildCharacterGalleryRows(character: Character): CharacterGalleryImageRow[] {
  return character.gallery.map((image, sortOrder) => ({
    id: image.id,
    character_id: character.id,
    image_url: image.url,
    image_path: image.path,
    caption: image.caption,
    sort_order: sortOrder
  }));
}

function buildCharacterGalleryRowsForWrite(character: Character) {
  return buildCharacterGalleryRows(character).map(omitLocalId);
}

async function replaceCharacterGalleryRows(character: Character) {
  if (!supportsCharacterGallery) return;
  const client = assertClient();
  const { error: deleteError } = await client.from('character_gallery_images').delete().eq('character_id', character.id);
  if (isMissingRelationError(deleteError, 'character_gallery_images')) {
    supportsCharacterGallery = false;
    return;
  }
  if (deleteError) throw deleteError;

  const rows = buildCharacterGalleryRowsForWrite(character);
  if (!rows.length) return;
  const { error } = await client.from('character_gallery_images').insert(rows);
  if (isMissingRelationError(error, 'character_gallery_images')) {
    supportsCharacterGallery = false;
    return;
  }
  if (error) throw error;
}

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

type TableRow = {
  id: string;
  slug: string;
  name: string;
  system_key?: string | null;
  description: string;
  slot_count: number;
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
  meta: Json;
  state: Json;
  owner_id: string | null;
  current_round: number;
  current_turn_index: number;
  current_session_id: string | null;
  created_at: string;
  updated_at: string;
  last_editor: string | null;
};

type TableSessionRow = {
  id: string;
  table_id: string;
  episode_number: string;
  episode_title: string;
  status: string;
  session_date: string | null;
  location: string;
  objective: string;
  recap: string;
  notes: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type TableSessionAttendanceRow = {
  id: string;
  session_id: string;
  membership_id: string;
  status: SessionAttendanceStatus;
  marked_at: string;
  created_at: string;
  updated_at: string;
};

type TableMembershipRow = {
  id: string;
  table_id: string;
  user_id: string;
  role: string;
  character_id: string | null;
  nickname: string;
  active: boolean;
  joined_at: string;
  updated_at: string;
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
    lore: character.lore || '',
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

function prepareCharacterRowForWrite(row: ReturnType<typeof buildCharacterRow>) {
  const payload = { ...row };
  if (!supportsCharacterLore) {
    delete (payload as Partial<typeof payload>).lore;
  }

  return payload;
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

function buildWeaponRowsForWrite(character: Character) {
  return buildWeaponRows(character).map(omitLocalId);
}

function buildTechniqueRowsForWrite(character: Character) {
  return buildTechniqueRows(character).map(omitLocalId);
}

function buildPassiveRowsForWrite(character: Character) {
  return buildPassiveRows(character).map(omitLocalId);
}

function buildVowRowsForWrite(character: Character) {
  return buildVowRows(character).map(omitLocalId);
}

function buildInventoryItemRowsForWrite(character: Character) {
  return buildInventoryItemRows(character).map(omitLocalId);
}

function buildConditionRowsForWrite(character: Character) {
  return buildConditionRows(character).map(omitLocalId);
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
  const weaponRows = buildWeaponRowsForWrite(character);
  const techniqueRows = buildTechniqueRowsForWrite(character);
  const passiveRows = buildPassiveRowsForWrite(character);
  const vowRows = buildVowRowsForWrite(character);
  const inventoryRows = buildInventoryItemRowsForWrite(character);
  const conditionRows = buildConditionRowsForWrite(character);

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

  await replaceCharacterGalleryRows(character);
}

async function syncCharacterRows(tableId: string, ownerId: string, state: WorkspaceState) {
  const client = assertClient();
  const ownershipMap = await fetchExistingCharacterOwnership(tableId);
  const buildRows = () =>
    state.characters.map((character, sortOrder) =>
      prepareCharacterRowForWrite(buildCharacterRow(tableId, character, sortOrder, ownerId, ownershipMap.get(character.id)))
    );
  let rows = buildRows();

  if (rows.length) {
    let { error } = await client.from('characters').upsert(rows, {
      onConflict: 'id'
    });
    if (isMissingColumnError(error, 'lore')) {
      supportsCharacterLore = false;
      rows = buildRows();
      const retry = await client.from('characters').upsert(rows, {
        onConflict: 'id'
      });
      error = retry.error;
    }
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
    .select('sort_order, owner_id')
    .eq('table_id', tableId)
    .eq('id', character.id)
    .maybeSingle();
  if (existingError) throw existingError;

  const buildRow = () =>
    prepareCharacterRowForWrite(
      buildCharacterRow(tableId, character, existingRows?.sort_order ?? 0, userId, existingRows?.owner_id ?? null)
    );
  let { error } = await client.from('characters').upsert(buildRow(), {
    onConflict: 'id'
  });
  if (isMissingColumnError(error, 'lore')) {
    supportsCharacterLore = false;
    const retry = await client.from('characters').upsert(buildRow(), {
      onConflict: 'id'
    });
    error = retry.error;
  }
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
  return data as TableRow;
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

function mapMemberships(records: TableMembershipRow[], state: WorkspaceState, ownerId: string | null): PresenceMember[] {
  return records
    .filter((membership) => membership.active)
    .map((membership) => {
      const character = state.characters.find((entry) => entry.id === membership.character_id);
      return {
        id: membership.id,
        userId: membership.user_id,
        nickname: membership.nickname,
        role: membership.role as PresenceMember['role'],
        characterId: membership.character_id || '',
        characterName: character?.name || '',
        isOwner: membership.user_id === ownerId
      };
    });
}

async function fetchMembershipRows(tableId: string): Promise<TableMembershipRow[]> {
  const client = assertClient();
  const { data, error } = await client
    .from('table_memberships')
    .select('id, table_id, user_id, role, character_id, nickname, active, joined_at, updated_at')
    .eq('table_id', tableId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data || []) as TableMembershipRow[];
}

function toGameSession(row: TableSessionRow): GameSession {
  return {
    id: row.id,
    tableId: row.table_id,
    episodeNumber: row.episode_number || '',
    episodeTitle: row.episode_title || '',
    status: row.status || 'Planejamento',
    sessionDate: row.session_date || '',
    location: row.location || '',
    objective: row.objective || '',
    recap: row.recap || '',
    notes: row.notes || '',
    isActive: row.is_active,
    createdBy: row.created_by || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function fetchCurrentSession(tableId: string, fallbackRow: TableRow): Promise<GameSession | null> {
  if (!supportsTableSessions) return null;
  const client = assertClient();
  if (fallbackRow.current_session_id) {
    const { data, error } = await client
      .from('table_sessions')
      .select('id, table_id, episode_number, episode_title, status, session_date, location, objective, recap, notes, is_active, created_by, created_at, updated_at')
      .eq('id', fallbackRow.current_session_id)
      .eq('table_id', tableId)
      .maybeSingle();

    if (isMissingRelationError(error, 'table_sessions')) {
      supportsTableSessions = false;
      return null;
    }
    if (isPermissionError(error)) return null;
    if (error) throw error;
    if (data) return toGameSession(data as TableSessionRow);
  }

  const { data, error } = await client
    .from('table_sessions')
    .select('id, table_id, episode_number, episode_title, status, session_date, location, objective, recap, notes, is_active, created_by, created_at, updated_at')
    .eq('table_id', tableId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isMissingRelationError(error, 'table_sessions')) {
    supportsTableSessions = false;
    return null;
  }
  if (isPermissionError(error)) return null;
  if (error) throw error;
  if (data) return toGameSession(data as TableSessionRow);

  return null;
}

async function fetchSessionHistoryPreview(tableId: string): Promise<GameSession[]> {
  if (!supportsTableSessions) return [];
  const client = assertClient();
  const { data, error } = await client
    .from('table_sessions')
    .select('id, table_id, episode_number, episode_title, status, session_date, location, objective, recap, notes, is_active, created_by, created_at, updated_at')
    .eq('table_id', tableId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (isMissingRelationError(error, 'table_sessions')) {
    supportsTableSessions = false;
    return [];
  }
  if (isPermissionError(error)) return [];
  if (error) throw error;
  return (data || []).map((row) => toGameSession(row as TableSessionRow));
}

async function fetchSessionAttendances(sessionId: string, memberships: TableMembershipRow[]): Promise<SessionAttendance[]> {
  const fallbackAttendances = () =>
    memberships
      .filter((membership) => membership.active)
      .map((membership) => ({
        id: uid('attendance'),
        sessionId,
        membershipId: membership.id,
        status: 'pending' as const,
        markedAt: now()
      }));
  if (!supportsSessionAttendances) return fallbackAttendances();
  const client = assertClient();
  const { data, error } = await client
    .from('table_session_attendances')
    .select('id, session_id, membership_id, status, marked_at, created_at, updated_at')
    .eq('session_id', sessionId)
    .order('marked_at', { ascending: false });

  if (isMissingRelationError(error, 'table_session_attendances')) {
    supportsSessionAttendances = false;
    return fallbackAttendances();
  }
  if (isPermissionError(error)) return fallbackAttendances();
  if (error) throw error;
  const rows = (data || []) as TableSessionAttendanceRow[];
  const map = new Map(rows.map((row) => [row.membership_id, row]));
  return memberships
    .filter((membership) => membership.active)
    .map((membership) => {
      const existing = map.get(membership.id);
      if (existing) {
        return {
          id: existing.id,
          sessionId: existing.session_id,
          membershipId: existing.membership_id,
          status: existing.status,
          markedAt: existing.marked_at
        };
      }

      return {
        id: uid('attendance'),
        sessionId,
        membershipId: membership.id,
        status: 'pending',
        markedAt: now()
      };
    });
}

async function fetchRelationalCharacters(tableId: string, fallbackState: WorkspaceState): Promise<Character[]> {
  const client = assertClient();
  const characterColumns = () =>
    [
      'id',
      'table_id',
      'owner_id',
      'name',
      'age',
      'clan',
      'grade',
      'appearance',
      supportsCharacterLore ? 'lore' : '',
      'identity_scar',
      'identity_anchor',
      'identity_trigger',
      'avatar_url',
      'avatar_path',
      'money',
      'archived',
      'sort_order'
    ]
      .filter(Boolean)
      .join(', ');
  const fetchCharacterRows = () =>
    client
      .from('characters')
      .select(characterColumns())
      .eq('table_id', tableId)
      .eq('archived', false)
      .order('sort_order', { ascending: true });
  let characterRowsResult = await fetchCharacterRows();

  if (isMissingColumnError(characterRowsResult.error, 'lore')) {
    supportsCharacterLore = false;
    characterRowsResult = await fetchCharacterRows();
  }

  if (characterRowsResult.error) throw characterRowsResult.error;

  const rows = ((characterRowsResult.data || []) as unknown as CharacterRow[]).filter((row) => !row.archived);
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
    conditionRowsResult,
    galleryRowsResult
  ] = await Promise.all([
    client.from('character_resources').select('character_id, resource_key, current_value, max_value, sort_order').in('character_id', characterIds),
    client.from('character_attributes').select('character_id, attribute_key, value, rank, sort_order').in('character_id', characterIds),
    client.from('character_weapons').select('id, character_id, name, grade, damage, tags, description, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    client.from('character_techniques').select('id, character_id, name, cost, damage, technique_type, tags, description, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    client.from('character_passives').select('id, character_id, name, tags, description, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    client.from('character_vows').select('id, character_id, name, benefit, restriction, penalty, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    client.from('character_inventory_items').select('id, character_id, name, quantity, effect, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    client.from('character_conditions').select('id, character_id, name, color, note, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true }),
    supportsCharacterGallery
      ? client.from('character_gallery_images').select('id, character_id, image_url, image_path, caption, sort_order').in('character_id', characterIds).order('sort_order', { ascending: true })
      : Promise.resolve({ data: [], error: null })
  ]);

  const rowResults = [
    resourceRowsResult,
    attributeRowsResult,
    weaponRowsResult,
    techniqueRowsResult,
    passiveRowsResult,
    vowRowsResult,
    inventoryRowsResult,
    conditionRowsResult,
  ];

  for (const result of rowResults) {
    if (result.error) throw result.error;
  }

  if (isMissingRelationError(galleryRowsResult.error, 'character_gallery_images')) {
    supportsCharacterGallery = false;
  } else if (galleryRowsResult.error) {
    throw galleryRowsResult.error;
  }

  const resourceRows = (resourceRowsResult.data || []) as CharacterResourceRow[];
  const attributeRows = (attributeRowsResult.data || []) as CharacterAttributeRow[];
  const weaponRows = (weaponRowsResult.data || []) as CharacterWeaponRow[];
  const techniqueRows = (techniqueRowsResult.data || []) as CharacterTechniqueRow[];
  const passiveRows = (passiveRowsResult.data || []) as CharacterPassiveRow[];
  const vowRows = (vowRowsResult.data || []) as CharacterVowRow[];
  const inventoryRows = (inventoryRowsResult.data || []) as CharacterInventoryItemRow[];
  const conditionRows = (conditionRowsResult.data || []) as CharacterConditionRow[];
  const galleryRows = (galleryRowsResult.error ? [] : galleryRowsResult.data || []) as CharacterGalleryImageRow[];

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
        lore: row.lore || fallback?.lore || '',
        avatarMode: row.avatar_path ? 'upload' : row.avatar_url ? 'url' : 'none',
        avatar,
        avatarPath: row.avatar_path || '',
        gallery: await Promise.all(
          galleryRows
            .filter((entry) => entry.character_id === row.id)
            .sort((left, right) => left.sort_order - right.sort_order)
            .map(async (entry, index) => ({
              id: entry.id,
              url: entry.image_path ? await createSignedAvatarUrl(entry.image_path) : entry.image_url,
              path: entry.image_path,
              caption: entry.caption || '',
              sortOrder: Number.isFinite(entry.sort_order) ? entry.sort_order : index
            }))
        ),
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
            tags: parseTags(entry.tags),
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
            tags: parseTags(entry.tags),
            description: entry.description
          })),
        passives: passiveRows
          .filter((entry) => entry.character_id === row.id)
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            tags: parseTags(entry.tags),
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
  const systemKey = resolveGameSystemKey(row.system_key);
  const fallbackState = parseWorkspaceState(row.state);
  const [characters, logs, snapshots, joinCodes, invites, membershipRows, currentSession, sessionHistoryPreview] = await Promise.all([
    fetchRelationalCharacters(row.id, fallbackState),
    fetchTableLogs(row.id, fallbackState.log),
    fetchSnapshots(row.id),
    fetchJoinCodes(row.id, row.slug),
    fetchInvites(row.id, row.slug),
    fetchMembershipRows(row.id),
    fetchCurrentSession(row.id, row),
    fetchSessionHistoryPreview(row.id)
  ]);
  const state = normalizeState({
    ...fallbackState,
    characters,
    log: logs
  });
  const memberships = mapMemberships(membershipRows, state, row.owner_id);
  const sessionAttendances = currentSession ? await fetchSessionAttendances(currentSession.id, membershipRows) : [];
  const preview = sessionHistoryPreview.length ? sessionHistoryPreview : currentSession ? [currentSession] : [];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    systemKey,
    ownerId: row.owner_id,
    meta: toTableMeta(row),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    lastEditor: row.last_editor || '',
    state,
    currentSession,
    sessionAttendances,
    sessionHistoryPreview: preview,
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
  systemKey?: string | null;
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
    systemKey: resolveGameSystemKey(input.systemKey),
    role: input.role,
    nickname: input.nickname,
    characterId: input.characterId || '',
    lastJoinedAt: new Date().toISOString()
  };
}

async function listUserTableSummaries(user: AuthUser): Promise<TableListItem[]> {
  const client = assertClient();
  const tableSummarySelect = () => `
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
        ${supportsTableSystemKey ? 'system_key,' : ''}
        series_name,
        campaign_name
      )
    `;
  const fetchSummaries = () =>
    client.from('table_memberships').select(tableSummarySelect()).eq('user_id', user.id).eq('active', true);
  let result = await fetchSummaries();

  if (isMissingColumnError(result.error, 'system_key')) {
    supportsTableSystemKey = false;
    result = await fetchSummaries();
  }

  if (result.error) throw result.error;

  const records = (result.data || []) as unknown as Array<{
    id: string;
    role: string;
    nickname: string;
    character_id: string | null;
    joined_at: string;
    tables:
      | {
          id: string;
          slug: string;
          name: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
          status: string;
          system_key?: string | null;
          series_name: string;
          campaign_name: string;
        }
      | Array<{
          id: string;
          slug: string;
          name: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
          status: string;
          system_key?: string | null;
          series_name: string;
          campaign_name: string;
        }>;
  }>;

  return records
    .map((record): TableListItem | null => {
      const table = Array.isArray(record.tables) ? record.tables[0] : record.tables;
      if (!table) return null;

      return {
        id: table.id,
        slug: table.slug,
        name: table.name,
        systemKey: resolveGameSystemKey((table as { system_key?: string | null }).system_key),
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

async function listUserOwnedCharacters(user: AuthUser): Promise<UserCharacterSummary[]> {
  const client = assertClient();
  const { data, error } = await client
    .from('characters')
    .select(
      `
      id,
      name,
      clan,
      grade,
      updated_at,
      table_id,
      avatar_url,
      avatar_path,
      tables (
        name
      )
    `
    )
    .eq('owner_id', user.id)
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return Promise.all(
    (data || []).map(async (row) => {
      const table = Array.isArray(row.tables) ? row.tables[0] : row.tables;
      const avatarUrl = row.avatar_path ? await createSignedAvatarUrl(row.avatar_path) : row.avatar_url || '';

      return {
        id: row.id,
        name: row.name,
        clan: row.clan || '',
        grade: row.grade || '',
        avatarUrl,
        tableId: row.table_id,
        tableName: table?.name || '',
        updatedAt: row.updated_at
      } satisfies UserCharacterSummary;
    })
  );
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
  const buildInsertPayload = () => {
    const payload = toTableInsert(
        {
          ...DEFAULT_TABLE_META,
          tableName: `Workspace de ${user.username || user.displayName || 'feiticeiro'}`
        },
        initialState,
        user.id,
        user.displayName,
        slug,
        DEFAULT_GAME_SYSTEM_KEY,
        DRAFT_KIND
    );
    if (!supportsTableSystemKey) {
      delete (payload as Partial<ReturnType<typeof toTableInsert>>).system_key;
    }

    return payload;
  };

  let { data: inserted, error: insertError } = await client.from('tables').insert(buildInsertPayload()).select('id').single();

  if (isMissingColumnError(insertError, 'system_key')) {
    supportsTableSystemKey = false;
    const retry = await client.from('tables').insert(buildInsertPayload()).select('id').single();
    inserted = retry.data;
    insertError = retry.error;
  }

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

  if (shouldFallbackToLegacyClaim(error)) {
    const fallback = await client.rpc('claim_table_invite', {
      invite_token: input.inviteToken
    });
    if (fallback.error) throw toWorkspaceError(fallback.error, 'Nao foi possivel aceitar este convite.');
    return fallback.data?.[0];
  }

  if (error) throw toWorkspaceError(error, 'Nao foi possivel aceitar este convite.');
  return data?.[0];
}

async function resolveJoinCode(code: string) {
  const client = assertClient();
  const { data, error } = await client.rpc('resolve_join_code', {
    join_code: code
  });

  if (isMissingFunctionError(error)) throw toWorkspaceError(error, 'Nao foi possivel validar este codigo.');
  if (error) throw toWorkspaceError(error, 'Nao foi possivel validar este codigo.');
  return data?.[0] || null;
}

async function claimJoinCode(input: { code: string; nickname: string; characterId?: string }) {
  const client = assertClient();
  const { data, error } = await client.rpc('claim_join_code_v2', {
    join_code: input.code,
    session_nickname: input.nickname,
    selected_character_id: input.characterId || undefined
  });

  if (shouldFallbackToLegacyClaim(error)) {
    const fallback = await client.rpc('claim_join_code', {
      join_code: input.code
    });
    if (fallback.error) throw toWorkspaceError(fallback.error, 'Nao foi possivel entrar com este codigo.');
    return fallback.data?.[0];
  }

  if (error) throw toWorkspaceError(error, 'Nao foi possivel entrar com este codigo.');
  return data?.[0];
}

async function reconcileCharacterOwnership(input: { tableId: string; characterId?: string | null }) {
  if (!input.characterId) return;

  const client = assertClient();
  const { data } = await client.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return;

  const response = await fetch(characterOwnershipApiUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      tableId: input.tableId,
      characterId: input.characterId
    })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || 'Nao foi possivel vincular a ficha ao jogador.');
  }
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
    async listUserCharacters(user) {
      return listUserOwnedCharacters(user);
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

      const tableState = await fetchTableState(table.id);

      return {
        table: tableState,
        session: buildTableSession({
          tableId: table.id,
          tableSlug: table.slug,
          tableName: table.name,
          systemKey: tableState.systemKey,
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

        try {
          const table = await fetchTableState(session.tableId);
          if (disposed) return;
          callback(table);
        } catch (error) {
          if (!disposed) {
            console.error('workspace realtime reload failed', error);
          }
        }
      };

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `id=eq.${session.tableId}` }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions', filter: `table_id=eq.${session.tableId}` }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'table_session_attendances' }, reload)
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'character_gallery_images' }, reload)
        .subscribe();

      return () => {
        disposed = true;
        void client.removeChannel(channel);
      };
    },
    async createTable({ user, nickname, systemKey = DEFAULT_GAME_SYSTEM_KEY, meta, state }) {
      const client = assertClient();
      let insertedTable: { id: string; slug: string; name: string; system_key?: string | null } | null = null;

      try {
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const baseSlug = slugify(meta.tableName || DEFAULT_TABLE_META.tableName);
          const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`.slice(0, 48);
          const buildInsertPayload = () => {
            const payload = toTableInsert(meta, state, user.id, nickname, slug, systemKey);
            if (!supportsTableSystemKey) {
              delete (payload as Partial<ReturnType<typeof toTableInsert>>).system_key;
            }

            return payload;
          };
          const selectColumns = () => (supportsTableSystemKey ? 'id, slug, name, system_key' : 'id, slug, name');
          let response = await client
            .from('tables')
            .insert(buildInsertPayload())
            .select(selectColumns())
            .single();
          if (isMissingColumnError(response.error, 'system_key')) {
            supportsTableSystemKey = false;
            response = await client.from('tables').insert(buildInsertPayload()).select(selectColumns()).single();
          }

          if (response.error?.code === '23505') continue;
          if (response.error) throw response.error;
          insertedTable = response.data as unknown as { id: string; slug: string; name: string; system_key?: string | null };
          break;
        }

        if (!insertedTable) {
          throw new Error('Nao foi possivel reservar um slug unico para a mesa.');
        }
        const createdTable = insertedTable;

        const { data: membership, error: membershipError } = await client
          .from('table_memberships')
          .insert({
            table_id: createdTable.id,
            user_id: user.id,
            role: 'gm',
            character_id: null,
            nickname,
            active: true
          })
          .select('id')
          .single();

        if (membershipError) throw membershipError;

        let initialSessionRow: TableSessionRow | null = null;
        if (supportsTableSessions) {
          const { data: initialSession, error: initialSessionError } = await client
            .from('table_sessions')
            .insert({
              table_id: createdTable.id,
              episode_number: '',
              episode_title: '',
              status: 'Planejamento',
              session_date: null,
              location: '',
              objective: '',
              recap: '',
              notes: '',
              is_active: false,
              created_by: user.id
            })
            .select('id, table_id, episode_number, episode_title, status, session_date, location, objective, recap, notes, is_active, created_by, created_at, updated_at')
            .single();

          if (isMissingRelationError(initialSessionError, 'table_sessions')) {
            supportsTableSessions = false;
          } else if (!isPermissionError(initialSessionError)) {
            if (initialSessionError) throw initialSessionError;
            initialSessionRow = initialSession as TableSessionRow;
          }
        }

        if (initialSessionRow) {
          const { error: tableSessionError } = await client
            .from('tables')
            .update({
              current_session_id: initialSessionRow.id,
              episode_number: initialSessionRow.episode_number,
              episode_title: initialSessionRow.episode_title,
              session_date: initialSessionRow.session_date,
              location: initialSessionRow.location,
              status: initialSessionRow.status,
              recap: initialSessionRow.recap,
              objective: initialSessionRow.objective,
              last_editor: nickname
            })
            .eq('id', createdTable.id);

          if (tableSessionError) throw tableSessionError;

          if (supportsSessionAttendances) {
            const { error: attendanceError } = await client.from('table_session_attendances').insert({
              session_id: initialSessionRow.id,
              membership_id: membership.id,
              status: 'pending'
            });

            if (isMissingRelationError(attendanceError, 'table_session_attendances')) {
              supportsSessionAttendances = false;
            } else if (!isPermissionError(attendanceError)) {
              if (attendanceError) throw attendanceError;
            }
          }
        }

        await syncCharacterRows(createdTable.id, user.id, state);

        if (state.log.length) {
          const { error: logError } = await client.from('table_logs').insert(
            state.log.map((entry) => omitLocalId({
              id: entry.id,
              table_id: createdTable.id,
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
          table_id: createdTable.id,
          created_by: user.id,
          label: 'Snapshot inicial',
          state: serializeStateForStorage(state) as unknown as Json
        });

        if (snapshotError) throw snapshotError;

        const table = await fetchTableState(createdTable.id);
        return {
          table,
          session: buildTableSession({
            tableId: createdTable.id,
            membershipId: membership.id,
            tableSlug: createdTable.slug,
            tableName: createdTable.name,
            systemKey: table.systemKey,
            role: 'gm',
            nickname
          })
        };
      } catch (error) {
        if (insertedTable?.id) {
          const { error: cleanupError } = await client.from('tables').delete().eq('id', insertedTable.id);
          if (cleanupError) {
            console.error('createTable cleanup failed', cleanupError);
          }
        }

        throw error;
      }
    },
    async updateTableMeta({ session, meta }) {
      const client = assertClient();

      const { error } = await client
        .from('tables')
        .update({
          name: meta.tableName || DEFAULT_TABLE_META.tableName,
          description: meta.description || '',
          slot_count: meta.slotCount || 0,
          series_name: meta.seriesName || DEFAULT_TABLE_META.seriesName,
          campaign_name: meta.campaignName || '',
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

      if (claimed.role === 'player' && claimed.character_id) {
        await reconcileCharacterOwnership({
          tableId: claimed.table_id,
          characterId: claimed.character_id
        });
      }

      const table = await fetchTableState(claimed.table_id);
      return {
        table,
        session: buildTableSession({
          tableId: claimed.table_id,
          membershipId: claimed.membership_id,
          tableSlug: claimed.table_slug,
          tableName: claimed.table_name,
          systemKey: table.systemKey,
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
            systemKey: resolveGameSystemKey(resolved.system_key),
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

      if (claimed.role === 'player' && claimed.character_id) {
        await reconcileCharacterOwnership({
          tableId: claimed.table_id,
          characterId: claimed.character_id
        });
      }

      const table = await fetchTableState(claimed.table_id);
      return {
        session: buildTableSession({
          tableId: claimed.table_id,
          membershipId: claimed.membership_id,
          tableSlug: claimed.table_slug,
          tableName: claimed.table_name,
          systemKey: table.systemKey,
          role: claimed.role as TableSession['role'],
          nickname,
          characterId: claimed.character_id
        }),
        table
      } satisfies JoinCodeBackendResult;
    },
    async createInvite({ session, role, characterId, label, origin }) {
      if (session.role !== 'gm') {
        throw new Error('Apenas GMs podem criar convites.');
      }
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
      if (session.role !== 'gm') {
        throw new Error('Apenas GMs podem criar codigos.');
      }
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
      if (session.role !== 'gm') {
        throw new Error('Apenas GMs podem revogar codigos.');
      }
      const client = assertClient();
      const { error } = await client
        .from('table_join_codes')
        .update({
          active: false
        })
        .eq('id', joinCodeId)
        .eq('table_id', session.tableId);
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
      if (session.role !== 'gm') {
        throw new Error('Apenas GMs podem sincronizar o estado global da mesa.');
      }
      const client = assertClient();
      const { data: authState, error: authError } = await client.auth.getUser();
      if (authError) throw authError;
      if (authState.user?.id) {
        await syncCharacterRows(session.tableId, authState.user.id, state);
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
    async createGameSession({ session, gameSession }) {
      if (session.role !== 'gm') throw new Error('Apenas GMs podem criar sessoes.');
      const client = assertClient();
      const { data: authState, error: authError } = await client.auth.getUser();
      if (authError) throw authError;
      const payload = {
        table_id: session.tableId,
        episode_number: gameSession.episodeNumber || '',
        episode_title: gameSession.episodeTitle || '',
        status: gameSession.status || 'Planejamento',
        session_date: gameSession.sessionDate || null,
        location: gameSession.location || '',
        objective: gameSession.objective || '',
        recap: gameSession.recap || '',
        notes: gameSession.notes || '',
        is_active: gameSession.isActive ?? false,
        created_by: authState.user?.id || null
      };
      if (payload.is_active) {
        const { error: deactivateError } = await client
          .from('table_sessions')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('table_id', session.tableId)
          .eq('is_active', true);
        if (deactivateError) throw deactivateError;
      }
      const { data, error } = await client
        .from('table_sessions')
        .insert(payload)
        .select('id, table_id, episode_number, episode_title, status, session_date, location, objective, recap, notes, is_active, created_by, created_at, updated_at')
        .single();
      if (error) throw error;
      const sessionRow = data as TableSessionRow;
      const tableRow = await fetchTableRowById(session.tableId);
      const { error: tableError } = await client
        .from('tables')
        .update({
          current_session_id: sessionRow.id,
          description: tableRow.description,
          slot_count: tableRow.slot_count,
          episode_number: sessionRow.episode_number,
          episode_title: sessionRow.episode_title,
          session_date: sessionRow.session_date,
          location: sessionRow.location,
          status: sessionRow.status,
          recap: sessionRow.recap,
          objective: sessionRow.objective,
          last_editor: session.nickname
        })
        .eq('id', session.tableId);
      if (tableError) throw tableError;
      const { error: attendanceError } = await client.from('table_session_attendances').insert({
        session_id: sessionRow.id,
        membership_id: session.membershipId,
        status: 'pending'
      });
      if (attendanceError) throw attendanceError;
      return fetchTableState(session.tableId);
    },
    async updateGameSession({ session, sessionId, patch }) {
      if (session.role !== 'gm') throw new Error('Apenas GMs podem editar sessoes.');
      const client = assertClient();
      const { error } = await client
        .from('table_sessions')
        .update({
          episode_number: patch.episodeNumber ?? '',
          episode_title: patch.episodeTitle ?? '',
          status: patch.status ?? 'Planejamento',
          session_date: patch.sessionDate ?? null,
          location: patch.location ?? '',
          objective: patch.objective ?? '',
          recap: patch.recap ?? '',
          notes: patch.notes ?? '',
          is_active: patch.isActive ?? false,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('table_id', session.tableId);
      if (!error && sessionId) {
        const sessionRow = await fetchTableRowById(session.tableId);
        const { error: mirrorError } = await client
          .from('tables')
          .update({
            current_session_id: sessionId,
            episode_number: patch.episodeNumber ?? sessionRow.episode_number,
            episode_title: patch.episodeTitle ?? sessionRow.episode_title,
            session_date: patch.sessionDate ?? sessionRow.session_date,
            location: patch.location ?? sessionRow.location,
            status: patch.status ?? sessionRow.status,
            recap: patch.recap ?? sessionRow.recap,
            objective: patch.objective ?? sessionRow.objective,
            last_editor: session.nickname
          })
          .eq('id', session.tableId);
        if (mirrorError) throw mirrorError;
      }
      if (error) throw error;
      return fetchTableState(session.tableId);
    },
    async startGameSession({ session, sessionId }) {
      if (session.role !== 'gm') throw new Error('Apenas GMs podem iniciar sessoes.');
      const client = assertClient();
      const { error: deactivateError } = await client
        .from('table_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('table_id', session.tableId)
        .eq('is_active', true)
        .neq('id', sessionId);
      if (deactivateError) throw deactivateError;
      const { data, error } = await client
        .from('table_sessions')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('table_id', session.tableId)
        .select('id, table_id, episode_number, episode_title, status, session_date, location, objective, recap, notes, is_active, created_by, created_at, updated_at')
        .single();
      if (error) throw error;
      const sessionRow = data as TableSessionRow;
      const { error: tableError } = await client.from('tables').update({
        current_session_id: sessionId,
        episode_number: sessionRow.episode_number,
        episode_title: sessionRow.episode_title,
        session_date: sessionRow.session_date,
        location: sessionRow.location,
        status: 'Em sessão',
        recap: sessionRow.recap,
        objective: sessionRow.objective,
        last_editor: session.nickname
      }).eq('id', session.tableId);
      if (tableError) throw tableError;
      return fetchTableState(session.tableId);
    },
    async endGameSession({ session, sessionId }) {
      if (session.role !== 'gm') throw new Error('Apenas GMs podem encerrar sessoes.');
      const client = assertClient();
      const targetSessionId = sessionId || (await fetchTableState(session.tableId)).currentSession?.id;
      if (!targetSessionId) throw new Error('Sessao nao encontrada.');
      const { data, error } = await client
        .from('table_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', targetSessionId)
        .eq('table_id', session.tableId)
        .select('id, table_id, episode_number, episode_title, status, session_date, location, objective, recap, notes, is_active, created_by, created_at, updated_at')
        .single();
      if (error) throw error;
      const sessionRow = data as TableSessionRow;
      const { error: tableError } = await client
        .from('tables')
        .update({
          current_session_id: targetSessionId,
          episode_number: sessionRow.episode_number,
          episode_title: sessionRow.episode_title,
          session_date: sessionRow.session_date,
          location: sessionRow.location,
          status: sessionRow.status,
          recap: sessionRow.recap,
          objective: sessionRow.objective,
          last_editor: session.nickname
        })
        .eq('id', session.tableId);
      if (tableError) throw tableError;
      return fetchTableState(session.tableId);
    },
    async markSessionAttendance({ session, sessionId, membershipId, status }) {
      if (session.role !== 'gm' && session.membershipId !== membershipId) {
        throw new Error('Voce so pode marcar a propria presenca.');
      }
      const client = assertClient();
      const { error } = await client
        .from('table_session_attendances')
        .upsert(
          {
            session_id: sessionId,
            membership_id: membershipId,
            status,
            marked_at: new Date().toISOString()
          },
          { onConflict: 'session_id,membership_id' }
        );
      if (error) throw error;
      return fetchTableState(session.tableId);
    },
    async clearSessionAttendance({ session, sessionId }) {
      const client = assertClient();
      const targetSessionId = sessionId || (await fetchTableState(session.tableId)).currentSession?.id;
      if (!targetSessionId) return fetchTableState(session.tableId);
      const query = client.from('table_session_attendances').delete().eq('session_id', targetSessionId);
      if (session.role !== 'gm') {
        query.eq('membership_id', session.membershipId);
      }
      const { error } = await query;
      if (error) throw error;
      return fetchTableState(session.tableId);
    },
    async saveCharacter({ session, userId, character }) {
      if (session.role === 'viewer') {
        throw new Error('Seu papel atual permite apenas leitura.');
      }
      if (session.role === 'player' && session.characterId !== character.id) {
        throw new Error('Players so podem editar a propria ficha vinculada.');
      }
      await saveCharacterGraph(session.tableId, userId, character);
    },
    async appendTableLog({ session, userId, entry }) {
      const client = assertClient();
      const { error } = await client.from('table_logs').insert(omitLocalId({
        id: entry.id,
        table_id: session.tableId,
        actor_id: userId,
        category: entry.category,
        title: entry.title,
        body: entry.text,
        meta: entry.meta,
        created_at: entry.timestamp
      }));
      if (error) throw error;
    },
    async clearTableLogs({ session }) {
      if (session.role !== 'gm') {
        throw new Error('Apenas GMs podem limpar o log compartilhado.');
      }
      const client = assertClient();
      const { error } = await client.from('table_logs').delete().eq('table_id', session.tableId);
      if (error) throw error;
    },
    async transferTableOwnership({ session, targetMembershipId }) {
      const client = assertClient();
      const { error } = await client.rpc('transfer_table_ownership', {
        p_table_id: session.tableId,
        p_target_membership_id: targetMembershipId
      });
      if (error) throw error;
      return fetchTableState(session.tableId);
    },
    async deleteTable({ session }) {
      const client = assertClient();
      const { error } = await client.rpc('delete_table_preserving_characters', {
        p_table_id: session.tableId
      });
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
    },
    async uploadCharacterGalleryImage({ user, characterId, file, caption = '', sortOrder = 0 }) {
      const client = assertClient();
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/${characterId}/gallery-${crypto.randomUUID()}.${extension}`;

      const { error } = await client.storage.from('avatars').upload(path, file, {
        upsert: true,
        contentType: file.type || 'image/png'
      });

      if (error) throw error;

      const url = await createSignedAvatarUrl(path);
      const image: CharacterGalleryImage = {
        id: crypto.randomUUID(),
        url,
        path,
        caption,
        sortOrder
      };

      return {
        url,
        path,
        image
      };
    }
  };
}

export type WorkspaceRealtimeChannel = RealtimeChannel;
