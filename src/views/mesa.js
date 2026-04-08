import {
  DEFAULT_TABLE_META,
  JOIN_CODE_ROLE_OPTIONS,
  TABLE_STATUS_OPTIONS
} from '../core/constants.js';
import { normalizeState } from '../core/model.js';
import {
  buildTableContextLabel,
  buildTableEpisodeLabel,
  formatJoinCodeDisplay,
  normalizeTableMeta
} from '../core/online.js';
import { parseCharacterSheetsText } from '../core/parsers.js';
import { escapeHtml } from '../core/utils.js';
import { renderButtonLabel } from '../ui/icons.js';

function validateStateJson(raw) {
  const text = String(raw || '').trim();
  if (!text) {
    return {
      tone: 'info',
      title: 'Aguardando JSON',
      text: 'Cole um estado completo para validar personagens, guia ativa e estrutura antes de importar.'
    };
  }

  try {
    const parsed = JSON.parse(text);
    const normalized = normalizeState(parsed);
    const currentView = typeof parsed?.currentView === 'string' ? parsed.currentView : 'sem guia';
    const activeCharacterId = typeof parsed?.activeCharacterId === 'string' ? parsed.activeCharacterId : 'sem personagem';
    return {
      tone: 'success',
      title: 'JSON v?lido',
      text: `${normalized.characters.length} personagem(ns) detectado(s) ? guia ${currentView} ? ativo ${activeCharacterId}`
    };
  } catch (error) {
    return {
      tone: 'danger',
      title: 'JSON inválido',
      text: 'O conteúdo não pode ser interpretado como um estado válido da versão atual.'
    };
  }
}

function validateTextSheets(raw) {
  const text = String(raw || '').trim();
  if (!text) {
    return {
      tone: 'info',
      title: 'Aguardando ficha',
      text: 'Cole uma ou várias fichas em texto para detectar nomes e quantidade antes de converter.'
    };
  }

  const characters = parseCharacterSheetsText(text);
  if (!characters.length) {
    return {
      tone: 'danger',
      title: 'Nenhuma ficha reconhecida',
      text: 'O texto não parece seguir o formato de ficha do sistema.'
    };
  }

  const names = characters.map((character) => character.name).slice(0, 4).join(', ');
  const suffix = characters.length > 4 ? '...' : '';
  return {
    tone: 'success',
    title: 'Fichas detectadas',
    text: `${characters.length} personagem(ns): ${names}${suffix}`
  };
}

function renderValidationBox(result) {
  return `
    <div class="validation-box validation-box--${result.tone}">
      <strong>${escapeHtml(result.title)}</strong>
      <span>${escapeHtml(result.text)}</span>
    </div>
  `;
}

function bindValidation(target, textarea, validator) {
  const update = () => {
    target.innerHTML = renderValidationBox(validator(textarea.value));
  };
  textarea.addEventListener('input', update);
  update();
  return update;
}

function renderCloudStatusCard(label, value, tone = 'info') {
  return `
    <div class="cloud-status-card cloud-status-card--${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderPresenceCard(member) {
  const roleLabel = member.role === 'gm' ? 'Mestre' : member.role === 'player' ? 'Jogador' : 'Espectador';
  const memberLabel = member.characterName || member.characterId || 'Sem vínculo';

  return `
    <article class="mesa-presence-card">
      <div class="mesa-presence-card__badge">${escapeHtml((member.nickname || '?').slice(0, 1).toUpperCase())}</div>
      <div class="mesa-presence-card__copy">
        <strong>${escapeHtml(member.nickname || 'Feiticeiro')}</strong>
        <span>${escapeHtml(roleLabel)} • ${escapeHtml(memberLabel)}</span>
      </div>
    </article>
  `;
}

function renderSnapshotList(snapshots) {
  if (!snapshots.length) {
    return '<div class="empty-state empty-state--compact">Nenhum snapshot remoto salvo ainda.</div>';
  }

  return `
    <div class="cloud-snapshot-list">
      ${snapshots.map((snapshot) => `
        <article class="cloud-snapshot-card">
          <div class="cloud-snapshot-card__meta">
            <strong>${escapeHtml(snapshot.label)}</strong>
            <span>${escapeHtml(snapshot.actorName || 'Mesa')}</span>
          </div>
          <div class="cloud-snapshot-card__footer">
            <small>${escapeHtml(snapshot.createdAt || '')}</small>
            <button class="ghost-button" type="button" data-restore-snapshot="${snapshot.id}">${renderButtonLabel('download', 'Restaurar')}</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

function renderTableMetaFields(meta, isConnected, canEdit) {
  const normalized = normalizeTableMeta(meta || DEFAULT_TABLE_META);
  const disabled = canEdit ? '' : 'disabled';

  return `
    <div class="mesa-meta-stack">
      <section class="mesa-meta-block mesa-meta-block--primary">
        <div class="mesa-meta-block__header">
          <strong>Sessão atual</strong>
          <span>Essencial na primeira dobra</span>
        </div>
        <div class="mesa-form-grid mesa-form-grid--primary">
          <label class="mesa-form-grid__wide">
            <span class="settings-label">Nome da mesa</span>
            <input name="tableName" class="editable-input" value="${escapeHtml(normalized.tableName)}" ${disabled} />
          </label>
          <label>
            <span class="settings-label">Número do episódio</span>
            <input name="episodeNumber" class="editable-input" value="${escapeHtml(normalized.episodeNumber)}" ${disabled} />
          </label>
          <label class="mesa-form-grid__wide">
            <span class="settings-label">Título do episódio</span>
            <input name="episodeTitle" class="editable-input" value="${escapeHtml(normalized.episodeTitle)}" placeholder="Ex.: Pressão sobre Shibuya" ${disabled} />
          </label>
          <label class="mesa-form-grid__wide">
            <span class="settings-label">Players na sessão</span>
            <input name="expectedRoster" class="editable-input" value="${escapeHtml(normalized.expectedRoster)}" placeholder="Ex.: Mysto, Yuji, Nobara" ${disabled} />
          </label>
        </div>
      </section>

      <section class="mesa-meta-block mesa-meta-block--secondary">
        <div class="mesa-meta-block__header">
          <strong>Contexto curto</strong>
          <span>Leitura rápida no hub e na mobile</span>
        </div>
        <div class="mesa-form-grid mesa-form-grid--secondary">
          <label>
            <span class="settings-label">RPG / série</span>
            <input name="seriesName" class="editable-input" value="${escapeHtml(normalized.seriesName)}" ${disabled} />
          </label>
          <label>
            <span class="settings-label">Status</span>
            <select name="status" class="editable-select" ${disabled}>
              ${TABLE_STATUS_OPTIONS.map((item) => `<option value="${escapeHtml(item)}" ${item === normalized.status ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
            </select>
          </label>
        </div>
      </section>

      <details class="mesa-advanced-details">
        <summary>Metadados avançados</summary>
        <div class="mesa-form-grid mesa-form-grid--advanced">
          <label>
            <span class="settings-label">Campanha / arco</span>
            <input name="campaignName" class="editable-input" value="${escapeHtml(normalized.campaignName)}" ${disabled} />
          </label>
          <label>
            <span class="settings-label">Data</span>
            <input name="sessionDate" class="editable-input" type="date" value="${escapeHtml(normalized.sessionDate)}" ${disabled} />
          </label>
          <label>
            <span class="settings-label">Local</span>
            <input name="location" class="editable-input" value="${escapeHtml(normalized.location)}" ${disabled} />
          </label>
          <label class="mesa-form-grid__wide">
            <span class="settings-label">Recap</span>
            <textarea name="recap" class="editable-textarea" rows="4" ${disabled}>${escapeHtml(normalized.recap)}</textarea>
          </label>
          <label class="mesa-form-grid__wide">
            <span class="settings-label">Objetivo</span>
            <textarea name="objective" class="editable-textarea" rows="3" ${disabled}>${escapeHtml(normalized.objective)}</textarea>
          </label>
        </div>
      </details>
    </div>
    ${!isConnected ? '<p class="export-help">Os dados principais entram na criação da sessão e moldam convites, hub lateral e leitura mobile.</p>' : ''}
  `;
}

function renderJoinByLinkBox(state, runtime) {
  const nickname = runtime.online.session?.nickname || state.characters[0]?.name || 'Feiticeiro';
  return `
    <section id="mesaInviteSection" class="export-box export-box--mesa export-box--mesa-support">
      <div class="panel__header panel__header--tight">
        <div>
          <p class="eyebrow">Entrar por link</p>
          <h3>Convite da sessão</h3>
        </div>
      </div>
      <p class="export-help">Cole um link de mestre, jogador ou espectador para entrar direto na sessão publicada.</p>
      <div class="cloud-form-grid">
        <label class="cloud-form-grid__wide">
          <span class="settings-label">Link da mesa</span>
          <input id="cloudInviteUrlInput" class="editable-input" placeholder="https://.../mesa/shibuya-08?token=..." />
        </label>
        <label>
          <span class="settings-label">Apelido</span>
          <input id="cloudJoinNicknameInput" class="editable-input" value="${escapeHtml(nickname)}" />
        </label>
      </div>
      <div class="export-actions">
        <button id="joinOnlineTableButton" class="ghost-button" type="button">${renderButtonLabel('book', 'Entrar por link')}</button>
      </div>
    </section>
  `;
}

function renderJoinByCodeBox(state, runtime) {
  const nickname = runtime.online.session?.nickname || state.characters[0]?.name || 'Feiticeiro';
  return `
    <section id="mesaJoinCodeSection" class="export-box export-box--mesa export-box--mesa-support">
      <div class="panel__header panel__header--tight">
        <div>
          <p class="eyebrow">Entrar por código</p>
          <h3>Acesso rápido em 6 dígitos</h3>
        </div>
      </div>
      <p class="export-help">Use um código numérico da mesa para entrar sem depender do link completo.</p>
      <div class="cloud-form-grid">
        <label>
          <span class="settings-label">Código da mesa</span>
          <input id="mesaJoinCodeInput" class="editable-input mesa-code-input" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="123456" />
        </label>
        <label>
          <span class="settings-label">Apelido</span>
          <input id="mesaJoinCodeNicknameInput" class="editable-input" value="${escapeHtml(nickname)}" />
        </label>
      </div>
      <div class="export-actions">
        <button id="joinByCodeButton" class="control-button control-button--primary" type="button">${renderButtonLabel('users', 'Entrar por código')}</button>
      </div>
    </section>
  `;
}

function renderPendingCodeJoinPanel(runtime) {
  const pending = runtime.online.pendingCodeJoin;
  if (!pending || pending.role !== 'player') return '';

  return `
    <section id="mesaPendingCodeSection" class="export-box export-box--mesa export-box--mesa-highlight">
      <div class="panel__header panel__header--tight">
        <div>
          <p class="eyebrow">Entrada por código</p>
          <h3>Escolha o personagem para concluir</h3>
        </div>
      </div>
      <p class="export-help">
        O código ${escapeHtml(formatJoinCodeDisplay(pending.code))} abriu a mesa ${escapeHtml(pending.table?.meta?.tableName || pending.table?.name || 'ativa')}. Agora escolha a ficha vinculada a este jogador.
      </p>
      <div class="mesa-character-pick-grid">
        ${(pending.characters || []).length
          ? pending.characters.map((character) => `
            <button type="button" class="mesa-character-pick" data-complete-code-join="${character.id}">
              <strong>${escapeHtml(character.name)}</strong>
              <span>${escapeHtml(character.grade || 'Sem grau')}</span>
              <small>${escapeHtml(character.clan || 'Sem clã')}</small>
            </button>
          `).join('')
          : '<div class="empty-state empty-state--compact">A mesa ainda não tem personagens para vincular.</div>'}
      </div>
      <div class="export-actions">
        <button id="cancelPendingJoinCodeButton" class="ghost-button" type="button">${renderButtonLabel('close', 'Cancelar')}</button>
      </div>
    </section>
  `;
}

function renderJoinCodeManager(state, online, canManageCodes) {
  const joinCodes = online.joinCodes || [];

  return `
    <section class="export-box export-box--mesa mesa-stage mesa-stage--people">
      <div class="panel__header panel__header--tight">
        <div>
          <p class="eyebrow">Pessoas e convites</p>
          <h3>Links e códigos da sessão</h3>
        </div>
      </div>
      <p class="export-help">Organize entradas por papel com um fluxo separado para links e códigos rápidos de 6 dígitos.</p>

      <div class="mesa-dual-grid">
        <div class="mesa-subpanel">
          <div class="mesa-subpanel__header">
            <strong>Links por papel</strong>
            <span>Convite por URL</span>
          </div>
          ${canManageCodes ? `
            <div class="cloud-form-grid">
              <label>
                <span class="settings-label">Papel</span>
                <select id="cloudInviteRoleSelect" class="editable-select">
                  ${JOIN_CODE_ROLE_OPTIONS.map((item) => `<option value="${item.key}">${escapeHtml(item.label)}</option>`).join('')}
                </select>
              </label>
              <label>
                <span class="settings-label">Vincular personagem</span>
                <select id="cloudInviteCharacterSelect" class="editable-select">
                  <option value="">Sem vínculo</option>
                  ${state.characters.map((character) => `<option value="${character.id}">${escapeHtml(character.name)}</option>`).join('')}
                </select>
              </label>
              <label class="cloud-form-grid__wide">
                <span class="settings-label">Rótulo opcional</span>
                <input id="cloudInviteLabelInput" class="editable-input" placeholder="Ex.: link do Yuji" />
              </label>
            </div>
            <div class="export-actions">
              <button id="createInviteButton" class="control-button control-button--primary" type="button">${renderButtonLabel('users', 'Gerar link')}</button>
              <button id="copyLastInviteButton" class="ghost-button" type="button">${renderButtonLabel('copy', 'Copiar último')}</button>
            </div>
            ${online.lastInvite ? `<div class="cloud-link-preview">${escapeHtml(online.lastInvite)}</div>` : '<div class="empty-state empty-state--compact">Nenhum link gerado nesta sessão ainda.</div>'}
          ` : '<div class="empty-state empty-state--compact">Somente o mestre gera links e códigos da mesa.</div>'}
        </div>

        <div class="mesa-subpanel">
          <div class="mesa-subpanel__header">
            <strong>Códigos de 6 dígitos</strong>
            <span>Entrada rápida na sessão</span>
          </div>
          ${canManageCodes ? `
            <div class="cloud-form-grid">
              <label>
                <span class="settings-label">Papel</span>
                <select id="joinCodeRoleSelect" class="editable-select">
                  ${JOIN_CODE_ROLE_OPTIONS.map((item) => `<option value="${item.key}">${escapeHtml(item.label)}</option>`).join('')}
                </select>
              </label>
              <label class="cloud-form-grid__wide">
                <span class="settings-label">Rótulo</span>
                <input id="joinCodeLabelInput" class="editable-input" placeholder="Ex.: mesa dos jogadores" />
              </label>
            </div>
            <div class="export-actions">
              <button id="createJoinCodeButton" class="control-button control-button--primary" type="button">${renderButtonLabel('plus', 'Gerar código')}</button>
            </div>
            <div class="mesa-code-list">
              ${joinCodes.length ? joinCodes.map((joinCode) => `
                <article class="mesa-code-card">
                  <div class="mesa-code-card__copy">
                    <span>${escapeHtml(joinCode.role === 'gm' ? 'Mestre' : joinCode.role === 'player' ? 'Jogador' : 'Espectador')}</span>
                    <strong>${escapeHtml(formatJoinCodeDisplay(joinCode.code))}</strong>
                    <small>${escapeHtml(joinCode.label || 'Sem rótulo')}</small>
                  </div>
                  <div class="mesa-code-card__actions">
                    <button type="button" class="ghost-button" data-copy-join-code="${joinCode.code}">${renderButtonLabel('copy', 'Copiar')}</button>
                    <button type="button" class="ghost-button ghost-button--danger" data-revoke-join-code="${joinCode.id}">${renderButtonLabel('trash', 'Revogar')}</button>
                  </div>
                </article>
              `).join('') : '<div class="empty-state empty-state--compact">Nenhum código numérico ativo nesta mesa.</div>'}
            </div>
          ` : '<div class="empty-state empty-state--compact">O mestre pode gerar códigos reutilizáveis para jogadores, espectadores e mestre auxiliar.</div>'}
        </div>
      </div>
    </section>
  `;
}

function renderEmptyMesaSection(ctx) {
  const { runtime, state } = ctx;
  const online = runtime.online;
  const meta = normalizeTableMeta({
    tableName: DEFAULT_TABLE_META.tableName,
    seriesName: DEFAULT_TABLE_META.seriesName,
    expectedRoster: state.characters.map((character) => character.name).join(', ')
  });

  return `
    <section id="mesaCreateSection" class="export-box export-box--mesa export-box--mesa-primary mesa-stage mesa-stage--session">
      <div class="mesa-empty-shell">
        <div class="mesa-empty-shell__hero">
          <div class="panel__header panel__header--tight">
            <div>
              <p class="eyebrow">Mesa online</p>
              <h2>Você ainda não está dentro de uma mesa online</h2>
            </div>
          </div>
          <p class="export-help">
            ${online.platformAvailable
              ? 'Crie a sessão principal com os dados essenciais e depois libere entradas por link ou código de 6 dígitos.'
              : 'A API online ainda não respondeu. Assim que estiver disponível, esta central libera sync, convites, códigos e snapshots remotos.'}
          </p>
          <div class="cloud-status-grid">
            ${renderCloudStatusCard('Plataforma', online.platformAvailable ? 'API online ativa' : 'Aguardando servidor', online.platformAvailable ? 'success' : 'warning')}
            ${renderCloudStatusCard('Personagens', `${state.characters.length} no navegador`)}
            ${renderCloudStatusCard('Guia ativa', state.currentView)}
            ${renderCloudStatusCard('Entradas', 'Link e código')}
          </div>
        </div>

        <div class="mesa-empty-shell__content">
          <form id="mesaCreateForm" class="stack-list stack-list--mesa mesa-setup-form">
            <label>
              <span class="settings-label">Seu apelido</span>
              <input name="nickname" class="editable-input" value="${escapeHtml(online.session?.nickname || state.characters[0]?.name || 'Feiticeiro')}" />
            </label>
            ${renderTableMetaFields(meta, false, true)}
            <div class="export-actions">
              <button id="createOnlineTableButton" class="control-button control-button--primary" type="submit">${renderButtonLabel('users', 'Criar mesa')}</button>
            </div>
          </form>

          <div class="mesa-entry-stack">
            ${renderJoinByLinkBox(state, runtime)}
            ${renderJoinByCodeBox(state, runtime)}
          </div>
        </div>
      </div>
    </section>
    ${renderPendingCodeJoinPanel(runtime)}
  `;
}

function renderLiveMesaSection(ctx) {
  const { runtime, state } = ctx;
  const online = runtime.online;
  const members = online.members || [];
  const meta = normalizeTableMeta(online.table?.meta || { tableName: online.table?.name || online.session?.tableName });
  const canEdit = online.session?.role === 'gm';
  const roleLabel = online.session?.role === 'gm' ? 'Mestre' : online.session?.role === 'player' ? 'Jogador' : 'Espectador';
  const episode = buildTableEpisodeLabel(meta) || 'Sem episódio definido';
  const context = buildTableContextLabel(meta) || 'Contexto ainda não informado';

  return `
    <section id="mesaSessionSection" class="export-box export-box--mesa export-box--mesa-primary mesa-stage mesa-stage--session">
      <div class="mesa-session-hero">
        <div class="mesa-session-hero__copy">
          <div class="panel__header panel__header--tight">
            <div>
              <p class="eyebrow">Sessão atual</p>
              <h2>${escapeHtml(meta.tableName || online.table?.name || 'Mesa em nuvem')}</h2>
            </div>
          </div>
          <p class="export-help">Acompanhe a sessão em andamento, ajuste os dados centrais e deixe convites, presença e backups como apoio progressivo.</p>
        </div>
        <div class="cloud-status-grid">
          ${renderCloudStatusCard('Papel', roleLabel, online.session?.role === 'gm' ? 'success' : 'info')}
          ${renderCloudStatusCard('Sync', online.status === 'connected' ? 'Ao vivo' : online.status === 'syncing' ? 'Sincronizando' : online.status === 'error' ? 'Erro' : 'Conectando', online.status === 'connected' ? 'success' : online.status === 'error' ? 'danger' : 'info')}
          ${renderCloudStatusCard('Conectados', String(members.length))}
          ${renderCloudStatusCard('Último sync', online.lastSyncAt ? new Date(online.lastSyncAt).toLocaleTimeString('pt-BR') : 'Aguardando')}
        </div>
      </div>

      <div class="mesa-summary-band">
        <div class="mesa-summary-card">
          <span>Episódio</span>
          <strong>${escapeHtml(episode)}</strong>
        </div>
        <div class="mesa-summary-card">
          <span>Contexto</span>
          <strong>${escapeHtml(context)}</strong>
        </div>
        <div class="mesa-summary-card">
          <span>Players</span>
          <strong>${escapeHtml(meta.expectedRoster || 'Elenco aberto')}</strong>
        </div>
      </div>

      <form id="mesaMetaForm" class="stack-list stack-list--mesa mesa-setup-form">
        ${renderTableMetaFields(meta, true, canEdit)}
        ${canEdit ? `
          <div class="export-actions">
            <button id="saveMesaMetaButton" class="control-button control-button--primary" type="submit">${renderButtonLabel('save', 'Salvar dados da mesa')}</button>
          </div>
        ` : '<p class="export-help">Somente o mestre altera os dados da sessão. O restante da mesa recebe as mudanças em tempo real.</p>'}
      </form>
    </section>

    <section id="mesaPeopleSection" class="export-box export-box--mesa mesa-stage mesa-stage--people">
      <div class="panel__header panel__header--tight">
        <div>
          <p class="eyebrow">Pessoas e convites</p>
          <h3>Pessoas na sessão</h3>
        </div>
      </div>
      <p class="export-help">Quem está conectado aparece primeiro. Convites e códigos ficam logo abaixo, separados por função.</p>
      <div id="mesaPresenceSection" class="mesa-presence-grid">
        ${members.length ? members.map((member) => renderPresenceCard(member)).join('') : '<div class="empty-state empty-state--compact">Sem presença ativa no momento.</div>'}
      </div>
    </section>

    ${renderJoinCodeManager(state, online, canEdit)}

    <section id="mesaSnapshotsSection" class="export-box export-box--mesa mesa-stage mesa-stage--security">
      <div class="panel__header panel__header--tight">
        <div>
          <p class="eyebrow">Segurança e recuperação</p>
          <h3>Snapshots remotos</h3>
        </div>
      </div>
      <p class="export-help">Use snapshots para congelar a sessão atual, testar caminhos e restaurar um ponto seguro da mesa quando necessário.</p>
      <div class="export-actions export-actions--cloud">
        <button id="pushCurrentStateButton" class="ghost-button" type="button">${renderButtonLabel('upload', 'Enviar estado atual')}</button>
        <button id="createSnapshotButton" class="ghost-button" type="button">${renderButtonLabel('save', 'Salvar snapshot')}</button>
        <button id="refreshSnapshotsButton" class="ghost-button" type="button">${renderButtonLabel('dice', 'Atualizar backups')}</button>
      </div>
      ${renderSnapshotList(online.snapshots || [])}
    </section>
  `;
}

export function renderMesaSection(ctx) {
  const { dom, actions, runtime } = ctx;
  const activeCharacter = actions.getActiveCharacter();
  const activeText = actions.serializeCharacterToText(activeCharacter);

  dom.mesaSection.innerHTML = `
    <div class="stack-list stack-list--export">
      ${runtime.online.session ? renderLiveMesaSection(ctx) : renderEmptyMesaSection(ctx)}

      <section id="mesaBackupSection" class="export-box export-box--state">
        <div class="panel__header panel__header--tight">
          <div>
            <p class="eyebrow">Backup da sessão</p>
            <h3>JSON e restore manual</h3>
          </div>
        </div>
        <p class="export-help">A nuvem é a fonte principal, mas você ainda pode gerar um backup manual em JSON ou recarregar um estado salvo.</p>
        <div class="export-actions">
          <button id="exportJsonButton" class="control-button control-button--primary">${renderButtonLabel('export', 'Exportar JSON')}</button>
          <button id="loadLocalStateButton" class="ghost-button">${renderButtonLabel('copy', 'Recarregar cache')}</button>
          <button id="resetStateButton" class="ghost-button">${renderButtonLabel('trash', 'Restaurar padrão')}</button>
        </div>
        <label>
          <span class="settings-label">Importar via texto</span>
          <textarea id="importTextarea" placeholder="Cole aqui o JSON inteiro do estado"></textarea>
        </label>
        <div id="importJsonValidation"></div>
        <div class="export-actions">
          <button id="importJsonTextButton" class="control-button">${renderButtonLabel('download', 'Importar texto')}</button>
        </div>
        <label class="export-file-input">
          <span class="settings-label">Importar via arquivo</span>
          <input id="importFileInput" type="file" accept="application/json,.json" />
        </label>
      </section>

      <section id="mesaImportSection" class="export-box export-box--text-sheet">
        <div class="panel__header panel__header--tight">
          <div>
            <p class="eyebrow">Conversão de ficha</p>
            <h3>Texto bruto em personagem</h3>
          </div>
        </div>
        <p class="export-help">Cole uma ou várias fichas em texto bruto no formato da mesa. O site converte automaticamente em personagens completos.</p>
        <label>
          <span class="settings-label">Ficha em texto</span>
          <textarea id="textSheetTextarea" placeholder="Cole aqui uma ou mais fichas de personagem em texto."></textarea>
        </label>
        <div id="textSheetValidation"></div>
        <div class="export-actions">
          <button id="importTextSheetButton" class="control-button control-button--primary">${renderButtonLabel('sheet', 'Converter ficha em personagem')}</button>
        </div>
      </section>

      <section class="export-box export-box--archive">
        <div class="panel__header panel__header--tight">
          <div>
            <p class="eyebrow">Arquivo rápido</p>
            <h3>Ficha ativa em texto</h3>
          </div>
        </div>
        <p class="export-help">A ficha ativa também pode ser convertida de volta para texto para compartilhar, arquivar ou clonar para outra mesa.</p>
        <label>
          <span class="settings-label">Texto da ficha ativa</span>
          <textarea id="characterTextPreview" readonly>${escapeHtml(activeText)}</textarea>
        </label>
        <div class="export-actions">
          <button id="copyCharacterTextButton" class="control-button">${renderButtonLabel('copy', 'Copiar ficha em texto')}</button>
          <button id="downloadCharacterTextButton" class="ghost-button">${renderButtonLabel('download', 'Baixar .txt')}</button>
        </div>
      </section>
    </div>
  `;

  const importTextarea = dom.mesaSection.querySelector('#importTextarea');
  const textSheetTextarea = dom.mesaSection.querySelector('#textSheetTextarea');
  const importValidation = dom.mesaSection.querySelector('#importJsonValidation');
  const textValidation = dom.mesaSection.querySelector('#textSheetValidation');

  const refreshJsonValidation = bindValidation(importValidation, importTextarea, validateStateJson);
  const refreshTextValidation = bindValidation(textValidation, textSheetTextarea, validateTextSheets);

  dom.mesaSection.querySelector('#mesaCreateForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const meta = normalizeTableMeta(Object.fromEntries(data.entries()));
    actions.createOnlineTable({
      name: meta.tableName,
      nickname: data.get('nickname') || '',
      meta
    });
  });

  dom.mesaSection.querySelector('#joinOnlineTableButton')?.addEventListener('click', () => {
    actions.connectToInviteLink(
      dom.mesaSection.querySelector('#cloudInviteUrlInput')?.value || '',
      dom.mesaSection.querySelector('#cloudJoinNicknameInput')?.value || ''
    );
  });

  dom.mesaSection.querySelector('#joinByCodeButton')?.addEventListener('click', () => {
    actions.connectToJoinCode(
      dom.mesaSection.querySelector('#mesaJoinCodeInput')?.value || '',
      dom.mesaSection.querySelector('#mesaJoinCodeNicknameInput')?.value || ''
    );
  });

  dom.mesaSection.querySelectorAll('[data-complete-code-join]').forEach((button) => {
    button.addEventListener('click', () => actions.completeJoinCodeAsPlayer(button.dataset.completeCodeJoin));
  });

  dom.mesaSection.querySelector('#cancelPendingJoinCodeButton')?.addEventListener('click', () => {
    actions.clearPendingJoinCode();
  });

  dom.mesaSection.querySelector('#mesaMetaForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    actions.updateOnlineTableMeta({
      name: data.get('tableName') || DEFAULT_TABLE_META.tableName,
      meta: normalizeTableMeta(Object.fromEntries(data.entries()))
    });
  });

  dom.mesaSection.querySelector('#createInviteButton')?.addEventListener('click', async () => {
    const role = dom.mesaSection.querySelector('#cloudInviteRoleSelect')?.value || 'player';
    const characterId = role === 'player' ? (dom.mesaSection.querySelector('#cloudInviteCharacterSelect')?.value || '') : '';
    const label = dom.mesaSection.querySelector('#cloudInviteLabelInput')?.value || '';
    const invite = await actions.createInviteLink({ role, characterId, label });
    if (invite?.url) actions.copyInviteLink(invite.url);
  });

  dom.mesaSection.querySelector('#copyLastInviteButton')?.addEventListener('click', () => {
    actions.copyInviteLink(runtime.online.lastInvite);
  });

  dom.mesaSection.querySelector('#createJoinCodeButton')?.addEventListener('click', async () => {
    const role = dom.mesaSection.querySelector('#joinCodeRoleSelect')?.value || 'player';
    const label = dom.mesaSection.querySelector('#joinCodeLabelInput')?.value || '';
    const joinCode = await actions.createJoinCode({ role, label });
    if (joinCode?.code) {
      actions.copyTextSnippet(joinCode.code, {
        successTitle: 'Código copiado',
        successMessage: `O código ${formatJoinCodeDisplay(joinCode.code)} foi enviado para a área de transferência.`
      });
    }
  });

  dom.mesaSection.querySelectorAll('[data-copy-join-code]').forEach((button) => {
    button.addEventListener('click', () => {
      actions.copyTextSnippet(button.dataset.copyJoinCode, {
        successTitle: 'Código copiado',
        successMessage: `O código ${formatJoinCodeDisplay(button.dataset.copyJoinCode)} foi enviado para a área de transferência.`
      });
    });
  });

  dom.mesaSection.querySelectorAll('[data-revoke-join-code]').forEach((button) => {
    button.addEventListener('click', () => actions.revokeJoinCode(button.dataset.revokeJoinCode));
  });

  dom.mesaSection.querySelector('#pushCurrentStateButton')?.addEventListener('click', () => {
    actions.importCurrentStateToCloud('Sincronização manual');
  });

  dom.mesaSection.querySelector('#createSnapshotButton')?.addEventListener('click', () => {
    actions.createCloudSnapshot('Snapshot manual');
  });

  dom.mesaSection.querySelector('#refreshSnapshotsButton')?.addEventListener('click', () => {
    actions.refreshCloudSnapshots();
  });

  dom.mesaSection.querySelectorAll('[data-restore-snapshot]').forEach((button) => {
    button.addEventListener('click', () => {
      actions.restoreCloudSnapshot(button.dataset.restoreSnapshot);
    });
  });

  dom.mesaSection.querySelector('#exportJsonButton')?.addEventListener('click', actions.exportState);
  dom.mesaSection.querySelector('#loadLocalStateButton')?.addEventListener('click', actions.reloadPersistentState);
  dom.mesaSection.querySelector('#resetStateButton')?.addEventListener('click', actions.resetState);
  dom.mesaSection.querySelector('#importJsonTextButton')?.addEventListener('click', () => {
    const result = validateStateJson(importTextarea.value);
    importValidation.innerHTML = renderValidationBox(result);
    if (result.tone === 'danger') return;
    actions.importStateFromText(importTextarea.value);
  });
  dom.mesaSection.querySelector('#importFileInput')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await actions.importStateFromFile(file);
    event.target.value = '';
    importTextarea.value = '';
    refreshJsonValidation();
  });
  dom.mesaSection.querySelector('#importTextSheetButton')?.addEventListener('click', () => {
    const result = validateTextSheets(textSheetTextarea.value);
    textValidation.innerHTML = renderValidationBox(result);
    if (result.tone === 'danger') return;
    actions.importCharactersFromText(textSheetTextarea.value);
  });
  dom.mesaSection.querySelector('#copyCharacterTextButton')?.addEventListener('click', actions.copyActiveCharacterText);
  dom.mesaSection.querySelector('#downloadCharacterTextButton')?.addEventListener('click', actions.downloadActiveCharacterText);

  refreshTextValidation();
}
