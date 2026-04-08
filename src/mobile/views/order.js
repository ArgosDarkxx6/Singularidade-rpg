import { ORDER_ENTRY_TYPE_LABEL } from '../../core/constants.js';
import { escapeHtml } from '../../core/utils.js';
import { renderButtonLabel, renderIcon } from '../../ui/icons.js';
import { renderMobileHero, renderMobileMetric, renderMobilePanel } from './shared.js';

function renderActiveEntry(order, members) {
  const activeEntry = order.entries[order.turn] || null;
  if (!activeEntry) {
    return '<div class="mobile-info-card"><span>Turno atual</span><p>Adicione PCs ou NPCs para iniciar a ordem de combate.</p></div>';
  }

  const member = activeEntry.characterId
    ? members.find((item) => item.characterId === activeEntry.characterId)
    : null;

  return `
    <article id="mobileOrderActiveSection" class="mobile-resource-card">
      <div class="mobile-resource-card__top">
        <div>
          <span>Em turno</span>
          <strong>${escapeHtml(activeEntry.name)}</strong>
        </div>
        <span class="flag-chip is-info">${activeEntry.init ?? '-'}</span>
      </div>
      <p>${escapeHtml(ORDER_ENTRY_TYPE_LABEL[activeEntry.type] || 'PC')}${member ? ' - jogador conectado' : ''}${activeEntry.notes ? ` - ${escapeHtml(activeEntry.notes)}` : ''}</p>
      <div class="mobile-inline-actions mobile-inline-actions--grid">
        <button type="button" class="ghost-button" data-mobile-prev-turn>${renderButtonLabel('minus', 'Anterior')}</button>
        <button type="button" class="control-button control-button--primary" data-mobile-next-turn>${renderButtonLabel('plus', 'Proximo')}</button>
      </div>
    </article>
  `;
}

function renderEntries(order, members) {
  if (!order.entries.length) {
    return '<div class="mobile-info-card"><span>Fila vazia</span><p>Use o botao de adicionar combatente para montar a iniciativa da cena.</p></div>';
  }

  return `
    <div class="mobile-stack">
      ${order.entries.map((entry, index) => {
        const member = entry.characterId ? members.find((item) => item.characterId === entry.characterId) : null;
        return `
          <article class="mobile-order-entry ${index === order.turn ? 'is-active' : ''}">
            <div class="mobile-order-entry__init">${entry.init ?? '-'}</div>
            <div class="mobile-order-entry__body">
              <div class="mobile-order-entry__top">
                <strong>${escapeHtml(entry.name)}</strong>
                <p>${escapeHtml(ORDER_ENTRY_TYPE_LABEL[entry.type] || 'PC')}${member ? ' - conectado' : ''}${entry.notes ? ` - ${escapeHtml(entry.notes)}` : ''}</p>
              </div>
            </div>
            <div class="mobile-order-entry__actions">
              <button type="button" class="icon-button" data-mobile-edit-order="${entry.id}" aria-label="Editar notas">${renderIcon('edit')}</button>
              <button type="button" class="icon-button" data-mobile-remove-order="${entry.id}" aria-label="Remover">${renderIcon('trash')}</button>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

export function renderMobileOrderView(ctx) {
  const { state, runtime } = ctx;
  const order = state.order;
  const members = runtime.online.members || [];

  return `
    <section class="mobile-page mobile-page--order">
      ${renderMobileHero({
        eyebrow: 'Combate',
        title: 'Ordem, turno e ritmo da cena',
        body: 'Use a fila condensada para controlar round, presenca e foco do combate sem perder o fluxo.'
      })}
      <div class="mobile-metric-row">
        ${renderMobileMetric('Round', order.round)}
        ${renderMobileMetric('Turno', order.entries.length ? order.turn + 1 : 0)}
        ${renderMobileMetric('Fila', order.entries.length)}
        ${renderMobileMetric('Conectados', members.length)}
      </div>
      ${renderMobilePanel({
        eyebrow: 'Turno atual',
        title: 'Pressao da cena',
        body: renderActiveEntry(order, members),
        actions: `
          <div class="mobile-inline-actions mobile-inline-actions--grid">
            <button type="button" class="ghost-button" data-mobile-roll-init>${renderButtonLabel('dice', 'Iniciativa')}</button>
            <button type="button" class="ghost-button" data-mobile-sort-order>${renderButtonLabel('order', 'Ordenar')}</button>
            <button type="button" class="ghost-button" data-mobile-reset-order>${renderButtonLabel('trash', 'Resetar')}</button>
            <button type="button" class="control-button control-button--primary" data-mobile-add-combatant>${renderButtonLabel('plus', 'Combatente')}</button>
          </div>
        `
      })}
      ${renderMobilePanel({
        eyebrow: 'Fila',
        title: 'Combatentes',
        body: renderEntries(order, members)
      })}
    </section>
  `;
}

export function bindMobileOrderView(ctx, root) {
  root.querySelector('[data-mobile-prev-turn]')?.addEventListener('click', () => ctx.actions.goToNextTurn(-1));
  root.querySelector('[data-mobile-next-turn]')?.addEventListener('click', () => ctx.actions.goToNextTurn(1));
  root.querySelector('[data-mobile-roll-init]')?.addEventListener('click', () => ctx.actions.rollOrderInitiative());
  root.querySelector('[data-mobile-sort-order]')?.addEventListener('click', () => ctx.actions.manualSortOrder());
  root.querySelector('[data-mobile-reset-order]')?.addEventListener('click', () => ctx.actions.resetOrder());
  root.querySelector('[data-mobile-add-combatant]')?.addEventListener('click', () => ctx.actions.openCombatantModal());

  root.querySelectorAll('[data-mobile-edit-order]').forEach((button) => {
    button.addEventListener('click', () => ctx.actions.openCombatantNotesModal(button.dataset.mobileEditOrder));
  });
  root.querySelectorAll('[data-mobile-remove-order]').forEach((button) => {
    button.addEventListener('click', () => ctx.actions.removeCombatant(button.dataset.mobileRemoveOrder));
  });
}
