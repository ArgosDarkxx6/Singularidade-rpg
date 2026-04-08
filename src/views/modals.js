import {
  CONDITION_COLORS,
  GRADE_OPTIONS,
  TECHNIQUE_TYPES
} from '../core/constants.js';
import { searchCanonPresets } from '../content/canon-presets.js';
import {
  escapeAttribute,
  escapeHtml,
  getInitials,
  parseTags,
  safeNumber
} from '../core/utils.js';
import { renderButtonLabel } from '../ui/icons.js';

function renderPresetCard(collectionKey, preset) {
  const badges = [];

  if (preset.origin) badges.push(`<span class="type-pill">${escapeHtml(preset.origin)}</span>`);
  if (collectionKey === 'techniques') {
    if (preset.type) badges.push(`<span class="type-pill">${escapeHtml(preset.type)}</span>`);
    badges.push(`<span class="type-pill">Custo ${preset.cost} EA</span>`);
    if (preset.damage) badges.push(`<span class="type-pill">${escapeHtml(preset.damage)}</span>`);
  }
  if (collectionKey === 'weapons') {
    if (preset.grade) badges.push(`<span class="type-pill">${escapeHtml(preset.grade)}</span>`);
    if (preset.damage) badges.push(`<span class="type-pill">${escapeHtml(preset.damage)}</span>`);
  }
  if (collectionKey === 'inventory') {
    badges.push(`<span class="type-pill">Qtd. ${preset.quantity}</span>`);
  }
  (preset.tags || []).slice(0, 3).forEach((tag) => {
    badges.push(`<span class="tag-chip">${escapeHtml(tag)}</span>`);
  });

  return `
    <button type="button" class="preset-card" data-preset-id="${escapeAttribute(preset.id)}">
      <div class="preset-card__header">
        <strong>${escapeHtml(preset.name)}</strong>
        <span class="preset-card__cta">Aplicar</span>
      </div>
      <div class="card-chip-row card-chip-row--compact">${badges.join('')}</div>
      <p>${escapeHtml(preset.description || preset.effect || 'Sem resumo registrado.')}</p>
    </button>
  `;
}

function renderPresetBrowser(collectionKey, label) {
  return `
    <section class="preset-browser" data-preset-browser="${escapeAttribute(collectionKey)}">
      <div class="preset-browser__header">
        <div>
          <span class="eyebrow">Biblioteca canonica</span>
          <h3>Preencher com preset</h3>
        </div>
        <p class="item-card__meta">Escolha um ${escapeHtml(label)} pronto e ajuste os campos como quiser antes de salvar.</p>
      </div>
      <label class="modal-field preset-browser__search">
        <span>Buscar preset</span>
        <input
          type="search"
          data-preset-search="${escapeAttribute(collectionKey)}"
          placeholder="Nome, origem, tag ou efeito"
          autocomplete="off"
        />
      </label>
      <div class="preset-browser__results" data-preset-results="${escapeAttribute(collectionKey)}"></div>
    </section>
  `;
}

function fillNamedField(form, name, value) {
  const field = form.elements.namedItem(name);
  if (!field) return;
  field.value = value ?? '';
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

function applyPresetToForm(form, collectionKey, preset) {
  if (!form || !preset) return;

  fillNamedField(form, 'name', preset.name || '');

  if (collectionKey === 'techniques') {
    fillNamedField(form, 'cost', preset.cost ?? 0);
    fillNamedField(form, 'damage', preset.damage || '');
    fillNamedField(form, 'type', preset.type || 'Ofensiva');
    fillNamedField(form, 'tags', (preset.tags || []).join(', '));
    fillNamedField(form, 'description', preset.description || '');
    return;
  }

  if (collectionKey === 'weapons') {
    fillNamedField(form, 'grade', preset.grade || 'Grau 4');
    fillNamedField(form, 'damage', preset.damage || '');
    fillNamedField(form, 'tags', (preset.tags || []).join(', '));
    fillNamedField(form, 'description', preset.description || '');
    return;
  }

  if (collectionKey === 'passives') {
    fillNamedField(form, 'tags', (preset.tags || []).join(', '));
    fillNamedField(form, 'description', preset.description || '');
    return;
  }

  if (collectionKey === 'inventory') {
    fillNamedField(form, 'quantity', preset.quantity ?? 1);
    fillNamedField(form, 'effect', preset.effect || '');
  }
}

function renderManagerAvatar(character) {
  if ((character.avatarMode === 'url' || character.avatarMode === 'upload') && character.avatar) {
    return `<img class="character-manager-card__avatar" src="${escapeAttribute(character.avatar)}" alt="Avatar de ${escapeAttribute(character.name)}" />`;
  }

  return `<div class="character-manager-card__avatar character-manager-card__avatar--placeholder">${escapeHtml(getInitials(character.name))}</div>`;
}

function renderCharacterManagerCard(character, activeCharacterId, totalCharacters) {
  const isActive = character.id === activeCharacterId;
  const gradeLabel = character.grade ? `Grau ${escapeHtml(String(character.grade))}` : 'Sem grau';

  return `
    <article class="character-manager-card ${isActive ? 'is-active' : ''}">
      <div class="character-manager-card__main">
        ${renderManagerAvatar(character)}
        <div class="character-manager-card__body">
          <div class="character-manager-card__top">
            <strong>${escapeHtml(character.name)}</strong>
            <span class="type-pill">${gradeLabel}</span>
          </div>
          <p>${escapeHtml(character.clan || 'Sem cla registrado')}</p>
          <div class="card-chip-row card-chip-row--compact">
            <span class="tag-chip">PV ${character.resources.hp.current}/${character.resources.hp.max}</span>
            <span class="tag-chip">EA ${character.resources.energy.current}/${character.resources.energy.max}</span>
            <span class="tag-chip">SAN ${character.resources.sanity.current}/${character.resources.sanity.max}</span>
          </div>
        </div>
      </div>
      <div class="character-manager-card__actions">
        <button
          type="button"
          class="inline-button ${isActive ? 'inline-button--accent' : ''}"
          data-manager-activate="${escapeAttribute(character.id)}"
          ${isActive ? 'disabled' : ''}
        >
          ${renderButtonLabel('sheet', isActive ? 'Ativo' : 'Definir ativo')}
        </button>
        <button
          type="button"
          class="inline-button inline-button--muted"
          data-manager-delete="${escapeAttribute(character.id)}"
          ${totalCharacters <= 1 ? 'disabled' : ''}
        >
          ${renderButtonLabel('trash', totalCharacters <= 1 ? 'Ultimo personagem' : 'Excluir')}
        </button>
      </div>
    </article>
  `;
}

function renderCharacterManagerBody(state) {
  return `
    <section class="character-manager">
      <div class="character-manager__split">
        <section class="character-manager__composer">
          <div class="character-manager__section-head">
            <span class="eyebrow">Novo registro</span>
            <h3>Adicionar personagem</h3>
            <p class="item-card__meta">Crie uma ficha base e refine o restante no modo edicao.</p>
          </div>
          <div class="modal-grid">
            <label class="modal-field"><span>Nome</span><input name="name" required placeholder="Ex.: Yuji" /></label>
            <label class="modal-field"><span>Idade</span><input name="age" type="number" min="0" value="16" /></label>
            <label class="modal-field"><span>Cla</span><input name="clan" placeholder="Opcional" /></label>
            <label class="modal-field"><span>Grau</span><input name="grade" placeholder="3" value="4" /></label>
            <label class="modal-field"><span>PV maximo</span><input name="hpMax" type="number" min="1" value="20" /></label>
            <label class="modal-field"><span>EA maxima</span><input name="energyMax" type="number" min="0" value="10" /></label>
            <label class="modal-field"><span>SAN maxima</span><input name="sanityMax" type="number" min="1" value="50" /></label>
          </div>
          <label class="modal-field">
            <span>Aparencia</span>
            <textarea name="appearance" placeholder="Descricao breve para a ficha."></textarea>
          </label>
        </section>
        <section class="character-manager__registry">
          <div class="character-manager__section-head">
            <span class="eyebrow">Elenco atual</span>
            <h3>Gerenciar fichas</h3>
            <p class="item-card__meta">Defina a ficha ativa ou remova personagens com seguranca sem poluir o elenco lateral.</p>
          </div>
          <div class="character-manager__list">
            ${state.characters.map((character) => renderCharacterManagerCard(character, state.activeCharacterId, state.characters.length)).join('')}
          </div>
        </section>
      </div>
    </section>
  `;
}

export function createModalActions({ ui, modalRoot, getState, getActiveCharacter, actions }) {
  function bindPresetBrowser(collectionKey) {
    const form = modalRoot.querySelector('.modal-form');
    const input = modalRoot.querySelector(`[data-preset-search="${collectionKey}"]`);
    const results = modalRoot.querySelector(`[data-preset-results="${collectionKey}"]`);
    if (!form || !input || !results) return;

    const renderResults = (query = '') => {
      const presets = searchCanonPresets(collectionKey, query).slice(0, 8);
      results.innerHTML = presets.length
        ? presets.map((preset) => renderPresetCard(collectionKey, preset)).join('')
        : '<div class="empty-state empty-state--compact">Nenhum preset encontrado para esse filtro.</div>';

      results.querySelectorAll('[data-preset-id]').forEach((button) => {
        button.addEventListener('click', () => {
          const preset = searchCanonPresets(collectionKey, input.value.trim())
            .find((entry) => entry.id === button.dataset.presetId);
          if (!preset) return;
          applyPresetToForm(form, collectionKey, preset);
          ui.toast('Preset aplicado', `${preset.name} preencheu o formulario e continua editavel.`, 'success');
        });
      });
    };

    input.addEventListener('input', () => renderResults(input.value.trim()));
    renderResults();
  }

  function openConditionModal() {
    ui.openModal({
      title: 'Nova condicao',
      subtitle: 'Tags rapidas que podem ser usadas fora do modo edicao.',
      body: `
        <div class="modal-grid">
          <label class="modal-field">
            <span>Nome</span>
            <input name="name" required placeholder="Ex.: Sangrando" />
          </label>
          <label class="modal-field">
            <span>Cor</span>
            <select name="color">${Object.entries(CONDITION_COLORS).map(([value, config]) => `<option value="${value}">${config.label}</option>`).join('')}</select>
          </label>
        </div>
        <label class="modal-field">
          <span>Nota opcional</span>
          <textarea name="note" placeholder="Ex.: -1 Destreza no proximo turno"></textarea>
        </label>
      `,
      submitText: 'Aplicar condicao',
      onSubmit(formData) {
        const payload = {
          name: String(formData.get('name') || '').trim(),
          color: String(formData.get('color') || 'purple'),
          note: String(formData.get('note') || '').trim()
        };
        if (!payload.name) return;
        actions.addCondition(getActiveCharacter().id, payload);
        ui.closeModal();
      }
    });
  }

  function openTechniqueModal(existing) {
    const item = existing || { id: '', name: '', cost: 0, damage: '', type: 'Ofensiva', tags: [], description: '' };
    ui.openModal({
      title: existing ? 'Editar tecnica' : 'Nova tecnica',
      subtitle: 'Busque uma tecnica canonica ou monte tudo do zero com custo, dano, tipo, tags e descricao.',
      body: `
        ${renderPresetBrowser('techniques', 'tecnica')}
        <div class="modal-grid">
          <label class="modal-field"><span>Nome</span><input name="name" required value="${escapeAttribute(item.name)}" /></label>
          <label class="modal-field"><span>Custo de EA</span><input name="cost" type="number" min="0" value="${escapeAttribute(String(item.cost))}" /></label>
          <label class="modal-field"><span>Dano</span><input name="damage" value="${escapeAttribute(item.damage)}" placeholder="2d10" /></label>
          <label class="modal-field"><span>Tipo</span><select name="type">${TECHNIQUE_TYPES.map((type) => `<option value="${type}" ${type === item.type ? 'selected' : ''}>${type}</option>`).join('')}</select></label>
        </div>
        <label class="modal-field"><span>Tags (separadas por virgula)</span><input name="tags" value="${escapeAttribute(item.tags.join(', '))}" placeholder="marca, acerto garantido" /></label>
        <label class="modal-field"><span>Descricao</span><textarea name="description">${escapeHtml(item.description)}</textarea></label>
      `,
      submitText: existing ? 'Salvar tecnica' : 'Adicionar tecnica',
      onSubmit(formData) {
        const payload = {
          id: item.id,
          name: String(formData.get('name') || '').trim(),
          cost: safeNumber(formData.get('cost'), 0),
          damage: String(formData.get('damage') || '').trim(),
          type: String(formData.get('type') || 'Ofensiva'),
          tags: parseTags(formData.get('tags')),
          description: String(formData.get('description') || '').trim()
        };
        if (!payload.name) return;
        actions.saveCollectionItem('techniques', payload);
        ui.closeModal();
      }
    });
    bindPresetBrowser('techniques');
  }

  function openWeaponModal(existing) {
    const item = existing || { id: '', name: '', grade: 'Grau 4', damage: '', tags: [], description: '' };
    ui.openModal({
      title: existing ? 'Editar arma' : 'Nova arma',
      subtitle: 'Use uma ferramenta canonica como base ou registre uma arma totalmente autoral.',
      body: `
        ${renderPresetBrowser('weapons', 'arma')}
        <div class="modal-grid">
          <label class="modal-field"><span>Nome</span><input name="name" required value="${escapeAttribute(item.name)}" /></label>
          <label class="modal-field"><span>Grau</span><select name="grade">${GRADE_OPTIONS.map((grade) => `<option value="${grade}" ${grade === item.grade ? 'selected' : ''}>${grade}</option>`).join('')}</select></label>
          <label class="modal-field"><span>Dano</span><input name="damage" value="${escapeAttribute(item.damage)}" placeholder="2d6" /></label>
          <label class="modal-field"><span>Tags</span><input name="tags" value="${escapeAttribute(item.tags.join(', '))}" placeholder="garras, anti-barreira" /></label>
        </div>
        <label class="modal-field"><span>Descricao</span><textarea name="description">${escapeHtml(item.description)}</textarea></label>
      `,
      submitText: existing ? 'Salvar arma' : 'Adicionar arma',
      onSubmit(formData) {
        const payload = {
          id: item.id,
          name: String(formData.get('name') || '').trim(),
          grade: String(formData.get('grade') || 'Grau 4'),
          damage: String(formData.get('damage') || '').trim(),
          tags: parseTags(formData.get('tags')),
          description: String(formData.get('description') || '').trim()
        };
        if (!payload.name) return;
        actions.saveCollectionItem('weapons', payload);
        ui.closeModal();
      }
    });
    bindPresetBrowser('weapons');
  }

  function openPassiveModal(existing) {
    const item = existing || { id: '', name: '', tags: [], description: '' };
    ui.openModal({
      title: existing ? 'Editar passiva' : 'Nova passiva',
      subtitle: 'Traco fixo com tags e descricao. Pode vir de preset canonico ou nascer do zero.',
      body: `
        ${renderPresetBrowser('passives', 'passiva')}
        <label class="modal-field"><span>Nome</span><input name="name" required value="${escapeAttribute(item.name)}" /></label>
        <label class="modal-field"><span>Tags</span><input name="tags" value="${escapeAttribute(item.tags.join(', '))}" placeholder="sensor, choque" /></label>
        <label class="modal-field"><span>Descricao</span><textarea name="description">${escapeHtml(item.description)}</textarea></label>
      `,
      submitText: existing ? 'Salvar passiva' : 'Adicionar passiva',
      onSubmit(formData) {
        const payload = {
          id: item.id,
          name: String(formData.get('name') || '').trim(),
          tags: parseTags(formData.get('tags')),
          description: String(formData.get('description') || '').trim()
        };
        if (!payload.name) return;
        actions.saveCollectionItem('passives', payload);
        ui.closeModal();
      }
    });
    bindPresetBrowser('passives');
  }

  function openVowModal(existing) {
    const item = existing || { id: '', name: '', benefit: '', restriction: '', penalty: '' };
    ui.openModal({
      title: existing ? 'Editar voto' : 'Novo voto',
      subtitle: 'Beneficio, restricao e penalidade. Nesta rodada os votos seguem totalmente manuais.',
      body: `
        <label class="modal-field"><span>Nome</span><input name="name" required value="${escapeAttribute(item.name)}" /></label>
        <label class="modal-field"><span>Beneficio</span><textarea name="benefit">${escapeHtml(item.benefit)}</textarea></label>
        <label class="modal-field"><span>Restricao</span><textarea name="restriction">${escapeHtml(item.restriction)}</textarea></label>
        <label class="modal-field"><span>Penalidade</span><textarea name="penalty">${escapeHtml(item.penalty)}</textarea></label>
      `,
      submitText: existing ? 'Salvar voto' : 'Adicionar voto',
      onSubmit(formData) {
        const payload = {
          id: item.id,
          name: String(formData.get('name') || '').trim(),
          benefit: String(formData.get('benefit') || '').trim(),
          restriction: String(formData.get('restriction') || '').trim(),
          penalty: String(formData.get('penalty') || '').trim()
        };
        if (!payload.name) return;
        actions.saveCollectionItem('vows', payload);
        ui.closeModal();
      }
    });
  }

  function openInventoryItemModal(existing) {
    const item = existing || { id: '', name: '', quantity: 1, effect: '' };
    ui.openModal({
      title: existing ? 'Editar item' : 'Novo item',
      subtitle: 'Item utilitario da ficha. Puxe um preset do universo jujutsu ou registre um item novo.',
      body: `
        ${renderPresetBrowser('inventory', 'item')}
        <div class="modal-grid">
          <label class="modal-field"><span>Nome</span><input name="name" required value="${escapeAttribute(item.name)}" /></label>
          <label class="modal-field"><span>Quantidade</span><input name="quantity" type="number" min="1" value="${escapeAttribute(String(item.quantity))}" /></label>
        </div>
        <label class="modal-field"><span>Efeito / descricao</span><textarea name="effect">${escapeHtml(item.effect)}</textarea></label>
      `,
      submitText: existing ? 'Salvar item' : 'Adicionar item',
      onSubmit(formData) {
        const payload = {
          id: item.id,
          name: String(formData.get('name') || '').trim(),
          quantity: safeNumber(formData.get('quantity'), 1),
          effect: String(formData.get('effect') || '').trim()
        };
        if (!payload.name) return;
        actions.saveCollectionItem('inventory', payload);
        ui.closeModal();
      }
    });
    bindPresetBrowser('inventory');
  }

  function openCollectionModal(collectionKey, existing) {
    const mapping = {
      techniques: openTechniqueModal,
      weapons: openWeaponModal,
      passives: openPassiveModal,
      vows: openVowModal,
      inventory: openInventoryItemModal
    };
    mapping[collectionKey]?.(existing);
  }

  function openCharacterModal() {
    ui.openModal({
      title: 'Adicionar personagem',
      subtitle: 'Crie uma nova ficha base para o elenco e refine o resto no modo edicao.',
      body: `
        <div class="modal-grid">
          <label class="modal-field"><span>Nome</span><input name="name" required placeholder="Ex.: Yuji" /></label>
          <label class="modal-field"><span>Idade</span><input name="age" type="number" min="0" value="16" /></label>
          <label class="modal-field"><span>Cla</span><input name="clan" placeholder="Opcional" /></label>
          <label class="modal-field"><span>Grau</span><input name="grade" placeholder="3" value="4" /></label>
          <label class="modal-field"><span>PV maximo</span><input name="hpMax" type="number" min="1" value="20" /></label>
          <label class="modal-field"><span>EA maxima</span><input name="energyMax" type="number" min="0" value="10" /></label>
          <label class="modal-field"><span>SAN maxima</span><input name="sanityMax" type="number" min="1" value="50" /></label>
        </div>
        <label class="modal-field"><span>Aparencia</span><textarea name="appearance" placeholder="Descricao breve para a ficha."></textarea></label>
      `,
      submitText: 'Criar personagem',
      onSubmit(formData) {
        const payload = {
          name: String(formData.get('name') || '').trim(),
          age: safeNumber(formData.get('age'), 0),
          clan: String(formData.get('clan') || '').trim(),
          grade: String(formData.get('grade') || '').trim(),
          hpMax: safeNumber(formData.get('hpMax'), 20),
          energyMax: safeNumber(formData.get('energyMax'), 10),
          sanityMax: safeNumber(formData.get('sanityMax'), 50),
          appearance: String(formData.get('appearance') || '').trim()
        };
        if (!payload.name) return;
        actions.addCharacter(payload);
        ui.closeModal();
      }
    });
  }

  function bindCharacterManagerButtons() {
    modalRoot.querySelectorAll('[data-manager-activate]').forEach((button) => {
      button.addEventListener('click', () => {
        actions.setActiveCharacter(button.dataset.managerActivate);
        openCharacterManagerModal();
      });
    });

    modalRoot.querySelectorAll('[data-manager-delete]').forEach((button) => {
      button.addEventListener('click', () => {
        openDeleteCharacterModal(button.dataset.managerDelete, { returnToManager: true });
      });
    });
  }

  function openCharacterManagerModal() {
    ui.openModal({
      title: 'Gerenciamento de personagens',
      subtitle: 'Centralize criacao, exclusao e selecao da ficha ativa sem espalhar acoes destrutivas pelo app.',
      eyebrow: 'Elenco',
      submitText: 'Adicionar personagem',
      body: renderCharacterManagerBody(getState()),
      onSubmit(formData) {
        const payload = {
          name: String(formData.get('name') || '').trim(),
          age: safeNumber(formData.get('age'), 0),
          clan: String(formData.get('clan') || '').trim(),
          grade: String(formData.get('grade') || '').trim(),
          hpMax: safeNumber(formData.get('hpMax'), 20),
          energyMax: safeNumber(formData.get('energyMax'), 10),
          sanityMax: safeNumber(formData.get('sanityMax'), 50),
          appearance: String(formData.get('appearance') || '').trim()
        };
        if (!payload.name) {
          ui.toast('Nome obrigatorio', 'Preencha o nome antes de criar uma nova ficha.', 'warning');
          return;
        }
        actions.addCharacter(payload);
        openCharacterManagerModal();
      }
    });

    bindCharacterManagerButtons();
  }

  function openDeleteCharacterModal(characterId, options = {}) {
    const character = getState().characters.find((entry) => entry.id === characterId);
    if (!character) return;

    if (getState().characters.length <= 1) {
      ui.toast('Exclusao bloqueada', 'O elenco precisa manter ao menos um personagem ativo.', 'warning');
      return;
    }

    const orderEntries = getState().order.entries.filter((entry) => entry.characterId === characterId);
    ui.openModal({
      title: 'Excluir personagem',
      subtitle: `Digite exatamente "${character.name}" para confirmar a exclusao desta ficha.`,
      eyebrow: 'Acao irreversivel',
      submitText: 'Excluir personagem',
      submitTone: 'danger',
      body: `
        <div class="modal-confirm-copy">
          <p>Esta operacao remove a ficha de <strong>${escapeHtml(character.name)}</strong>, limpa suas entradas ligadas na ordem de combate e escolhe outro personagem valido como ficha ativa.</p>
          <div class="card-chip-row card-chip-row--compact">
            <span class="type-pill">Cla: ${escapeHtml(character.clan || 'Sem cla')}</span>
            <span class="type-pill">Grau: ${escapeHtml(String(character.grade || '--'))}</span>
            ${orderEntries.length ? `<span class="type-pill">Ordem: ${orderEntries.length} entrada(s)</span>` : ''}
          </div>
        </div>
        <label class="modal-field">
          <span>Confirmacao nominal</span>
          <input name="confirmName" autocomplete="off" placeholder="${escapeAttribute(character.name)}" />
        </label>
      `,
      onSubmit(formData) {
        const typed = String(formData.get('confirmName') || '').trim();
        if (typed !== character.name) {
          ui.toast('Nome nao confere', 'Digite o nome exatamente como aparece na ficha.', 'danger');
          return;
        }
        const removed = actions.removeCharacter(character.id);
        if (removed === false) return;
        if (options.returnToManager) {
          openCharacterManagerModal();
          return;
        }
        ui.closeModal();
      }
    });
  }

  function openCombatantModal() {
    const characters = getState().characters;
    ui.openModal({
      title: 'Adicionar combatente',
      subtitle: 'Inclua um PC do site ou um NPC manual.',
      body: `
        <div class="modal-grid">
          <label class="modal-field">
            <span>Tipo</span>
            <select name="type" id="combatantTypeSelect">
              <option value="pc">Personagem do site</option>
              <option value="npc">NPC manual</option>
            </select>
          </label>
          <label class="modal-field" id="pcCharacterField">
            <span>Personagem</span>
            <select name="characterId">${characters.map((character) => `<option value="${character.id}">${escapeHtml(character.name)}</option>`).join('')}</select>
          </label>
          <label class="modal-field" id="npcNameField" style="display:none;">
            <span>Nome do NPC</span>
            <input name="npcName" placeholder="Ex.: Maldicao de Corredor" />
          </label>
          <label class="modal-field" id="npcModifierField" style="display:none;">
            <span>Modificador</span>
            <input name="modifier" type="number" value="0" />
          </label>
        </div>
        <label class="modal-field"><span>Notas</span><textarea name="notes" placeholder="Marcado, voando, barreira ativa..."></textarea></label>
      `,
      submitText: 'Adicionar',
      onSubmit(formData) {
        const type = String(formData.get('type') || 'pc');
        const payload = {
          type,
          characterId: String(formData.get('characterId') || ''),
          name: String(formData.get('npcName') || '').trim(),
          modifier: safeNumber(formData.get('modifier'), 0),
          notes: String(formData.get('notes') || '').trim()
        };
        if (type === 'npc' && !payload.name) return;
        actions.addCombatant(payload);
        ui.closeModal();
      }
    });

    const select = modalRoot.querySelector('#combatantTypeSelect');
    const pcField = modalRoot.querySelector('#pcCharacterField');
    const npcNameField = modalRoot.querySelector('#npcNameField');
    const npcModifierField = modalRoot.querySelector('#npcModifierField');
    const syncVisibility = () => {
      const isNpc = select?.value === 'npc';
      if (pcField) pcField.style.display = isNpc ? 'none' : '';
      if (npcNameField) npcNameField.style.display = isNpc ? '' : 'none';
      if (npcModifierField) npcModifierField.style.display = isNpc ? '' : 'none';
    };
    select?.addEventListener('change', syncVisibility);
    syncVisibility();
  }

  function openCombatantNotesModal(entryId) {
    const entry = getState().order.entries.find((item) => item.id === entryId);
    if (!entry) return;
    ui.openModal({
      title: 'Editar notas do combatente',
      subtitle: entry.name,
      body: `<label class="modal-field"><span>Notas</span><textarea name="notes">${escapeHtml(entry.notes)}</textarea></label>`,
      submitText: 'Salvar notas',
      onSubmit(formData) {
        actions.updateOrderNotes(entryId, String(formData.get('notes') || '').trim());
        ui.closeModal();
      }
    });
  }

  return {
    openConditionModal,
    openCollectionModal,
    openCharacterModal,
    openCharacterManagerModal,
    openDeleteCharacterModal,
    openCombatantModal,
    openCombatantNotesModal
  };
}
