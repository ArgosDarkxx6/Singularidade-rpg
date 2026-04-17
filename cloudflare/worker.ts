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
  const supabaseUrl = env.SUPABASE_URL?.trim();
  const anonKey = env.SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return null;
  }

  return {
    supabaseUrl: stripTrailingSlash(supabaseUrl),
    anonKey,
    serviceRoleKey
  };
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

  const body = (await request.json().catch(() => null)) as { username?: unknown; password?: unknown } | null;
  const username = typeof body?.username === 'string' ? normalize(body.username) : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!USERNAME_PATTERN.test(username) || password.length < 6) {
    return authErrorJson('Usuario ou senha invalidos.', 401, request);
  }

  const profileUrl = new URL('/rest/v1/profiles', config.supabaseUrl);
  profileUrl.searchParams.set('select', 'email');
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
    return authErrorJson('Usuario ou senha invalidos.', 401, request);
  }

  const profiles = (await profileResponse.json().catch(() => [])) as Array<{ email?: string }>;
  const email = profiles[0]?.email;
  if (!email) {
    return authErrorJson('Usuario ou senha invalidos.', 401, request);
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
    return authErrorJson('Usuario ou senha invalidos.', 401, request);
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

    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'project-nexus', worker: 'singularidade-online' });
    }

    return serveAssets(request, env);
  }
} satisfies ExportedHandler<Env>;
