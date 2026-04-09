import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';
import type { AuthUser, Character, PresenceMember, TableInvite, TableJoinCode, TableMeta, TableSession, TableSnapshot, TableState, WorkspaceState } from '@/types/domain';
import { DEFAULT_TABLE_META } from '@lib/domain/constants';
import { createDefaultState, normalizeState } from '@lib/domain/state';
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

function toCharacterRows(tableId: string, ownerId: string, state: WorkspaceState) {
  return state.characters.map((character, sortOrder) => ({
    id: character.id,
    table_id: tableId,
    owner_id: ownerId,
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
    archived: false,
    sort_order: sortOrder
  }));
}

async function syncCharacterRows(tableId: string, ownerId: string, state: WorkspaceState) {
  const client = assertClient();
  const rows = toCharacterRows(tableId, ownerId, state);

  if (!rows.length) return;

  const { error } = await client.from('characters').upsert(rows, {
    onConflict: 'id'
  });

  if (error) throw error;
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

async function fetchTableState(tableId: string): Promise<TableState> {
  const row = await fetchTableRowById(tableId);
  const state = await hydrateStateAvatars(parseWorkspaceState(row.state));
  const [snapshots, memberships, joinCodes, invites] = await Promise.all([
    fetchSnapshots(row.id),
    fetchMemberships(row.id, state),
    fetchJoinCodes(row.id, row.slug),
    fetchInvites(row.id, row.slug)
  ]);

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
    selected_character_id: input.characterId || null
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
    async getTable(session) {
      return fetchTableState(session.tableId);
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
        session: {
          tableId: insertedTable.id,
          membershipId: membership.id,
          tableSlug: insertedTable.slug,
          tableName: insertedTable.name,
          role: 'gm',
          nickname,
          characterId: '',
          lastJoinedAt: new Date().toISOString()
        }
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
        session: {
          tableId: claimed.table_id,
          membershipId: claimed.membership_id,
          tableSlug: claimed.table_slug,
          tableName: claimed.table_name,
          role: claimed.role as TableSession['role'],
          nickname,
          characterId: claimed.character_id || '',
          lastJoinedAt: new Date().toISOString()
        }
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
        session: {
          tableId: claimed.table_id,
          membershipId: claimed.membership_id,
          tableSlug: claimed.table_slug,
          tableName: claimed.table_name,
          role: claimed.role as TableSession['role'],
          nickname,
          characterId: claimed.character_id || '',
          lastJoinedAt: new Date().toISOString()
        },
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
