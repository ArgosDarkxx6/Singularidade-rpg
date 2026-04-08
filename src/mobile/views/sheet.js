import {
  ATTRIBUTE_CONFIG,
  RESOURCE_COLORS,
  RESOURCE_KEYS,
  RESOURCE_LABELS
} from '../../core/constants.js';
import { getAttributeModifier, getFlags } from '../../core/rules.js';
import { clamp, escapeAttribute, escapeHtml, formatMoney, getInitials } from '../../core/utils.js';
import { renderButtonLabel, renderIcon } from '../../ui/icons.js';
import { renderMobileHero, renderMobileMetric, renderMobilePanel } from './shared.js';

function renderAvatar(character) {
  if ((character.avatarMode === 'url' || character.avatarMode === 'upload') && character.avatar) {
    return `<img class="mobile-sheet__avatar" src="${escapeAttribute(character.avatar)}" alt="${escapeAttribute(character.name)}" />`;
  }
  return `<div class="mobile-sheet__avatar--placeholder">${escapeHtml(getInitials(character.name))}</div>`;
}

function renderResourceCard(character, resourceKey, runtime) {
  const resource = character.resources[resourceKey];
  const width = resource.max ? clamp((resource.current / resource.max) * 100, 0, 100) : 0;

  return `
    <article class="mobile-resource-card">
      <div class="mobile-resource-card__top">
        <div>
          <span>${escapeHtml(RESOURCE_LABELS[resourceKey])}</span>
          <strong>${resource.current} / ${resource.max}</strong>
        </div>
        ${runtime.editMode ? `<small>${renderIcon(resourceKey === 'hp' ? 'hp' : resourceKey === 'energy' ? 'energy' : 'sanity', 'ui-icon ui-icon--mini')}</small>` : ''}
      </div>
      <div class="mobile-resource-card__bar">
        <span style="width:${width}%; background:${RESOURCE_COLORS[resourceKey]};"></span>
      </div>
      <div class="mobile-resource-card__controls">
        <button type="button" data-mobile-resource-step="${resourceKey}:-5">-5</button>
        <button type="button" data-mobile-resource-step="${resourceKey}:-1">-1</button>
        <button type="button" data-mobile-resource-step="${resourceKey}:1">+1</button>
        <button type="button" data-mobile-resource-step="${resourceKey}:5">+5</button>
      </div>
      <div class="mobile-form-grid">
        <label class="mobile-form-field">
          <span>Atual</span>
          <input type="number" data-mobile-resource-current="${resourceKey}" value="${escapeAttribute(String(resource.current))}" />
        </label>
        ${runtime.editMode ? `
          <label class="mobile-form-field">
            <span>Maximo</span>
            <input type="number" data-mobile-resource-max="${resourceKey}" value="${escapeAttribute(String(resource.max))}" />
          </label>
        ` : ''}
      </div>
    </article>
  `;
}

function renderIdentityPanel(character, flags) {
  const flagPills = [
    flags.exhaustion ? '<span class="flag-chip is-energy">Exaustao</span>' : '',
    flags.san30 ? '<span class="flag-chip is-warning">SAN&lt;30</span>' : '',
    flags.san15 ? '<span class="flag-chip is-danger">SAN&lt;15</span>' : ''
  ].filter(Boolean).join('');

  return renderMobileHero({
    eyebrow: 'Ficha ativa',
    title: character.name || 'Sem personagem',
    body: character.appearance || 'Abra o gerenciamento de personagens para preencher identidade, recursos e tecnicas.',
    actions: `
      <div class="mobile-inline-actions">
        <span class="type-pill">${escapeHtml(character.clan || 'Sem cla')}</span>
        <span class="type-pill">${escapeHtml(character.grade ? `Grau ${character.grade}` : 'Sem grau')}</span>
        ${flagPills || '<span class="type-pill">Sincronia estavel</span>'}
      </div>
      <div class="mobile-sheet__hero">
        <div class="mobile-sheet__avatar-wrap">${renderAvatar(character)}</div>
        <div class="mobile-sheet__hero-copy">
          <p class="eyebrow">Identidade</p>
          <strong>${escapeHtml(character.identity.anchor || 'Sem ancora definida')}</strong>
          <p>${escapeHtml(character.identity.trigger || 'Sem gatilho registrado')}</p>
        </div>
      </div>
    `
  });
}

function renderAttributesPanel(character) {
  return renderMobilePanel({
    eyebrow: 'Atributos',
    title: 'Leitura rapida da ficha',
    body: `
      <div class="mobile-stack">
        ${ATTRIBUTE_CONFIG.map((attribute) => {
          const current = character.attributes[attribute.key];
          const effective = getAttributeModifier(character, attribute.key);
          return `
            <article class="mobile-collection-card">
              <div class="mobile-inline-actions">
                <strong>${escapeHtml(attribute.label)}</strong>
                <span class="rank-pill rank-pill--${escapeHtml(current.rank)}" data-rank="${escapeHtml(current.rank)}">${escapeHtml(current.rank)}</span>
              </div>
              <p>Base ${current.value >= 0 ? '+' : ''}${current.value} - Ativo ${effective >= 0 ? '+' : ''}${effective}</p>
              <button type="button" class="ghost-button ghost-button--full" data-mobile-quick-roll="${escapeHtml(attribute.key)}">${renderButtonLabel('dice', `Rolar ${attribute.label}`)}</button>
            </article>
          `;
        }).join('')}
      </div>
    `
  });
}

function renderCollectionsPanel(character, runtime) {
  const collectionCards = [
    {
      key: 'weapons',
      title: 'Arsenal',
      count: character.weapons.length,
      preview: character.weapons.slice(0, 2).map((item) => item.name).join(', ') || 'Nenhuma arma cadastrada.',
      icon: 'sheet',
      action: 'Nova arma'
    },
    {
      key: 'techniques',
      title: 'Tecnicas',
      count: character.techniques.length,
      preview: character.techniques.slice(0, 2).map((item) => item.name).join(', ') || 'Nenhuma tecnica cadastrada.',
      icon: 'spark',
      action: 'Nova tecnica'
    },
    {
      key: 'passives',
      title: 'Passivas',
      count: character.passives.length,
      preview: character.passives.slice(0, 2).map((item) => item.name).join(', ') || 'Nenhuma passiva cadastrada.',
      icon: 'tag',
      action: 'Nova passiva'
    },
    {
      key: 'inventory',
      title: 'Inventario',
      count: character.inventory.items.length,
      preview: `${formatMoney(character.inventory.money)} - ${character.inventory.items.slice(0, 2).map((item) => item.name).join(', ') || 'sem itens'}`,
      icon: 'book',
      action: 'Novo item'
    }
  ];

  return renderMobilePanel({
    eyebrow: 'Colecoes',
    title: 'Arsenal, tecnicas e inventario',
    body: `
      <div class="mobile-stack">
        ${collectionCards.map((card) => `
          <article class="mobile-collection-card">
            <div class="mobile-inline-actions">
              <strong>${escapeHtml(card.title)}</strong>
              <span class="type-pill">${card.count}</span>
            </div>
            <p>${escapeHtml(card.preview)}</p>
            ${runtime.editMode ? `<button type="button" class="ghost-button ghost-button--full" data-mobile-collection="${escapeHtml(card.key)}">${renderButtonLabel(card.icon, card.action)}</button>` : ''}
          </article>
        `).join('')}
      </div>
    `
  });
}

function renderConditionsPanel(character, runtime) {
  return renderMobilePanel({
    eyebrow: 'Condicoes',
    title: 'Status em mesa',
    body: character.conditions.length
      ? `
        <div class="mobile-inline-actions">
          ${character.conditions.map((condition) => `
            <span class="tag-chip">${escapeHtml(condition.name)}</span>
          `).join('')}
        </div>
      `
      : '<div class="mobile-info-card"><span>Condicoes</span><p>Nenhuma condicao ativa na ficha.</p></div>',
    actions: runtime.editMode ? `<div class="mobile-inline-actions"><button type="button" class="ghost-button ghost-button--full" data-mobile-add-condition>${renderButtonLabel('tag', 'Nova condicao')}</button></div>` : ''
  });
}

export function renderMobileSheetView(ctx) {
  const { actions, runtime } = ctx;
  const character = actions.getActiveCharacter();
  const flags = getFlags(character);

  return `
    <section class="mobile-page mobile-page--sheet">
      <div class="mobile-character-strip">
        ${ctx.state.characters.map((item) => `
          <button type="button" class="mobile-character-pill ${item.id === character.id ? 'is-active' : ''}" data-mobile-character="${escapeHtml(item.id)}">
            ${escapeHtml(item.name)}
          </button>
        `).join('')}
      </div>
      ${renderIdentityPanel(character, flags)}
      <section id="mobileSheetResources" class="mobile-panel">
        <div class="mobile-panel__header">
          <div>
            <p class="eyebrow">Fluxo</p>
            <h2>PV / EA / SAN</h2>
          </div>
        </div>
        <div class="mobile-panel__body">
          <div class="mobile-resource-grid">
            ${RESOURCE_KEYS.map((resourceKey) => renderResourceCard(character, resourceKey, runtime)).join('')}
          </div>
        </div>
      </section>
      <div class="mobile-metric-row">
        ${renderMobileMetric('Armas', character.weapons.length)}
        ${renderMobileMetric('Tecnicas', character.techniques.length)}
        ${renderMobileMetric('Passivas', character.passives.length)}
        ${renderMobileMetric('Inventario', character.inventory.items.length)}
      </div>
      ${renderConditionsPanel(character, runtime)}
      ${renderAttributesPanel(character)}
      ${renderCollectionsPanel(character, runtime)}
    </section>
  `;
}

export function bindMobileSheetView(ctx, root) {
  const { actions } = ctx;
  const character = actions.getActiveCharacter();

  root.querySelectorAll('[data-mobile-character]').forEach((button) => {
    button.addEventListener('click', () => actions.setActiveCharacter(button.dataset.mobileCharacter));
  });

  root.querySelectorAll('[data-mobile-resource-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const [resourceKey, step] = String(button.dataset.mobileResourceStep || '').split(':');
      actions.adjustResource(character.id, resourceKey, Number(step || 0));
    });
  });

  root.querySelectorAll('[data-mobile-resource-current]').forEach((input) => {
    input.addEventListener('change', () => {
      actions.setResourceCurrent(character.id, input.dataset.mobileResourceCurrent, input.value);
    });
  });

  root.querySelectorAll('[data-mobile-resource-max]').forEach((input) => {
    input.addEventListener('change', () => {
      actions.setResourceMax(character.id, input.dataset.mobileResourceMax, input.value);
    });
  });

  root.querySelectorAll('[data-mobile-quick-roll]').forEach((button) => {
    button.addEventListener('click', () => {
      actions.executeAttributeRoll(character.id, button.dataset.mobileQuickRoll, 'standard');
      actions.setView('rolls');
    });
  });

  root.querySelectorAll('[data-mobile-collection]').forEach((button) => {
    button.addEventListener('click', () => actions.openCollectionModal(button.dataset.mobileCollection));
  });

  root.querySelector('[data-mobile-add-condition]')?.addEventListener('click', () => actions.openConditionModal());
}
