import {
  ATTRIBUTE_CONFIG,
  CONDITION_COLORS,
  RESOURCE_COLORS,
  RESOURCE_KEYS,
  RESOURCE_LABELS
} from '../core/constants.js';
import {
  getAttributeModifier,
  getDisasterProgress,
  getFlags,
  getPendingDisasters
} from '../core/rules.js';
import {
  clamp,
  escapeAttribute,
  escapeHtml,
  formatMoney,
  getInitials
} from '../core/utils.js';
import { renderButtonLabel, renderIcon } from '../ui/icons.js';

function renderAvatar(character, className) {
  if ((character.avatarMode === 'url' || character.avatarMode === 'upload') && character.avatar) {
    return `<img class="${className}" src="${escapeAttribute(character.avatar)}" alt="Avatar de ${escapeAttribute(character.name)}" />`;
  }
  return `<div class="${className} placeholder">${escapeHtml(getInitials(character.name))}</div>`;
}

function hasAvatarImage(character) {
  return !!((character.avatarMode === 'url' || character.avatarMode === 'upload') && character.avatar);
}

function renderSettingsRow(label, valueHtml) {
  return `
    <div class="settings-row">
      <div class="settings-label">${escapeHtml(label)}</div>
      <div class="settings-value">${valueHtml}</div>
    </div>
  `;
}

function renderItemActions(collectionKey, itemId, runtime) {
  if (!runtime.editMode) return '';
  return `
    <div class="item-card__actions edit-only">
      <button class="inline-button" data-edit-collection="${collectionKey}" data-item-id="${itemId}">${renderButtonLabel('edit', 'Editar')}</button>
      <button class="inline-button inline-button--muted" data-remove-collection="${collectionKey}" data-item-id="${itemId}">${renderButtonLabel('trash', 'Remover')}</button>
    </div>
  `;
}

function renderWeaponCard(weapon, runtime) {
  return `
    <article class="item-card item-card--weapon">
      <div class="item-card__header">
        <div class="item-card__title-wrap">
          <h3>${escapeHtml(weapon.name)}</h3>
          <div class="card-chip-row">
            <span class="type-pill">${escapeHtml(weapon.grade || 'Sem grau')}</span>
            ${weapon.damage ? `<span class="type-pill">${escapeHtml(weapon.damage)}</span>` : ''}
            ${weapon.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        ${renderItemActions('weapons', weapon.id, runtime)}
      </div>
      ${weapon.description ? `<div class="item-card__description">${escapeHtml(weapon.description)}</div>` : ''}
    </article>
  `;
}

function renderTechniqueCard(technique, runtime) {
  return `
    <article class="item-card item-card--technique">
      <div class="item-card__header">
        <div class="item-card__title-wrap">
          <h3>${escapeHtml(technique.name)}</h3>
          <div class="card-chip-row">
            <span class="type-pill">${escapeHtml(technique.type)}</span>
            <span class="type-pill">Custo ${technique.cost} EA</span>
            ${technique.damage ? `<span class="type-pill">${escapeHtml(technique.damage)}</span>` : ''}
            ${technique.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        ${renderItemActions('techniques', technique.id, runtime)}
      </div>
      <div class="item-card__description">${escapeHtml(technique.description || 'Sem descrição.')}</div>
      <div class="item-card__actions">
        <button class="inline-button" type="button" data-open-reference="${escapeHtml(technique.name)}">${renderButtonLabel('book', 'Abrir no Livro')}</button>
      </div>
    </article>
  `;
}

function renderPassiveCard(passive, runtime) {
  return `
    <article class="item-card item-card--passive">
      <div class="item-card__header">
        <div class="item-card__title-wrap">
          <h3>${escapeHtml(passive.name)}</h3>
          <div class="card-chip-row">
            ${passive.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        ${renderItemActions('passives', passive.id, runtime)}
      </div>
      <div class="item-card__description">${escapeHtml(passive.description || 'Sem descrição.')}</div>
    </article>
  `;
}

function renderVowCard(vow, runtime) {
  return `
    <article class="item-card item-card--vow">
      <div class="item-card__header">
        <div class="item-card__title-wrap">
          <h3>${escapeHtml(vow.name)}</h3>
        </div>
        ${renderItemActions('vows', vow.id, runtime)}
      </div>
      <div class="settings-list">
        ${renderSettingsRow('Benefício', escapeHtml(vow.benefit || '—'))}
        ${renderSettingsRow('Restrição', escapeHtml(vow.restriction || '—'))}
        ${renderSettingsRow('Penalidade', escapeHtml(vow.penalty || '—'))}
      </div>
    </article>
  `;
}

function renderInventoryCard(item, runtime) {
  return `
    <article class="item-card item-card--inventory">
      <div class="item-card__header">
        <div class="item-card__title-wrap">
          <h3>${escapeHtml(item.name)}</h3>
          <div class="card-chip-row"><span class="type-pill">Qtd. ${item.quantity}</span></div>
        </div>
        ${renderItemActions('inventory', item.id, runtime)}
      </div>
      <div class="item-card__description">${escapeHtml(item.effect || 'Sem efeito registrado.')}</div>
    </article>
  `;
}

function renderConditionChip(condition) {
  const theme = CONDITION_COLORS[condition.color] || CONDITION_COLORS.purple;
  return `
    <span class="tag-chip tag-chip--condition" style="background:${theme.bg}; border-color:${theme.border};">
      <strong>${escapeHtml(condition.name)}</strong>
      ${condition.note ? `<span>${escapeHtml(condition.note)}</span>` : ''}
      <button type="button" class="icon-button tag-chip__remove" aria-label="Abrir regra" data-open-reference="${condition.name}">
        ${renderIcon('book', 'ui-icon ui-icon--xs')}
      </button>
      <button type="button" class="icon-button tag-chip__remove" aria-label="Remover condição" data-remove-condition="${condition.id}">
        ${renderIcon('close', 'ui-icon ui-icon--xs')}
      </button>
    </span>
  `;
}

function renderResourceCard(character, resourceKey, runtime) {
  const resource = character.resources[resourceKey];
  const width = resource.max ? clamp((resource.current / resource.max) * 100, 0, 100) : 0;
  return `
    <article class="resource-card resource-card--${resourceKey}">
      <div class="resource-card__glow"></div>
      <div class="resource-card__top">
        <div class="resource-card__title">
          ${renderIcon(resourceKey === 'hp' ? 'hp' : resourceKey === 'energy' ? 'energy' : 'sanity', 'ui-icon ui-icon--resource')}
          <div>
            <h3>${RESOURCE_LABELS[resourceKey]}</h3>
            <div class="item-card__meta">Atual / máximo</div>
          </div>
        </div>
        <div class="resource-value">${resource.current} / ${resource.max}</div>
      </div>
      <div class="resource-bar"><span style="width:${width}%; background:${RESOURCE_COLORS[resourceKey]};"></span></div>
      <div class="resource-stepper">
        <div class="resource-stepper__group">
          <button type="button" data-resource-key="${resourceKey}" data-resource-step="-5">-5</button>
          <button type="button" data-resource-key="${resourceKey}" data-resource-step="-1">-1</button>
          <button type="button" data-resource-key="${resourceKey}" data-resource-step="1">+1</button>
          <button type="button" data-resource-key="${resourceKey}" data-resource-step="5">+5</button>
        </div>
        <div class="resource-stepper__group resource-stepper__group--fields">
          <label>
            <span class="settings-label">Atual</span>
            <input class="editable-input" data-resource-current="${resourceKey}" type="number" value="${escapeAttribute(String(resource.current))}" />
          </label>
          ${runtime.editMode ? `
            <label>
              <span class="settings-label">Máximo</span>
              <input class="editable-input" data-resource-max="${resourceKey}" type="number" value="${escapeAttribute(String(resource.max))}" />
            </label>
          ` : ''}
        </div>
      </div>
    </article>
  `;
}

function bindCollectionButtons(container, collectionKey, items, actions) {
  container.querySelectorAll('[data-edit-collection]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = items.find((entry) => entry.id === button.dataset.itemId);
      if (!item) return;
      actions.openCollectionModal(collectionKey, item);
    });
  });

  container.querySelectorAll('[data-remove-collection]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = items.find((entry) => entry.id === button.dataset.itemId);
      if (!item) return;
      actions.removeCollectionItem(collectionKey, item.id, item.name);
    });
  });
}

export function renderSheetQuickLinks(ctx) {
  const { dom } = ctx;
  if (!dom.sheetQuickLinksSection) return;

  const links = [
    { target: 'identitySection', label: 'Identidade' },
    { target: 'sheetConditionsPanel', label: 'Condições' },
    { target: 'sheetAttributesPanel', label: 'Atributos' },
    { target: 'sheetWeaponsPanel', label: 'Arsenal' },
    { target: 'sheetTechniquesPanel', label: 'Técnicas' },
    { target: 'sheetInventoryPanel', label: 'Inventário' }
  ];

  dom.sheetQuickLinksSection.innerHTML = `
    <div class="sheet-quicklinks">
      <span class="sheet-quicklinks__label">Atalhos da ficha</span>
      <div class="sheet-quicklinks__list">
        ${links.map((link) => `
          <button type="button" class="sheet-quicklinks__button" data-scroll-target="${link.target}">
            ${escapeHtml(link.label)}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  dom.sheetQuickLinksSection.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.scrollTarget);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

export function renderCharacterList(ctx) {
  const { dom, state, actions, runtime } = ctx;
  const activeCharacter = actions.getActiveCharacter();
  const linkedCharacterId = runtime.online.session?.characterId || '';
  const isPlayerScoped = runtime.online.session?.role === 'player' && linkedCharacterId;

  dom.characterList.innerHTML = state.characters.map((character) => {
    const flags = getFlags(character);
    const gradeLabel = character.grade ? `Grau ${escapeHtml(String(character.grade))}` : 'Sem grau';
    const isLocked = isPlayerScoped && character.id !== linkedCharacterId;
    const isConnectedMember = (runtime.online.members || []).some((member) => member.characterId === character.id);
    return `
      <article class="character-card-shell ${activeCharacter.id === character.id ? 'is-active' : ''} ${isLocked ? 'is-locked' : ''}">
        <button class="character-card-button ${activeCharacter.id === character.id ? 'is-active' : ''}" data-character-id="${character.id}" ${isLocked ? 'aria-disabled="true"' : ''}>
          <span class="character-card-button__pulse" aria-hidden="true"></span>
          ${renderAvatar(character, 'character-avatar')}
          <div class="character-card-button__body">
            <div class="character-card-button__top">
              <h3>${escapeHtml(character.name)}</h3>
              <span class="character-card-button__grade">${gradeLabel}</span>
            </div>
            <p>${escapeHtml(character.clan || 'Sem clã')}</p>
            <div class="card-chip-row card-chip-row--compact">
              ${isConnectedMember ? '<span class="flag-chip is-info">Conectado</span>' : ''}
              ${linkedCharacterId === character.id ? '<span class="flag-chip is-success">Seu link</span>' : ''}
              ${flags.exhaustion ? '<span class="flag-chip is-energy">Exaustão</span>' : ''}
              ${flags.san30 ? '<span class="flag-chip is-warning">SAN&lt;30</span>' : ''}
              ${flags.san15 ? '<span class="flag-chip is-danger">SAN&lt;15</span>' : ''}
            </div>
          </div>
        </button>
      </article>
    `;
  }).join('');

  dom.characterList.querySelectorAll('[data-character-id]').forEach((button) => {
    button.addEventListener('click', () => actions.setActiveCharacter(button.dataset.characterId));
  });
}

export function renderMiniHud(ctx) {
  const { dom, runtime } = ctx;
  const character = ctx.actions.getActiveCharacter();
  const flags = getFlags(character);

  dom.miniHud.innerHTML = `
    <span class="mini-hud__chip mini-hud__chip--identity">
      ${renderIcon('sheet', 'ui-icon ui-icon--mini')}
      <strong>${escapeHtml(character.name)}</strong>
      <span>${escapeHtml(character.clan || 'Sem clã')}</span>
    </span>
    ${RESOURCE_KEYS.map((resourceKey) => {
      const resource = character.resources[resourceKey];
      const width = resource.max ? clamp((resource.current / resource.max) * 100, 0, 100) : 0;
      return `
        <span class="mini-hud__chip mini-hud__chip--${resourceKey}">
          ${renderIcon(resourceKey === 'hp' ? 'hp' : resourceKey === 'energy' ? 'energy' : 'sanity', 'ui-icon ui-icon--mini')}
          <strong>${RESOURCE_LABELS[resourceKey]}</strong>
          <span>${resource.current}/${resource.max}</span>
          <span class="mini-hud__bar"><span style="width:${width}%; background:${RESOURCE_COLORS[resourceKey]};"></span></span>
        </span>
      `;
    }).join('')}
    ${runtime.online.session ? `
      <span class="mini-hud__chip mini-hud__chip--cloud">
        ${renderIcon('users', 'ui-icon ui-icon--mini')}
        <strong>${escapeHtml(runtime.online.table?.name || 'Mesa online')}</strong>
        <span>${escapeHtml(runtime.online.session.role === 'gm' ? 'Mestre' : runtime.online.session.role === 'player' ? 'Jogador' : 'Espectador')}</span>
      </span>
    ` : ''}
    ${flags.exhaustion ? '<span class="flag-chip is-energy">Exaustão</span>' : ''}
    ${flags.san30 ? '<span class="flag-chip is-warning">SAN&lt;30</span>' : ''}
    ${flags.san15 ? '<span class="flag-chip is-danger">SAN&lt;15</span>' : ''}
  `;
}

export function renderSidebarDisasterMini(ctx) {
  const { dom, state, actions } = ctx;
  const disaster = state.disaster;
  const pending = getPendingDisasters(disaster);
  const progress = getDisasterProgress(disaster);

  dom.sidebarDisasterMini.innerHTML = `
    <div class="status-mini-card status-mini-card--chaos">
      <div class="status-mini-card__top">
        <div>
          <p class="eyebrow">Ritmo da sessão</p>
          <h3>Ciclo do caos</h3>
        </div>
        <span class="flag-chip is-info">${disaster.criticalFailures}/${disaster.threshold}</span>
      </div>
      <div class="status-mini-card__bar"><span style="width:${progress}%;"></span></div>
      <div class="status-mini-card__meta"><span>Falhas críticas</span><strong>${disaster.criticalFailures}</strong></div>
      <div class="status-mini-card__meta"><span>Desastres prontos</span><strong>${pending}</strong></div>
      <div class="status-mini-card__actions">
        <button class="inline-button inline-button--muted" data-disaster-step="-1">${renderButtonLabel('minus', 'Remover erro')}</button>
        <button class="inline-button inline-button--accent" data-disaster-step="1">${renderButtonLabel('plus', 'Adicionar erro')}</button>
      </div>
    </div>
  `;

  dom.sidebarDisasterMini.querySelectorAll('[data-disaster-step]').forEach((button) => {
    button.addEventListener('click', () => actions.adjustCriticalFailures(Number(button.dataset.disasterStep)));
  });
}

export function renderIdentitySection(ctx) {
  const { dom, runtime, actions } = ctx;
  const character = actions.getActiveCharacter();
  const isEdit = runtime.editMode;
  const canOpenAvatar = hasAvatarImage(character);
  const flags = getFlags(character);
  const statusHtml = [
    flags.exhaustion ? '<span class="flag-chip is-energy">Exaustão</span>' : '',
    flags.san30 ? '<span class="flag-chip is-warning">SAN&lt;30</span>' : '',
    flags.san15 ? '<span class="flag-chip is-danger">SAN&lt;15</span>' : ''
  ].filter(Boolean).join('');

  const detailRows = isEdit
    ? [
        renderSettingsRow('Nome', `<input class="editable-input" data-field="name" value="${escapeAttribute(character.name)}" />`),
        renderSettingsRow('Idade', `<input class="editable-input" data-field="age" type="number" min="0" value="${escapeAttribute(String(character.age))}" />`),
        renderSettingsRow('Clã', `<input class="editable-input" data-field="clan" value="${escapeAttribute(character.clan)}" />`),
        renderSettingsRow('Grau', `<input class="editable-input" data-field="grade" value="${escapeAttribute(String(character.grade || ''))}" />`),
        renderSettingsRow('Aparência', `<textarea class="editable-textarea" data-field="appearance">${escapeHtml(character.appearance)}</textarea>`),
        renderSettingsRow('Cicatriz', `<input class="editable-input" data-field="identity.scar" value="${escapeAttribute(character.identity.scar)}" placeholder="Opcional" />`),
        renderSettingsRow('Âncora', `<input class="editable-input" data-field="identity.anchor" value="${escapeAttribute(character.identity.anchor)}" placeholder="Opcional" />`),
        renderSettingsRow('Gatilho', `<input class="editable-input" data-field="identity.trigger" value="${escapeAttribute(character.identity.trigger)}" placeholder="Opcional" />`)
      ].join('')
    : [
        renderSettingsRow('Aparência', escapeHtml(character.appearance || '—')),
        renderSettingsRow('Cicatriz', escapeHtml(character.identity.scar || '—')),
        renderSettingsRow('Âncora', escapeHtml(character.identity.anchor || '—')),
        renderSettingsRow('Gatilho', escapeHtml(character.identity.trigger || '—'))
      ].join('');

  dom.identitySection.innerHTML = `
    <div class="identity-hero">
      <div class="identity-hero__visual">
        <div class="identity-avatar-column">
          <div class="identity-avatar-frame ${canOpenAvatar ? 'identity-avatar-frame--interactive' : ''}" data-avatar-toggle>
            ${renderAvatar(character, 'identity-avatar')}
          </div>
          <div class="identity-avatar-note">${canOpenAvatar ? 'Clique no avatar para ampliar o retrato.' : 'Adicione um avatar para liberar a visualização ampliada.'}</div>
          ${isEdit ? `
            <div class="avatar-controls">
              <label class="modal-field">
                <span class="settings-label">URL do avatar</span>
                <input class="editable-input" id="avatarUrlInput" type="url" placeholder="https://..." value="${escapeAttribute(character.avatarMode === 'url' ? character.avatar : '')}" />
              </label>
              <label class="avatar-upload-button" for="avatarUploadInput">${renderButtonLabel('upload', 'Upload do avatar')}</label>
              <input id="avatarUploadInput" type="file" accept="image/*" hidden />
              <button id="clearAvatarButton" class="ghost-button">${renderButtonLabel('trash', 'Remover avatar')}</button>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="identity-hero__content">
        <div class="identity-hero__headline">
          <div class="identity-hero__intro">
            <p class="eyebrow">Registro em campo</p>
            <h3>${escapeHtml(character.name)}</h3>
          </div>
          <div class="identity-hero__headline-actions">
            <div class="status-strip identity-status-strip">
              ${statusHtml || '<span class="flag-chip is-info">Sincronia estável</span>'}
            </div>
          </div>
        </div>
        <p class="identity-hero__summary">${escapeHtml(character.appearance || 'Sem descrição registrada para o personagem ativo.')}</p>
        <div class="identity-hero__facts">
          <div class="identity-stat">
            <span>Idade</span>
            <strong>${escapeHtml(String(character.age))} anos</strong>
          </div>
          <div class="identity-stat">
            <span>Clã</span>
            <strong>${escapeHtml(character.clan || 'Sem clã')}</strong>
          </div>
          <div class="identity-stat">
            <span>Grau</span>
            <strong>${character.grade ? `Grau ${escapeHtml(String(character.grade))}` : '—'}</strong>
          </div>
        </div>
        <div class="settings-list settings-list--identity">
          ${detailRows}
        </div>
      </div>
    </div>
  `;

  dom.identitySection.querySelector('[data-avatar-toggle]')?.addEventListener('click', () => {
    if (!canOpenAvatar) return;
    actions.openAvatarLightbox({
      src: character.avatar,
      alt: `Avatar de ${character.name}`,
      caption: `${character.name}${character.clan ? ` • ${character.clan}` : ''}`
    });
  });

  if (!isEdit) return;

  dom.identitySection.querySelectorAll('[data-field]').forEach((input) => {
    input.addEventListener('change', () => {
      const field = input.dataset.field;
      const value = input.type === 'number' ? Number(input.value) : input.value;
      actions.setCharacterField(character.id, field, value);
    });
  });

  dom.identitySection.querySelector('#avatarUploadInput')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await actions.setCharacterAvatarUpload(character.id, file);
  });

  dom.identitySection.querySelector('#avatarUrlInput')?.addEventListener('change', (event) => {
    actions.setCharacterAvatarUrl(character.id, event.target.value.trim());
  });

  dom.identitySection.querySelector('#clearAvatarButton')?.addEventListener('click', () => {
    actions.clearCharacterAvatar(character.id);
  });
}

export function renderResourceSection(ctx) {
  const { dom, runtime, actions } = ctx;
  const character = actions.getActiveCharacter();
  const flags = getFlags(character);

  const statusHtml = [
    flags.exhaustion ? '<span class="flag-chip is-energy">Exaustão</span>' : '',
    flags.san30 ? '<span class="flag-chip is-warning">SAN&lt;30</span>' : '',
    flags.san15 ? '<span class="flag-chip is-danger">SAN&lt;15</span>' : ''
  ].filter(Boolean).join('');

  dom.resourceSection.innerHTML = `
    <div class="resource-list resource-list--hero">
      ${RESOURCE_KEYS.map((resourceKey) => renderResourceCard(character, resourceKey, runtime)).join('')}
      <div class="status-strip">${statusHtml || '<span class="flag-chip is-info">Sem flags automáticas no momento.</span>'}</div>
    </div>
  `;

  dom.resourceSection.querySelectorAll('[data-resource-step]').forEach((button) => {
    button.addEventListener('click', () => {
      actions.adjustResource(character.id, button.dataset.resourceKey, Number(button.dataset.resourceStep));
    });
  });

  dom.resourceSection.querySelectorAll('[data-resource-current]').forEach((input) => {
    input.addEventListener('change', () => actions.setResourceCurrent(character.id, input.dataset.resourceCurrent, input.value));
  });

  if (!runtime.editMode) return;

  dom.resourceSection.querySelectorAll('[data-resource-max]').forEach((input) => {
    input.addEventListener('change', () => actions.setResourceMax(character.id, input.dataset.resourceMax, input.value));
  });
}

export function renderConditionsSection(ctx) {
  const { dom, actions } = ctx;
  const character = actions.getActiveCharacter();

  if (!character.conditions.length) {
    dom.conditionsSection.innerHTML = '<div class="empty-state">Nenhuma condição ativa. Use o botão acima para marcar status de mesa.</div>';
    return;
  }

  dom.conditionsSection.innerHTML = `
    <div class="conditions-wrap">
      ${character.conditions.map(renderConditionChip).join('')}
    </div>
  `;

  dom.conditionsSection.querySelectorAll('[data-remove-condition]').forEach((button) => {
    button.addEventListener('click', () => actions.removeCondition(character.id, button.dataset.removeCondition));
  });
  dom.conditionsSection.querySelectorAll('[data-open-reference]').forEach((button) => {
    button.addEventListener('click', () => actions.openCompendiumReference(button.dataset.openReference));
  });
}

export function renderAttributesSection(ctx) {
  const { dom, runtime, actions } = ctx;
  const character = actions.getActiveCharacter();

  dom.attributesSection.innerHTML = `
    <div class="attributes-table">
      ${ATTRIBUTE_CONFIG.map((attribute) => {
        const modifier = getAttributeModifier(character, attribute.key);
        const value = character.attributes[attribute.key].value;
        const rank = character.attributes[attribute.key].rank;
        const isAdjusted = modifier !== value;
        return `
          <div class="attribute-row">
            <div class="attribute-row__label">
              <h3>${attribute.label}</h3>
              <div class="attribute-row__meta">Teste padrão: 1d20 + atributo ${isAdjusted ? `(ativo: ${modifier >= 0 ? '+' : ''}${modifier})` : ''}</div>
            </div>
            <div>
              ${runtime.editMode
                ? `<input class="editable-input" data-attribute-value="${attribute.key}" type="number" value="${escapeAttribute(String(value))}" />`
                : `<div class="attribute-value">${value >= 0 ? '+' : ''}${value}</div>`}
            </div>
            <div>
              ${runtime.editMode
                ? `<select class="editable-select" data-attribute-rank="${attribute.key}">${['C', 'B', 'A', 'S', 'SS', 'SSS'].map((rankOption) => `<option value="${rankOption}" ${rankOption === rank ? 'selected' : ''}>${rankOption}</option>`).join('')}</select>`
                : `<span class="rank-pill rank-pill--${rank}" data-rank="${rank}">${rank}</span>`}
            </div>
            <button class="icon-button roll-quick-button" title="Rolar ${attribute.label}" aria-label="Rolar ${attribute.label}" data-quick-roll="${attribute.key}">${renderIcon('dice')}</button>
          </div>
        `;
      }).join('')}
    </div>
  `;

  dom.attributesSection.querySelectorAll('[data-quick-roll]').forEach((button) => {
    button.addEventListener('click', () => actions.executeAttributeRoll(character.id, button.dataset.quickRoll, 'standard'));
  });

  if (!runtime.editMode) return;

  dom.attributesSection.querySelectorAll('[data-attribute-value]').forEach((input) => {
    input.addEventListener('change', () => actions.setAttributeValue(character.id, input.dataset.attributeValue, input.value));
  });

  dom.attributesSection.querySelectorAll('[data-attribute-rank]').forEach((input) => {
    input.addEventListener('change', () => actions.setAttributeRank(character.id, input.dataset.attributeRank, input.value));
  });
}

export function renderWeaponsSection(ctx) {
  const { dom, runtime, actions } = ctx;
  const items = actions.getActiveCharacter().weapons;
  dom.weaponsSection.innerHTML = items.length
    ? items.map((item) => renderWeaponCard(item, runtime)).join('')
    : '<div class="empty-state">Nenhuma arma cadastrada.</div>';
  if (runtime.editMode) bindCollectionButtons(dom.weaponsSection, 'weapons', items, actions);
}

export function renderTechniquesSection(ctx) {
  const { dom, runtime, actions } = ctx;
  const items = actions.getActiveCharacter().techniques;
  dom.techniquesSection.innerHTML = items.length
    ? items.map((item) => renderTechniqueCard(item, runtime)).join('')
    : '<div class="empty-state">Nenhuma técnica cadastrada.</div>';
  dom.techniquesSection.querySelectorAll('[data-open-reference]').forEach((button) => {
    button.addEventListener('click', () => actions.openCompendiumReference(button.dataset.openReference));
  });
  if (runtime.editMode) bindCollectionButtons(dom.techniquesSection, 'techniques', items, actions);
}

export function renderPassivesSection(ctx) {
  const { dom, runtime, actions } = ctx;
  const items = actions.getActiveCharacter().passives;
  dom.passivesSection.innerHTML = items.length
    ? items.map((item) => renderPassiveCard(item, runtime)).join('')
    : '<div class="empty-state">Nenhuma passiva cadastrada.</div>';
  if (runtime.editMode) bindCollectionButtons(dom.passivesSection, 'passives', items, actions);
}

export function renderVowsSection(ctx) {
  const { dom, runtime, actions } = ctx;
  const items = actions.getActiveCharacter().vows;
  dom.vowsSection.innerHTML = items.length
    ? items.map((item) => renderVowCard(item, runtime)).join('')
    : '<div class="empty-state">Nenhum voto cadastrado.</div>';
  if (runtime.editMode) bindCollectionButtons(dom.vowsSection, 'vows', items, actions);
}

export function renderInventorySection(ctx) {
  const { dom, runtime, actions } = ctx;
  const character = actions.getActiveCharacter();

  dom.inventorySection.innerHTML = `
    <div class="inventory-layout">
      <div class="inventory-money">
        <strong>Dinheiro:</strong>
        ${runtime.editMode
          ? `<input class="editable-input" id="inventoryMoneyInput" type="number" min="0" value="${escapeAttribute(String(character.inventory.money))}" />`
          : `<span> ${formatMoney(character.inventory.money)}</span>`}
      </div>
      <div class="stack-list">
        ${character.inventory.items.length
          ? character.inventory.items.map((item) => renderInventoryCard(item, runtime)).join('')
          : '<div class="empty-state">Inventário vazio.</div>'}
      </div>
    </div>
  `;

  if (runtime.editMode) {
    dom.inventorySection.querySelector('#inventoryMoneyInput')?.addEventListener('change', (event) => {
      actions.setInventoryMoney(character.id, event.target.value);
    });
    bindCollectionButtons(dom.inventorySection, 'inventory', character.inventory.items, actions);
  }
}
