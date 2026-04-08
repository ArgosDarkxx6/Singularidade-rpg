import {
  DEFAULT_TABLE_META,
  JOIN_CODE_ROLE_OPTIONS,
  TABLE_STATUS_OPTIONS
} from '../../core/constants.js';
import { normalizeState } from '../../core/model.js';
import {
  buildTableContextLabel,
  buildTableEpisodeLabel,
  formatJoinCodeDisplay,
  normalizeTableMeta
} from '../../core/online.js';
import { parseCharacterSheetsText } from '../../core/parsers.js';
import { escapeHtml } from '../../core/utils.js';
import { renderButtonLabel } from '../../ui/icons.js';
import {
  formEntries,
  renderMobileEmptyState,
  renderMobileField,
  renderMobileHero,
  renderMobileMetric,
  renderMobilePanel,
  renderMobileSelect
} from './shared.js';

function validateStateJson(raw) {
  const text = String(raw || '').trim();
  if (!text) {
    return { tone: 'info', title: 'Aguardando JSON', text: 'Cole um estado para validar antes de importar.' };
  }

  try {
    const parsed = JSON.parse(text);
    const normalized = normalizeState(parsed);
    const currentView = typeof parsed?.currentView === 'string' ? parsed.currentView : 'sem guia';
    return {
      tone: 'success',
      title: 'JSON v?lido',
      text: `${normalized.characters.length} personagem(ns) detectado(s) e guia ${currentView}`
    };
  } catch (error) {
    return { tone: 'danger', title: 'JSON inválido', text: 'O conteúdo não corresponde a um estado válido da versão atual.' };
  }
}

function validateTextSheets(raw) {
  const text = String(raw || '').trim();
  if (!text) {
    return { tone: 'info', title: 'Aguardando ficha', text: 'Cole uma ou mais fichas para detectar nomes e quantidade.' };
  }
  const characters = parseCharacterSheetsText(text);
  if (!characters.length) {
    return { tone: 'danger', title: 'Nenhuma ficha reconhecida', text: 'O texto não parece seguir o formato esperado.' };
  }
  return {
    tone: 'success',
    title: 'Fichas detectadas',
    text: `${characters.length} personagem(ns): ${characters.map((item) => item.name).slice(0, 4).join(', ')}`
  };
}

function renderValidation(result) {
  return `
    <div class="validation-box validation-box--${result.tone}">
      <strong>${escapeHtml(result.title)}</strong>
      <span>${escapeHtml(result.text)}</span>
    </div>
  `;
}

function renderStatusMetrics(online) {
  return `
    <div class="mobile-metric-row">
      ${renderMobileMetric('Status', online.session ? 'Ao vivo' : (online.platformAvailable ? 'Pronta' : 'Aguardando API'))}
      ${renderMobileMetric('Conectados', online.members?.length || 0)}
      ${renderMobileMetric('Snapshots', online.snapshots?.length || 0)}
      ${renderMobileMetric('Papel', online.session?.role || 'Nenhum')}
    </div>
  `;
}

function renderMetaForm(meta, canEdit, formId) {
  return `
    <form id="${formId}" class="mobile-form">
      <div class="mobile-form-grid mobile-form-grid--mesa-primary">
        ${renderMobileField({ label: 'Nome da mesa', name: 'tableName', value: meta.tableName, wide: true, disabled: !canEdit })}
        ${renderMobileField({ label: 'Episódio', name: 'episodeNumber', value: meta.episodeNumber, disabled: !canEdit })}
        ${renderMobileField({ label: 'Título', name: 'episodeTitle', value: meta.episodeTitle, wide: true, disabled: !canEdit })}
        ${renderMobileField({ label: 'Players', name: 'expectedRoster', value: meta.expectedRoster, wide: true, disabled: !canEdit })}
      </div>
      <div class="mobile-form-grid mobile-form-grid--mesa-secondary">
        ${renderMobileField({ label: 'RPG / série', name: 'seriesName', value: meta.seriesName, disabled: !canEdit })}
        ${renderMobileSelect({
          label: 'Status',
          name: 'status',
          value: meta.status,
          options: TABLE_STATUS_OPTIONS.map((item) => ({ label: item, value: item })),
          disabled: !canEdit
        })}
      </div>
      <details class="mobile-advanced-details">
        <summary>Metadados avançados</summary>
        <div class="mobile-form-grid">
          ${renderMobileField({ label: 'Campanha / arco', name: 'campaignName', value: meta.campaignName, disabled: !canEdit })}
          ${renderMobileField({ label: 'Data', name: 'sessionDate', value: meta.sessionDate, type: 'date', disabled: !canEdit })}
          ${renderMobileField({ label: 'Local', name: 'location', value: meta.location, disabled: !canEdit })}
          ${renderMobileField({ label: 'Recap', name: 'recap', value: meta.recap, tag: 'textarea', wide: true, disabled: !canEdit })}
          ${renderMobileField({ label: 'Objetivo', name: 'objective', value: meta.objective, tag: 'textarea', wide: true, rows: 3, disabled: !canEdit })}
        </div>
      </details>
      ${canEdit ? `<button type="submit" class="control-button control-button--primary">${renderButtonLabel('save', 'Salvar dados da mesa')}</button>` : ''}
    </form>
  `;
}

function renderPresenceList(members) {
  if (!members.length) {
    return renderMobileEmptyState('Presença', 'Nenhum membro conectado agora.');
  }

  return `
    <div class="mobile-stack">
      ${members.map((member) => `
        <article class="mobile-info-card">
          <span>${escapeHtml(member.role === 'gm' ? 'Mestre' : member.role === 'player' ? 'Jogador' : 'Espectador')}</span>
          <strong>${escapeHtml(member.nickname || 'Feiticeiro')}</strong>
          <p>${escapeHtml(member.characterName || member.characterId || 'Sem vínculo de personagem')}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderSnapshots(snapshots) {
  if (!snapshots.length) {
    return renderMobileEmptyState('Snapshots', 'Nenhum backup remoto salvo ainda.');
  }

  return `
    <div class="mobile-stack">
      ${snapshots.map((snapshot) => `
        <article class="mobile-collection-card">
          <span>${escapeHtml(snapshot.createdAt || '')}</span>
          <strong>${escapeHtml(snapshot.label)}</strong>
          <p>${escapeHtml(snapshot.actorName || 'Mesa')}</p>
          <button type="button" class="ghost-button ghost-button--full" data-mobile-restore-snapshot="${snapshot.id}">${renderButtonLabel('download', 'Restaurar snapshot')}</button>
        </article>
      `).join('')}
    </div>
  `;
}

function renderInviteControls(state, online) {
  if (!online.session) return '';

  return `
    <div class="mobile-form">
      <div class="mobile-form-grid">
        ${renderMobileSelect({
          label: 'Papel',
          name: 'role',
          value: 'player',
          options: JOIN_CODE_ROLE_OPTIONS.map((item) => ({ label: item.label, value: item.key }))
        })}
        ${renderMobileSelect({
          label: 'Personagem',
          name: 'characterId',
          value: '',
          options: [{ label: 'Sem vínculo', value: '' }, ...state.characters.map((character) => ({ label: character.name, value: character.id }))]
        })}
        ${renderMobileField({ label: 'Rótulo', name: 'label', value: '', wide: true, placeholder: 'Ex.: link do Yuji' })}
      </div>
      <div class="mobile-inline-actions mobile-inline-actions--grid">
        <button type="button" class="control-button control-button--primary" data-mobile-create-invite>${renderButtonLabel('users', 'Gerar convite')}</button>
        <button type="button" class="ghost-button" data-mobile-copy-last-invite>${renderButtonLabel('copy', 'Copiar último')}</button>
      </div>
      ${online.lastInvite ? `<div class="mobile-info-card"><span>Último link</span><p>${escapeHtml(online.lastInvite)}</p></div>` : ''}
    </div>
  `;
}

function renderJoinCodeControls(online) {
  if (!online.session) return '';
  const canManage = online.session.role === 'gm';
  const joinCodes = online.joinCodes || [];

  return `
    <div class="mobile-form">
      ${canManage ? `
        <div class="mobile-form-grid">
          ${renderMobileSelect({
            label: 'Papel',
            name: 'joinCodeRole',
            value: 'player',
            options: JOIN_CODE_ROLE_OPTIONS.map((item) => ({ label: item.label, value: item.key }))
          })}
          ${renderMobileField({ label: 'Rótulo', name: 'joinCodeLabel', value: '', wide: true, placeholder: 'Ex.: mesa dos jogadores' })}
        </div>
        <button type="button" class="control-button control-button--primary" data-mobile-create-join-code>${renderButtonLabel('plus', 'Gerar código')}</button>
      ` : '<div class="empty-state empty-state--compact">Somente o mestre pode gerar códigos da mesa.</div>'}
      <div class="mobile-stack">
        ${joinCodes.length ? joinCodes.map((joinCode) => `
          <article class="mobile-info-card">
            <span>${escapeHtml(joinCode.role === 'gm' ? 'Mestre' : joinCode.role === 'player' ? 'Jogador' : 'Espectador')}</span>
            <strong>${escapeHtml(formatJoinCodeDisplay(joinCode.code))}</strong>
            <p>${escapeHtml(joinCode.label || 'Sem rótulo')}</p>
            ${canManage ? `
              <div class="mobile-inline-actions mobile-inline-actions--grid">
                <button type="button" class="ghost-button" data-mobile-copy-join-code="${joinCode.code}">${renderButtonLabel('copy', 'Copiar')}</button>
                <button type="button" class="ghost-button" data-mobile-revoke-join-code="${joinCode.id}">${renderButtonLabel('trash', 'Revogar')}</button>
              </div>
            ` : ''}
          </article>
        `).join('') : '<div class="empty-state empty-state--compact">Nenhum código ativo nesta mesa.</div>'}
      </div>
    </div>
  `;
}

function renderPendingJoinCard(online) {
  const pending = online.pendingCodeJoin;
  if (!pending || pending.role !== 'player') return '';

  return renderMobilePanel({
    eyebrow: 'Entrada por código',
    title: 'Escolha seu personagem',
    body: `
      <div class="mobile-form">
        <div class="mobile-info-card">
          <span>Mesa</span>
          <strong>${escapeHtml(pending.table?.meta?.tableName || pending.table?.name || 'Mesa online')}</strong>
          <p>Código ${escapeHtml(formatJoinCodeDisplay(pending.code))}</p>
        </div>
        <div class="mobile-stack">
          ${(pending.characters || []).length ? pending.characters.map((character) => `
            <button type="button" class="control-button" data-mobile-complete-code-join="${character.id}">
              ${renderButtonLabel('users', character.name)}
            </button>
          `).join('') : '<div class="empty-state empty-state--compact">A mesa ainda não tem personagens disponíveis.</div>'}
        </div>
        <button type="button" class="ghost-button ghost-button--full" data-mobile-cancel-code-join>${renderButtonLabel('close', 'Cancelar')}</button>
      </div>
    `
  });
}

function renderDisconnectedView(ctx) {
  const defaultMeta = normalizeTableMeta({
    ...DEFAULT_TABLE_META,
    expectedRoster: ctx.state.characters.map((character) => character.name).join(', ')
  });

  return `
    ${renderMobileHero({
      eyebrow: 'Mesa',
      title: 'Você ainda não está dentro de uma mesa online',
      body: 'Crie uma sessão com os dados essenciais, entre por link ou código e leve a mesa inteira para a nuvem.'
    })}
    ${renderStatusMetrics(ctx.runtime.online)}
    ${renderMobilePanel({
      eyebrow: 'Criar mesa',
      title: 'Sessão em nuvem',
      body: `
        <form id="mobileMesaCreateForm" class="mobile-form">
          ${renderMobileField({ label: 'Seu apelido', name: 'nickname', value: ctx.runtime.online.session?.nickname || ctx.state.characters[0]?.name || 'Feiticeiro' })}
          ${renderMetaForm(defaultMeta, true, 'mobileMesaMetaSeed').replace('<form id="mobileMesaMetaSeed" class="mobile-form">', '').replace('</form>', '')}
          <button type="submit" class="control-button control-button--primary">${renderButtonLabel('users', 'Criar mesa')}</button>
        </form>
      `
    })}
    ${renderMobilePanel({
      eyebrow: 'Entrar',
      title: 'Convite da sessão',
      body: `
        <div id="mobileMesaCreateSection" class="mobile-form">
          ${renderMobileField({ label: 'Link da mesa', name: 'inviteUrl', value: '', placeholder: 'https://.../mesa/shibuya-08?token=...' })}
          ${renderMobileField({ label: 'Apelido', name: 'joinNickname', value: ctx.state.characters[0]?.name || 'Feiticeiro' })}
          <button type="button" class="ghost-button ghost-button--full" data-mobile-join-table>${renderButtonLabel('book', 'Entrar por convite')}</button>
        </div>
      `
    })}
    ${renderMobilePanel({
      eyebrow: 'Entrar',
      title: 'Código da mesa',
      body: `
        <div id="mobileMesaCodeSection" class="mobile-form">
          ${renderMobileField({ label: 'Código de 6 dígitos', name: 'joinCode', value: '', placeholder: '123456' })}
          ${renderMobileField({ label: 'Apelido', name: 'joinCodeNickname', value: ctx.state.characters[0]?.name || 'Feiticeiro' })}
          <button type="button" class="control-button control-button--primary" data-mobile-join-code>${renderButtonLabel('users', 'Entrar por código')}</button>
        </div>
      `
    })}
    ${renderPendingJoinCard(ctx.runtime.online)}
  `;
}

function renderConnectedView(ctx) {
  const { runtime } = ctx;
  const online = runtime.online;
  const meta = normalizeTableMeta(online.table?.meta || { tableName: online.table?.name || online.session?.tableName });
  const roleLabel = online.session?.role === 'gm' ? 'Mestre' : online.session?.role === 'player' ? 'Jogador' : 'Espectador';
  const heroText = [
    buildTableEpisodeLabel(meta),
    buildTableContextLabel(meta),
    roleLabel
  ].filter(Boolean).join(' • ') || 'Mesa online pronta para convites, snapshots e sync ao vivo.';

  return `
    ${renderMobileHero({
      eyebrow: 'Mesa',
      title: meta.tableName || 'Mesa em nuvem',
      body: heroText,
      actions: `
        <div class="mobile-inline-actions mobile-inline-actions--grid">
          <button type="button" class="ghost-button" data-mobile-disconnect-table>${renderButtonLabel('close', 'Sair da mesa')}</button>
        </div>
      `
    })}
    ${renderStatusMetrics(online)}
    ${renderMobilePanel({
      eyebrow: 'Sessão',
      title: 'Identidade e contexto',
      body: `<div id="mobileMesaMetaSection">${renderMetaForm(meta, online.session?.role === 'gm', 'mobileMesaMetaForm')}</div>`
    })}
    ${renderMobilePanel({
      eyebrow: 'Presença',
      title: 'Conectados agora',
      body: `<div id="mobileMesaPresenceSection">${renderPresenceList(online.members || [])}</div>`
    })}
    ${renderMobilePanel({
      eyebrow: 'Pessoas e convites',
      title: 'Links por papel',
      body: `<div id="mobileMesaInviteSection">${renderInviteControls(ctx.state, online)}</div>`
    })}
    ${renderMobilePanel({
      eyebrow: 'Pessoas e convites',
      title: 'Códigos de 6 dígitos',
      body: `<div id="mobileMesaJoinCodeSection">${renderJoinCodeControls(online)}</div>`
    })}
    ${renderMobilePanel({
      eyebrow: 'Snapshots',
      title: 'Backups remotos',
      body: `
        <div id="mobileMesaSnapshotsSection" class="mobile-form">
          <div class="mobile-inline-actions mobile-inline-actions--grid">
            <button type="button" class="ghost-button" data-mobile-push-state>${renderButtonLabel('upload', 'Enviar estado')}</button>
            <button type="button" class="ghost-button" data-mobile-create-snapshot>${renderButtonLabel('save', 'Salvar snapshot')}</button>
            <button type="button" class="ghost-button" data-mobile-refresh-snapshots>${renderButtonLabel('dice', 'Atualizar')}</button>
          </div>
          ${renderSnapshots(online.snapshots || [])}
        </div>
      `
    })}
  `;
}

function renderBackupUtilities(ctx) {
  const characterText = ctx.actions.serializeCharacterToText(ctx.actions.getActiveCharacter());
  return `
    ${renderMobilePanel({
      eyebrow: 'Backup',
      title: 'JSON e restore manual',
      body: `
        <div class="mobile-form">
          <div class="mobile-inline-actions mobile-inline-actions--grid">
            <button type="button" class="control-button control-button--primary" data-mobile-export-json>${renderButtonLabel('export', 'Exportar JSON')}</button>
            <button type="button" class="ghost-button" data-mobile-reload-cache>${renderButtonLabel('copy', 'Recarregar cache')}</button>
            <button type="button" class="ghost-button" data-mobile-reset-state>${renderButtonLabel('trash', 'Restaurar padrão')}</button>
          </div>
          ${renderMobileField({ label: 'Importar JSON', name: 'importJson', tag: 'textarea', value: '', wide: true, placeholder: 'Cole aqui o JSON do estado' })}
          <div id="mobileMesaImportJsonValidation"></div>
          <div class="mobile-inline-actions mobile-inline-actions--grid">
            <button type="button" class="ghost-button" data-mobile-import-json>${renderButtonLabel('download', 'Importar texto')}</button>
          </div>
          <label class="mobile-form-field">
            <span>Arquivo JSON</span>
            <input id="mobileImportFileInput" type="file" accept="application/json,.json" />
          </label>
        </div>
      `
    })}
    ${renderMobilePanel({
      eyebrow: 'Conversão',
      title: 'Ficha em texto para personagem',
      body: `
        <div class="mobile-form">
          ${renderMobileField({ label: 'Fichas em texto', name: 'textSheet', tag: 'textarea', value: '', wide: true, placeholder: 'Cole aqui uma ou mais fichas em texto' })}
          <div id="mobileMesaTextValidation"></div>
          <button type="button" class="control-button control-button--primary" data-mobile-import-text-sheet>${renderButtonLabel('sheet', 'Converter ficha')}</button>
        </div>
      `
    })}
    ${renderMobilePanel({
      eyebrow: 'Arquivo rápido',
      title: 'Ficha ativa em texto',
      body: `
        <div class="mobile-form">
          ${renderMobileField({ label: 'Texto da ficha ativa', name: 'characterText', tag: 'textarea', value: characterText, wide: true, rows: 8, disabled: true })}
          <div class="mobile-inline-actions mobile-inline-actions--grid">
            <button type="button" class="control-button" data-mobile-copy-character-text>${renderButtonLabel('copy', 'Copiar ficha')}</button>
            <button type="button" class="ghost-button" data-mobile-download-character-text>${renderButtonLabel('download', 'Baixar .txt')}</button>
          </div>
        </div>
      `
    })}
  `;
}

export function renderMobileMesaView(ctx) {
  return `
    <section class="mobile-page mobile-page--mesa">
      ${ctx.runtime.online.session ? renderConnectedView(ctx) : renderDisconnectedView(ctx)}
      ${renderBackupUtilities(ctx)}
    </section>
  `;
}

export function bindMobileMesaView(ctx, root) {
  const jsonTextarea = root.querySelector('[name="importJson"]');
  const jsonValidation = root.querySelector('#mobileMesaImportJsonValidation');
  const textTextarea = root.querySelector('[name="textSheet"]');
  const textValidation = root.querySelector('#mobileMesaTextValidation');

  const refreshJsonValidation = () => {
    if (!jsonTextarea || !jsonValidation) return;
    jsonValidation.innerHTML = renderValidation(validateStateJson(jsonTextarea.value));
  };
  const refreshTextValidation = () => {
    if (!textTextarea || !textValidation) return;
    textValidation.innerHTML = renderValidation(validateTextSheets(textTextarea.value));
  };

  jsonTextarea?.addEventListener('input', refreshJsonValidation);
  textTextarea?.addEventListener('input', refreshTextValidation);
  refreshJsonValidation();
  refreshTextValidation();

  root.querySelector('#mobileMesaCreateForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = formEntries(event.currentTarget);
    ctx.actions.createOnlineTable({
      name: data.tableName || DEFAULT_TABLE_META.tableName,
      nickname: data.nickname || '',
      meta: normalizeTableMeta(data)
    });
  });

  root.querySelector('[data-mobile-join-table]')?.addEventListener('click', () => {
    const link = root.querySelector('[name="inviteUrl"]')?.value || '';
    const nickname = root.querySelector('[name="joinNickname"]')?.value || '';
    ctx.actions.connectToInviteLink(link, nickname);
  });

  root.querySelector('[data-mobile-join-code]')?.addEventListener('click', () => {
    const code = root.querySelector('[name="joinCode"]')?.value || '';
    const nickname = root.querySelector('[name="joinCodeNickname"]')?.value || '';
    ctx.actions.connectToJoinCode(code, nickname);
  });

  root.querySelectorAll('[data-mobile-complete-code-join]').forEach((button) => {
    button.addEventListener('click', () => ctx.actions.completeJoinCodeAsPlayer(button.dataset.mobileCompleteCodeJoin));
  });
  root.querySelector('[data-mobile-cancel-code-join]')?.addEventListener('click', () => ctx.actions.clearPendingJoinCode());

  root.querySelector('#mobileMesaMetaForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = formEntries(event.currentTarget);
    ctx.actions.updateOnlineTableMeta({
      name: data.tableName || DEFAULT_TABLE_META.tableName,
      meta: normalizeTableMeta(data)
    });
  });

  root.querySelector('[data-mobile-disconnect-table]')?.addEventListener('click', () => ctx.actions.disconnectOnlineSession());
  root.querySelector('[data-mobile-push-state]')?.addEventListener('click', () => ctx.actions.importCurrentStateToCloud('Sincronização manual'));
  root.querySelector('[data-mobile-create-snapshot]')?.addEventListener('click', () => ctx.actions.createCloudSnapshot('Snapshot manual'));
  root.querySelector('[data-mobile-refresh-snapshots]')?.addEventListener('click', () => ctx.actions.refreshCloudSnapshots());

  root.querySelector('[data-mobile-create-invite]')?.addEventListener('click', async () => {
    const role = root.querySelector('#mobileMesaInviteSection [name="role"]')?.value || 'player';
    const characterId = role === 'player' ? (root.querySelector('#mobileMesaInviteSection [name="characterId"]')?.value || '') : '';
    const label = root.querySelector('#mobileMesaInviteSection [name="label"]')?.value || '';
    const invite = await ctx.actions.createInviteLink({ role, characterId, label });
    if (invite?.url) ctx.actions.copyInviteLink(invite.url);
  });
  root.querySelector('[data-mobile-copy-last-invite]')?.addEventListener('click', () => ctx.actions.copyInviteLink(ctx.runtime.online.lastInvite));

  root.querySelector('[data-mobile-create-join-code]')?.addEventListener('click', async () => {
    const role = root.querySelector('#mobileMesaJoinCodeSection [name="joinCodeRole"]')?.value || 'player';
    const label = root.querySelector('#mobileMesaJoinCodeSection [name="joinCodeLabel"]')?.value || '';
    const joinCode = await ctx.actions.createJoinCode({ role, label });
    if (joinCode?.code) {
      ctx.actions.copyTextSnippet(joinCode.code, {
        successTitle: 'Código copiado',
        successMessage: `O código ${formatJoinCodeDisplay(joinCode.code)} foi enviado para a área de transferência.`
      });
    }
  });
  root.querySelectorAll('[data-mobile-copy-join-code]').forEach((button) => {
    button.addEventListener('click', () => {
      ctx.actions.copyTextSnippet(button.dataset.mobileCopyJoinCode, {
        successTitle: 'Código copiado',
        successMessage: `O código ${formatJoinCodeDisplay(button.dataset.mobileCopyJoinCode)} foi enviado para a área de transferência.`
      });
    });
  });
  root.querySelectorAll('[data-mobile-revoke-join-code]').forEach((button) => {
    button.addEventListener('click', () => ctx.actions.revokeJoinCode(button.dataset.mobileRevokeJoinCode));
  });

  root.querySelectorAll('[data-mobile-restore-snapshot]').forEach((button) => {
    button.addEventListener('click', () => ctx.actions.restoreCloudSnapshot(button.dataset.mobileRestoreSnapshot));
  });

  root.querySelector('[data-mobile-export-json]')?.addEventListener('click', () => ctx.actions.exportState());
  root.querySelector('[data-mobile-reload-cache]')?.addEventListener('click', () => ctx.actions.reloadPersistentState());
  root.querySelector('[data-mobile-reset-state]')?.addEventListener('click', () => ctx.actions.resetState());
  root.querySelector('[data-mobile-import-json]')?.addEventListener('click', () => {
    const result = validateStateJson(jsonTextarea?.value || '');
    if (jsonValidation) jsonValidation.innerHTML = renderValidation(result);
    if (result.tone === 'danger') return;
    ctx.actions.importStateFromText(jsonTextarea?.value || '');
  });
  root.querySelector('#mobileImportFileInput')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await ctx.actions.importStateFromFile(file);
    event.target.value = '';
    if (jsonTextarea) jsonTextarea.value = '';
    refreshJsonValidation();
  });
  root.querySelector('[data-mobile-import-text-sheet]')?.addEventListener('click', () => {
    const result = validateTextSheets(textTextarea?.value || '');
    if (textValidation) textValidation.innerHTML = renderValidation(result);
    if (result.tone === 'danger') return;
    ctx.actions.importCharactersFromText(textTextarea?.value || '');
  });
  root.querySelector('[data-mobile-copy-character-text]')?.addEventListener('click', () => ctx.actions.copyActiveCharacterText());
  root.querySelector('[data-mobile-download-character-text]')?.addEventListener('click', () => ctx.actions.downloadActiveCharacterText());
}
