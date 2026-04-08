import { buildTableContextLabel, buildTableEpisodeLabel, normalizeTableMeta } from '../core/online.js';
import { escapeHtml } from '../core/utils.js';
import { renderButtonLabel } from '../ui/icons.js';

function statusTone(status) {
  if (status === 'connected') return 'success';
  if (status === 'syncing' || status === 'reconnecting' || status === 'connecting') return 'info';
  if (status === 'error') return 'danger';
  return 'warning';
}

function statusLabel(status, platformAvailable) {
  if (!platformAvailable) return 'Sem API';
  return {
    connected: 'Mesa ao vivo',
    syncing: 'Sincronizando',
    reconnecting: 'Reconectando',
    connecting: 'Entrando',
    offline: 'Nuvem pronta',
    error: 'Erro de sync'
  }[status] || 'Mesa';
}

function roleLabel(role) {
  return role === 'gm' ? 'Mestre' : role === 'player' ? 'Jogador' : 'Espectador';
}

function renderEmptyHub(online) {
  return `
    <div class="online-hub-card online-hub-card--empty ${online.platformAvailable ? '' : 'online-hub-card--pending'}">
      <div class="online-hub-card__top">
        <div>
          <p class="eyebrow">Mesa online</p>
          <h3>Você não está dentro de uma mesa online</h3>
        </div>
      </div>
      <p class="online-hub-card__copy">
        Crie uma sessão ou entre por link e código para levar a mesa atual para a nuvem.
      </p>
      <div class="online-hub-card__actions online-hub-card__actions--stack">
        <button id="openCloudMesaButton" class="ghost-button ghost-button--full" type="button">
          ${renderButtonLabel('users', 'Abrir Mesa')}
        </button>
      </div>
    </div>
  `;
}

function renderLiveHub(online, members) {
  const meta = normalizeTableMeta(online.table?.meta || { tableName: online.table?.name || online.session?.tableName });
  const episode = buildTableEpisodeLabel(meta);
  const context = buildTableContextLabel(meta);
  const memberPreview = members.slice(0, 4);

  return `
    <div class="online-hub-card">
      <div class="online-hub-card__top">
        <div>
          <p class="eyebrow">Mesa atual</p>
          <h3>${escapeHtml(meta.tableName || online.table?.name || online.session?.tableName || 'Mesa em nuvem')}</h3>
        </div>
        <span class="flag-chip is-${statusTone(online.status)}">${escapeHtml(statusLabel(online.status, true))}</span>
      </div>

      <div class="online-hub-card__meta-list">
        ${episode ? `<div class="online-hub-card__meta-row"><span>Episódio</span><strong>${escapeHtml(episode)}</strong></div>` : ''}
        ${context ? `<div class="online-hub-card__meta-row"><span>Contexto</span><strong>${escapeHtml(context)}</strong></div>` : ''}
        <div class="online-hub-card__meta-row">
          <span>Papel</span>
          <strong>${escapeHtml(roleLabel(online.session?.role))}</strong>
        </div>
        <div class="online-hub-card__meta-row">
          <span>Conectados</span>
          <strong>${members.length}</strong>
        </div>
      </div>

      <div class="online-hub-card__avatars">
        ${memberPreview.length ? memberPreview.map((member) => `
          <span class="online-member-chip">
            <strong>${escapeHtml((member.nickname || '?').slice(0, 1).toUpperCase())}</strong>
            <span>${escapeHtml(member.nickname || 'Feiticeiro')}</span>
          </span>
        `).join('') : '<span class="item-card__meta">Aguardando presença da mesa.</span>'}
      </div>

      <div class="online-hub-card__actions online-hub-card__actions--stack">
        <button id="openCloudSessionButton" class="ghost-button ghost-button--full" type="button">${renderButtonLabel('users', 'Abrir Mesa')}</button>
        <button id="disconnectCloudSessionButton" class="ghost-button ghost-button--full" type="button">${renderButtonLabel('close', 'Sair da mesa')}</button>
      </div>
    </div>
  `;
}

export function renderOnlineHubSection(ctx) {
  const { dom, runtime, actions } = ctx;
  if (!dom.onlineHubSection) return;

  const online = runtime.online;
  const members = online.members || [];

  dom.onlineHubSection.innerHTML = online.session ? renderLiveHub(online, members) : renderEmptyHub(online);

  dom.onlineHubSection.querySelector('#openCloudMesaButton')?.addEventListener('click', () => actions.setView('mesa'));
  dom.onlineHubSection.querySelector('#openCloudSessionButton')?.addEventListener('click', () => actions.setView('mesa'));
  dom.onlineHubSection.querySelector('#disconnectCloudSessionButton')?.addEventListener('click', () => actions.disconnectOnlineSession());
}
