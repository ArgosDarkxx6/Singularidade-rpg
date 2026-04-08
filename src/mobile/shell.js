import { NAV_ITEMS, VIEW_LABELS } from '../core/constants.js';
import { buildTableEpisodeLabel, normalizeTableMeta } from '../core/online.js';
import { escapeHtml } from '../core/utils.js';
import { renderButtonLabel, renderIcon } from '../ui/icons.js';
import { bindMobileCurrentView, renderMobileCurrentView } from './views/index.js';

function compactStatusLabel(online) {
  if (!online.platformAvailable) return 'Nuvem offline';
  return {
    connected: 'Ao vivo',
    syncing: 'Sincronizando',
    reconnecting: 'Reconexão',
    connecting: 'Entrando',
    offline: 'Nuvem pronta',
    error: 'Erro'
  }[online.status] || 'Mesa';
}

function compactTableLabel(online) {
  if (!online.session) return 'Sem mesa online';
  const meta = normalizeTableMeta(online.table?.meta || { tableName: online.table?.name || online.session.tableName });
  return buildTableEpisodeLabel(meta) || meta.campaignName || meta.tableName || 'Mesa ativa';
}

function buildCharacterContext(ctx) {
  const activeCharacter = ctx.actions.getActiveCharacter();
  if (!activeCharacter) return 'Sem ficha ativa';
  const details = [activeCharacter.name];
  if (activeCharacter.grade) details.push(`Grau ${activeCharacter.grade}`);
  return details.join(' • ');
}

function buildMesaContext(ctx) {
  const online = ctx.runtime.online;
  if (!online.session) return 'Abra a Mesa para conectar a sessão';
  return compactTableLabel(online);
}

function buildContextActions(ctx) {
  const currentView = ctx.runtime.ui.currentView;
  const actions = [
    { kind: 'manager', icon: 'users', label: 'Elenco' }
  ];

  if (currentView === 'sheet') {
    actions.push({
      kind: 'toggle-edit',
      icon: 'edit',
      label: ctx.runtime.editMode ? 'Fechar edição' : 'Editar'
    });
  } else if (currentView === 'rolls') {
    actions.push({
      kind: 'scroll',
      icon: 'copy',
      label: 'Log',
      target: 'mobileRollLogSection'
    });
  } else if (currentView === 'order') {
    actions.push({
      kind: 'scroll',
      icon: 'order',
      label: 'Turno',
      target: 'mobileOrderActiveSection'
    });
  } else if (currentView === 'compendium') {
    actions.push({
      kind: 'focus-search',
      icon: 'search',
      label: 'Buscar'
    });
  } else {
    actions.push(ctx.runtime.online.session
      ? {
          kind: 'scroll',
          icon: 'copy',
          label: 'Convites',
          target: 'mobileMesaInviteSection'
        }
      : {
          kind: 'scroll',
          icon: 'plus',
          label: 'Criar mesa',
          target: 'mobileMesaCreateSection'
        });
  }

  return actions.slice(0, 2);
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches;
}

function renderMobileViewHost(ctx) {
  if (!ctx.dom.mobileViewHost) return;
  ctx.dom.mobileViewHost.innerHTML = renderMobileCurrentView(ctx);
  bindMobileCurrentView(ctx);
}

export function renderMobileCurrentSurface(ctx) {
  if (!ctx.dom.mobileViewHost) return;
  if (!isMobileViewport()) {
    ctx.dom.mobileViewHost.innerHTML = '';
    return;
  }
  renderMobileViewHost(ctx);
}

export function renderMobileShell(ctx) {
  const { dom, runtime, actions } = ctx;
  if (!dom.mobileChrome) return;

  if (!isMobileViewport()) {
    dom.mobileChrome.innerHTML = '';
    if (dom.mobileViewHost) dom.mobileViewHost.innerHTML = '';
    return;
  }

  const online = runtime.online;
  const viewLabel = VIEW_LABELS[runtime.ui.currentView] || VIEW_LABELS.sheet;
  const contextActions = buildContextActions(ctx);

  dom.mobileChrome.innerHTML = `
    <header class="mobile-header">
      <div class="mobile-header__top">
        <div class="mobile-header__brand">
          <span class="mobile-header__brand-mark">${renderIcon('spark', 'ui-icon ui-icon--mini')}</span>
          <div class="mobile-header__brand-copy">
            <p class="eyebrow">Singularidade</p>
            <strong>${escapeHtml(viewLabel)}</strong>
          </div>
        </div>
        <span class="mobile-sync-pill mobile-sync-pill--${escapeHtml(online.status || 'offline')}">${escapeHtml(compactStatusLabel(online))}</span>
      </div>

      <div class="mobile-header__rail">
        <div class="mobile-header__context-pill">
          <span class="mobile-header__label">Ficha</span>
          <strong>${escapeHtml(buildCharacterContext(ctx))}</strong>
        </div>
        <div class="mobile-header__context-pill">
          <span class="mobile-header__label">Mesa</span>
          <strong>${escapeHtml(buildMesaContext(ctx))}</strong>
        </div>
      </div>

      <div class="mobile-action-strip mobile-action-strip--compact">
        ${contextActions.map((item) => `
          <button
            type="button"
            class="mobile-action-button"
            data-mobile-kind="${escapeHtml(item.kind)}"
            ${item.view ? `data-mobile-view="${escapeHtml(item.view)}"` : ''}
            ${item.target ? `data-mobile-target="${escapeHtml(item.target)}"` : ''}
          >
            ${renderButtonLabel(item.icon, item.label)}
          </button>
        `).join('')}
      </div>
    </header>
    <nav class="mobile-bottom-nav" aria-label="Navegação mobile">
      ${NAV_ITEMS.map((item) => `
        <button
          type="button"
          class="mobile-nav-button ${item.key === runtime.ui.currentView ? 'is-active' : ''}"
          data-view="${escapeHtml(item.key)}"
        >
          <span class="mobile-nav-button__icon">${renderIcon(item.icon, 'ui-icon')}</span>
          <span class="mobile-nav-button__label">${escapeHtml(item.label)}</span>
        </button>
      `).join('')}
    </nav>
  `;

  renderMobileViewHost(ctx);

  dom.mobileChrome.querySelectorAll('.mobile-nav-button').forEach((button) => {
    button.addEventListener('click', () => actions.setView(button.dataset.view));
  });

  dom.mobileChrome.querySelectorAll('.mobile-action-button').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.dataset.mobileKind;
      if (kind === 'manager') {
        actions.openCharacterManagerModal();
        return;
      }
      if (kind === 'view' && button.dataset.mobileView) {
        actions.setView(button.dataset.mobileView);
        return;
      }
      if (kind === 'toggle-edit') {
        actions.toggleEditMode();
        return;
      }
      if (kind === 'focus-search') {
        const target = dom.mobileViewHost?.querySelector('#mobileBookSearchInput');
        if (target) {
          target.focus();
          return;
        }
        actions.focusCompendiumSearch();
        return;
      }
      if (kind === 'scroll' && button.dataset.mobileTarget) {
        const target = dom.mobileViewHost?.querySelector(`#${button.dataset.mobileTarget}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}
