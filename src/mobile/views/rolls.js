import { ATTRIBUTE_CONFIG, ROLL_TN_PRESETS } from '../../core/constants.js';
import { contextLabel } from '../../core/rules.js';
import { escapeAttribute, escapeHtml, formatTimestamp } from '../../core/utils.js';
import { renderButtonLabel } from '../../ui/icons.js';
import { formEntries, renderMobileHero, renderMobilePanel } from './shared.js';

function renderTnPresets(prefix) {
  return `
    <div class="mobile-tn-presets">
      ${ROLL_TN_PRESETS.map((value) => `
        <button type="button" data-mobile-tn="${prefix}:${value}">TN ${value}</button>
      `).join('')}
    </div>
  `;
}

function renderLastRoll(runtime) {
  const roll = runtime.lastRoll;
  if (!roll) {
    return '<div class="mobile-info-card"><span>Último resultado</span><p>Nenhuma rolagem registrada nesta sessão.</p></div>';
  }

  const badges = [];
  if (roll.tn !== null) badges.push(`<span class="flag-chip is-${roll.tnResult === 'success' ? 'success' : 'danger'}">${escapeHtml(roll.outcomeLabel)} • TN ${roll.tn}</span>`);
  if (roll.isCritical) badges.push('<span class="flag-chip is-warning">Crítico</span>');
  if (roll.isFumble) badges.push('<span class="flag-chip is-danger">Falha crítica</span>');
  if (roll.isBlackFlash) badges.push('<span class="flag-chip is-energy">Black Flash</span>');

  if (roll.custom) {
    return `
      <article class="mobile-resource-card mobile-roll-result">
        <span>${escapeHtml(roll.label || 'Rolagem customizada')}</span>
        <strong>${roll.total}</strong>
        <div class="mobile-inline-actions">${badges.join('') || '<span class="type-pill">Sem TN</span>'}</div>
        <p>${escapeHtml(roll.expression)}${roll.bonus ? ` ${roll.bonus >= 0 ? '+' : ''}${roll.bonus}` : ''} • subtotal ${roll.subtotal}</p>
      </article>
    `;
  }

  return `
    <article class="mobile-resource-card mobile-roll-result">
      <span>${escapeHtml(roll.characterName)} • ${escapeHtml(roll.attributeLabel)}</span>
      <strong>${roll.total}</strong>
      <div class="mobile-inline-actions">${badges.join('') || '<span class="type-pill">Sem TN</span>'}</div>
      <p>${escapeHtml(contextLabel(roll.context))} • d20 ${roll.natural} ${roll.effectiveModifier >= 0 ? '+' : ''}${roll.effectiveModifier}${roll.extraBonus ? ` ${roll.extraBonus >= 0 ? '+' : ''}${roll.extraBonus}` : ''}</p>
    </article>
  `;
}

function renderLogList(state) {
  const entries = state.log.filter((entry) => entry.category === 'Rolagem').slice(0, 6);
  if (!entries.length) {
    return '<div class="mobile-info-card"><span>Log</span><p>As últimas rolagens da mesa aparecem aqui.</p></div>';
  }

  return `
    <div class="mobile-stack">
      ${entries.map((entry) => `
        <article class="mobile-log-card">
          <span>${escapeHtml(formatTimestamp(entry.timestamp))}</span>
          <strong>${escapeHtml(entry.title)}</strong>
          <p>${escapeHtml(entry.text)}</p>
          ${entry.meta ? `<p>${escapeHtml(entry.meta)}</p>` : ''}
        </article>
      `).join('')}
    </div>
  `;
}

export function renderMobileRollsView(ctx) {
  const active = ctx.actions.getActiveCharacter();

  return `
    <section class="mobile-page mobile-page--rolls">
      ${renderMobileHero({
        eyebrow: 'Rolagens',
        title: 'O que você vai rolar agora?',
        body: 'TN visível, resultado forte e log da mesa sem sair do fluxo da sessão.'
      })}
      ${renderMobilePanel({
        eyebrow: 'Teste guiado',
        title: '1d20 + atributo',
        body: `
          <form id="mobileGuidedRollForm" class="mobile-form">
            <div class="mobile-form-grid">
              <label class="mobile-form-field">
                <span>Personagem</span>
                <select name="characterId">
                  ${ctx.state.characters.map((character) => `<option value="${character.id}" ${character.id === active.id ? 'selected' : ''}>${escapeHtml(character.name)}</option>`).join('')}
                </select>
              </label>
              <label class="mobile-form-field">
                <span>Atributo</span>
                <select name="attributeKey">
                  ${ATTRIBUTE_CONFIG.map((attribute) => `<option value="${attribute.key}">${escapeHtml(attribute.label)}</option>`).join('')}
                </select>
              </label>
              <label class="mobile-form-field">
                <span>Contexto</span>
                <select name="context">
                  <option value="standard">Teste padrão</option>
                  <option value="physical-attack">Ataque físico</option>
                  <option value="ranged-attack">Ataque à distância</option>
                  <option value="domain-clash">Conflito de domínio</option>
                </select>
              </label>
              <label class="mobile-form-field">
                <span>Bônus extra</span>
                <input name="extraBonus" type="number" value="0" />
              </label>
              <label class="mobile-form-field mobile-form-field--wide">
                <span>TN</span>
                <input name="tn" type="number" value="13" />
              </label>
            </div>
            ${renderTnPresets('guided')}
            <button type="submit" class="control-button control-button--primary">${renderButtonLabel('dice', 'Rolar teste')}</button>
          </form>
        `
      })}
      ${renderMobilePanel({
        eyebrow: 'Dados livres',
        title: 'Rolagem customizada',
        body: `
          <form id="mobileCustomRollForm" class="mobile-form">
            <div class="mobile-form-grid">
              <label class="mobile-form-field">
                <span>Notação</span>
                <input name="expression" value="2d6" />
              </label>
              <label class="mobile-form-field">
                <span>Bônus</span>
                <input name="bonus" type="number" value="0" />
              </label>
              <label class="mobile-form-field mobile-form-field--wide">
                <span>Rótulo</span>
                <input name="label" placeholder="Ex.: dano da técnica" />
              </label>
              <label class="mobile-form-field mobile-form-field--wide">
                <span>TN</span>
                <input name="tn" type="number" value="13" />
              </label>
            </div>
            ${renderTnPresets('custom')}
            <button type="submit" class="control-button control-button--primary">${renderButtonLabel('grid', 'Rolar dados')}</button>
          </form>
        `
      })}
      ${renderMobilePanel({
        eyebrow: 'Resumo',
        title: 'Último resultado',
        body: renderLastRoll(ctx.runtime)
      })}
      ${renderMobilePanel({
        eyebrow: 'Log',
        title: 'Rolagens recentes',
        body: `<div id="mobileRollLogSection">${renderLogList(ctx.state)}</div>`
      })}
    </section>
  `;
}

export function bindMobileRollsView(ctx, root) {
  root.querySelector('#mobileGuidedRollForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = formEntries(event.currentTarget);
    ctx.actions.executeAttributeRoll(data.characterId, data.attributeKey, data.context, data.extraBonus, data.tn);
  });

  root.querySelector('#mobileCustomRollForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = formEntries(event.currentTarget);
    ctx.actions.executeCustomRoll(data.expression, data.bonus, data.label, data.tn);
  });

  root.querySelectorAll('[data-mobile-tn]').forEach((button) => {
    button.addEventListener('click', () => {
      const [prefix, value] = String(button.dataset.mobileTn || '').split(':');
      const formId = prefix === 'guided' ? '#mobileGuidedRollForm' : '#mobileCustomRollForm';
      const input = root.querySelector(`${formId} [name="tn"]`);
      if (!input) return;
      input.value = value || '13';
      input.focus();
    });
  });
}
