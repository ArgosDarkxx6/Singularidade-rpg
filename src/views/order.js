import { ORDER_ENTRY_TYPE_LABEL } from '../core/constants.js';
import { escapeHtml } from '../core/utils.js';
import { renderButtonLabel, renderIcon } from '../ui/icons.js';

export function renderOrderControlsSection(ctx) {
  const { dom, state, actions, runtime } = ctx;
  const order = state.order;
  const activeEntry = order.entries[order.turn] || null;
  const activeMember = activeEntry?.characterId
    ? (runtime.online.members || []).find((member) => member.characterId === activeEntry.characterId)
    : null;

  dom.orderControlsSection.innerHTML = `
    <div class="order-controls order-controls--flat">
      <div class="order-controls__overview">
        <div class="order-counters">
          <div class="order-counter">
            <div class="order-counter__label">Round</div>
            <div class="order-counter__value">${order.round}</div>
          </div>
          <div class="order-counter">
            <div class="order-counter__label">Turno</div>
            <div class="order-counter__value">${order.entries.length ? order.turn + 1 : 0}</div>
          </div>
        </div>
        <div class="order-focus-card">
          ${activeEntry ? `
            <div class="order-focus-card__label">Em turno</div>
            <strong>${escapeHtml(activeEntry.name)}</strong>
            <span>${ORDER_ENTRY_TYPE_LABEL[activeEntry.type]}${activeEntry.init !== null && activeEntry.init !== undefined ? ` • Init ${activeEntry.init}` : ''}</span>
          ` : `
            <div class="order-focus-card__label">Fila vazia</div>
            <strong>Adicione PCs ou NPCs</strong>
            <span>A iniciativa aparece aqui assim que a ordem ganhar ritmo.</span>
          `}
        </div>
      </div>
      <div class="status-strip">
        ${activeEntry ? `<span class="flag-chip is-info">Ativo: ${escapeHtml(activeEntry.name)}</span>` : '<span class="flag-chip is-info">Sem combatentes na fila.</span>'}
        ${activeMember ? '<span class="flag-chip is-success">Jogador conectado</span>' : ''}
      </div>
      <div class="order-controls__buttons">
        <button id="previousTurnButton" class="control-button">${renderButtonLabel('minus', 'Anterior')}</button>
        <button id="nextTurnButton" class="control-button control-button--primary">${renderButtonLabel('plus', 'Próximo')}</button>
        <button id="resetOrderButton" class="ghost-button">${renderButtonLabel('trash', 'Resetar round/turno')}</button>
        <button id="sortOrderButton" class="ghost-button">${renderButtonLabel('order', 'Ordenar')}</button>
        <button id="rollInitiativeButton" class="ghost-button">${renderButtonLabel('dice', 'Iniciativa automática')}</button>
      </div>
    </div>
  `;

  dom.orderControlsSection.querySelector('#previousTurnButton')?.addEventListener('click', () => actions.goToNextTurn(-1));
  dom.orderControlsSection.querySelector('#nextTurnButton')?.addEventListener('click', () => actions.goToNextTurn(1));
  dom.orderControlsSection.querySelector('#resetOrderButton')?.addEventListener('click', actions.resetOrder);
  dom.orderControlsSection.querySelector('#sortOrderButton')?.addEventListener('click', actions.manualSortOrder);
  dom.orderControlsSection.querySelector('#rollInitiativeButton')?.addEventListener('click', actions.rollOrderInitiative);
}

export function renderOrderListSection(ctx) {
  const { dom, state, actions, runtime } = ctx;
  const entries = state.order.entries;

  if (!entries.length) {
    dom.orderListSection.innerHTML = '<div class="empty-state">Nenhum combatente na ordem. Use “Adicionar combatente”.</div>';
    return;
  }

  dom.orderListSection.innerHTML = `
    <div class="order-list">
      ${entries.map((entry, index) => `
        <article class="order-entry ${index === state.order.turn ? 'is-active' : ''}">
          <div class="order-entry__init">${entry.init ?? '—'}</div>
          <div>
            <div class="order-entry__title">
              ${escapeHtml(entry.name)}
              ${index === state.order.turn ? '<span class="order-entry__badge">Em turno</span>' : ''}
              ${entry.characterId && (runtime.online.members || []).some((member) => member.characterId === entry.characterId) ? '<span class="order-entry__badge order-entry__badge--connected">Conectado</span>' : ''}
            </div>
            <div class="order-entry__sub">${ORDER_ENTRY_TYPE_LABEL[entry.type]}${entry.type === 'npc' ? ` • Mod ${entry.modifier >= 0 ? '+' : ''}${entry.modifier}` : ''}${entry.notes ? ` • ${escapeHtml(entry.notes)}` : ''}</div>
          </div>
          <div class="order-entry__actions">
            <button class="icon-button" title="Editar notas" aria-label="Editar notas" data-edit-order-entry="${entry.id}">${renderIcon('edit')}</button>
            <button class="icon-button" title="Remover" aria-label="Remover" data-remove-order-entry="${entry.id}">${renderIcon('trash')}</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  dom.orderListSection.querySelectorAll('[data-remove-order-entry]').forEach((button) => {
    button.addEventListener('click', () => actions.removeCombatant(button.dataset.removeOrderEntry));
  });
  dom.orderListSection.querySelectorAll('[data-edit-order-entry]').forEach((button) => {
    button.addEventListener('click', () => actions.openCombatantNotesModal(button.dataset.editOrderEntry));
  });
}
