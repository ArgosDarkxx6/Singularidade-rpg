import type {
  ExportedHandler,
  Fetcher,
  Request as WorkerRequest,
  Response as WorkerResponse
} from '@cloudflare/workers-types';

export interface Env {
  ASSETS: Fetcher;
  REFERENCE_SOURCE_URL?: string;
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
    source: 'Singularidade RPG',
    url: '/livro#black-flash'
  },
  {
    id: 'reference-domain-expansion',
    title: 'Domain Expansion',
    category: 'combat',
    summary: 'Covers the escalation point where the fight becomes a rule dispute instead of a trade of attacks.',
    source: 'Singularidade RPG',
    url: '/livro#dominio'
  },
  {
    id: 'reference-vows',
    title: 'Votos vinculativos',
    category: 'builds',
    summary: 'Describes how a sacrifice becomes a permanent advantage for a character or table arc.',
    source: 'Singularidade RPG',
    url: '/livro#votos'
  },
  {
    id: 'reference-order',
    title: 'Ordem de combate',
    category: 'table',
    summary: 'Summarizes the initiative loop, turn flow and the way the order tracker keeps the table aligned.',
    source: 'Singularidade RPG',
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

    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'singularidade-online' });
    }

    return serveAssets(request, env);
  }
} satisfies ExportedHandler<Env>;
