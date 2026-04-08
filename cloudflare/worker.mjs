const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type'
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...headers
    }
  });
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return String(value || 'mesa-singularidade')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'mesa-singularidade';
}

function normalizeRole(role) {
  return ['gm', 'player', 'viewer'].includes(role) ? role : 'viewer';
}

function sanitizeNickname(value) {
  return String(value || '').trim().slice(0, 48) || 'Feiticeiro';
}

function sanitizeText(value, maxLength = 120) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeTableMeta(meta = {}) {
  const source = ensureObject(meta) || {};
  return {
    tableName: sanitizeText(source.tableName || source.name || 'Mesa Singularidade', 72) || 'Mesa Singularidade',
    seriesName: sanitizeText(source.seriesName || 'Jujutsu Kaisen', 72),
    campaignName: sanitizeText(source.campaignName || '', 72),
    episodeNumber: sanitizeText(source.episodeNumber || '', 16),
    episodeTitle: sanitizeText(source.episodeTitle || '', 96),
    sessionDate: sanitizeText(source.sessionDate || '', 32),
    location: sanitizeText(source.location || '', 72),
    status: sanitizeText(source.status || 'Planejamento', 32) || 'Planejamento',
    expectedRoster: sanitizeText(source.expectedRoster || '', 120),
    recap: sanitizeText(source.recap || '', 600),
    objective: sanitizeText(source.objective || '', 320)
  };
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

function randomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function ensureObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function safeParseJson(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

async function runAll(db, sql, bindings = []) {
  const result = await db.prepare(sql).bind(...bindings).all();
  return result.results || [];
}

async function runFirst(db, sql, bindings = []) {
  return db.prepare(sql).bind(...bindings).first();
}

async function runExec(db, sql, bindings = []) {
  return db.prepare(sql).bind(...bindings).run();
}

async function uniqueTableSlug(db, name) {
  const base = slugify(name);
  let candidate = base;
  let index = 2;
  while (await runFirst(db, 'SELECT slug FROM tables WHERE slug = ?', [candidate])) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  const [, contentType, payload] = match;
  const binary = atob(payload);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
  return { contentType, bytes: output };
}

async function getTableRecord(env, slug) {
  return runFirst(
    env.DB,
    `SELECT
      slug,
      name,
      gm_token AS gmToken,
      meta_json AS metaJson,
      state_json AS stateJson,
      last_editor AS lastEditor,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM tables
    WHERE slug = ?`,
    [slug]
  );
}

async function getAccessContext(env, slug, token) {
  const gmTable = await runFirst(
    env.DB,
    `SELECT
      slug,
      name,
      gm_token AS gmToken,
      meta_json AS metaJson,
      state_json AS stateJson,
      last_editor AS lastEditor,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM tables
    WHERE slug = ? AND gm_token = ?`,
    [slug, token]
  );
  if (gmTable) {
    return {
      role: 'gm',
      characterId: '',
      label: 'Mestre',
      table: gmTable
    };
  }

  const table = await getTableRecord(env, slug);
  if (!table) return null;

  const invite = await runFirst(
    env.DB,
    'SELECT role, character_id AS characterId, label FROM table_invites WHERE table_slug = ? AND token = ?',
    [slug, token]
  );
  if (!invite) return null;

  return {
    role: normalizeRole(invite.role),
    characterId: invite.characterId || '',
    label: invite.label || '',
    table
  };
}

function buildInviteUrl(requestUrl, slug, token, role, characterId = '') {
  const url = new URL(requestUrl);
  url.pathname = `/mesa/${encodeURIComponent(slug)}`;
  url.search = '';
  url.hash = '';
  url.searchParams.set('token', token);
  url.searchParams.set('role', normalizeRole(role));
  if (characterId) url.searchParams.set('character', characterId);
  return url.toString();
}

async function saveTableState(db, slug, state, actor = '') {
  await runExec(
    db,
    'UPDATE tables SET state_json = ?, updated_at = ?, last_editor = ? WHERE slug = ?',
    [JSON.stringify(state), nowIso(), actor, slug]
  );
}

async function saveTableMeta(db, slug, name, meta, actor = '') {
  const normalized = normalizeTableMeta(meta);
  await runExec(
    db,
    'UPDATE tables SET name = ?, meta_json = ?, updated_at = ?, last_editor = ? WHERE slug = ?',
    [name || normalized.tableName, JSON.stringify(normalized), nowIso(), actor, slug]
  );
  return normalized;
}

async function createSnapshotRecord(db, slug, label, actor, state) {
  const snapshotId = randomId('snapshot');
  await runExec(
    db,
    'INSERT INTO table_snapshots (id, table_slug, label, actor_name, state_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [snapshotId, slug, label, actor, JSON.stringify(state), nowIso()]
  );
  return snapshotId;
}

async function createInviteRecord(db, slug, role, characterId = '', label = '') {
  const inviteId = randomId('invite');
  const token = randomToken();
  await runExec(
    db,
    'INSERT INTO table_invites (id, table_slug, role, token, character_id, label, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [inviteId, slug, normalizeRole(role), token, characterId || '', label || '', nowIso()]
  );
  return { inviteId, token };
}

function sanitizeJoinCode(value) {
  return String(value || '').replace(/\D+/g, '').slice(0, 6);
}

function normalizeJoinCodeRecord(record = {}) {
  return {
    id: String(record.id || '').trim(),
    tableSlug: String(record.tableSlug || record.table_slug || '').trim(),
    role: normalizeRole(record.role),
    code: sanitizeJoinCode(record.code),
    label: sanitizeText(record.label || '', 64),
    active: record.active !== false && String(record.active ?? '1') !== '0',
    createdAt: String(record.createdAt || record.created_at || '').trim(),
    updatedAt: String(record.updatedAt || record.updated_at || '').trim()
  };
}

async function createJoinCodeRecord(db, slug, role, label = '') {
  let code = '';
  do {
    const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    code = String(value).padStart(6, '0');
  } while (await runFirst(db, 'SELECT id FROM table_join_codes WHERE code = ? AND active = 1', [code]));

  const record = {
    id: randomId('joincode'),
    tableSlug: slug,
    role: normalizeRole(role),
    code,
    label: sanitizeText(label || '', 64),
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  await runExec(
    db,
    'INSERT INTO table_join_codes (id, table_slug, role, code, label, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [record.id, record.tableSlug, record.role, record.code, record.label, 1, record.createdAt, record.updatedAt]
  );

  return record;
}

async function listJoinCodes(db, slug) {
  const rows = await runAll(
    db,
    'SELECT id, table_slug AS tableSlug, role, code, label, active, created_at AS createdAt, updated_at AS updatedAt FROM table_join_codes WHERE table_slug = ? AND active = 1 ORDER BY created_at DESC',
    [slug]
  );
  return rows.map(normalizeJoinCodeRecord);
}

function extractCharacterSummaries(state) {
  const characters = Array.isArray(state?.characters) ? state.characters : [];
  return characters.map((character) => ({
    id: String(character?.id || '').trim(),
    name: sanitizeText(character?.name || 'Feiticeiro', 72) || 'Feiticeiro',
    grade: sanitizeText(character?.grade || '', 32),
    clan: sanitizeText(character?.clan || '', 72)
  })).filter((character) => character.id);
}

function withCors(response) {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
}

function isCanonicalAppPath(pathname = '') {
  const cleanPath = String(pathname || '').replace(/\/+$/, '') || '/';
  if (cleanPath === '/fichas' || cleanPath === '/rolagens' || cleanPath === '/ordem' || cleanPath === '/livro' || cleanPath === '/mesa') {
    return true;
  }
  return /^\/mesa\/[^/]+$/.test(cleanPath);
}

async function serveSpaEntry(request, env) {
  const indexUrl = new URL(request.url);
  indexUrl.pathname = '/index.html';
  indexUrl.search = '';
  indexUrl.hash = '';
  const assetResponse = await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
  return withCors(assetResponse);
}

async function handleReferenceSearch(requestUrl) {
  const url = new URL(requestUrl);
  const query = String(url.searchParams.get('q') || '').trim();
  const scope = ['all', 'lore', 'media'].includes(String(url.searchParams.get('scope') || '').trim())
    ? String(url.searchParams.get('scope') || '').trim()
    : 'all';
  if (!query) return json({ ok: true, query: '', cards: [] });

  const fandomEndpoint = new URL('https://jujutsu-kaisen.fandom.com/api.php');
  fandomEndpoint.searchParams.set('action', 'query');
  fandomEndpoint.searchParams.set('list', 'search');
  fandomEndpoint.searchParams.set('srsearch', query);
  fandomEndpoint.searchParams.set('srlimit', '4');
  fandomEndpoint.searchParams.set('format', 'json');
  fandomEndpoint.searchParams.set('origin', '*');

  const fandomRequest = fetch(fandomEndpoint.toString(), {
    headers: {
      'user-agent': 'SingularidadeCloud/1.0 (+workers)'
    }
  })
    .then((response) => response.json())
    .then((payload) => (payload.query.search || []).map((item) => ({
      id: `fandom-${item.pageid}`,
      title: item.title,
      category: 'Lore / Wiki',
      summary: stripHtml(item.snippet),
      source: 'Jujutsu Kaisen Wiki',
      provider: 'lore',
      url: `https://jujutsu-kaisen.fandom.com/wiki/${encodeURIComponent(String(item.title).replace(/\s+/g, '_'))}`
    })))
    .catch(() => []);

  const anilistRequest = fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'SingularidadeCloud/1.0 (+workers)'
    },
    body: JSON.stringify({
      query: `
        query SearchMedia($search: String) {
          Page(page: 1, perPage: 4) {
            media(search: $search, type_in: [ANIME, MANGA], sort: POPULARITY_DESC) {
              id
              type
              title {
                romaji
                english
              }
              description(asHtml: false)
              siteUrl
              episodes
              chapters
              status
            }
          }
        } ? `,
      variables: { search: query }
    })
  })
    .then((response) => response.json())
    .then((payload) => (payload.data.Page.media || []).map((media) => ({
      id: `anilist-${media.id}`,
      title: media.title.english || media.title.romaji || 'Mídia',
      category: media.type === 'MANGA' ? 'Mangá / Arco' : 'Anime / Episódio',
      summary: stripHtml(media.description || ''),
      source: 'AniList',
      provider: 'media',
      url: media.siteUrl,
      meta: media.episodes ? `${media.episodes} episódios` : media.chapters ? `${media.chapters} capítulos` : media.status || ''
    })))
    .catch(() => []);

  const [fandomCards, anilistCards] = await Promise.all([fandomRequest, anilistRequest]);
  const cards = [...fandomCards, ...anilistCards]
    .filter((card) => scope === 'all' || card.provider === scope)
    .filter((card) => card.title && card.url)
    .filter((card, index, list) => list.findIndex((candidate) => `${candidate.provider}:${candidate.title}` === `${card.provider}:${card.title}`) === index)
    .slice(0, 8);

  return json({
    ok: true,
    query,
    scope,
    cards,
    warning: cards.length ? '' : 'Nenhuma referência externa respondeu com resultados para esta busca.'
  });
}

async function handleCreateTable(request, env) {
  const body = ensureObject(await readJson(request)) || {};
  const meta = normalizeTableMeta(body.meta || { tableName: body.name || 'Mesa Singularidade' });
  const tableName = meta.tableName;
  const localState = ensureObject(body.localState) || {};
  const slug = await uniqueTableSlug(env.DB, tableName);
  const gmToken = randomToken();
  const createdAt = nowIso();
  const nickname = sanitizeNickname(body.nickname);

  await runExec(
    env.DB,
    'INSERT INTO tables (slug, name, gm_token, meta_json, state_json, last_editor, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [slug, tableName, gmToken, JSON.stringify(meta), JSON.stringify(localState), nickname, createdAt, createdAt]
  );

  await createSnapshotRecord(env.DB, slug, 'Snapshot inicial', nickname, localState);

  return json({
    ok: true,
    table: {
      slug,
      name: tableName,
      meta,
      createdAt
    },
    session: {
      tableSlug: slug,
      tableName,
      token: gmToken,
      role: 'gm',
      nickname
    },
    inviteLinks: {
      gm: buildInviteUrl(request.url, slug, gmToken, 'gm')
    }
  }, 201);
}

async function handleGetTable(request, env, slug) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access) return json({ ok: false, error: 'Mesa não encontrada ou token inválido.' }, 404);

  const state = safeParseJson(access.table.stateJson, {});
  const snapshots = await runAll(
    env.DB,
    'SELECT id, label, actor_name AS actorName, created_at AS createdAt FROM table_snapshots WHERE table_slug = ? ORDER BY created_at DESC LIMIT 12',
    [slug]
  );

  return json({
    ok: true,
    table: {
      slug: access.table.slug,
      name: access.table.name,
      meta: normalizeTableMeta(safeParseJson(access.table.metaJson, {})),
      updatedAt: access.table.updatedAt,
      createdAt: access.table.createdAt,
      lastEditor: access.table.lastEditor || '',
      state
    },
    access: {
      role: access.role,
      characterId: access.characterId || '',
      label: access.label || ''
    },
    snapshots
  });
}

async function handleUpdateTable(request, env, slug) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access || access.role !== 'gm') return json({ ok: false, error: 'Apenas o mestre pode atualizar a mesa.' }, 403);

  const body = ensureObject(await readJson(request)) || {};
  const meta = normalizeTableMeta(body.meta || { tableName: body.name || access.table.name });
  const name = sanitizeText(body.name || meta.tableName, 72) || meta.tableName;
  const savedMeta = await saveTableMeta(env.DB, slug, name, meta, sanitizeNickname(body.actor || 'Mestre'));
  const updated = await getTableRecord(env, slug);

  return json({
    ok: true,
    table: {
      slug: updated.slug,
      name: updated.name,
      meta: savedMeta,
      updatedAt: updated.updatedAt,
      createdAt: updated.createdAt,
      lastEditor: updated.lastEditor || ''
    }
  });
}

async function handleCreateInvite(request, env, slug) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access || access.role !== 'gm') return json({ ok: false, error: 'Apenas o mestre pode criar convites.' }, 403);

  const body = ensureObject(await readJson(request)) || {};
  const role = normalizeRole(body.role);
  const characterId = String(body.characterId || '').trim();
  const label = String(body.label || '').trim().slice(0, 64);
  const invite = await createInviteRecord(env.DB, slug, role, characterId, label);

  return json({
    ok: true,
    invite: {
      id: invite.inviteId,
      role,
      characterId,
      label,
      url: buildInviteUrl(request.url, slug, invite.token, role, characterId)
    }
  }, 201);
}

async function handleListJoinCodes(request, env, slug) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access || access.role !== 'gm') return json({ ok: false, error: 'Apenas o mestre pode listar códigos.' }, 403);
  return json({ ok: true, joinCodes: await listJoinCodes(env.DB, slug) });
}

async function handleCreateJoinCode(request, env, slug) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access || access.role !== 'gm') return json({ ok: false, error: 'Apenas o mestre pode gerar códigos.' }, 403);

  const body = ensureObject(await readJson(request)) || {};
  const role = normalizeRole(body.role);
  const label = sanitizeText(body.label || '', 64);
  const joinCode = await createJoinCodeRecord(env.DB, slug, role, label);
  return json({ ok: true, joinCode: normalizeJoinCodeRecord(joinCode) }, 201);
}

async function handleDeleteJoinCode(request, env, slug, joinCodeId) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access || access.role !== 'gm') return json({ ok: false, error: 'Apenas o mestre pode revogar códigos.' }, 403);

  const existing = await runFirst(
    env.DB,
    'SELECT id, code FROM table_join_codes WHERE id = ? AND table_slug = ? AND active = 1',
    [joinCodeId, slug]
  );
  if (!existing) return json({ ok: false, error: 'Código não encontrado.' }, 404);

  await runExec(
    env.DB,
    'UPDATE table_join_codes SET active = 0, updated_at = ? WHERE id = ?',
    [nowIso(), joinCodeId]
  );

  return json({
    ok: true,
    revoked: {
      id: existing.id,
      code: sanitizeJoinCode(existing.code)
    }
  });
}

async function handleJoinByCode(request, env) {
  const body = ensureObject(await readJson(request)) || {};
  const code = sanitizeJoinCode(body.code);
  const nickname = sanitizeNickname(body.nickname);
  const characterId = String(body.characterId || '').trim();
  if (code.length !== 6) return json({ ok: false, error: 'Informe um código numérico de 6 dígitos.' }, 400);

  const joinCode = await runFirst(
    env.DB,
    'SELECT id, table_slug AS tableSlug, role, code, label, active, created_at AS createdAt, updated_at AS updatedAt FROM table_join_codes WHERE code = ? AND active = 1',
    [code]
  );
  if (!joinCode) return json({ ok: false, error: 'Código inválido ou revogado.' }, 404);

  const table = await getTableRecord(env, joinCode.tableSlug);
  if (!table) return json({ ok: false, error: 'Mesa não encontrada para este código.' }, 404);

  const meta = normalizeTableMeta(safeParseJson(table.metaJson, {}));
  const state = safeParseJson(table.stateJson, {});
  const role = normalizeRole(joinCode.role);

  if (role === 'player' && !characterId) {
    return json({
      ok: true,
      requiresCharacter: true,
      role,
      joinCode: normalizeJoinCodeRecord(joinCode),
      table: {
        slug: table.slug,
        name: table.name,
        meta
      },
      characters: extractCharacterSummaries(state)
    });
  }

  if (role === 'player') {
    const validCharacter = extractCharacterSummaries(state).find((character) => character.id === characterId);
    if (!validCharacter) return json({ ok: false, error: 'Escolha um personagem válido para entrar como jogador.' }, 400);
  }

  let session = null;
  if (role === 'gm') {
    session = {
      tableSlug: table.slug,
      tableName: table.name,
      token: table.gmToken,
      role: 'gm',
      nickname,
      characterId: ''
    };
  } else {
    const invite = await createInviteRecord(
      env.DB,
      table.slug,
      role,
      role === 'player' ? characterId : '',
      `Acesso por código ${code}`
    );
    session = {
      tableSlug: table.slug,
      tableName: table.name,
      token: invite.token,
      role,
      nickname,
      characterId: role === 'player' ? characterId : ''
    };
  }

  return json({
    ok: true,
    role,
    table: {
      slug: table.slug,
      name: table.name,
      meta
    },
    session
  });
}

async function handleImportLocal(request, env, slug) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access || access.role !== 'gm') return json({ ok: false, error: 'Apenas o mestre pode importar um estado enviado pelo navegador.' }, 403);

  const body = ensureObject(await readJson(request)) || {};
  const state = ensureObject(body.state);
  if (!state) return json({ ok: false, error: 'Estado inválido para importação.' }, 400);

  await saveTableState(env.DB, slug, state, sanitizeNickname(body.actor || access.label || 'Mestre'));
  await createSnapshotRecord(env.DB, slug, body.label || 'Importacao enviada', sanitizeNickname(body.actor || access.label || 'Mestre'), state);

  return json({ ok: true, table: { slug, updatedAt: nowIso() } });
}

async function handleCreateSnapshot(request, env, slug) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access || access.role === 'viewer') return json({ ok: false, error: 'Seu papel não permite criar snapshots.' }, 403);

  const body = ensureObject(await readJson(request)) || {};
  const table = access.table;
  const state = ensureObject(body.state) || safeParseJson(table.stateJson, {});
  const label = String(body.label || 'Snapshot manual').trim().slice(0, 64) || 'Snapshot manual';
  const actor = sanitizeNickname(body.actor || access.label || 'Mestre');
  const snapshotId = await createSnapshotRecord(env.DB, slug, label, actor, state);

  return json({
    ok: true,
    snapshot: {
      id: snapshotId,
      label,
      actorName: actor,
      createdAt: nowIso()
    }
  }, 201);
}

async function handleListSnapshots(request, env, slug) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access) return json({ ok: false, error: 'Mesa não encontrada ou token inválido.' }, 404);

  const snapshots = await runAll(
    env.DB,
    'SELECT id, label, actor_name AS actorName, created_at AS createdAt FROM table_snapshots WHERE table_slug = ? ORDER BY created_at DESC LIMIT 20',
    [slug]
  );

  return json({ ok: true, snapshots });
}

async function handleRestoreSnapshot(request, env, slug, snapshotId) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access || access.role !== 'gm') return json({ ok: false, error: 'Apenas o mestre pode restaurar snapshots.' }, 403);

  const snapshot = await runFirst(
    env.DB,
    'SELECT id, state_json, label FROM table_snapshots WHERE table_slug = ? AND id = ?',
    [slug, snapshotId]
  );
  if (!snapshot) return json({ ok: false, error: 'Snapshot não encontrado.' }, 404);

  const state = safeParseJson(snapshot.state_json, {});
  await saveTableState(env.DB, slug, state, 'Restaurado de snapshot');

  return json({
    ok: true,
    restored: {
      id: snapshot.id,
      label: snapshot.label
    },
    state
  });
}

async function handleAvatarUpload(request, env) {
  const url = new URL(request.url);
  const tableSlug = url.searchParams.get('table') || '';
  const token = url.searchParams.get('token') || '';
  const access = await getAccessContext(env, tableSlug, token);
  if (!env.AVATARS) return json({ ok: false, error: 'Bucket de avatar ainda não habilitado na conta Cloudflare.' }, 503);
  if (!access || access.role === 'viewer') return json({ ok: false, error: 'Seu papel não permite enviar avatares.' }, 403);

  const body = ensureObject(await readJson(request)) || {};
  const parsed = parseDataUrl(body.dataUrl);
  if (!parsed) return json({ ok: false, error: 'Formato de avatar inválido.' }, 400);

  const extension = parsed.contentType.includes('png') ? 'png'
    : parsed.contentType.includes('jpeg') || parsed.contentType.includes('jpg') ? 'jpg'
      : parsed.contentType.includes('webp') ? 'webp'
        : 'bin';
  const key = `avatars/${tableSlug}/${randomId('avatar')}.${extension}`;

  await env.AVATARS.put(key, parsed.bytes, {
    httpMetadata: {
      contentType: parsed.contentType,
      cacheControl: 'public, max-age=604800'
    }
  });

  return json({
    ok: true,
    key,
    url: `/api/assets/avatar/${key}`
  }, 201);
}

async function handleAvatarFetch(request, env, key) {
  if (!env.AVATARS) return new Response('Avatar bucket disabled', { status: 503, headers: CORS_HEADERS });
  const object = await env.AVATARS.get(key);
  if (!object) return new Response('Not found', { status: 404, headers: CORS_HEADERS });

  const headers = new Headers(CORS_HEADERS);
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', headers.get('cache-control') || 'public, max-age=604800');

  return new Response(object.body, { headers });
}

async function handleRealtime(request, env, slug) {
  if ((request.headers.get('upgrade') || '').toLowerCase() !== 'websocket') {
    return json({ ok: false, error: 'Realtime exige upgrade websocket.' }, 426);
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const nickname = sanitizeNickname(url.searchParams.get('nickname'));
  const characterId = url.searchParams.get('character') || '';
  const access = await getAccessContext(env, slug, token);
  if (!access) return json({ ok: false, error: 'Mesa não encontrada ou token inválido.' }, 404);

  const objectId = env.TABLE_ROOM.idFromName(slug);
  const stub = env.TABLE_ROOM.get(objectId);
  const headers = new Headers(request.headers);
  headers.set('x-singularidade-slug', slug);
  headers.set('x-singularidade-role', access.role);
  headers.set('x-singularidade-nickname', nickname || access.label || 'Feiticeiro');
  headers.set('x-singularidade-character', access.characterId || characterId || '');
  return stub.fetch('https://room.internal/ws', {
    method: 'GET',
    headers
  });
}

async function routeApi(request, env, ctx) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  if (pathname === '/api/health' && request.method === 'GET') {
    return json({
      ok: true,
      service: 'singularidade-cloud',
      platform: 'cloudflare-workers',
      capabilities: {
        realtime: true,
        snapshots: true,
        avatars: Boolean(env.AVATARS),
        references: true
      }
    });
  }

  const dbSession = typeof env.DB?.withSession === 'function'
    ? env.DB.withSession(request.headers.get('x-d1-bookmark') || 'first-primary')
    : env.DB;
  const runtimeEnv = dbSession === env.DB ? env : { ...env, DB: dbSession };
  const withBookmark = async (responsePromise) => {
    const response = await responsePromise;
    if (typeof dbSession?.getBookmark === 'function') {
      const bookmark = dbSession.getBookmark();
      if (bookmark) response.headers.set('x-d1-bookmark', bookmark);
    }
    return response;
  };

  if (pathname === '/api/tables' && request.method === 'POST') return withBookmark(handleCreateTable(request, runtimeEnv));
  if (pathname === '/api/join/code' && request.method === 'POST') return withBookmark(handleJoinByCode(request, runtimeEnv));
  if (pathname === '/api/reference/search' && request.method === 'GET') return handleReferenceSearch(request.url);
  if (pathname === '/api/uploads/avatar' && request.method === 'POST') return withBookmark(handleAvatarUpload(request, runtimeEnv));

  const avatarMatch = pathname.match(/^\/api\/assets\/avatar\/(.+)$/);
  if (avatarMatch && request.method === 'GET') {
    return handleAvatarFetch(request, env, avatarMatch[1]);
  }

  const tableSnapshotRestoreMatch = pathname.match(/^\/api\/tables\/([^/]+)\/snapshots\/([^/]+)\/restore$/);
  if (tableSnapshotRestoreMatch && request.method === 'POST') {
    return withBookmark(handleRestoreSnapshot(request, runtimeEnv, decodeURIComponent(tableSnapshotRestoreMatch[1]), decodeURIComponent(tableSnapshotRestoreMatch[2])));
  }

  const tableSnapshotsMatch = pathname.match(/^\/api\/tables\/([^/]+)\/snapshots$/);
  if (tableSnapshotsMatch && request.method === 'GET') {
    return withBookmark(handleListSnapshots(request, runtimeEnv, decodeURIComponent(tableSnapshotsMatch[1])));
  }

  const tableSnapshotCreateMatch = pathname.match(/^\/api\/tables\/([^/]+)\/snapshot$/);
  if (tableSnapshotCreateMatch && request.method === 'POST') {
    return withBookmark(handleCreateSnapshot(request, runtimeEnv, decodeURIComponent(tableSnapshotCreateMatch[1])));
  }

  const tableInviteMatch = pathname.match(/^\/api\/tables\/([^/]+)\/invites$/);
  if (tableInviteMatch && request.method === 'POST') {
    return withBookmark(handleCreateInvite(request, runtimeEnv, decodeURIComponent(tableInviteMatch[1])));
  }

  const tableJoinCodeMatch = pathname.match(/^\/api\/tables\/([^/]+)\/join-codes$/);
  if (tableJoinCodeMatch && request.method === 'GET') {
    return withBookmark(handleListJoinCodes(request, runtimeEnv, decodeURIComponent(tableJoinCodeMatch[1])));
  }
  if (tableJoinCodeMatch && request.method === 'POST') {
    return withBookmark(handleCreateJoinCode(request, runtimeEnv, decodeURIComponent(tableJoinCodeMatch[1])));
  }

  const tableJoinCodeDeleteMatch = pathname.match(/^\/api\/tables\/([^/]+)\/join-codes\/([^/]+)$/);
  if (tableJoinCodeDeleteMatch && request.method === 'DELETE') {
    return withBookmark(handleDeleteJoinCode(request, runtimeEnv, decodeURIComponent(tableJoinCodeDeleteMatch[1]), decodeURIComponent(tableJoinCodeDeleteMatch[2])));
  }

  const tableImportMatch = pathname.match(/^\/api\/tables\/([^/]+)\/import-local$/);
  if (tableImportMatch && request.method === 'POST') {
    return withBookmark(handleImportLocal(request, runtimeEnv, decodeURIComponent(tableImportMatch[1])));
  }

  const realtimeMatch = pathname.match(/^\/api\/realtime\/([^/]+)$/);
  if (realtimeMatch) {
    return withBookmark(handleRealtime(request, runtimeEnv, decodeURIComponent(realtimeMatch[1])));
  }

  const tableMatch = pathname.match(/^\/api\/tables\/([^/]+)$/);
  if (tableMatch && request.method === 'GET') {
    return withBookmark(handleGetTable(request, runtimeEnv, decodeURIComponent(tableMatch[1])));
  }
  if (tableMatch && request.method === 'PATCH') {
    return withBookmark(handleUpdateTable(request, runtimeEnv, decodeURIComponent(tableMatch[1])));
  }

  return null;
}

export class TableRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.connections = new Map();
    this.tableSlug = '';
    this.cachedState = null;
  }

  async fetch(request) {
    if ((request.headers.get('upgrade') || '').toLowerCase() !== 'websocket') {
      return json({ ok: true, room: this.tableSlug || 'unbound' });
    }

    const slug = request.headers.get('x-singularidade-slug') || '';
    const role = normalizeRole(request.headers.get('x-singularidade-role'));
    const nickname = sanitizeNickname(request.headers.get('x-singularidade-nickname'));
    const characterId = request.headers.get('x-singularidade-character') || '';

    this.tableSlug = slug;
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    await this.acceptConnection(server, { role, nickname, characterId });
    return new Response(null, { status: 101, webSocket: client });
  }

  async loadState() {
    if (this.cachedState) return this.cachedState;
    const table = await getTableRecord(this.env, this.tableSlug);
    this.cachedState = safeParseJson(table.stateJson, {});
    return this.cachedState;
  }

  getPresence() {
    const stateCharacters = Array.isArray(this.cachedState?.characters) ? this.cachedState.characters : [];
    return Array.from(this.connections.entries()).map(([id, connection]) => ({
      id,
      nickname: connection.nickname,
      role: connection.role,
      characterId: connection.characterId || '',
      characterName: stateCharacters.find((character) => String(character?.id || '').trim() === String(connection.characterId || '').trim())?.name || ''
    }));
  }

  send(socket, message) {
    try {
      socket.send(JSON.stringify(message));
    } catch (error) {
      return false;
    }
    return true;
  }

  broadcast(message, exceptId = '') {
    for (const [id, connection] of this.connections.entries()) {
      if (exceptId && id === exceptId) continue;
      this.send(connection.socket, message);
    }
  }

  async acceptConnection(socket, info) {
    socket.accept();
    const socketId = randomId('member');
    this.connections.set(socketId, {
      socket,
      nickname: info.nickname,
      role: info.role,
      characterId: info.characterId || ''
    });

    this.send(socket, {
      type: 'hello',
      payload: {
        state: await this.loadState(),
        presence: this.getPresence()
      }
    });
    this.broadcast({ type: 'presence', payload: this.getPresence() });

    socket.addEventListener('message', async (event) => {
      await this.handleMessage(socketId, event);
    });
    socket.addEventListener('close', () => {
      this.connections.delete(socketId);
      this.broadcast({ type: 'presence', payload: this.getPresence() });
    });
    socket.addEventListener('error', () => {
      this.connections.delete(socketId);
      this.broadcast({ type: 'presence', payload: this.getPresence() });
    });
  }

  async handleMessage(socketId, event) {
    const connection = this.connections.get(socketId);
    if (!connection) return;

    let message = null;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      this.send(connection.socket, { type: 'error', payload: { message: 'Mensagem inválida.' } });
      return;
    }

    if (message.type === 'presence.update') {
      connection.nickname = sanitizeNickname(message.payload.nickname || connection.nickname);
      connection.characterId = String(message.payload.characterId || connection.characterId || '').trim();
      this.broadcast({ type: 'presence', payload: this.getPresence() });
      return;
    }

    if (message.type === 'table.meta') {
      if (connection.role !== 'gm') {
        this.send(connection.socket, { type: 'error', payload: { message: 'Somente o mestre atualiza os dados da mesa.' } });
        return;
      }

      const meta = normalizeTableMeta(message.payload.meta || {});
      const name = sanitizeText(message.payload.name || meta.tableName, 72) || meta.tableName;
      await saveTableMeta(this.env.DB, this.tableSlug, name, meta, connection.nickname);
      const table = await getTableRecord(this.env, this.tableSlug);
      this.broadcast({
        type: 'table.meta',
        payload: {
          slug: this.tableSlug,
          name: table.name || name,
          meta,
          updatedAt: table.updatedAt || nowIso(),
          lastEditor: table.lastEditor || connection.nickname
        }
      });
      this.send(connection.socket, {
        type: 'ack',
        payload: {
          updatedAt: table.updatedAt || nowIso()
        }
      });
      return;
    }

    if (message.type === 'roll.event') {
      if (connection.role === 'viewer') {
        this.send(connection.socket, { type: 'error', payload: { message: 'Espectadores não podem publicar rolagens.' } });
        return;
      }

      const payload = ensureObject(message.payload) || {};
      if (connection.role === 'player' && connection.characterId) {
        const rollCharacterId = String(payload.roll?.characterId || '').trim();
        if (rollCharacterId && rollCharacterId !== connection.characterId) {
          this.send(connection.socket, { type: 'error', payload: { message: 'Este link de jogador está vinculado a outro personagem.' } });
          return;
        }
      }

      this.broadcast({
        type: 'roll.event',
        payload: {
          ...payload,
          actor: sanitizeNickname(payload.actor || connection.nickname),
          updatedAt: payload.updatedAt || nowIso()
        }
      }, socketId);
      return;
    }

    if (message.type !== 'state.sync') return;
    if (connection.role === 'viewer') {
      this.send(connection.socket, { type: 'error', payload: { message: 'Espectadores não podem editar a mesa.' } });
      return;
    }

    const nextState = ensureObject(message.payload.state);
    if (!nextState) {
      this.send(connection.socket, { type: 'error', payload: { message: 'Estado inválido para sincronização.' } });
      return;
    }

    this.cachedState = nextState;
    await saveTableState(this.env.DB, this.tableSlug, nextState, connection.nickname);
    this.broadcast({
      type: 'state',
      payload: {
        state: nextState,
        actor: connection.nickname,
        reason: sanitizeText(message.payload.reason || 'state-sync', 48),
        updatedAt: nowIso()
      }
    }, socketId);
    this.send(connection.socket, {
      type: 'ack',
      payload: {
        updatedAt: nowIso()
      }
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    const apiResponse = await routeApi(request, env, ctx);
    if (apiResponse) return apiResponse;

    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return Response.redirect(new URL('/fichas', request.url).toString(), 302);
    }

    if (env.ASSETS.fetch) {
      if (isCanonicalAppPath(url.pathname)) {
        return serveSpaEntry(request, env);
      }
      const assetResponse = await env.ASSETS.fetch(request);
      return withCors(assetResponse);
    }

    return json({ ok: false, error: 'Static assets binding não configurado.' }, 500);
  }
};





