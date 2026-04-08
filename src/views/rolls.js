import { contextLabel } from '../core/rules.js';
import { escapeHtml, formatTimestamp } from '../core/utils.js';
import { ATTRIBUTE_CONFIG, ROLL_TN_PRESETS } from '../core/constants.js';
import { renderButtonLabel, renderIcon } from '../ui/icons.js';

function renderTnControls(formKey, defaultValue = 13) {
  return `
    <label class="roll-tn-field">
      <span class="settings-label">TN</span>
      <input name="tn" type="number" min="0" step="1" value="${defaultValue}" placeholder="Ex.: 13" />
      <div class="tn-preset-row" data-tn-presets="${formKey}">
        ${ROLL_TN_PRESETS.map((value) => `
          <button type="button" class="type-pill type-pill--interactive" data-tn-value="${value}">
            TN ${value}
          </button>
        `).join('')}
      </div>
    </label>
  `;
}

function bindTnControls(form, formKey) {
  const presets = form.querySelector(`[data-tn-presets="${formKey}"]`);
  const tnInput = form.elements.namedItem('tn');
  if (!presets || !tnInput) return;

  presets.querySelectorAll('[data-tn-value]').forEach((button) => {
    button.addEventListener('click', () => {
      tnInput.value = button.dataset.tnValue || '';
      tnInput.dispatchEvent(new Event('change', { bubbles: true }));
      tnInput.focus();
    });
  });
}

function renderTnOutcome(roll) {
  if (roll.tn === null) {
    return '<span class="flag-chip is-info">Sem TN definida</span>';
  }

  const tone = roll.tnResult === 'success' ? 'success' : 'danger';
  const marginLabel = roll.margin === null ? '' : ` ${roll.margin >= 0 ? '+' : ''}${roll.margin}`;
  return `<span class="flag-chip is-${tone}">${escapeHtml(roll.outcomeLabel)} vs TN ${roll.tn}${marginLabel}</span>`;
}

export function renderGuidedRollSection(ctx) {
  const { dom, state, actions } = ctx;
  const active = actions.getActiveCharacter();

  dom.guidedRollSection.innerHTML = `
    <form id="guidedRollForm" class="roll-form">
      <div class="form-grid form-grid--guided">
        <label>
          <span class="settings-label">Personagem</span>
          <select name="characterId">
            ${state.characters.map((character) => `<option value="${character.id}" ${character.id === active.id ? 'selected' : ''}>${escapeHtml(character.name)}</option>`).join('')}
          </select>
        </label>
        <label>
          <span class="settings-label">Atributo</span>
          <select name="attributeKey">
            ${ATTRIBUTE_CONFIG.map((attribute) => `<option value="${attribute.key}">${attribute.label}</option>`).join('')}
          </select>
        </label>
        <label>
          <span class="settings-label">Contexto</span>
          <select name="context">
            <option value="standard">Teste padrão</option>
            <option value="physical-attack">Ataque físico</option>
            <option value="ranged-attack">Ataque à distância</option>
            <option value="domain-clash">Conflito de domínio</option>
          </select>
        </label>
        <label>
          <span class="settings-label">Bônus extra</span>
          <input name="extraBonus" type="number" value="0" step="1" placeholder="Ex.: +2" />
        </label>
        ${renderTnControls('guided', 13)}
        <div class="roll-hint-card">
          <div class="roll-hint-card__glow"></div>
          <strong>${renderIcon('spark', 'ui-icon ui-icon--mini')} Regras rápidas</strong>
          <span>Crítico: 20 natural • Falha crítica: 1–3 • Exaustão em 0 EA • Sucesso apenas se total &gt; TN.</span>
        </div>
      </div>
      <div class="roll-actions">
        <button class="control-button control-button--primary" type="submit">${renderButtonLabel('dice', 'Rolar 1d20 + atributo')}</button>
      </div>
    </form>
  `;

  const form = dom.guidedRollSection.querySelector('#guidedRollForm');
  bindTnControls(form, 'guided');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    actions.executeAttributeRoll(
      data.get('characterId'),
      data.get('attributeKey'),
      data.get('context'),
      data.get('extraBonus'),
      data.get('tn')
    );
  });
}

export function renderCustomRollSection(ctx) {
  const { dom, actions } = ctx;

  dom.customRollSection.innerHTML = `
    <form id="customRollForm" class="roll-form">
      <div class="form-grid">
        <label>
          <span class="settings-label">Notação</span>
          <input name="expression" placeholder="2d10" value="2d6" />
        </label>
        <label>
          <span class="settings-label">Bônus extra</span>
          <input name="bonus" type="number" value="0" />
        </label>
        ${renderTnControls('custom', 13)}
      </div>
      <label>
        <span class="settings-label">Rótulo</span>
        <input name="label" placeholder="Ex.: dano da técnica" />
      </label>
      <div class="roll-actions">
        <button class="control-button control-button--primary" type="submit">${renderButtonLabel('grid', 'Rolar dados')}</button>
      </div>
    </form>
  `;

  const form = dom.customRollSection.querySelector('#customRollForm');
  bindTnControls(form, 'custom');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    actions.executeCustomRoll(
      data.get('expression'),
      data.get('bonus'),
      data.get('label'),
      data.get('tn')
    );
  });
}

export function renderRollSummarySection(ctx) {
  const { dom, runtime, actions } = ctx;

  if (!runtime.lastRoll) {
    dom.rollSummarySection.innerHTML = '<div class="empty-state">Nenhuma rolagem nesta sessão. Faça um teste para ver o resumo aqui.</div>';
    return;
  }

  const roll = runtime.lastRoll;
  if (roll.custom) {
    dom.rollSummarySection.innerHTML = `
      <div class="roll-summary">
        <div class="roll-summary__meta">${escapeHtml(roll.label)}</div>
        <div class="roll-summary__value">${roll.total}</div>
        <div class="status-strip">${renderTnOutcome(roll)}</div>
        <div class="roll-summary__grid">
          <div class="summary-stat"><div class="summary-stat__label">Expressão</div><div class="summary-stat__value">${escapeHtml(roll.expression)}</div></div>
          <div class="summary-stat"><div class="summary-stat__label">Rolagens</div><div class="summary-stat__value">${roll.rolls.length ? roll.rolls.join(', ') : '—'}</div></div>
          <div class="summary-stat"><div class="summary-stat__label">Subtotal</div><div class="summary-stat__value">${roll.subtotal}</div></div>
          <div class="summary-stat"><div class="summary-stat__label">Bônus</div><div class="summary-stat__value">${roll.bonus >= 0 ? '+' : ''}${roll.bonus}</div></div>
          <div class="summary-stat"><div class="summary-stat__label">TN</div><div class="summary-stat__value">${roll.tn === null ? '—' : roll.tn}</div></div>
          <div class="summary-stat"><div class="summary-stat__label">Margem</div><div class="summary-stat__value">${roll.margin === null ? '—' : `${roll.margin >= 0 ? '+' : ''}${roll.margin}`}</div></div>
        </div>
      </div>
    `;
    return;
  }

  const tags = [
    renderTnOutcome(roll),
    roll.isCritical ? '<span class="flag-chip is-warning">Crítico</span>' : '',
    roll.isFumble ? '<span class="flag-chip is-danger">Falha crítica</span>' : '',
    roll.isBlackFlash ? '<span class="flag-chip is-energy">Black Flash</span>' : ''
  ].filter(Boolean).join('');
  const references = [
    roll.isBlackFlash ? { label: 'Black Flash', query: 'Black Flash' } : null,
    roll.isCritical ? { label: 'Crítico', query: 'critico combate tecnica' } : null,
    roll.isFumble ? { label: 'Falha crítica', query: 'falha critica exaustao SAN' } : null
  ].filter(Boolean);

  dom.rollSummarySection.innerHTML = `
    <div class="roll-summary">
      <div class="roll-summary__meta">${escapeHtml(roll.characterName)} • ${escapeHtml(roll.attributeLabel)} • ${escapeHtml(contextLabel(roll.context))}</div>
      <div class="roll-summary__value">${roll.total}</div>
      <div class="status-strip">${tags || '<span class="flag-chip is-info">Sem gatilhos especiais.</span>'}</div>
      ${references.length ? `
        <div class="roll-summary__reference-actions">
          ${references.map((reference) => `<button type="button" class="ghost-button" data-roll-reference="${escapeHtml(reference.query)}">${renderButtonLabel('book', reference.label)}</button>`).join('')}
        </div>
      ` : ''}
      <div class="roll-summary__grid">
        <div class="summary-stat"><div class="summary-stat__label">d20 natural</div><div class="summary-stat__value">${roll.natural}</div></div>
        <div class="summary-stat"><div class="summary-stat__label">Modificador</div><div class="summary-stat__value">${roll.effectiveModifier >= 0 ? '+' : ''}${roll.effectiveModifier}</div></div>
        <div class="summary-stat"><div class="summary-stat__label">Bônus extra</div><div class="summary-stat__value">${roll.extraBonus >= 0 ? '+' : ''}${roll.extraBonus}</div></div>
        <div class="summary-stat"><div class="summary-stat__label">TN</div><div class="summary-stat__value">${roll.tn === null ? '—' : roll.tn}</div></div>
        <div class="summary-stat"><div class="summary-stat__label">Margem</div><div class="summary-stat__value">${roll.margin === null ? '—' : `${roll.margin >= 0 ? '+' : ''}${roll.margin}`}</div></div>
        <div class="summary-stat"><div class="summary-stat__label">Contexto</div><div class="summary-stat__value">${escapeHtml(contextLabel(roll.context))}</div></div>
        <div class="summary-stat"><div class="summary-stat__label">Notas</div><div class="summary-stat__value">${roll.notes.length ? escapeHtml(roll.notes.join(' • ')) : '—'}</div></div>
      </div>
    </div>
  `;

  dom.rollSummarySection.querySelectorAll('[data-roll-reference]').forEach((button) => {
    button.addEventListener('click', () => actions.openCompendiumReference(button.dataset.rollReference));
  });
}

export function renderLogSection(ctx) {
  const { dom, state, runtime, actions } = ctx;
  if (!state.log.length) {
    dom.logSection.innerHTML = '<div class="empty-state">Nenhum evento registrado.</div>';
    return;
  }

  dom.logSection.innerHTML = `
    <div class="log-list">
      ${state.log.map((entry) => `
        <article class="log-entry" id="log-${entry.id}">
          <div class="log-entry__top">
            <div class="log-entry__title">${escapeHtml(entry.category)} — ${escapeHtml(entry.title)}</div>
            <div class="log-entry__time">
              <span>${escapeHtml(formatTimestamp(entry.timestamp))}</span>
              ${runtime.online.session ? `<button class="icon-button log-entry__anchor" type="button" title="Copiar link deste evento" data-log-anchor="${entry.id}">${renderIcon('copy')}</button>` : ''}
            </div>
          </div>
          <div class="log-entry__text">${escapeHtml(entry.text)}</div>
          ${entry.meta ? `<div class="log-entry__text">${escapeHtml(entry.meta)}</div>` : ''}
        </article>
      `).join('')}
    </div>
  `;

  dom.logSection.querySelectorAll('[data-log-anchor]').forEach((button) => {
    button.addEventListener('click', () => actions.copyLogAnchor(button.dataset.logAnchor));
  });
}
