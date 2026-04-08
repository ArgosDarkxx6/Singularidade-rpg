import {
  filterCompendiumEntries,
  getBookMeta,
  getCompendiumCategories
} from '../../core/compendium.js';
import { filterGlossaryEntries } from '../../core/glossary.js';
import { escapeAttribute, escapeHtml } from '../../core/utils.js';
import { renderButtonLabel } from '../../ui/icons.js';
import { renderMobileHero, renderMobileMetric, renderMobilePanel } from './shared.js';

function renderReferenceResults(runtime) {
  const references = runtime.online.references || [];
  if (runtime.online.referencesLoading) {
    return `
      <div class="mobile-stack">
        <article class="mobile-collection-card mobile-collection-card--loading"></article>
        <article class="mobile-collection-card mobile-collection-card--loading"></article>
      </div>
    `;
  }

  if (!references.length) {
    return '<div class="mobile-info-card"><span>Camada online</span><p>Busque um termo para ver referências da wiki e de mídia ligadas ao cenário.</p></div>';
  }

  return `
    <div class="mobile-stack">
      ${references.map((card) => `
        <a class="mobile-collection-card mobile-link-card" href="${escapeAttribute(card.url)}" target="_blank" rel="noreferrer">
          <span>${escapeHtml(card.source || 'Referência online')}</span>
          <strong>${escapeHtml(card.title)}</strong>
          <p>${escapeHtml(card.summary || 'Sem resumo disponível.')}</p>
          <div class="mobile-inline-actions">
            <span class="type-pill">${escapeHtml(card.category || 'Wiki')}</span>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

function renderChapterCards(chapters) {
  if (!chapters.length) {
    return '<div class="mobile-info-card"><span>Sem resultado</span><p>Nenhum capítulo ou seção corresponde ao filtro atual.</p></div>';
  }

  return `
    <div class="mobile-stack">
      ${chapters.map((chapter) => `
        <article class="mobile-collection-card">
          <span>${escapeHtml(chapter.label || 'Capítulo')}</span>
          <strong>${escapeHtml(chapter.title)}</strong>
          <p>${escapeHtml(chapter.summary)}</p>
          <div class="mobile-inline-actions">
            <span class="type-pill">${chapter.sections.length} seções</span>
            <span class="type-pill">${escapeHtml(chapter.category)}</span>
          </div>
          <div class="mobile-stack">
            ${chapter.sections.slice(0, 5).map((section) => `
              <article class="mobile-info-card">
                <span>${escapeHtml(section.title)}</span>
                <p>${escapeHtml(section.summary)}</p>
              </article>
            `).join('')}
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

function renderGlossaryCards(groups) {
  const entries = groups.flatMap((group) => group.entries.map((entry) => ({ ...entry, groupLabel: group.label })));
  if (!entries.length) {
    return '<div class="mobile-info-card"><span>Glossário</span><p>Nenhum verbete corresponde ao filtro atual.</p></div>';
  }

  return `
    <div class="mobile-stack">
      ${entries.slice(0, 16).map((entry) => `
        <article class="mobile-collection-card">
          <span>${escapeHtml(entry.groupLabel)}</span>
          <strong>${escapeHtml(entry.name)}</strong>
          <p>${escapeHtml(entry.summary)}</p>
          <div class="mobile-inline-actions">
            ${entry.tags.slice(0, 3).map((tag) => `<span class="type-pill">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

export function renderMobileCompendiumView(ctx) {
  const { runtime } = ctx;
  const categories = getCompendiumCategories();
  const chapters = runtime.compendiumCategory === 'glossary'
    ? []
    : filterCompendiumEntries(runtime.compendiumQuery, runtime.compendiumCategory);
  const glossaryGroups = filterGlossaryEntries(runtime.compendiumQuery, runtime.compendiumCategory);
  const meta = getBookMeta(chapters);
  const glossaryCount = glossaryGroups.reduce((total, group) => total + group.entries.length, 0);

  return `
    <section class="mobile-page mobile-page--compendium">
      ${renderMobileHero({
        eyebrow: 'Livro',
        title: 'Qual regra você precisa agora?',
        body: 'Busca primeiro, leitura direta e referências externas sem sair do fluxo da mesa.'
      })}
      ${renderMobilePanel({
        eyebrow: 'Busca',
        title: 'Livro e referências',
        body: `
          <div id="mobileBookSearchSection" class="mobile-form">
            <label class="mobile-form-field">
              <span>Buscar no livro</span>
              <input id="mobileBookSearchInput" type="search" value="${escapeAttribute(runtime.compendiumQuery)}" placeholder="Regra, combate, domínio, técnica..." />
            </label>
            <div id="mobileBookFilterRow" class="mobile-filter-row">
              ${categories.map((category) => `
                <button type="button" class="mobile-character-pill ${runtime.compendiumCategory === category.key ? 'is-active' : ''}" data-mobile-category="${escapeHtml(category.key)}">
                  ${escapeHtml(category.label)}
                </button>
              `).join('')}
            </div>
            <div class="mobile-inline-actions mobile-inline-actions--grid">
              <button type="button" class="control-button control-button--primary" data-mobile-download-rules>${renderButtonLabel('download', 'Baixar PDF')}</button>
            </div>
          </div>
        `
      })}
      <div id="mobileBookMetricsRow" class="mobile-metric-row">
        ${renderMobileMetric('Capítulos', meta.chapterCount)}
        ${renderMobileMetric('Seções', meta.sectionCount)}
        ${renderMobileMetric('Tabelas', meta.tableCount)}
        ${renderMobileMetric('Glossário', glossaryCount)}
      </div>
      ${renderMobilePanel({
        eyebrow: 'Leitura',
        title: 'Capítulos visíveis',
        body: `<div id="mobileBookChapterResults">${renderChapterCards(chapters)}</div>`
      })}
      ${renderMobilePanel({
        eyebrow: 'Glossário',
        title: 'Verbetes em destaque',
        body: `<div id="mobileBookGlossaryResults">${renderGlossaryCards(glossaryGroups)}</div>`
      })}
      ${renderMobilePanel({
        eyebrow: 'Camada online',
        title: 'Referências externas',
        body: `<div id="mobileBookReferenceResults">${renderReferenceResults(runtime)}</div>`
      })}
    </section>
  `;
}

export function bindMobileCompendiumView(ctx, root) {
  const searchInput = root.querySelector('#mobileBookSearchInput');
  if (searchInput) {
    searchInput.oninput = (event) => {
      ctx.actions.setCompendiumQuery(event.target.value);
    };
  }

  root.querySelectorAll('[data-mobile-category]').forEach((button) => {
    button.onclick = () => ctx.actions.setCompendiumCategory(button.dataset.mobileCategory);
  });

  const downloadButton = root.querySelector('[data-mobile-download-rules]');
  if (downloadButton) downloadButton.onclick = () => ctx.actions.downloadRules();
}

export function updateMobileCompendiumView(ctx, root) {
  const host = document.createElement('div');
  host.innerHTML = renderMobileCompendiumView(ctx).trim();

  const currentPage = root.querySelector('.mobile-page--compendium');
  const nextPage = host.firstElementChild;
  if (!currentPage || !nextPage) {
    root.innerHTML = renderMobileCompendiumView(ctx);
    bindMobileCompendiumView(ctx, root);
    return;
  }

  const currentInput = currentPage.querySelector('#mobileBookSearchInput');
  const nextInput = nextPage.querySelector('#mobileBookSearchInput');
  if (currentInput && nextInput && document.activeElement !== currentInput && currentInput.value !== nextInput.value) {
    currentInput.value = nextInput.value;
  }

  [
    '#mobileBookFilterRow',
    '#mobileBookMetricsRow',
    '#mobileBookChapterResults',
    '#mobileBookGlossaryResults',
    '#mobileBookReferenceResults'
  ].forEach((selector) => {
    const currentNode = currentPage.querySelector(selector);
    const nextNode = nextPage.querySelector(selector);
    if (currentNode && nextNode) currentNode.replaceWith(nextNode);
  });

  bindMobileCompendiumView(ctx, root);
}
