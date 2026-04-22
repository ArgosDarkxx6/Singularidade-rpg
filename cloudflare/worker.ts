import type {
  ExportedHandler,
  Fetcher,
  Request as WorkerRequest,
  Response as WorkerResponse
} from '@cloudflare/workers-types';

export interface Env {
  ASSETS: Fetcher;
  REFERENCE_SOURCE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

type ReferenceCard = {
  id: string;
  title: string;
  category: string;
  summary: string;
  source: string;
  url: string;
};

const LOCAL_REFERENCE_CARDS: ReferenceCard[] = [
  {
    id: 'reference-black-flash',
    title: 'Black Flash',
    category: 'combat',
    summary: 'Explains the critical timing window, the reward for precision and the narrative use of burst damage.',
    source: 'Project Nexus / Singularidade',
    url: '/livro#black-flash'
  },
  {
    id: 'reference-domain-expansion',
    title: 'Domain Expansion',
    category: 'combat',
    summary: 'Covers the escalation point where the fight becomes a rule dispute instead of a trade of attacks.',
    source: 'Project Nexus / Singularidade',
    url: '/livro#dominio'
  },
  {
    id: 'reference-vows',
    title: 'Votos vinculativos',
    category: 'builds',
    summary: 'Describes how a sacrifice becomes a permanent advantage for a character or table arc.',
    source: 'Project Nexus / Singularidade',
    url: '/livro#votos'
  },
  {
    id: 'reference-order',
    title: 'Ordem de combate',
    category: 'table',
    summary: 'Summarizes the initiative loop, turn flow and the way the order tracker keeps the table aligned.',
    source: 'Project Nexus / Singularidade',
    url: '/ordem'
  }
];

function json(data: unknown, init?: ResponseInit): WorkerResponse {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init?.headers || {})
    }
  }) as unknown as WorkerResponse;
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function authCorsHeaders(request: WorkerRequest): Record<string, string> {
  return {
    'access-control-allow-origin': request.headers.get('origin') || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    vary: 'Origin'
  };
}

function authJson(data: unknown, request: WorkerRequest, init?: ResponseInit): WorkerResponse {
  return json(data, {
    ...init,
    headers: {
      ...authCorsHeaders(request),
      ...((init?.headers as Record<string, string> | undefined) || {})
    }
  });
}

function authErrorJson(message: string, status: number, request: WorkerRequest): WorkerResponse {
  return authJson({ error: message }, request, { status });
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function getAuthConfig(env: Env) {
  const supabaseUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return null;
  }

  return {
    supabaseUrl: stripTrailingSlash(supabaseUrl),
    anonKey,
    serviceRoleKey
  };
}

function serviceHeaders(config: ReturnType<typeof getAuthConfig> & {}) {
  return {
    apikey: config.serviceRoleKey,
    authorization: `Bearer ${config.serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json'
  };
}

function authBearerToken(request: WorkerRequest) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

async function getAuthenticatedUserId(config: ReturnType<typeof getAuthConfig> & {}, request: WorkerRequest) {
  const token = authBearerToken(request);
  if (!token) return '';

  const userResponse = await fetch(new URL('/auth/v1/user', config.supabaseUrl).toString(), {
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${token}`,
      accept: 'application/json'
    }
  });

  if (!userResponse.ok) return '';

  const payload = (await userResponse.json().catch(() => null)) as { id?: string } | null;
  return typeof payload?.id === 'string' ? payload.id : '';
}

async function getAuthenticatedUser(config: ReturnType<typeof getAuthConfig> & {}, request: WorkerRequest) {
  const token = authBearerToken(request);
  if (!token) return null;

  const userResponse = await fetch(new URL('/auth/v1/user', config.supabaseUrl).toString(), {
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${token}`,
      accept: 'application/json'
    }
  });

  if (!userResponse.ok) return null;
  const payload = (await userResponse.json().catch(() => null)) as { id?: string; email?: string } | null;
  if (!payload?.id || !payload.email) return null;
  return {
    id: payload.id,
    email: payload.email,
    token
  };
}

async function verifyPassword(config: ReturnType<typeof getAuthConfig> & {}, email: string, password: string) {
  const tokenUrl = new URL('/auth/v1/token', config.supabaseUrl);
  tokenUrl.searchParams.set('grant_type', 'password');

  const response = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  return response.ok;
}

async function fetchServiceRows<T>(config: ReturnType<typeof getAuthConfig> & {}, path: string, params: Record<string, string>) {
  const url = new URL(path, config.supabaseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: serviceHeaders(config)
  });

  if (!response.ok) return null;
  return (await response.json().catch(() => [])) as T[];
}

async function callRpcWithUserToken(
  config: ReturnType<typeof getAuthConfig> & {},
  token: string,
  rpcName: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(new URL(`/rest/v1/rpc/${rpcName}`, config.supabaseUrl).toString(), {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response;
}

async function fetchServiceSingle<T>(config: ReturnType<typeof getAuthConfig> & {}, path: string, params: Record<string, string>) {
  const rows = await fetchServiceRows<T>(config, path, params);
  return rows?.[0] || null;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesQuery(card: ReferenceCard, query: string) {
  if (!query) return true;
  const needle = normalize(query);
  return [card.title, card.category, card.summary, card.source].some((value) => normalize(value).includes(needle));
}

function filterLocalReferences(url: URL) {
  const query = url.searchParams.get('q') || '';
  const category = normalize(url.searchParams.get('category') || '');

  return LOCAL_REFERENCE_CARDS.filter((card) => matchesQuery(card, query)).filter((card) => !category || normalize(card.category) === category);
}

async function fetchRemoteReferences(env: Env, url: URL) {
  if (!env.REFERENCE_SOURCE_URL) return null;

  try {
    const endpoint = new URL(env.REFERENCE_SOURCE_URL);
    endpoint.searchParams.set('q', url.searchParams.get('q') || '');
    endpoint.searchParams.set('category', url.searchParams.get('category') || '');

    const response = await fetch(endpoint.toString(), {
      headers: {
        accept: 'application/json'
      }
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { items?: ReferenceCard[] } | ReferenceCard[];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.items)) return payload.items;
    return null;
  } catch {
    return null;
  }
}

async function serveReferences(request: WorkerRequest, env: Env): Promise<WorkerResponse> {
  const url = new URL(request.url);
  const remote = await fetchRemoteReferences(env, url);
  const items = remote ?? filterLocalReferences(url);

  return json({
    source: remote ? 'remote' : 'local',
    items,
    total: items.length
  });
}

async function serveUsernameLogin(request: WorkerRequest, env: Env): Promise<WorkerResponse> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: authCorsHeaders(request) }) as unknown as WorkerResponse;
  }

  if (request.method !== 'POST') {
    return authErrorJson('Metodo nao permitido.', 405, request);
  }

  const config = getAuthConfig(env);
  if (!config) {
    return authErrorJson('Login por usuario indisponivel.', 503, request);
  }

  const body = (await request.json().catch(() => null)) as { identifier?: unknown; username?: unknown; password?: unknown } | null;
  const identifierRaw = typeof body?.identifier === 'string' ? body.identifier : typeof body?.username === 'string' ? body.username : '';
  const identifier = normalize(identifierRaw);
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!USERNAME_PATTERN.test(identifier) || password.length < 6) {
    return authErrorJson('Usuario, email ou senha invalidos.', 401, request);
  }

  const profileUrl = new URL('/rest/v1/profiles', config.supabaseUrl);
  profileUrl.searchParams.set('select', 'email');
  profileUrl.searchParams.set('username', `eq.${identifier}`);
  profileUrl.searchParams.set('limit', '1');

  const profileResponse = await fetch(profileUrl.toString(), {
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      accept: 'application/json'
    }
  });

  if (!profileResponse.ok) {
    return authErrorJson('Usuario, email ou senha invalidos.', 401, request);
  }

  const profiles = (await profileResponse.json().catch(() => [])) as Array<{ email?: string }>;
  const email = profiles[0]?.email;
  if (!email) {
    return authErrorJson('Usuario, email ou senha invalidos.', 401, request);
  }

  const tokenUrl = new URL('/auth/v1/token', config.supabaseUrl);
  tokenUrl.searchParams.set('grant_type', 'password');

  const tokenResponse = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const tokenPayload = (await tokenResponse.json().catch(() => null)) as
    | {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
        user?: Record<string, unknown>;
      }
    | null;

  if (!tokenResponse.ok || !tokenPayload?.access_token || !tokenPayload.refresh_token) {
    return authErrorJson('Usuario, email ou senha invalidos.', 401, request);
  }

  const { email: _email, ...safeUser } = tokenPayload.user || {};
  void _email;

  return authJson({
    access_token: tokenPayload.access_token,
    refresh_token: tokenPayload.refresh_token,
    expires_in: tokenPayload.expires_in,
    token_type: tokenPayload.token_type,
    user: safeUser
  }, request);
}

async function serveUsernameAvailability(request: WorkerRequest, env: Env): Promise<WorkerResponse> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: authCorsHeaders(request) }) as unknown as WorkerResponse;
  }

  if (request.method !== 'POST') {
    return authErrorJson('Metodo nao permitido.', 405, request);
  }

  const config = getAuthConfig(env);
  if (!config) {
    return authErrorJson('Validacao de username indisponivel.', 503, request);
  }

  const body = (await request.json().catch(() => null)) as { username?: unknown; identifier?: unknown } | null;
  const usernameRaw = typeof body?.username === 'string' ? body.username : typeof body?.identifier === 'string' ? body.identifier : '';
  const username = normalize(usernameRaw);

  if (!USERNAME_PATTERN.test(username)) {
    return authJson({ available: false }, request);
  }

  const profileUrl = new URL('/rest/v1/profiles', config.supabaseUrl);
  profileUrl.searchParams.set('select', 'id');
  profileUrl.searchParams.set('username', `eq.${username}`);
  profileUrl.searchParams.set('limit', '1');

  const profileResponse = await fetch(profileUrl.toString(), {
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      accept: 'application/json'
    }
  });

  if (!profileResponse.ok) {
    return authErrorJson('Validacao de username indisponivel.', 503, request);
  }

  const profiles = (await profileResponse.json().catch(() => [])) as Array<{ id?: string }>;
  return authJson({ available: profiles.length === 0 }, request);
}

async function serveEmailAvailability(request: WorkerRequest, env: Env): Promise<WorkerResponse> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: authCorsHeaders(request) }) as unknown as WorkerResponse;
  }

  if (request.method !== 'POST') {
    return authErrorJson('Metodo nao permitido.', 405, request);
  }

  const config = getAuthConfig(env);
  if (!config) {
    return authErrorJson('Validacao de email indisponivel.', 503, request);
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = normalize(typeof body?.email === 'string' ? body.email : '');

  if (!EMAIL_PATTERN.test(email)) {
    return authJson({ available: false }, request);
  }

  const profileUrl = new URL('/rest/v1/profiles', config.supabaseUrl);
  profileUrl.searchParams.set('select', 'id');
  profileUrl.searchParams.set('email', `eq.${email}`);
  profileUrl.searchParams.set('limit', '1');

  const profileResponse = await fetch(profileUrl.toString(), {
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      accept: 'application/json'
    }
  });

  if (!profileResponse.ok) {
    return authErrorJson('Validacao de email indisponivel.', 503, request);
  }

  const profiles = (await profileResponse.json().catch(() => [])) as Array<{ id?: string }>;
  return authJson({ available: profiles.length === 0 }, request);
}

async function serveInvitePreview(request: WorkerRequest, env: Env): Promise<WorkerResponse> {
  if (request.method !== 'GET') {
    return authErrorJson('Metodo nao permitido.', 405, request);
  }

  const config = getAuthConfig(env);
  if (!config) {
    return authErrorJson('Preview de convite indisponivel.', 503, request);
  }

  const token = new URL(request.url).searchParams.get('token')?.trim() || '';
  if (!token) {
    return authErrorJson('Convite invalido.', 400, request);
  }

  const invite = await fetchServiceSingle<{
    id?: string;
    table_id?: string;
    role?: 'gm' | 'player' | 'viewer';
    revoked_at?: string | null;
    expires_at?: string | null;
    accepted_at?: string | null;
  }>(config, '/rest/v1/table_invites', {
    select: 'id,table_id,role,revoked_at,expires_at,accepted_at',
    token: `eq.${token}`,
    limit: '1'
  });

  if (!invite?.table_id || !invite.role) {
    return authErrorJson('Convite invalido ou expirado.', 404, request);
  }

  const table = await fetchServiceSingle<{
    id?: string;
    slug?: string;
    name?: string;
    description?: string | null;
  }>(config, '/rest/v1/tables', {
    select: 'id,slug,name,description',
    id: `eq.${invite.table_id}`,
    limit: '1'
  });

  if (!table?.id || !table.slug || !table.name) {
    return authErrorJson('Mesa do convite nao encontrada.', 404, request);
  }

  const nowIso = new Date().toISOString();
  const expired = Boolean(invite.expires_at && invite.expires_at < nowIso);
  const revoked = Boolean(invite.revoked_at);

  return json({
    token,
    tableId: table.id,
    tableSlug: table.slug,
    tableName: table.name,
    tableDescription: table.description || '',
    role: invite.role,
    revoked,
    expired,
    accepted: Boolean(invite.accepted_at)
  });
}

async function resolveProfileIdByUsername(config: ReturnType<typeof getAuthConfig> & {}, username: string) {
  const normalized = normalize(username);
  const profile = await fetchServiceSingle<{ id?: string }>(config, '/rest/v1/profiles', {
    select: 'id',
    username: `eq.${normalized}`,
    limit: '1'
  });
  return profile?.id || '';
}

async function serveTableOwnershipTransfer(request: WorkerRequest, env: Env): Promise<WorkerResponse> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: authCorsHeaders(request) }) as unknown as WorkerResponse;
  }
  if (request.method !== 'POST') {
    return authErrorJson('Metodo nao permitido.', 405, request);
  }

  const config = getAuthConfig(env);
  if (!config) {
    return authErrorJson('Transferencia indisponivel.', 503, request);
  }

  const actor = await getAuthenticatedUser(config, request);
  if (!actor) {
    return authErrorJson('Sessao invalida.', 401, request);
  }

  const body = (await request.json().catch(() => null)) as {
    tableId?: unknown;
    targetUsername?: unknown;
    currentPassword?: unknown;
  } | null;

  const tableId = typeof body?.tableId === 'string' ? body.tableId : '';
  const targetUsername = typeof body?.targetUsername === 'string' ? body.targetUsername : '';
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';

  if (!UUID_PATTERN.test(tableId) || !USERNAME_PATTERN.test(targetUsername) || currentPassword.length < 6) {
    return authErrorJson('Dados de transferencia invalidos.', 400, request);
  }

  const passwordOk = await verifyPassword(config, actor.email, currentPassword);
  if (!passwordOk) {
    return authErrorJson('Senha atual invalida.', 401, request);
  }

  const targetUserId = await resolveProfileIdByUsername(config, targetUsername);
  if (!targetUserId) {
    return authErrorJson('Username de destino nao encontrado.', 404, request);
  }
  if (targetUserId === actor.id) {
    return authErrorJson('Nao e permitido transferir para a propria conta.', 409, request);
  }

  const targetMembership = await fetchServiceSingle<{ id?: string }>(config, '/rest/v1/table_memberships', {
    select: 'id',
    table_id: `eq.${tableId}`,
    user_id: `eq.${targetUserId}`,
    active: 'eq.true',
    limit: '1'
  });
  if (!targetMembership?.id) {
    return authErrorJson('O destino precisa ser membro ativo da mesa.', 409, request);
  }

  const rpcResponse = await callRpcWithUserToken(config, actor.token, 'transfer_table_ownership', {
    p_table_id: tableId,
    p_target_membership_id: targetMembership.id
  });
  if (!rpcResponse.ok) {
    const payload = (await rpcResponse.json().catch(() => null)) as { message?: string; error?: string } | null;
    return authErrorJson(payload?.message || payload?.error || 'Nao foi possivel transferir a mesa.', 409, request);
  }

  return authJson({ ok: true }, request);
}

async function serveCharacterOwnershipTransfer(request: WorkerRequest, env: Env): Promise<WorkerResponse> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: authCorsHeaders(request) }) as unknown as WorkerResponse;
  }
  if (request.method !== 'POST') {
    return authErrorJson('Metodo nao permitido.', 405, request);
  }

  const config = getAuthConfig(env);
  if (!config) {
    return authErrorJson('Transferencia indisponivel.', 503, request);
  }

  const actor = await getAuthenticatedUser(config, request);
  if (!actor) {
    return authErrorJson('Sessao invalida.', 401, request);
  }

  const body = (await request.json().catch(() => null)) as {
    coreId?: unknown;
    targetUsername?: unknown;
    currentPassword?: unknown;
  } | null;

  const coreId = typeof body?.coreId === 'string' ? body.coreId : '';
  const targetUsername = typeof body?.targetUsername === 'string' ? body.targetUsername : '';
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';

  if (!UUID_PATTERN.test(coreId) || !USERNAME_PATTERN.test(targetUsername) || currentPassword.length < 6) {
    return authErrorJson('Dados de transferencia invalidos.', 400, request);
  }

  const passwordOk = await verifyPassword(config, actor.email, currentPassword);
  if (!passwordOk) {
    return authErrorJson('Senha atual invalida.', 401, request);
  }

  const targetUserId = await resolveProfileIdByUsername(config, targetUsername);
  if (!targetUserId) {
    return authErrorJson('Username de destino nao encontrado.', 404, request);
  }
  if (targetUserId === actor.id) {
    return authErrorJson('Nao e permitido transferir para a propria conta.', 409, request);
  }

  const rpcResponse = await callRpcWithUserToken(config, actor.token, 'transfer_character_core_ownership', {
    p_core_id: coreId,
    p_target_user_id: targetUserId
  });
  if (!rpcResponse.ok) {
    const payload = (await rpcResponse.json().catch(() => null)) as { message?: string; error?: string } | null;
    return authErrorJson(payload?.message || payload?.error || 'Nao foi possivel transferir este personagem.', 409, request);
  }

  return authJson({ ok: true }, request);
}

async function serveCharacterOwnershipClaim(request: WorkerRequest, env: Env): Promise<WorkerResponse> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: authCorsHeaders(request) }) as unknown as WorkerResponse;
  }

  if (request.method !== 'POST') {
    return authErrorJson('Metodo nao permitido.', 405, request);
  }

  const config = getAuthConfig(env);
  if (!config) {
    return authErrorJson('Vinculo de ficha indisponivel.', 503, request);
  }

  const userId = await getAuthenticatedUserId(config, request);
  if (!userId) {
    return authErrorJson('Sessao invalida.', 401, request);
  }

  const body = (await request.json().catch(() => null)) as { tableId?: unknown; characterId?: unknown } | null;
  const tableId = typeof body?.tableId === 'string' ? body.tableId : '';
  const characterId = typeof body?.characterId === 'string' ? body.characterId : '';

  if (!UUID_PATTERN.test(tableId) || !UUID_PATTERN.test(characterId)) {
    return authErrorJson('Ficha invalida.', 400, request);
  }

  const memberships = await fetchServiceRows<{
    id?: string;
    role?: string;
    character_id?: string | null;
    table_id?: string;
  }>(config, '/rest/v1/table_memberships', {
    select: 'id,role,character_id,table_id',
    table_id: `eq.${tableId}`,
    user_id: `eq.${userId}`,
    active: 'eq.true',
    limit: '1'
  });

  const membership = memberships?.[0];
  if (!membership || membership.role !== 'player' || membership.character_id !== characterId) {
    return authErrorJson('Membership sem acesso a esta ficha.', 403, request);
  }

  const tables = await fetchServiceRows<{ owner_id?: string | null }>(config, '/rest/v1/tables', {
    select: 'owner_id',
    id: `eq.${tableId}`,
    limit: '1'
  });
  const tableOwnerId = tables?.[0]?.owner_id || '';

  const characters = await fetchServiceRows<{ id?: string; owner_id?: string | null; table_id?: string }>(config, '/rest/v1/characters', {
    select: 'id,owner_id,table_id',
    id: `eq.${characterId}`,
    table_id: `eq.${tableId}`,
    archived: 'eq.false',
    limit: '1'
  });

  const character = characters?.[0];
  if (!character) {
    return authErrorJson('Ficha nao encontrada.', 404, request);
  }

  const ownerId = character.owner_id || '';
  if (ownerId && ownerId !== userId && ownerId !== tableOwnerId) {
    return authErrorJson('Ficha ja vinculada a outro jogador.', 409, request);
  }

  if (ownerId === userId) {
    return authJson({ ok: true }, request);
  }

  const updateUrl = new URL('/rest/v1/characters', config.supabaseUrl);
  updateUrl.searchParams.set('id', `eq.${characterId}`);
  updateUrl.searchParams.set('table_id', `eq.${tableId}`);

  const updateResponse = await fetch(updateUrl.toString(), {
    method: 'PATCH',
    headers: {
      ...serviceHeaders(config),
      prefer: 'return=minimal'
    },
    body: JSON.stringify({
      owner_id: userId
    })
  });

  if (!updateResponse.ok) {
    return authErrorJson('Nao foi possivel vincular a ficha.', 502, request);
  }

  return authJson({ ok: true }, request);
}

async function serveAssets(request: WorkerRequest, env: Env): Promise<WorkerResponse> {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404) return response;

  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') return response;
  if (url.pathname.includes('.')) return response;

  const headers = Object.fromEntries(request.headers.entries());
  return env.ASSETS.fetch(new URL('/index.html', url), {
    method: request.method,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/references')) {
      return serveReferences(request, env);
    }

    if (url.pathname === '/api/auth/username-login') {
      return serveUsernameLogin(request, env);
    }

    if (url.pathname === '/api/auth/username-availability') {
      return serveUsernameAvailability(request, env);
    }

    if (url.pathname === '/api/auth/email-availability') {
      return serveEmailAvailability(request, env);
    }

    if (url.pathname === '/api/invites/preview') {
      return serveInvitePreview(request, env);
    }

    if (url.pathname === '/api/tables/transfer-ownership') {
      return serveTableOwnershipTransfer(request, env);
    }

    if (url.pathname === '/api/characters/transfer-ownership') {
      return serveCharacterOwnershipTransfer(request, env);
    }

    if (url.pathname === '/api/characters/claim-ownership') {
      return serveCharacterOwnershipClaim(request, env);
    }

    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'project-nexus', worker: 'singularidade-online' });
    }

    return serveAssets(request, env);
  }
} satisfies ExportedHandler<Env>;
