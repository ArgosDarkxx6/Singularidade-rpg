import { STORAGE_KEY, VIEW_LABELS } from './core/constants.js';
import { buildAppUrl, parseAppLocation } from './core/router.js';
import {
  copyText,
  deepClone,
  downloadTextFile,
  formatTimestamp,
  parseTags,
  readFileAsDataUrl,
  readFileAsText,
  safeNumber
} from './core/utils.js';
import {
  buildTableContextLabel,
  buildTableEpisodeLabel,
  buildInviteUrl,
  clearOnlineSession,
  createApiClient,
  createRealtimeClient,
  normalizeTableMeta,
  persistOnlineCache,
  persistOnlineSession,
  readOnlineCache,
  readOnlineSession,
  sanitizeNickname
} from './core/online.js';
import {
  createDefaultState,
  createDisasterEvent,
  createLogEntry,
  makeCharacter,
  normalizeState,
  uniquifyCharacterName
} from './core/model.js';
import {
  buildNpcInitiative,
  buildPcInitiative,
  buildRollMeta,
  buildRollOutcome,
  contextLabel,
  evaluateDifficulty,
  getFlags,
  getPendingDisasters,
  parseDiceNotation,
  rollDice,
  sortOrderEntries
} from './core/rules.js';
import {
  parseCharacterSheetText,
  parseCharacterSheetsText,
  serializeCharacterToText
} from './core/parsers.js';
import { upgradeCustomSelects } from './ui/custom-select.js';
import { renderButtonLabel, renderIcon } from './ui/icons.js';
import { createUiLayer } from './ui/overlays.js';
import { renderMobileShell } from './mobile/shell.js';
import { updateMobileCompendiumView } from './mobile/views/compendium.js';
import {
  renderAttributesSection,
  renderCharacterList,
  renderConditionsSection,
  renderIdentitySection,
  renderInventorySection,
  renderMiniHud,
  renderSheetQuickLinks,
  renderPassivesSection,
  renderResourceSection,
  renderSidebarDisasterMini,
  renderTechniquesSection,
  renderVowsSection,
  renderWeaponsSection
} from './views/sheet.js';
import { renderOnlineHubSection } from './views/online.js';
import {
  renderCustomRollSection,
  renderGuidedRollSection,
  renderLogSection,
  renderRollSummarySection
} from './views/rolls.js';
import { renderOrderControlsSection, renderOrderListSection } from './views/order.js';
import { renderMesaSection } from './views/mesa.js';
import { renderCompendiumSection } from './views/compendium.js';
import { createModalActions } from './views/modals.js';

const dom = {};
const runtime = {
  state: null,
  ui: {
    currentView: 'sheet',
    activeCharacterId: ''
  },
  lastRoll: null,
  editMode: false,
  compendiumQuery: '',
  compendiumCategory: 'all',
  compendiumFocusSearch: false,
  viewport: {
    mode: 'desktop',
    width: 0,
    height: 0
  },
  online: {
    platformAvailable: false,
    platformChecked: false,
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
    error: '',
    isApplyingRemoteState: false
  }
};

let ui = null;
let modalActions = null;
let api = null;
let realtimeClient = null;
let syncTimer = null;
let referenceTimer = null;
let resizeRenderFrame = null;

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches;
}

function getViewportSnapshot() {
  if (typeof window === 'undefined') {
    return { mode: 'desktop', width: 0, height: 0 };
  }
  return {
    mode: isMobileViewport() ? 'mobile' : 'desktop',
    width: window.innerWidth,
    height: window.innerHeight
  };
}

function syncViewportState() {
  runtime.viewport = getViewportSnapshot();
}

function isEditableElement(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable) return true;
  if (element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') return true;
  if (element.tagName !== 'INPUT') return false;
  const type = String(element.getAttribute('type') || 'text').toLowerCase();
  return !['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'].includes(type);
}

function getRenderContext() {
  return { dom, runtime, state: getStateSnapshot(), actions };
}

function renderCompendiumSurfaces() {
  if (!dom.compendiumSection) return;
  const ctx = getRenderContext();
  renderCompendiumSection(ctx);
  if (isMobileViewport() && runtime.ui.currentView === 'compendium' && dom.mobileViewHost) {
    updateMobileCompendiumView(ctx, dom.mobileViewHost);
  }
}

function getRouteContext(locationLike = globalThis.location) {
  return parseAppLocation(locationLike);
}

function syncBrowserRoute(viewName = runtime.ui?.currentView || 'sheet', options = {}) {
  if (typeof window === 'undefined' || !window.history?.pushState) return;
  const routeView = viewName || 'sheet';
  const routeTableSlug = options.tableSlug ?? (routeView === 'mesa' ? runtime.online.session?.tableSlug || getRouteContext().tableSlug : '');
  const url = buildAppUrl(routeView, {
    origin: window.location.origin,
    tableSlug: routeTableSlug,
    query: options.query || {}
  });

  if (url.pathname === window.location.pathname && url.search === window.location.search && !options.force) return;

  if (options.replace) window.history.replaceState({}, '', url.toString());
  else window.history.pushState({}, '', url.toString());
}

function applyRouteFromLocation(options = {}) {
  if (typeof window === 'undefined') return getRouteContext();

  const route = getRouteContext(window.location);
  if (route.redirectTo && window.history?.replaceState) {
    const redirect = new URL(window.location.href);
    redirect.pathname = route.redirectTo;
    redirect.search = '';
    redirect.hash = '';
    window.history.replaceState({}, '', redirect.toString());
  }

  if (runtime.ui.currentView !== route.view) runtime.ui.currentView = route.view;

  if (options.render) renderApp();
  return route;
}

function normalizeLocalUiState(raw = {}, sharedState = runtime.state || createDefaultState()) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const characters = Array.isArray(sharedState?.characters) ? sharedState.characters : [];
  const currentView = ['sheet', 'rolls', 'order', 'compendium', 'mesa'].includes(source.currentView)
    ? source.currentView
    : 'sheet';
  const activeCharacterId = characters.some((character) => character.id === source.activeCharacterId)
    ? source.activeCharacterId
    : (characters[0]?.id || '');

  return {
    currentView,
    activeCharacterId
  };
}

function getStateSnapshot() {
  return {
    ...runtime.state,
    currentView: runtime.ui.currentView,
    activeCharacterId: runtime.ui.activeCharacterId
  };
}

function reconcileUiState(raw = {}) {
  runtime.ui = normalizeLocalUiState({
    currentView: raw.currentView ?? runtime.ui.currentView,
    activeCharacterId: raw.activeCharacterId ?? runtime.ui.activeCharacterId
  }, runtime.state);
}

function cacheDom() {
  dom.characterList = document.getElementById('characterList');
  dom.onlineHubSection = document.getElementById('onlineHubSection');
  dom.mobileChrome = document.getElementById('mobileChrome');
  dom.mobileViewHost = document.getElementById('mobileViewHost');
  dom.miniHud = document.getElementById('miniHud');
  dom.sidebarDisasterMini = document.getElementById('sidebarDisasterMini');
  dom.identitySection = document.getElementById('identitySection');
  dom.sheetQuickLinksSection = document.getElementById('sheetQuickLinksSection');
  dom.resourceSection = document.getElementById('resourceSection');
  dom.conditionsSection = document.getElementById('conditionsSection');
  dom.attributesSection = document.getElementById('attributesSection');
  dom.weaponsSection = document.getElementById('weaponsSection');
  dom.techniquesSection = document.getElementById('techniquesSection');
  dom.passivesSection = document.getElementById('passivesSection');
  dom.vowsSection = document.getElementById('vowsSection');
  dom.inventorySection = document.getElementById('inventorySection');
  dom.guidedRollSection = document.getElementById('guidedRollSection');
  dom.customRollSection = document.getElementById('customRollSection');
  dom.rollSummarySection = document.getElementById('rollSummarySection');
  dom.logSection = document.getElementById('logSection');
  dom.mesaSection = document.getElementById('mesaSection');
  dom.orderControlsSection = document.getElementById('orderControlsSection');
  dom.orderListSection = document.getElementById('orderListSection');
  dom.compendiumSection = document.getElementById('compendiumSection');
  dom.mainShell = document.querySelector('.main-shell');
  dom.contentShell = document.querySelector('.content-shell');
  dom.modalRoot = document.getElementById('modalRoot');
  dom.toastRoot = document.getElementById('toastRoot');
  dom.views = {
    sheet: document.getElementById('sheetView'),
    rolls: document.getElementById('rollsView'),
    order: document.getElementById('orderView'),
    compendium: document.getElementById('compendiumView'),
    mesa: document.getElementById('mesaView')
  };
  dom.navButtons = Array.from(document.querySelectorAll('.nav-button'));
  dom.editModeToggle = document.getElementById('editModeToggle');
  dom.saveStateButton = document.getElementById('saveStateButton');
  dom.addConditionButton = document.getElementById('addConditionButton');
  dom.addTechniqueButton = document.getElementById('addTechniqueButton');
  dom.addWeaponButton = document.getElementById('addWeaponButton');
  dom.addPassiveButton = document.getElementById('addPassiveButton');
  dom.addVowButton = document.getElementById('addVowButton');
  dom.addInventoryItemButton = document.getElementById('addInventoryItemButton');
  dom.addCombatantButton = document.getElementById('addCombatantButton');
  dom.openCharacterManagerButton = document.getElementById('openCharacterManagerButton');
  dom.copyLogButton = document.getElementById('copyLogButton');
  dom.clearLogButton = document.getElementById('clearLogButton');
  dom.downloadRulesButton = document.getElementById('downloadRulesButton');
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const state = createDefaultState();
      return { state, ui: normalizeLocalUiState({}, state) };
    }
    const parsed = JSON.parse(raw);
    const state = normalizeState(parsed);
    return { state, ui: normalizeLocalUiState(parsed, state) };
  } catch (error) {
    const state = createDefaultState();
    return { state, ui: normalizeLocalUiState({}, state) };
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getStateSnapshot()));
}

function persistOnlineRuntime() {
  if (runtime.online.session) persistOnlineSession(runtime.online.session);
  else clearOnlineSession();

  persistOnlineCache({
    session: runtime.online.session,
    table: runtime.online.table,
    lastSyncAt: runtime.online.lastSyncAt,
    state: runtime.state
  });
}

function setOnlineStatus(status, error = '') {
  runtime.online.status = status;
  runtime.online.error = error;
}

function clearSyncQueue() {
  if (!syncTimer) return;
  clearTimeout(syncTimer);
  syncTimer = null;
}

function clearReferenceQueue() {
  if (!referenceTimer) return;
  clearTimeout(referenceTimer);
  referenceTimer = null;
}

function applyRemoteState(nextState, meta = {}) {
  runtime.online.isApplyingRemoteState = true;
  runtime.state = normalizeState(nextState);
  reconcileUiState();
  runtime.lastRoll = null;
  persistState();
  runtime.online.lastSyncAt = meta.updatedAt || new Date().toISOString();
  runtime.online.isApplyingRemoteState = false;
}

function handleRealtimeMessage(message) {
  if (message.type === 'hello') {
    runtime.online.members = message.payload?.presence || [];
    if (message.payload?.state) applyRemoteState(message.payload.state, { updatedAt: new Date().toISOString() });
    persistOnlineRuntime();
    renderApp();
    return;
  }

  if (message.type === 'presence') {
    runtime.online.members = message.payload || [];
    persistOnlineRuntime();
    renderApp();
    return;
  }

  if (message.type === 'table.meta') {
    runtime.online.table = {
      ...runtime.online.table,
      ...message.payload,
      meta: normalizeTableMeta(message.payload?.meta || { tableName: message.payload?.name || runtime.online.table?.name })
    };
    runtime.online.lastSyncAt = message.payload?.updatedAt || new Date().toISOString();
    persistOnlineRuntime();
    renderApp();
    return;
  }

  if (message.type === 'state') {
    if (message.payload?.state) {
      applyRemoteState(message.payload.state, { updatedAt: message.payload.updatedAt });
      ui.toast('Mesa sincronizada', `${message.payload.actor || 'Outro usuário'} atualizou o estado online.`, 'info');
      persistOnlineRuntime();
      renderApp();
    }
    return;
  }

  if (message.type === 'roll.event') {
    if (message.payload?.roll) {
      runtime.lastRoll = message.payload.roll;
      renderApp();
    }
    return;
  }

  if (message.type === 'ack') {
    runtime.online.lastSyncAt = message.payload?.updatedAt || new Date().toISOString();
    setOnlineStatus('connected');
    persistOnlineRuntime();
    renderApp();
    return;
  }

  if (message.type === 'error') {
    setOnlineStatus('error', message.payload?.message || 'Erro de realtime');
    ui.toast('Sync online', message.payload?.message || 'Erro na sincronização ao vivo.', 'danger');
    renderApp();
  }
}

async function refreshCloudSnapshots() {
  if (!runtime.online.session || !runtime.online.platformAvailable) return [];
  try {
    const payload = await api.getSnapshots(runtime.online.session.tableSlug, runtime.online.session.token);
    runtime.online.snapshots = payload.snapshots || [];
    renderApp();
    return runtime.online.snapshots;
  } catch (error) {
    setOnlineStatus('error', error.message);
    ui.toast('Snapshots', error.message, 'danger');
    renderApp();
    return [];
  }
}

async function refreshJoinCodes(options = {}) {
  if (!runtime.online.session || !runtime.online.platformAvailable || runtime.online.session.role !== 'gm') {
    runtime.online.joinCodes = [];
    if (!options.silent) renderApp();
    return [];
  }

  try {
    const payload = await api.getJoinCodes(runtime.online.session.tableSlug, runtime.online.session.token);
    runtime.online.joinCodes = payload.joinCodes || [];
    if (!options.silent) renderApp();
    return runtime.online.joinCodes;
  } catch (error) {
    runtime.online.joinCodes = [];
    if (!options.silent) {
      setOnlineStatus('error', error.message);
      ui.toast('Códigos da mesa', error.message, 'danger');
      renderApp();
    }
    return [];
  }
}

async function searchHybridReferences(query) {
  const cleanQuery = String(query || '').trim();
  if (!runtime.online.platformAvailable || cleanQuery.length < 2) {
    runtime.online.references = [];
    runtime.online.referencesLoading = false;
    renderCompendiumSurfaces();
    return;
  }

  runtime.online.referencesLoading = true;
  renderCompendiumSurfaces();

  try {
    const payload = await api.searchReferences(cleanQuery);
    runtime.online.references = payload.cards || [];
  } catch (error) {
    runtime.online.references = [];
  } finally {
    runtime.online.referencesLoading = false;
    renderCompendiumSurfaces();
  }
}

function scheduleReferenceSearch(query) {
  clearReferenceQueue();
  referenceTimer = setTimeout(() => {
    searchHybridReferences(query);
  }, 260);
}

async function pushStateToCloud(reason = 'state-sync') {
  if (!runtime.online.session || !runtime.online.platformAvailable || runtime.online.isApplyingRemoteState) return;
  if (!canMutateGlobal()) return;

  setOnlineStatus('syncing');
  renderApp();

  const payload = {
    state: runtime.state,
    reason
  };

  try {
    const sent = realtimeClient?.syncState(payload);
    if (!sent) {
      await api.importLocalState(runtime.online.session.tableSlug, runtime.online.session.token, {
        state: runtime.state,
        actor: runtime.online.session.nickname,
        label: 'Sync por fallback HTTP'
      });
      runtime.online.lastSyncAt = new Date().toISOString();
      setOnlineStatus('connected');
      persistOnlineRuntime();
      renderApp();
    }
  } catch (error) {
    setOnlineStatus('error', error.message);
    ui.toast('Sync online', error.message, 'danger');
    renderApp();
  }
}

function queueCloudSync(reason = 'state-sync') {
  if (!runtime.online.session || !runtime.online.platformAvailable || runtime.online.isApplyingRemoteState) return;
  clearSyncQueue();
  syncTimer = setTimeout(() => {
    pushStateToCloud(reason);
  }, 220);
}

function teardownRealtime() {
  realtimeClient?.disconnect();
  realtimeClient = null;
}

async function joinOnlineSession(session, options = {}) {
  if (!session) return false;
  if (!runtime.online.platformAvailable) {
    ui.toast('Cloudflare indisponivel', 'O servidor atual nao expos a API online. A mesa continua disponivel apenas no navegador por enquanto.', 'warning');
    return false;
  }

  teardownRealtime();
  const nickname = sanitizeNickname(session.nickname || runtime.online.session?.nickname || getActiveCharacter()?.name || 'Feiticeiro');
  runtime.online.session = {
    ...runtime.online.session,
    ...session,
    nickname
  };
  setOnlineStatus('connecting');
  renderApp();

  try {
    const payload = await api.getTable(runtime.online.session.tableSlug, runtime.online.session.token);
    runtime.online.session = {
      ...runtime.online.session,
      tableName: payload.table?.name || runtime.online.session.tableName,
      role: payload.access?.role || runtime.online.session.role || 'viewer',
      characterId: payload.access?.characterId || runtime.online.session.characterId || '',
      nickname
    };
    runtime.online.table = {
      slug: payload.table.slug,
      name: payload.table.name,
      meta: normalizeTableMeta(payload.table.meta || { tableName: payload.table.name }),
      updatedAt: payload.table.updatedAt,
      createdAt: payload.table.createdAt,
      lastEditor: payload.table.lastEditor || ''
    };
    runtime.online.snapshots = payload.snapshots || [];
    runtime.online.members = [];
    runtime.online.pendingCodeJoin = null;

    if (payload.table?.state && options.applyRemote !== false) {
      applyRemoteState(payload.table.state, { updatedAt: payload.table.updatedAt });
    }

    realtimeClient = createRealtimeClient({
      tableSlug: runtime.online.session.tableSlug,
      token: runtime.online.session.token,
      nickname: runtime.online.session.nickname,
      characterId: runtime.online.session.characterId,
      onMessage: handleRealtimeMessage,
      onStatus(info) {
        setOnlineStatus(info.state);
        renderApp();
      },
      onError(error) {
        setOnlineStatus('error', error?.message || 'Erro de realtime');
        renderApp();
      }
    });
    realtimeClient.connect();
    if (runtime.online.session.role === 'gm') await refreshJoinCodes({ silent: true });
    else runtime.online.joinCodes = [];
    persistOnlineRuntime();
    runtime.ui.currentView = 'mesa';
    if (runtime.online.session.characterId) runtime.ui.activeCharacterId = runtime.online.session.characterId;
    reconcileUiState();
    persistState();
    syncBrowserRoute('mesa', {
      replace: true,
      tableSlug: runtime.online.session.tableSlug
    });
    renderApp();
    return true;
  } catch (error) {
    teardownRealtime();
    setOnlineStatus('error', error.message);
    runtime.online.joinCodes = [];
    ui.toast('Mesa online', error.message, 'danger');
    renderApp();
    return false;
  }
}

async function bootstrapOnlinePlatform() {
  runtime.online.platformAvailable = await api.health();
  runtime.online.platformChecked = true;

  const cached = readOnlineCache();
  if (!runtime.online.platformAvailable && cached?.state) {
    runtime.state = normalizeState(cached.state);
    reconcileUiState();
    persistState();
  }

  const session = readOnlineSession();
  if (session) {
    await joinOnlineSession(session);
  } else {
    renderApp();
  }
}

function disconnectOnlineSession() {
  teardownRealtime();
  clearSyncQueue();
  runtime.online.session = null;
  runtime.online.table = null;
  runtime.online.members = [];
  runtime.online.snapshots = [];
  runtime.online.joinCodes = [];
  runtime.online.pendingCodeJoin = null;
  runtime.online.lastInvite = null;
  runtime.online.references = [];
  setOnlineStatus(runtime.online.platformAvailable ? 'offline' : 'warning');
  clearOnlineSession();
  persistOnlineRuntime();
  if (runtime.ui.currentView === 'mesa') {
    syncBrowserRoute('mesa', { replace: true, tableSlug: '' });
  }
  renderApp();
  ui.toast('Sessão online encerrada', 'A conexão com a mesa foi encerrada. O navegador manteve apenas o cache mais recente.', 'warning');
}

function getActiveCharacter() {
  return runtime.state.characters.find((character) => character.id === runtime.ui.activeCharacterId) || runtime.state.characters[0];
}

function getCharacterById(id) {
  return runtime.state.characters.find((character) => character.id === id) || null;
}

function getOnlineRole() {
  return runtime.online.session?.role || 'gm';
}

function getLinkedCharacterId() {
  return runtime.online.session?.characterId || '';
}

function canMutateGlobal() {
  return !runtime.online.session || getOnlineRole() !== 'viewer';
}

function canMutateCharacter(characterId) {
  if (!runtime.online.session) return true;
  const role = getOnlineRole();
  if (role === 'gm') return true;
  if (role === 'viewer') return false;
  const linkedCharacterId = getLinkedCharacterId();
  if (!linkedCharacterId) return runtime.ui.activeCharacterId === characterId;
  return linkedCharacterId === characterId;
}

function canManageRoster() {
  return !runtime.online.session || getOnlineRole() === 'gm';
}

function blockByRole(message, tone = 'warning') {
  ui.toast('Ação bloqueada', message, tone);
  return false;
}

function pushLog(entry) {
  runtime.state.log.unshift(entry);
  runtime.state.log = runtime.state.log.slice(0, 200);
}

function pushDisasterHistory(draft, title, text) {
  draft.disaster.history.unshift(createDisasterEvent(title, text));
  draft.disaster.history = draft.disaster.history.slice(0, 24);
}

function saveStateButtonToast() {
  persistState();
  ui.toast('Salvo', 'Estado sincronizado no cache do navegador.', 'success');
}

function commit(mutator, options = {}) {
  const previousState = deepClone(runtime.state);
  mutator(runtime.state);
  runtime.state = normalizeState(runtime.state);
  reconcileUiState();
  if (typeof options.after === 'function') {
    options.after(previousState, runtime.state);
  }
  persistState();
  persistOnlineRuntime();
  renderApp();
  queueCloudSync(options.syncReason || 'state-commit');
}

function publishRealtimeRoll(roll, reason = 'roll-event') {
  if (!runtime.online.session || !runtime.online.platformAvailable || !roll) return;
  realtimeClient?.publishRollEvent({
    roll: deepClone(roll),
    actor: runtime.online.session.nickname,
    reason,
    updatedAt: new Date().toISOString()
  });
}

function updateCharacter(characterId, mutator, options = {}) {
  if (!canMutateCharacter(characterId)) {
    blockByRole('Seu papel na mesa nao permite alterar esta ficha.');
    return;
  }
  commit((draft) => {
    const character = draft.characters.find((item) => item.id === characterId);
    if (!character) return;
    mutator(character, draft);
  }, {
    after(previousState, nextState) {
      syncAutomaticStates(previousState, nextState);
      if (typeof options.after === 'function') options.after(previousState, nextState);
    }
  });
}

function syncAutomaticStates(previousState, nextState) {
  nextState.characters.forEach((character) => {
    const previousCharacter = previousState.characters.find((item) => item.id === character.id);
    const previousFlags = previousCharacter ? getFlags(previousCharacter) : { exhaustion: false };
    const currentFlags = getFlags(character);

    if (!previousFlags.exhaustion && currentFlags.exhaustion) {
      ui.toast('Exaustao ativada', `${character.name} ficou sem EA. -2 em tudo.`, 'warning');
      pushLog(createLogEntry({
        category: 'Status',
        title: `Exaustao ativada - ${character.name}`,
        text: 'EA zerada. O personagem sofre -2 em todos os atributos e perde acesso a tecnicas e reforco.'
      }));
    }

    if (previousFlags.exhaustion && !currentFlags.exhaustion) {
      ui.toast('Exaustao desativada', `${character.name} recuperou EA suficiente para sair da Exaustao.`, 'success');
      pushLog(createLogEntry({
        category: 'Status',
        title: `Exaustao encerrada - ${character.name}`,
        text: 'O personagem voltou a usar seus atributos sem a penalidade da Exaustao.'
      }));
    }
  });
}

function scrollMainToTop() {
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  const scroller = dom.mainShell || dom.contentShell;
  if (scroller?.scrollTo) scroller.scrollTo({ top: 0, behavior: 'auto' });
}

function clearTransientHash() {
  if (typeof window === 'undefined' || !window.location?.hash || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState({}, '', url.toString());
}

function scheduleViewTopReset() {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  clearTransientHash();
  scrollMainToTop();
  if (typeof window === 'undefined') return;

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => scrollMainToTop());
  }
}

function setView(viewName, options = {}) {
  runtime.ui.currentView = VIEW_LABELS[viewName] ? viewName : 'sheet';
  syncBrowserRoute(runtime.ui.currentView, {
    replace: Boolean(options.replace),
    tableSlug: options.tableSlug,
    query: options.query
  });
  scheduleViewTopReset();
  renderApp();
}

function setActiveCharacter(characterId) {
  if (!canMutateCharacter(characterId) && runtime.online.session) {
    blockByRole('Este link esta vinculado a outro personagem da mesa.');
    return;
  }
  runtime.ui.activeCharacterId = characterId;
  reconcileUiState();
  renderApp();
}

function toggleEditMode() {
  if (runtime.online.session && getOnlineRole() !== 'gm') {
    blockByRole('Somente o mestre entra no modo de edição estrutural.');
    return;
  }
  runtime.editMode = !runtime.editMode;
  renderApp();
  ui.toast(
    runtime.editMode ? 'Modo edição ligado' : 'Modo edição desligado',
    runtime.editMode ? 'Campos estruturais liberados.' : 'Somente recursos, rolagens, condições e ordem seguem editáveis.',
    runtime.editMode ? 'warning' : 'success'
  );
}

function adjustResource(characterId, resourceKey, delta) {
  updateCharacter(characterId, (character) => {
    const block = character.resources[resourceKey];
    if (!block) return;
    block.current = Math.max(0, Math.min(block.max, block.current + delta));
  });
}

function setResourceCurrent(characterId, resourceKey, value) {
  updateCharacter(characterId, (character) => {
    const block = character.resources[resourceKey];
    if (!block) return;
    block.current = Math.max(0, Math.min(block.max, safeNumber(value, block.current)));
  });
}

function setResourceMax(characterId, resourceKey, value) {
  updateCharacter(characterId, (character) => {
    const block = character.resources[resourceKey];
    if (!block) return;
    block.max = Math.max(resourceKey === 'energy' ? 0 : 1, safeNumber(value, block.max));
    block.current = Math.max(0, Math.min(block.max, block.current));
  });
}

function setCharacterField(characterId, fieldPath, value) {
  updateCharacter(characterId, (character) => {
    const path = fieldPath.split('.');
    let ref = character;
    for (let index = 0; index < path.length - 1; index += 1) ref = ref[path[index]];
    ref[path[path.length - 1]] = value;
  });
}

function setCharacterAvatarUrl(characterId, url) {
  updateCharacter(characterId, (character) => {
    character.avatarMode = url ? 'url' : 'none';
    character.avatar = url;
  }, {
    after() {
      ui.toast('Avatar atualizado', url ? 'URL do avatar salva.' : 'Avatar removido.', url ? 'success' : 'warning');
    }
  });
}

async function setCharacterAvatarUpload(characterId, file) {
  const dataUrl = await readFileAsDataUrl(file);
  let avatarSource = dataUrl;

  if (runtime.online.session && runtime.online.platformAvailable) {
    try {
      const payload = await api.uploadAvatar(runtime.online.session.tableSlug, runtime.online.session.token, {
        dataUrl,
        fileName: file?.name || 'avatar'
      });
      avatarSource = payload.url || dataUrl;
    } catch (error) {
      ui.toast('Upload remoto indisponível', 'O avatar será mantido localmente nesta sessão.', 'warning');
    }
  }

  updateCharacter(characterId, (character) => {
    character.avatarMode = 'upload';
    character.avatar = avatarSource;
  }, {
    after() {
      ui.toast('Avatar atualizado', runtime.online.session ? 'Imagem vinculada à mesa online.' : 'Imagem carregada para a ficha.', 'success');
    }
  });
}

function clearCharacterAvatar(characterId) {
  updateCharacter(characterId, (character) => {
    character.avatarMode = 'none';
    character.avatar = '';
  }, {
    after() {
      ui.toast('Avatar removido', 'A ficha voltou para o placeholder.', 'warning');
    }
  });
}

function setAttributeValue(characterId, attributeKey, value) {
  updateCharacter(characterId, (character) => {
    character.attributes[attributeKey].value = safeNumber(value, character.attributes[attributeKey].value);
  });
}

function setAttributeRank(characterId, attributeKey, rank) {
  updateCharacter(characterId, (character) => {
    character.attributes[attributeKey].rank = rank;
  });
}

function addCondition(characterId, payload) {
  updateCharacter(characterId, (character) => {
    character.conditions.push({
      id: `condition_${Date.now().toString(36)}`,
      name: payload.name,
      color: payload.color,
      note: payload.note
    });
  }, {
    after() {
      ui.toast('Condição aplicada', `${payload.name} adicionada à ficha.`, 'success');
      pushLog(createLogEntry({ category: 'Condição', title: `${payload.name} aplicada`, text: payload.note || 'Sem nota adicional.' }));
    }
  });
}

function removeCondition(characterId, conditionId) {
  const character = getCharacterById(characterId);
  const condition = character?.conditions.find((item) => item.id === conditionId);
  updateCharacter(characterId, (draftCharacter) => {
    draftCharacter.conditions = draftCharacter.conditions.filter((item) => item.id !== conditionId);
  }, {
    after() {
      ui.toast('Condição removida', condition?.name || 'Condição removida.', 'warning');
      pushLog(createLogEntry({ category: 'Condição', title: 'Condição removida', text: condition?.name || '' }));
    }
  });
}

function saveCollectionItem(collectionKey, item) {
  if (collectionKey === 'inventory') {
    updateCharacter(getActiveCharacter().id, (character) => {
      const items = character.inventory.items;
      const index = items.findIndex((entry) => entry.id === item.id);
      const normalized = {
        id: item.id || `inventory_${Date.now().toString(36)}`,
        name: item.name,
        quantity: Math.max(1, safeNumber(item.quantity, 1)),
        effect: item.effect || ''
      };
      if (index >= 0) items.splice(index, 1, normalized);
      else items.push(normalized);
    }, {
      after() {
        ui.toast('Inventário atualizado', `${item.name} salvo.`, 'success');
        pushLog(createLogEntry({ category: 'Inventário', title: 'Inventário atualizado', text: item.name }));
      }
    });
    return;
  }

  updateCharacter(getActiveCharacter().id, (character) => {
    const collection = character[collectionKey] || [];
    const index = collection.findIndex((entry) => entry.id === item.id);
    const normalized = { ...item };
    if (!normalized.id) normalized.id = `${collectionKey}_${Date.now().toString(36)}`;
    if (normalized.tags) normalized.tags = parseTags(normalized.tags);
    if (collectionKey === 'techniques') normalized.cost = safeNumber(normalized.cost, 0);
    if (index >= 0) collection.splice(index, 1, normalized);
    else collection.push(normalized);
    character[collectionKey] = collection;
  }, {
    after() {
      const titles = {
        techniques: 'Técnica salva',
        weapons: 'Arma salva',
        passives: 'Passiva salva',
        vows: 'Voto salvo'
      };
      ui.toast(titles[collectionKey] || 'Item salvo', `${item.name} atualizado na ficha.`, 'success');
      pushLog(createLogEntry({ category: 'Ficha', title: titles[collectionKey] || 'Item salvo', text: item.name }));
    }
  });
}

function removeCollectionItem(collectionKey, itemId, itemName) {
  if (collectionKey === 'inventory') {
    updateCharacter(getActiveCharacter().id, (character) => {
      character.inventory.items = character.inventory.items.filter((item) => item.id !== itemId);
    }, {
      after() {
        ui.toast('Item removido', itemName || 'Removido do inventário.', 'warning');
        pushLog(createLogEntry({ category: 'Inventário', title: 'Item removido', text: itemName || '' }));
      }
    });
    return;
  }

  updateCharacter(getActiveCharacter().id, (character) => {
    character[collectionKey] = (character[collectionKey] || []).filter((item) => item.id !== itemId);
  }, {
    after() {
      ui.toast('Item removido', itemName || 'Removido da ficha.', 'warning');
      pushLog(createLogEntry({ category: 'Ficha', title: 'Item removido', text: itemName || collectionKey }));
    }
  });
}

function setInventoryMoney(characterId, value) {
  updateCharacter(characterId, (character) => {
    character.inventory.money = Math.max(0, safeNumber(value, character.inventory.money));
  });
}

function executeAttributeRoll(characterId, attributeKey, context, extraBonus = 0, tn = null) {
  if (!canMutateCharacter(characterId)) {
    blockByRole('Seu papel na mesa não permite rolar por esta ficha.');
    return;
  }
  const character = getCharacterById(characterId);
  if (!character) return;

  const result = buildRollOutcome(character, attributeKey, context, extraBonus, Math.random, tn);
  commit((draft) => {
    runtime.lastRoll = result;
    const draftCharacter = draft.characters.find((item) => item.id === characterId);
    if (result.isBlackFlash && draftCharacter) {
      draftCharacter.resources.energy.current = Math.min(
        draftCharacter.resources.energy.max,
        draftCharacter.resources.energy.current + 1
      );
    }
    if (result.isFumble) {
      draft.disaster.criticalFailures += 1;
      pushDisasterHistory(draft, 'Falha crítica automática', `${character.name} falhou criticamente em ${result.attributeLabel}.`);
    }

    const titleBase = context === 'physical-attack'
      ? 'Ataque físico'
      : context === 'ranged-attack'
        ? 'Ataque à distância'
        : context === 'domain-clash'
          ? 'Conflito de domínio'
          : 'Teste padrão';

    pushLog(createLogEntry({
      category: 'Rolagem',
      title: `${titleBase} — ${character.name}`,
      text: `${result.attributeLabel} | d20 ${result.natural} ${result.effectiveModifier >= 0 ? '+' : ''}${result.effectiveModifier} = ${result.total}`,
      meta: buildRollMeta(result)
    }));
  }, {
    after(previousState, nextState) {
      publishRealtimeRoll(result, 'attribute-roll');
      if (result.isBlackFlash) {
        ui.toast('Black Flash', `${character.name} ativou Black Flash e recuperou +1 EA.`, 'success');
      }
      const previousMilestones = getPendingDisasters(previousState.disaster);
      const currentMilestones = getPendingDisasters(nextState.disaster);
      if (result.isFumble && currentMilestones > previousMilestones) {
        ui.toast('Limiar de desastre alcançado', `${nextState.disaster.threshold} falhas críticas acumuladas pelo grupo.`, 'warning');
      }
    }
  });
}

function executeCustomRoll(expression, bonus, label, tn = null) {
  if (!canMutateGlobal()) {
    blockByRole('Seu papel na mesa não permite registrar novas rolagens.');
    return;
  }
  const parsed = parseDiceNotation(expression);
  if (!parsed) {
    ui.toast('Expressão inválida', 'Use formatos como 2d10, 1d6+3 ou 8.', 'danger');
    return;
  }

  const outcome = rollDice(parsed);
  const extraBonus = safeNumber(bonus, 0);
  const total = outcome.total + extraBonus;
  const difficulty = evaluateDifficulty(total, tn);
  runtime.lastRoll = {
    custom: true,
    expression: parsed.raw,
    label: label || 'Rolagem customizada',
    natural: outcome.rolls[0] || null,
    rolls: outcome.rolls,
    subtotal: outcome.subtotal,
    bonus: outcome.bonus + extraBonus,
    total,
    tn: difficulty.tn,
    tnResult: difficulty.tnResult,
    margin: difficulty.margin,
    outcomeLabel: difficulty.outcomeLabel,
    isCritical: false,
    isFumble: false,
    isBlackFlash: false,
    notes: []
  };

  commit(() => {
    pushLog(createLogEntry({
      category: 'Rolagem',
      title: label || 'Rolagem customizada',
      text: `${parsed.raw}${extraBonus ? ` ${extraBonus >= 0 ? '+' : ''}${extraBonus}` : ''} = ${total}`,
      meta: [
        difficulty.tn !== null ? `TN ${difficulty.tn}: ${difficulty.outcomeLabel} (${difficulty.margin >= 0 ? '+' : ''}${difficulty.margin})` : '',
        outcome.rolls.length ? `Rolagens: ${outcome.rolls.join(', ')}` : 'Valor fixo'
      ].filter(Boolean).join(' | ')
    }));
  });
  publishRealtimeRoll(runtime.lastRoll, 'custom-roll');
}

function copyLogToClipboard() {
  const text = runtime.state.log
    .map((entry) => `[${formatTimestamp(entry.timestamp)}] ${entry.category} — ${entry.title}\n${entry.text}${entry.meta ? `\n${entry.meta}` : ''}`)
    .join('\n\n');

  copyText(text)
    .then(() => ui.toast('Rolagem copiada', 'Log enviado para a área de transferência.', 'success'))
    .catch(() => ui.toast('Não foi possível copiar', 'Seu navegador bloqueou a área de transferência.', 'danger'));
}

function copyLogAnchor(entryId) {
  const url = new URL(window.location.href);
  url.hash = `log-${entryId}`;
  copyText(url.toString())
    .then(() => ui.toast('Âncora copiada', 'Link direto para este evento enviado para a área de transferência.', 'success'))
    .catch(() => ui.toast('Não foi possível copiar', 'Seu navegador bloqueou a área de transferência.', 'danger'));
}

function clearLog() {
  commit((draft) => {
    draft.log = [createLogEntry({ category: 'Sistema', title: 'Log limpo', text: 'Histórico reiniciado.' })];
  }, {
    after() {
      ui.toast('Log limpo', 'O histórico foi reiniciado.', 'warning');
    }
  });
}

function exportState() {
  downloadTextFile(
    `singularidade-state-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`,
    JSON.stringify(runtime.state, null, 2),
    'application/json;charset=utf-8'
  );
  ui.toast('Exportação pronta', 'JSON salvo com o estado completo da mesa.', 'success');
}

function importStateFromText(rawText) {
  if (!canMutateGlobal()) {
    blockByRole('Seu papel não permite importar um estado inteiro da mesa.');
    return;
  }
  try {
    const parsed = JSON.parse(rawText);
    runtime.state = normalizeState(parsed);
    runtime.ui = normalizeLocalUiState(parsed, runtime.state);
    runtime.lastRoll = null;
    persistState();
    renderApp();
    ui.toast('Importado', 'Estado completo restaurado.', 'success');
  } catch (error) {
    ui.toast('Importação falhou', 'JSON inválido ou incompatível.', 'danger');
  }
}

async function importStateFromFile(file) {
  const rawText = await readFileAsText(file);
  importStateFromText(rawText);
}

function reloadPersistentState() {
  if (runtime.online.session) {
    ui.toast('Cache do navegador', 'O estado local continua disponível, mas a mesa online segue sendo a fonte principal.', 'info');
  }
  const loadedState = loadState();
  runtime.state = loadedState.state;
  runtime.ui = loadedState.ui;
  runtime.lastRoll = null;
  renderApp();
  ui.toast('Cache recarregado', 'O estado salvo no navegador foi restaurado.', 'success');
}

function resetState() {
  if (!canMutateGlobal()) {
    blockByRole('Seu papel não permite resetar o estado da mesa.');
    return;
  }
  runtime.state = createDefaultState();
  runtime.ui = normalizeLocalUiState({}, runtime.state);
  runtime.lastRoll = null;
  persistState();
  renderApp();
  ui.toast('Estado padrão', 'Mesa reiniciada com Mysto e Kayo.', 'warning');
}

function downloadRules() {
  const anchor = document.createElement('a');
  anchor.href = 'assets/Singularidade_Livro_de_Regras.pdf';
  anchor.download = 'Singularidade_Livro_de_Regras.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function addCombatant(payload) {
  if (runtime.online.session && getOnlineRole() !== 'gm') {
    blockByRole('Somente o mestre pode alterar a ordem da mesa.');
    return;
  }
  commit((draft) => {
    draft.order.entries.push({
      id: `order_${Date.now().toString(36)}`,
      name: payload.type === 'pc'
        ? (draft.characters.find((character) => character.id === payload.characterId)?.name || 'PC')
        : payload.name,
      type: payload.type,
      characterId: payload.type === 'pc' ? payload.characterId : null,
      init: null,
      modifier: payload.type === 'npc' ? safeNumber(payload.modifier, 0) : 0,
      notes: payload.notes || ''
    });
  }, {
    after() {
      ui.toast('Combatente adicionado', payload.type === 'pc' ? 'Personagem enviado para a ordem.' : `${payload.name} entrou na lista.`, 'success');
    }
  });
}

function removeCombatant(entryId) {
  if (runtime.online.session && getOnlineRole() !== 'gm') {
    blockByRole('Somente o mestre pode alterar a ordem da mesa.');
    return;
  }
  commit((draft) => {
    draft.order.entries = draft.order.entries.filter((entry) => entry.id !== entryId);
    draft.order.turn = Math.max(0, Math.min(draft.order.turn, Math.max(draft.order.entries.length - 1, 0)));
  }, {
    after() {
      ui.toast('Combatente removido', 'Entrada retirada da ordem.', 'warning');
    }
  });
}

function updateOrderNotes(entryId, notes) {
  if (runtime.online.session && getOnlineRole() !== 'gm') {
    blockByRole('Somente o mestre pode alterar notas da ordem.');
    return;
  }
  commit((draft) => {
    const entry = draft.order.entries.find((item) => item.id === entryId);
    if (!entry) return;
    entry.notes = notes;
  });
}

function rollOrderInitiative() {
  if (runtime.online.session && getOnlineRole() !== 'gm') {
    blockByRole('Somente o mestre pode rolar a iniciativa da ordem.');
    return;
  }
  commit((draft) => {
    draft.order.entries = draft.order.entries.map((entry) => {
      if (entry.type === 'pc' && entry.characterId) {
        const character = draft.characters.find((item) => item.id === entry.characterId);
        if (!character) return entry;
        const result = buildPcInitiative(character);
        pushLog(createLogEntry({
          category: 'Iniciativa',
          title: `Iniciativa — ${character.name}`,
          text: `1d20 (${result.natural}) + max(Velocidade, Lutar) (${result.modifier}) = ${result.total}`
        }));
        return { ...entry, name: character.name, init: result.total };
      }
      const result = buildNpcInitiative(entry.modifier);
      pushLog(createLogEntry({
        category: 'Iniciativa',
        title: `Iniciativa — ${entry.name}`,
        text: `1d20 (${result.natural}) + modificador (${result.modifier}) = ${result.total}`
      }));
      return { ...entry, init: result.total };
    });
    draft.order.entries = sortOrderEntries(draft.order.entries);
    draft.order.turn = draft.order.entries.length ? 0 : 0;
  }, {
    after() {
      ui.toast('Ordem atualizada', 'Iniciativa automática gerada e ordenada.', 'success');
    }
  });
}

function manualSortOrder() {
  if (runtime.online.session && getOnlineRole() !== 'gm') {
    blockByRole('Somente o mestre pode reordenar a fila.');
    return;
  }
  commit((draft) => {
    draft.order.entries = sortOrderEntries(draft.order.entries);
    draft.order.turn = Math.max(0, Math.min(draft.order.turn, Math.max(draft.order.entries.length - 1, 0)));
  }, {
    after() {
      ui.toast('Ordem atualizada', 'Lista ordenada do maior para o menor.', 'success');
    }
  });
}

function goToNextTurn(step) {
  if (runtime.online.session && getOnlineRole() !== 'gm') {
    blockByRole('Somente o mestre pode avançar ou recuar turnos.');
    return;
  }
  commit((draft) => {
    const entries = draft.order.entries;
    if (!entries.length) return;
    let nextTurn = draft.order.turn + step;
    if (step > 0 && nextTurn >= entries.length) {
      draft.order.round += 1;
      nextTurn = 0;
    }
    if (step < 0 && nextTurn < 0) {
      draft.order.round = Math.max(1, draft.order.round - 1);
      nextTurn = entries.length - 1;
    }
    draft.order.turn = Math.max(0, Math.min(nextTurn, entries.length - 1));
  });
}

function resetOrder() {
  if (runtime.online.session && getOnlineRole() !== 'gm') {
    blockByRole('Somente o mestre pode resetar a ordem.');
    return;
  }
  commit((draft) => {
    draft.order.round = 1;
    draft.order.turn = 0;
  }, {
    after() {
      ui.toast('Contadores resetados', 'Round e turno voltaram ao início.', 'warning');
    }
  });
}

function adjustCriticalFailures(delta) {
  if (runtime.online.session && getOnlineRole() !== 'gm') {
    blockByRole('Somente o mestre pode ajustar o caos da sessão.');
    return;
  }
  commit((draft) => {
    draft.disaster.criticalFailures = Math.max(0, draft.disaster.criticalFailures + delta);
    pushDisasterHistory(draft, delta >= 0 ? 'Falha crítica registrada' : 'Falha crítica removida', 'Ajuste manual');
  }, {
    after(previousState, nextState) {
      const previousMilestones = getPendingDisasters(previousState.disaster);
      const currentMilestones = getPendingDisasters(nextState.disaster);
      if (currentMilestones > previousMilestones) {
        ui.toast('Limiar de desastre alcançado', `A sessão acumulou ${nextState.disaster.threshold} falhas críticas.`, 'warning');
        pushLog(createLogEntry({
          category: 'Desastre',
          title: 'Desastre narrativo pronto',
          text: `${nextState.disaster.threshold} falhas críticas alcançadas pelo grupo.`
        }));
      } else {
        ui.toast('Contador atualizado', 'Falhas críticas da sessão ajustadas.', delta >= 0 ? 'success' : 'warning');
      }
    }
  });
}

function addCharacter(payload) {
  if (!canManageRoster()) {
    blockByRole('Somente o mestre pode alterar o elenco da mesa online.');
    return;
  }
  commit((draft) => {
    const character = makeCharacter({
      name: payload.name,
      age: safeNumber(payload.age, 0),
      clan: payload.clan,
      grade: payload.grade,
      appearance: payload.appearance,
      resources: {
        hp: { current: Math.max(1, safeNumber(payload.hpMax, 20)), max: Math.max(1, safeNumber(payload.hpMax, 20)) },
        energy: { current: Math.max(0, safeNumber(payload.energyMax, 10)), max: Math.max(0, safeNumber(payload.energyMax, 10)) },
        sanity: { current: Math.max(1, safeNumber(payload.sanityMax, 50)), max: Math.max(1, safeNumber(payload.sanityMax, 50)) }
      }
    });
    draft.characters.push(character);
  }, {
    after() {
      const activeCharacter = runtime.state.characters[runtime.state.characters.length - 1];
      runtime.ui.activeCharacterId = activeCharacter?.id || runtime.ui.activeCharacterId;
      runtime.ui.currentView = 'sheet';
      reconcileUiState();
      ui.toast('Personagem adicionado', `${payload.name} entrou para o elenco.`, 'success');
      pushLog(createLogEntry({ category: 'Ficha', title: 'Novo personagem', text: payload.name }));
    }
  });
}

function removeCharacter(characterId) {
  if (!canManageRoster()) {
    blockByRole('Somente o mestre pode excluir personagens da mesa online.');
    return false;
  }
  const character = getCharacterById(characterId);
  if (!character) return false;
  if (runtime.state.characters.length <= 1) {
    ui.toast('Exclusão bloqueada', 'O elenco precisa manter ao menos um personagem ativo.', 'warning');
    return false;
  }

  let removed = false;
  commit((draft) => {
    const index = draft.characters.findIndex((entry) => entry.id === characterId);
    if (index < 0) return;

    draft.characters.splice(index, 1);
    removed = true;

    draft.order.entries = draft.order.entries.filter((entry) => entry.characterId !== characterId);
    if (!draft.order.entries.length) {
      draft.order.turn = 0;
      draft.order.round = 1;
    } else {
      draft.order.turn = Math.max(0, Math.min(draft.order.turn, draft.order.entries.length - 1));
      draft.order.round = Math.max(1, draft.order.round);
    }
  }, {
    after() {
      if (!removed) return;
      if (runtime.ui.activeCharacterId === characterId) {
        const characters = runtime.state.characters;
        runtime.ui.activeCharacterId = characters[0]?.id || '';
        reconcileUiState();
      }
      ui.toast('Personagem removido', `${character.name} saiu do elenco ativo.`, 'warning');
      pushLog(createLogEntry({ category: 'Ficha', title: 'Personagem removido', text: character.name }));
    }
  });

  return removed;
}

function importCharactersFromText(rawText) {
  if (!canManageRoster()) {
    blockByRole('Somente o mestre pode importar novas fichas para o elenco online.');
    return;
  }
  const parsed = parseCharacterSheetsText(rawText);
  if (!parsed.length) {
    ui.toast('Ficha não reconhecida', 'Cole uma ficha com o formato textual do sistema.', 'danger');
    return;
  }

  commit((draft) => {
    const imported = parsed.map((character) => {
      const next = makeCharacter(character);
      next.name = uniquifyCharacterName(next.name, draft.characters);
      draft.characters.push(next);
      return next;
    });
  }, {
    after() {
      runtime.ui.activeCharacterId = parsed.length ? runtime.state.characters[runtime.state.characters.length - 1]?.id || runtime.ui.activeCharacterId : runtime.ui.activeCharacterId;
      runtime.ui.currentView = 'sheet';
      reconcileUiState();
      ui.toast('Ficha importada', `${parsed.length} personagem(ns) convertido(s) do texto.`, 'success');
      pushLog(createLogEntry({
        category: 'Mesa',
        title: 'Ficha de texto convertida',
        text: `${parsed.map((character) => character.name).join(', ')} entrou/entraram no elenco.`
      }));
    }
  });
}

function copyActiveCharacterText() {
  const text = serializeCharacterToText(getActiveCharacter());
  copyText(text)
    .then(() => ui.toast('Ficha copiada', 'A ficha em texto foi enviada para a área de transferência.', 'success'))
    .catch(() => ui.toast('Falha ao copiar', 'Seu navegador bloqueou a área de transferência.', 'danger'));
}

function downloadActiveCharacterText() {
  const character = getActiveCharacter();
  const safeName = character.name.toLowerCase().replace(/\s+/g, '-');
  downloadTextFile(`${safeName || 'personagem'}.txt`, serializeCharacterToText(character));
  ui.toast('Texto gerado', 'A ficha textual foi baixada.', 'success');
}

function setCompendiumQuery(query) {
  runtime.compendiumQuery = query;
  scheduleReferenceSearch(query);
  renderCompendiumSurfaces();
}

function setCompendiumCategory(category) {
  runtime.compendiumCategory = category;
  renderCompendiumSurfaces();
}

function focusCompendiumSearch() {
  runtime.compendiumFocusSearch = true;
  if (runtime.ui.currentView !== 'compendium') {
    setView('compendium');
    return;
  }
  renderCompendiumSurfaces();
}

function openCompendiumReference(query, scope = 'all') {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return;
  runtime.compendiumCategory = 'all';
  runtime.compendiumQuery = cleanQuery;
  scheduleReferenceSearch(cleanQuery);
  runtime.compendiumFocusSearch = true;
  if (runtime.ui.currentView !== 'compendium') {
    setView('compendium');
    return;
  }
  renderCompendiumSurfaces();
}

async function createOnlineTable(payload) {
  if (!runtime.online.platformAvailable) {
    blockByRole('A API online ainda não está disponível neste ambiente. Publique no Cloudflare para ativar a mesa em nuvem.', 'warning');
    return false;
  }

  try {
    const meta = normalizeTableMeta(payload.meta || { tableName: payload.name });
    const response = await api.createTable({
      name: meta.tableName || payload.name,
      nickname: sanitizeNickname(payload.nickname),
      localState: runtime.state,
      meta
    });
    runtime.online.lastInvite = response.inviteLinks?.gm || null;
    const joined = await joinOnlineSession(response.session, { applyRemote: false });
    if (joined) {
      await refreshCloudSnapshots();
      await refreshJoinCodes({ silent: true });
      ui.toast('Mesa online criada', `${response.table.name} já está pronta para links e sync ao vivo.`, 'success');
    }
    return joined;
  } catch (error) {
    ui.toast('Mesa online', error.message, 'danger');
    return false;
  }
}

async function updateOnlineTableMeta(payload) {
  if (!runtime.online.session) {
    ui.toast('Sem mesa online', 'Entre em uma mesa antes de editar os dados da sessão.', 'warning');
    return false;
  }
  if (getOnlineRole() !== 'gm') {
    blockByRole('Somente o mestre altera os dados da mesa.');
    return false;
  }

  try {
    const meta = normalizeTableMeta(payload.meta || { tableName: payload.name });
    const response = await api.updateTable(runtime.online.session.tableSlug, runtime.online.session.token, {
      name: meta.tableName || payload.name,
      meta
    });
    runtime.online.table = {
      ...runtime.online.table,
      ...response.table
    };
    runtime.online.session = {
      ...runtime.online.session,
      tableName: response.table?.name || runtime.online.session.tableName
    };
    runtime.online.lastSyncAt = response.table?.updatedAt || new Date().toISOString();
    persistOnlineRuntime();
    realtimeClient?.syncTableMeta({
      name: response.table?.name || meta.tableName,
      meta: response.table?.meta || meta,
      actor: runtime.online.session.nickname
    });
    ui.toast('Mesa atualizada', 'Os dados da sessão foram sincronizados para todos os conectados.', 'success');
    renderApp();
    return true;
  } catch (error) {
    ui.toast('Mesa', error.message, 'danger');
    return false;
  }
}

async function connectToInviteLink(inviteUrl, nickname) {
  const raw = String(inviteUrl || '').trim();
  if (!raw) {
    ui.toast('Link ausente', 'Cole um link de mestre, jogador ou espectador para entrar na mesa.', 'warning');
    return false;
  }

  try {
    const url = new URL(raw);
    const parsedInvite = readOnlineSession(null, url) || {};
    const session = {
      ...parsedInvite,
      nickname: sanitizeNickname(nickname)
    };

    if (!session.tableSlug || !session.token) {
      ui.toast('Link inválido', 'O link não contém os parâmetros de acesso da mesa.', 'danger');
      return false;
    }

    runtime.online.pendingCodeJoin = null;
    return joinOnlineSession(session);
  } catch (error) {
    ui.toast('Link inválido', 'Cole um link completo gerado pela central online da mesa.', 'danger');
    return false;
  }
}

async function createInviteLink(payload) {
  if (!runtime.online.session) {
    ui.toast('Sem mesa online', 'Crie ou entre em uma mesa antes de gerar convites.', 'warning');
    return null;
  }

  try {
    const response = await api.createInvite(runtime.online.session.tableSlug, runtime.online.session.token, payload);
    runtime.online.lastInvite = response.invite?.url || null;
    renderApp();
    ui.toast('Convite gerado', `${payload.role === 'gm' ? 'Mestre' : payload.role === 'player' ? 'Jogador' : 'Espectador'} pronto para copiar.`, 'success');
    return response.invite;
  } catch (error) {
    ui.toast('Convite', error.message, 'danger');
    return null;
  }
}

async function createJoinCode(payload) {
  if (!runtime.online.session) {
    ui.toast('Sem mesa online', 'Crie ou entre em uma mesa antes de gerar códigos.', 'warning');
    return null;
  }

  try {
    const response = await api.createJoinCode(runtime.online.session.tableSlug, runtime.online.session.token, payload);
    await refreshJoinCodes({ silent: true });
    renderApp();
    ui.toast('Código gerado', `Código ${response.joinCode?.code || ''} pronto para ${payload.role === 'gm' ? 'mestre' : payload.role === 'player' ? 'jogador' : 'espectador'}.`, 'success');
    return response.joinCode;
  } catch (error) {
    ui.toast('Código da mesa', error.message, 'danger');
    return null;
  }
}

async function revokeJoinCode(joinCodeId) {
  if (!runtime.online.session) {
    ui.toast('Sem mesa online', 'Entre em uma mesa antes de revogar códigos.', 'warning');
    return false;
  }

  try {
    await api.revokeJoinCode(runtime.online.session.tableSlug, runtime.online.session.token, joinCodeId);
    runtime.online.joinCodes = runtime.online.joinCodes.filter((item) => item.id !== joinCodeId);
    renderApp();
    ui.toast('Código revogado', 'O acesso numérico foi desativado.', 'warning');
    return true;
  } catch (error) {
    ui.toast('Código da mesa', error.message, 'danger');
    return false;
  }
}

async function connectToJoinCode(code, nickname) {
  const cleanCode = String(code || '').replace(/\D+/g, '').slice(0, 6);
  if (!cleanCode) {
    ui.toast('Código ausente', 'Informe um código numérico de 6 dígitos para entrar na mesa.', 'warning');
    return false;
  }

  try {
    const response = await api.joinWithCode({
      code: cleanCode,
      nickname: sanitizeNickname(nickname)
    });
    if (response.requiresCharacter) {
      runtime.online.pendingCodeJoin = {
        code: cleanCode,
        nickname: sanitizeNickname(nickname),
        role: response.role,
        table: response.table,
        characters: response.characters || []
      };
      setView('mesa', { tableSlug: response.table?.slug || '' });
      ui.toast('Escolha um personagem', 'Selecione a ficha vinculada antes de concluir a entrada como jogador.', 'info');
      return true;
    }

    runtime.online.pendingCodeJoin = null;
    return joinOnlineSession(response.session);
  } catch (error) {
    ui.toast('Código da mesa', error.message, 'danger');
    return false;
  }
}

async function completeJoinCodeAsPlayer(characterId) {
  const pending = runtime.online.pendingCodeJoin;
  if (!pending) {
    ui.toast('Sem código pendente', 'Abra a Mesa e informe o código primeiro.', 'warning');
    return false;
  }

  try {
    const response = await api.joinWithCode({
      code: pending.code,
      nickname: pending.nickname,
      characterId
    });
    runtime.online.pendingCodeJoin = null;
    return joinOnlineSession(response.session);
  } catch (error) {
    ui.toast('Código da mesa', error.message, 'danger');
    return false;
  }
}

function clearPendingJoinCode() {
  runtime.online.pendingCodeJoin = null;
  if (!runtime.online.session && runtime.ui.currentView === 'mesa') {
    syncBrowserRoute('mesa', { replace: true, tableSlug: '' });
  }
  renderApp();
}

async function importCurrentStateToCloud(label = 'Importação manual') {
  if (!runtime.online.session) {
    ui.toast('Sem mesa online', 'Crie ou entre em uma mesa antes de enviar o estado atual.', 'warning');
    return false;
  }

  try {
    await api.importLocalState(runtime.online.session.tableSlug, runtime.online.session.token, {
      state: runtime.state,
      actor: runtime.online.session.nickname,
      label
    });
    await refreshCloudSnapshots();
    queueCloudSync('manual-cloud-import');
    ui.toast('Estado enviado', 'O snapshot atual foi promovido para a nuvem.', 'success');
    return true;
  } catch (error) {
    ui.toast('Nuvem pessoal', error.message, 'danger');
    return false;
  }
}

async function createCloudSnapshot(label = 'Snapshot manual') {
  if (!runtime.online.session) {
    ui.toast('Sem mesa online', 'Crie ou entre em uma mesa antes de salvar snapshots.', 'warning');
    return false;
  }

  try {
    await api.createSnapshot(runtime.online.session.tableSlug, runtime.online.session.token, {
      label,
      actor: runtime.online.session.nickname,
      state: runtime.state
    });
    await refreshCloudSnapshots();
    ui.toast('Snapshot salvo', 'Backup remoto criado com sucesso.', 'success');
    return true;
  } catch (error) {
    ui.toast('Snapshot', error.message, 'danger');
    return false;
  }
}

async function restoreCloudSnapshot(snapshotId) {
  if (!runtime.online.session) {
    ui.toast('Sem mesa online', 'Não há snapshot remoto para restaurar sem uma sessão em nuvem.', 'warning');
    return false;
  }

  try {
    const response = await api.restoreSnapshot(runtime.online.session.tableSlug, runtime.online.session.token, snapshotId);
    if (response.state) {
      applyRemoteState(response.state, { updatedAt: new Date().toISOString() });
      persistOnlineRuntime();
      renderApp();
    }
    ui.toast('Snapshot restaurado', 'A mesa voltou para o estado remoto selecionado.', 'success');
    return true;
  } catch (error) {
    ui.toast('Restaurar snapshot', error.message, 'danger');
    return false;
  }
}

function copyInviteLink(url) {
  if (!url) {
    ui.toast('Sem convite', 'Gere um link antes de tentar copiar.', 'warning');
    return;
  }

  copyText(url)
    .then(() => ui.toast('Convite copiado', 'O link foi enviado para a área de transferência.', 'success'))
    .catch(() => ui.toast('Não foi possível copiar', 'Seu navegador bloqueou a área de transferência.', 'danger'));
}

function copyTextSnippet(text, {
  successTitle = 'Copiado',
  successMessage = 'Conteúdo enviado para a área de transferência.',
  emptyTitle = 'Sem conteúdo',
  emptyMessage = 'Gere ou informe um conteúdo antes de copiar.'
} = {}) {
  if (!text) {
    ui.toast(emptyTitle, emptyMessage, 'warning');
    return;
  }

  copyText(text)
    .then(() => ui.toast(successTitle, successMessage, 'success'))
    .catch(() => ui.toast('Não foi possível copiar', 'Seu navegador bloqueou a área de transferência.', 'danger'));
}

function decorateStaticUi() {
  document.querySelectorAll('button[data-icon]').forEach((button) => {
    if (button.dataset.decorated === 'true' && button.id !== 'editModeToggle') return;
    const label = (button.dataset.label || button.textContent || '').trim();
    button.innerHTML = renderButtonLabel(button.dataset.icon, label, {
      iconOnly: button.classList.contains('icon-only')
    });
    if (button.id !== 'editModeToggle') button.dataset.decorated = 'true';
  });

  document.querySelectorAll('[data-panel-icon]').forEach((node) => {
    if (node.dataset.decorated === 'true') return;
    const title = node.querySelector('h2');
    if (!title) return;
    title.innerHTML = `<span class="panel-title">${renderIcon(node.dataset.panelIcon, 'ui-icon ui-icon--panel')}${title.textContent.trim()}</span>`;
    node.dataset.decorated = 'true';
  });
}

function renderNavigation() {
  Object.entries(dom.views).forEach(([viewKey, element]) => {
    if (!element) return;
    element.classList.toggle('is-active', runtime.ui.currentView === viewKey);
  });

  dom.navButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === runtime.ui.currentView);
  });

  const label = VIEW_LABELS[runtime.ui.currentView] || VIEW_LABELS.sheet;
  const target = document.querySelector('[data-active-view-label]');
  if (target) target.textContent = label;
}

function updateEditModeUI() {
  const canEditStructure = !runtime.online.session || getOnlineRole() === 'gm';
  const canRosterEdit = canManageRoster();
  const editLabel = runtime.editMode ? 'Fechar edição' : 'Editar';
  dom.editModeToggle.dataset.label = editLabel;
  dom.editModeToggle.innerHTML = renderButtonLabel('edit', editLabel);
  dom.editModeToggle.disabled = !canEditStructure;
  dom.editModeToggle.classList.toggle('is-disabled', !canEditStructure);
  dom.openCharacterManagerButton?.classList.toggle('is-disabled', !canRosterEdit);
  if (dom.openCharacterManagerButton) dom.openCharacterManagerButton.disabled = !canRosterEdit;
  document.querySelectorAll('.edit-only').forEach((element) => {
    element.classList.toggle('is-hidden', !runtime.editMode || !canEditStructure);
  });
}

function renderApp() {
  if (!dom.characterList) return;
  decorateStaticUi();
  renderNavigation();

  const ctx = getRenderContext();
  renderMobileShell(ctx);
  renderOnlineHubSection(ctx);
  renderCharacterList(ctx);
  renderMiniHud(ctx);
  renderSidebarDisasterMini(ctx);
  renderIdentitySection(ctx);
  renderSheetQuickLinks(ctx);
  renderResourceSection(ctx);
  renderConditionsSection(ctx);
  renderAttributesSection(ctx);
  renderWeaponsSection(ctx);
  renderTechniquesSection(ctx);
  renderPassivesSection(ctx);
  renderVowsSection(ctx);
  renderInventorySection(ctx);
  renderGuidedRollSection(ctx);
  renderCustomRollSection(ctx);
  renderRollSummarySection(ctx);
  renderLogSection(ctx);
  renderOrderControlsSection(ctx);
  renderOrderListSection(ctx);
  renderMesaSection(ctx);
  renderCompendiumSection(ctx);

  upgradeCustomSelects(document);
  updateEditModeUI();
}

function bindStaticEvents() {
  dom.navButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  dom.editModeToggle.addEventListener('click', toggleEditMode);
  dom.saveStateButton.addEventListener('click', saveStateButtonToast);
  dom.addConditionButton.addEventListener('click', () => modalActions.openConditionModal());
  dom.addTechniqueButton.addEventListener('click', () => modalActions.openCollectionModal('techniques'));
  dom.addWeaponButton.addEventListener('click', () => modalActions.openCollectionModal('weapons'));
  dom.addPassiveButton.addEventListener('click', () => modalActions.openCollectionModal('passives'));
  dom.addVowButton.addEventListener('click', () => modalActions.openCollectionModal('vows'));
  dom.addInventoryItemButton.addEventListener('click', () => modalActions.openCollectionModal('inventory'));
  dom.addCombatantButton.addEventListener('click', () => modalActions.openCombatantModal());
  dom.openCharacterManagerButton?.addEventListener('click', () => actions.openCharacterManagerModal());
  dom.copyLogButton.addEventListener('click', copyLogToClipboard);
  dom.clearLogButton.addEventListener('click', clearLog);
  dom.downloadRulesButton?.addEventListener('click', downloadRules);
}

const actions = {
  getState: getStateSnapshot,
  getOnlineState: () => runtime.online,
  getActiveCharacter,
  getCharacterById,
  setView,
  setActiveCharacter,
  toggleEditMode,
  adjustResource,
  setResourceCurrent,
  setResourceMax,
  setCharacterField,
  setCharacterAvatarUrl,
  setCharacterAvatarUpload,
  clearCharacterAvatar,
  setAttributeValue,
  setAttributeRank,
  addCondition,
  removeCondition,
  saveCollectionItem,
  removeCollectionItem,
  setInventoryMoney,
  executeAttributeRoll,
  executeCustomRoll,
  copyLogToClipboard,
  copyLogAnchor,
  clearLog,
  exportState,
  importStateFromText,
  importStateFromFile,
  reloadPersistentState,
  resetState,
  downloadRules,
  addCombatant,
  removeCombatant,
  updateOrderNotes,
  rollOrderInitiative,
  manualSortOrder,
  goToNextTurn,
  resetOrder,
  adjustCriticalFailures,
  addCharacter,
  removeCharacter,
  importCharactersFromText,
  serializeCharacterToText,
  copyActiveCharacterText,
  downloadActiveCharacterText,
  setCompendiumQuery,
  setCompendiumCategory,
  focusCompendiumSearch,
  openCompendiumReference,
  createOnlineTable,
  updateOnlineTableMeta,
  connectToInviteLink,
  createInviteLink,
  createJoinCode,
  revokeJoinCode,
  connectToJoinCode,
  completeJoinCodeAsPlayer,
  clearPendingJoinCode,
  copyTextSnippet,
  copyInviteLink,
  importCurrentStateToCloud,
  createCloudSnapshot,
  refreshCloudSnapshots,
  refreshJoinCodes,
  restoreCloudSnapshot,
  disconnectOnlineSession,
  openAvatarLightbox: (payload) => ui.openLightbox(payload),
  openCollectionModal: (collectionKey, existing) => modalActions.openCollectionModal(collectionKey, existing),
  openConditionModal: () => modalActions.openConditionModal(),
  openCombatantModal: () => modalActions.openCombatantModal(),
  openCharacterManagerModal: () => {
    if (!canManageRoster()) {
      blockByRole('Somente o mestre gerencia o elenco da mesa online.');
      return;
    }
    modalActions.openCharacterManagerModal();
  },
  openDeleteCharacterModal: (characterId) => {
    if (!canManageRoster()) {
      blockByRole('Somente o mestre remove personagens da mesa online.');
      return;
    }
    modalActions.openDeleteCharacterModal(characterId);
  },
  openCombatantNotesModal: (entryId) => modalActions.openCombatantNotesModal(entryId)
};

export function initApp() {
  cacheDom();
  syncViewportState();
  api = createApiClient('');
  ui = createUiLayer({
    modalRoot: dom.modalRoot,
    toastRoot: dom.toastRoot,
    enhanceSelects: upgradeCustomSelects
  });
  const loadedState = loadState();
  runtime.state = loadedState.state;
  runtime.ui = loadedState.ui;
  modalActions = createModalActions({
    ui,
    modalRoot: dom.modalRoot,
    getState: getStateSnapshot,
    getActiveCharacter,
    actions
  });
  bindStaticEvents();
  applyRouteFromLocation({ render: false });
  window.addEventListener('popstate', () => {
    applyRouteFromLocation({ render: true });
    scheduleViewTopReset();
  });
  window.addEventListener('resize', () => {
    if (resizeRenderFrame) cancelAnimationFrame(resizeRenderFrame);
    resizeRenderFrame = requestAnimationFrame(() => {
      resizeRenderFrame = null;
      const previousViewport = runtime.viewport;
      syncViewportState();
      const modeChanged = previousViewport.mode !== runtime.viewport.mode;
      const widthChanged = Math.abs(previousViewport.width - runtime.viewport.width);
      const activeEditable = isEditableElement(document.activeElement);
      if (!modeChanged && widthChanged < 72) return;
      if (activeEditable && !modeChanged && widthChanged < 180) return;
      renderApp();
    });
  });
  renderApp();
  bootstrapOnlinePlatform();
}

export const publicApi = {
  parseDiceNotation,
  rollDice,
  createDefaultState,
  normalizeState,
  makeCharacter,
  getFlags,
  buildRollOutcome,
  buildPcInitiative,
  buildNpcInitiative,
  sortOrderEntries,
  parseCharacterSheetText,
  parseCharacterSheetsText,
  serializeCharacterToText,
  contextLabel,
  readOnlineSession,
  getState: getStateSnapshot,
  getOnlineState: () => runtime.online,
  getLastRoll: () => runtime.lastRoll,
  debug: actions
};

