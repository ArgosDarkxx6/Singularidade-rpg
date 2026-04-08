import { DEFAULT_TABLE_META } from './constants.js';
import { buildAppUrl, parseAppLocation } from './router.js';
import { deepClone } from './utils.js';

export const ONLINE_SESSION_KEY = 'singularidade-online-session-v3';
export const ONLINE_CACHE_KEY = 'singularidade-online-cache-v3';
export const ONLINE_PRESENCE_DEBOUNCE = 300;

function safeStorage(storage = globalThis.localStorage) {
  if (!storage) return null;
  return storage;
}

function safeParseJson(raw, fallback = null) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function trimOrEmpty(value) {
  return String(value || '').trim();
}

function trimWithLimit(value, maxLength = 120) {
  return trimOrEmpty(value).slice(0, maxLength);
}

export function normalizeRole(role) {
  return ['gm', 'player', 'viewer'].includes(role) ? role : 'viewer';
}

export function sanitizeNickname(value) {
  const cleaned = trimOrEmpty(value).slice(0, 48);
  return cleaned || 'Feiticeiro';
}

export function normalizeTableMeta(meta = {}) {
  const source = meta && typeof meta === 'object' ? meta : {};
  return {
    tableName: trimWithLimit(source.tableName || source.name || DEFAULT_TABLE_META.tableName, 72) || DEFAULT_TABLE_META.tableName,
    seriesName: trimWithLimit(source.seriesName || DEFAULT_TABLE_META.seriesName, 72),
    campaignName: trimWithLimit(source.campaignName || '', 72),
    episodeNumber: trimWithLimit(source.episodeNumber || '', 16),
    episodeTitle: trimWithLimit(source.episodeTitle || '', 96),
    sessionDate: trimWithLimit(source.sessionDate || '', 32),
    location: trimWithLimit(source.location || '', 72),
    status: trimWithLimit(source.status || DEFAULT_TABLE_META.status, 32) || DEFAULT_TABLE_META.status,
    expectedRoster: trimWithLimit(source.expectedRoster || '', 120),
    recap: trimWithLimit(source.recap || '', 600),
    objective: trimWithLimit(source.objective || '', 320)
  };
}

export function sanitizeJoinCode(value) {
  return String(value || '').replace(/\D+/g, '').slice(0, 6);
}

export function formatJoinCodeDisplay(value) {
  const clean = sanitizeJoinCode(value);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

export function normalizeJoinCodeRecord(record = {}) {
  return {
    id: trimOrEmpty(record.id),
    tableSlug: trimOrEmpty(record.tableSlug || record.table_slug),
    role: normalizeRole(record.role),
    code: sanitizeJoinCode(record.code),
    label: trimWithLimit(record.label || '', 64),
    active: record.active !== false && String(record.active ?? '1') !== '0',
    createdAt: trimOrEmpty(record.createdAt || record.created_at),
    updatedAt: trimOrEmpty(record.updatedAt || record.updated_at)
  };
}

export function buildTableEpisodeLabel(meta = {}) {
  const normalized = normalizeTableMeta(meta);
  const bits = [];
  if (normalized.episodeNumber) bits.push(`EP ${normalized.episodeNumber}`);
  if (normalized.episodeTitle) bits.push(normalized.episodeTitle);
  return bits.join(' • ');
}

export function buildTableContextLabel(meta = {}) {
  const normalized = normalizeTableMeta(meta);
  const bits = [normalized.campaignName, normalized.location].filter(Boolean);
  return bits.join(' • ');
}

export function getWindowOrigin(locationLike = globalThis.location) {
  if (!locationLike) return '';
  if (locationLike.origin) return locationLike.origin;
  const protocol = locationLike.protocol || 'https:';
  const host = locationLike.host || 'localhost';
  return `${protocol}//${host}`;
}

export function buildInviteUrl({
  origin = getWindowOrigin(),
  tableSlug,
  token,
  role = 'viewer',
  characterId = ''
}) {
  const url = buildAppUrl('mesa', {
    origin,
    tableSlug,
    query: {
      token,
      role: normalizeRole(role),
      character: characterId
    }
  });
  return url.toString();
}

export function parseOnlineSessionFromUrl(locationLike = globalThis.location) {
  if (!locationLike) return null;
  const params = new URLSearchParams(locationLike.search || '');
  const route = parseAppLocation(locationLike);
  const tableSlug = trimOrEmpty(route.tableSlug || params.get('table'));
  const token = trimOrEmpty(params.get('token'));
  if (!tableSlug || !token) return null;

  return {
    tableSlug,
    token,
    role: normalizeRole(params.get('role')),
    characterId: trimOrEmpty(params.get('character')),
    nickname: sanitizeNickname(params.get('nickname') || ''),
    source: 'url'
  };
}

export function readPersistedOnlineSession(storage = globalThis.localStorage) {
  const store = safeStorage(storage);
  if (!store) return null;
  return safeParseJson(store.getItem(ONLINE_SESSION_KEY), null);
}

export function readOnlineSession(storage = globalThis.localStorage, locationLike = globalThis.location) {
  const persisted = readPersistedOnlineSession(storage);
  const fromUrl = parseOnlineSessionFromUrl(locationLike);
  const route = parseAppLocation(locationLike);

  if (!fromUrl && route.tableSlug && persisted?.tableSlug && route.tableSlug !== persisted.tableSlug) {
    return null;
  }

  if (!fromUrl) return persisted;
  return {
    ...persisted,
    ...fromUrl,
    role: normalizeRole(fromUrl.role || persisted?.role),
    characterId: fromUrl.characterId || persisted?.characterId || '',
    nickname: sanitizeNickname(fromUrl.nickname || persisted?.nickname)
  };
}

export function persistOnlineSession(session, storage = globalThis.localStorage) {
  const store = safeStorage(storage);
  if (!store || !session) return;
  store.setItem(ONLINE_SESSION_KEY, JSON.stringify({
    tableSlug: session.tableSlug,
    token: session.token,
    role: normalizeRole(session.role),
    characterId: trimOrEmpty(session.characterId),
    nickname: sanitizeNickname(session.nickname),
    tableName: trimOrEmpty(session.tableName),
    lastJoinedAt: session.lastJoinedAt || new Date().toISOString()
  }));
}

export function clearOnlineSession(storage = globalThis.localStorage) {
  safeStorage(storage)?.removeItem(ONLINE_SESSION_KEY);
}

export function persistOnlineCache(payload, storage = globalThis.localStorage) {
  const store = safeStorage(storage);
  if (!store || !payload) return;
  store.setItem(ONLINE_CACHE_KEY, JSON.stringify(payload));
}

export function readOnlineCache(storage = globalThis.localStorage) {
  const store = safeStorage(storage);
  if (!store) return null;
  return safeParseJson(store.getItem(ONLINE_CACHE_KEY), null);
}

export function createApiClient(baseUrl = '') {
  let d1Bookmark = '';

  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'content-type': 'application/json',
        ...(d1Bookmark ? { 'x-d1-bookmark': d1Bookmark } : {}),
        ...(options.headers || {})
      },
      ...options
    });

    const nextBookmark = response.headers.get('x-d1-bookmark') || '';
    if (nextBookmark) d1Bookmark = nextBookmark;

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message = typeof payload === 'string'
        ? payload
        : payload?.error || payload?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload;
  }

  return {
    async health() {
      try {
        const payload = await request('/api/health', { method: 'GET', headers: {} });
        return payload?.ok === true;
      } catch (error) {
        return false;
      }
    },
    createTable(payload) {
      return request('/api/tables', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    getTable(tableSlug, token) {
      return request(`/api/tables/${encodeURIComponent(tableSlug)}?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {}
      });
    },
    updateTable(tableSlug, token, payload) {
      return request(`/api/tables/${encodeURIComponent(tableSlug)}?token=${encodeURIComponent(token)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    },
    createInvite(tableSlug, token, payload) {
      return request(`/api/tables/${encodeURIComponent(tableSlug)}/invites?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    createJoinCode(tableSlug, token, payload) {
      return request(`/api/tables/${encodeURIComponent(tableSlug)}/join-codes?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    getJoinCodes(tableSlug, token) {
      return request(`/api/tables/${encodeURIComponent(tableSlug)}/join-codes?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {}
      });
    },
    revokeJoinCode(tableSlug, token, joinCodeId) {
      return request(`/api/tables/${encodeURIComponent(tableSlug)}/join-codes/${encodeURIComponent(joinCodeId)}?token=${encodeURIComponent(token)}`, {
        method: 'DELETE',
        body: JSON.stringify({})
      });
    },
    joinWithCode(payload) {
      return request('/api/join/code', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    importLocalState(tableSlug, token, payload) {
      return request(`/api/tables/${encodeURIComponent(tableSlug)}/import-local?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    createSnapshot(tableSlug, token, payload) {
      return request(`/api/tables/${encodeURIComponent(tableSlug)}/snapshot?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    getSnapshots(tableSlug, token) {
      return request(`/api/tables/${encodeURIComponent(tableSlug)}/snapshots?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {}
      });
    },
    restoreSnapshot(tableSlug, token, snapshotId) {
      return request(`/api/tables/${encodeURIComponent(tableSlug)}/snapshots/${encodeURIComponent(snapshotId)}/restore?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify({})
      });
    },
    uploadAvatar(tableSlug, token, payload) {
      return request(`/api/uploads/avatar?table=${encodeURIComponent(tableSlug)}&token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    searchReferences(query, scope = 'all') {
      return request(`/api/reference/search?q=${encodeURIComponent(query)}&scope=${encodeURIComponent(scope)}`, {
        method: 'GET',
        headers: {}
      });
    }
  };
}

export function createRealtimeClient({
  tableSlug,
  token,
  nickname,
  characterId = '',
  onMessage = () => {},
  onStatus = () => {},
  onError = () => {}
}) {
  let socket = null;
  let reconnectTimer = null;
  let manuallyClosed = false;
  let reconnectAttempt = 0;
  let latestPresence = {
    nickname: sanitizeNickname(nickname),
    characterId: trimOrEmpty(characterId)
  };

  function getWebSocketUrl() {
    const origin = getWindowOrigin();
    const url = new URL(origin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = `/api/realtime/${tableSlug}`;
    url.searchParams.set('token', token);
    url.searchParams.set('nickname', latestPresence.nickname);
    if (latestPresence.characterId) url.searchParams.set('character', latestPresence.characterId);
    return url.toString();
  }

  function clearReconnect() {
    if (!reconnectTimer) return;
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  function scheduleReconnect() {
    clearReconnect();
    if (manuallyClosed) return;
    reconnectAttempt += 1;
    const delay = Math.min(8000, 1000 * reconnectAttempt);
    onStatus({ state: 'reconnecting', delay });
    reconnectTimer = setTimeout(connect, delay);
  }

  function send(payload) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  }

  function connect() {
    clearReconnect();
    manuallyClosed = false;
    try {
      socket = new WebSocket(getWebSocketUrl());
    } catch (error) {
      onError(error);
      scheduleReconnect();
      return;
    }

    onStatus({ state: 'connecting' });

    socket.addEventListener('open', () => {
      reconnectAttempt = 0;
      onStatus({ state: 'connected' });
      send({ type: 'presence.update', payload: deepClone(latestPresence) });
    });

    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        onError(error);
      }
    });

    socket.addEventListener('error', (event) => {
      onError(event?.error || new Error('Realtime error'));
    });

    socket.addEventListener('close', () => {
      onStatus({ state: manuallyClosed ? 'disconnected' : 'closed' });
      scheduleReconnect();
    });
  }

  return {
    connect,
    disconnect() {
      manuallyClosed = true;
      clearReconnect();
      if (socket) socket.close(1000, 'client disconnect');
      socket = null;
      onStatus({ state: 'disconnected' });
    },
    syncState(payload) {
      return send({ type: 'state.sync', payload });
    },
    updatePresence(presence) {
      latestPresence = {
        ...latestPresence,
        nickname: sanitizeNickname(presence?.nickname || latestPresence.nickname),
        characterId: trimOrEmpty(presence?.characterId ?? latestPresence.characterId)
      };
      return send({ type: 'presence.update', payload: deepClone(latestPresence) });
    },
    syncTableMeta(payload) {
      return send({ type: 'table.meta', payload: deepClone(payload) });
    },
    publishRollEvent(payload) {
      return send({ type: 'roll.event', payload: deepClone(payload) });
    },
    getStatus() {
      return socket?.readyState ?? WebSocket.CLOSED;
    }
  };
}
