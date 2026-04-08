import {
  filterCompendiumEntries,
  getBookMeta,
  getBookOutline,
  getCompendiumCategories
} from '../core/compendium.js';
import { filterGlossaryEntries } from '../core/glossary.js';
import { escapeAttribute, escapeHtml } from '../core/utils.js';
import { renderButtonLabel, renderIcon } from '../ui/icons.js';

const standaloneState = {
  query: '',
  category: 'all',
  references: [],
  referencesLoading: false,
  requestId: 0
};

function renderHeading(tag, title, eyebrow, variant = 'section') {
  return `
    <div class="book-heading book-heading--${escapeAttribute(variant)}">
      ${eyebrow ? `<p class="book-heading__eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
      <${tag} class="book-heading__title">${escapeHtml(title)}</${tag}>
      <div class="book-heading__rule" aria-hidden="true"></div>
    </div>
  `;
}

function renderTable(block) {
  return `
    <section class="book-block book-block--table">
      ${renderHeading('h4', block.title, 'Tabela', 'block')}
      <div class="book-table-wrap">
        <table class="book-table">
          <thead>
            <tr>
              ${block.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${block.rows.map((row) => `
              <tr>
                ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${block.note ? `<p class="book-table__note">${escapeHtml(block.note)}</p>` : ''}
    </section>
  `;
}

function renderCallout(block) {
  const tone = block.type === 'example'
    ? 'example'
    : block.type === 'reference'
      ? 'reference'
      : block.tone || 'rule';
  const items = block.items?.length
    ? `<ul class="book-callout__list">${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '';

  return `
    <aside class="book-callout book-callout--${escapeAttribute(tone)}">
      ${renderHeading('h4', block.title, block.label || 'Destaque', 'callout')}
      ${block.body ? `<p>${escapeHtml(block.body)}</p>` : ''}
      ${items}
    </aside>
  `;
}

function renderList(block) {
  return `
    <section class="book-block book-block--list">
      ${renderHeading('h4', block.title, 'Tópicos', 'block')}
      <ul class="book-list">
        ${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </section>
  `;
}

function renderBlock(block) {
  if (block.type === 'paragraph') {
    return `<p class="book-copy">${escapeHtml(block.text)}</p>`;
  }

  if (block.type === 'table') return renderTable(block);
  if (block.type === 'list') return renderList(block);
  if (['rule', 'example', 'callout', 'reference'].includes(block.type)) return renderCallout(block);
  return '';
}

function renderSection(section) {
  return `
    <section id="${escapeAttribute(section.id)}" class="book-section" data-book-section="${escapeAttribute(section.id)}">
      <header class="book-section__header">
        ${renderHeading('h3', section.title, 'Seção', 'section')}
        <p class="book-section__summary">${escapeHtml(section.summary)}</p>
      </header>
      <div class="book-section__body">
        ${section.blocks.map((block) => renderBlock(block)).join('')}
      </div>
    </section>
  `;
}

function renderChapter(chapter, chapterIndex) {
  return `
    <article id="${escapeAttribute(chapter.id)}" class="book-chapter" data-book-category="${escapeAttribute(chapter.category)}">
      <div class="book-energy-rune book-energy-rune--a"></div>
      <div class="book-energy-rune book-energy-rune--b"></div>
      <header class="book-chapter__header">
        ${renderHeading('h2', chapter.title, `Capítulo ${chapterIndex + 1}`, 'chapter')}
        <p class="book-chapter__summary">${escapeHtml(chapter.summary)}</p>
      </header>
      <div class="book-chapter__sections">
        ${chapter.sections.map((section) => renderSection(section)).join('')}
      </div>
    </article>
  `;
}

function renderGlossaryCard(entry) {
  return `
    <article class="glossary-card" data-glossary-entry="${escapeAttribute(entry.id)}">
      <header class="glossary-card__header">
        ${renderHeading('h4', entry.name, entry.kind, 'card')}
        <p class="glossary-card__origin">${escapeHtml(entry.origin)}</p>
        <div class="glossary-card__tags">
          ${entry.tags.map((tag) => `<span class="glossary-chip">${escapeHtml(tag)}</span>`).join('')}
        </div>
      </header>
      <p class="glossary-card__summary">${escapeHtml(entry.summary)}</p>
      <div class="glossary-card__grid">
        <div class="glossary-card__field">
          <span class="glossary-card__label">Função em mesa</span>
          <p>${escapeHtml(entry.tableUse)}</p>
        </div>
        <div class="glossary-card__field">
          <span class="glossary-card__label">Template de adaptação</span>
          <p>${escapeHtml(entry.templateRule)}</p>
        </div>
        <div class="glossary-card__field">
          <span class="glossary-card__label">Leitura visual</span>
          <p>${escapeHtml(entry.visualCue)}</p>
        </div>
        <div class="glossary-card__field">
          <span class="glossary-card__label">Escala e custo</span>
          <p>${escapeHtml(entry.templateCost)}</p>
        </div>
      </div>
    </article>
  `;
}

function renderGlossary(groups) {
  if (!groups.length) return '';

  return `
    <article id="glossary" class="book-chapter book-chapter--glossary" data-book-category="glossary">
      <div class="book-energy-rune book-energy-rune--a"></div>
      <div class="book-energy-rune book-energy-rune--b"></div>
      <header class="book-chapter__header">
        ${renderHeading('h2', 'Glossário da obra e templates de adaptação', 'Atlas ritual', 'chapter')}
        <p class="book-chapter__summary">
          Um catálogo visual com referências da obra original para inspirar técnicas, armas, objetos, domínios e estruturas de ficha dentro do site e do livro.
        </p>
      </header>
      <div class="book-chapter__sections glossary-groups">
        ${groups.map((group) => `
          <section id="glossary-${escapeAttribute(group.key)}" class="book-section glossary-group" data-book-section="glossary-${escapeAttribute(group.key)}">
            <header class="book-section__header">
              ${renderHeading('h3', group.label, 'Glossário', 'section')}
              <p class="book-section__summary">Modelos prontos para adaptar identidade, risco, custo e linguagem visual da obra.</p>
            </header>
            <div class="glossary-grid">
              ${group.entries.map((entry) => renderGlossaryCard(entry)).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    </article>
  `;
}

function renderOutline(outline, glossaryGroups) {
  return `
    <div class="book-toc__panel">
      <div class="book-rail__header">
        ${renderHeading('h3', 'Navegação guiada', 'Índice rápido', 'rail')}
        <p class="item-card__meta">Capítulos, seções e atalhos para chegar na regra certa sem sair da leitura.</p>
      </div>
      <div class="book-toc__list">
        ${outline.map((chapter) => `
          <div class="book-toc__group">
            <a href="#${escapeAttribute(chapter.id)}" class="book-toc__chapter" data-outline-target="${escapeAttribute(chapter.id)}">
              <span>${escapeHtml(chapter.title)}</span>
              <small>${chapter.sections.length}</small>
            </a>
            <div class="book-toc__sections">
              ${chapter.sections.map((section) => `
                <a href="#${escapeAttribute(section.id)}" class="book-toc__section" data-outline-target="${escapeAttribute(section.id)}">${escapeHtml(section.title)}</a>
              `).join('')}
            </div>
          </div>
        `).join('')}
        ${glossaryGroups.length ? `
          <div class="book-toc__group">
            <a href="#glossary" class="book-toc__chapter" data-outline-target="glossary">
              <span>Glossário da obra</span>
              <small>${glossaryGroups.length}</small>
            </a>
            <div class="book-toc__sections">
              ${glossaryGroups.map((group) => `
                <a href="#glossary-${escapeAttribute(group.key)}" class="book-toc__section" data-outline-target="glossary-${escapeAttribute(group.key)}">${escapeHtml(group.label)}</a>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderMetric(label, value, detail = '') {
  return `
    <div class="book-stat">
      <span class="book-stat__label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      ${detail ? `<span class="book-stat__detail">${escapeHtml(detail)}</span>` : ''}
    </div>
  `;
}

function renderJumpLinks(outline, glossaryGroups) {
  const quickTargets = outline.slice(0, 4).map((chapter) => ({ id: chapter.id, label: chapter.title }));
  if (glossaryGroups.length) {
    quickTargets.push({ id: 'glossary', label: 'Glossário' });
  }

  return `
    <div class="book-command__jump-list">
      ${quickTargets.map((target) => `
        <a href="#${escapeAttribute(target.id)}" class="book-command__jump" data-outline-target="${escapeAttribute(target.id)}">
          ${escapeHtml(target.label)}
        </a>
      `).join('')}
    </div>
  `;
}

function renderReferenceCards(query, cards, loading) {
  if (!query && !loading && !cards.length) return '';

  return `
    <section class="book-reference-shell">
      <header class="book-reference-shell__header">
        ${renderHeading('h3', 'Referências online da obra', 'Camada híbrida', 'section')}
        <p class="book-section__summary">
          Resultados rápidos da wiki de Jujutsu para complementar o livro curado do site sem espelhar o conteúdo externo.
        </p>
      </header>
      ${loading ? `
        <div class="book-reference-grid">
          ${Array.from({ length: 3 }).map(() => '<article class="book-reference-card book-reference-card--loading"></article>').join('')}
        </div>
      ` : cards.length ? `
        <div class="book-reference-grid">
          ${cards.map((card) => `
            <a class="book-reference-card" href="${escapeAttribute(card.url)}" target="_blank" rel="noreferrer">
              <div class="book-reference-card__meta">
                <span>${escapeHtml(card.source || 'Referência online')}</span>
                <strong>${escapeHtml(card.category || 'Wiki')}</strong>
              </div>
              <h4>${escapeHtml(card.title)}</h4>
              <p>${escapeHtml(card.summary || 'Sem resumo disponível.')}</p>
              <span class="book-reference-card__action">Abrir referência</span>
            </a>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state empty-state--compact">Nenhuma referência externa retornou para “${escapeHtml(query)}”.</div>
      `}
    </section>
  `;
}

function replaceNode(currentNode, nextNode) {
  if (!currentNode && !nextNode) return null;
  if (currentNode && nextNode) {
    currentNode.replaceWith(nextNode);
    return null;
  }
  if (currentNode && !nextNode) {
    currentNode.remove();
    return null;
  }
  return nextNode;
}

function buildBookMarkup({ chapters, query, activeCategory, standalone = false, externalCards = [], referencesLoading = false }) {
  const categories = getCompendiumCategories();
  const totalGlossaryGroups = filterGlossaryEntries('', 'glossary');
  const totalGlossaryCount = totalGlossaryGroups.reduce((total, group) => total + group.entries.length, 0);
  const glossaryGroups = activeCategory === 'all' || activeCategory === 'glossary' || query
    ? filterGlossaryEntries(query, activeCategory)
    : [];
  const meta = getBookMeta(chapters);
  const outline = getBookOutline(chapters);
  const glossaryCount = glossaryGroups.reduce((total, group) => total + group.entries.length, 0);
  const visibleGlossary = activeCategory === 'all' || activeCategory === 'glossary' || !!query;
  const resultLabel = query
    ? `Busca por "${query}" em ${meta.sectionCount} seções e ${glossaryCount} verbetes`
    : visibleGlossary
      ? `${meta.sectionCount} seções editoriais e ${glossaryCount} verbetes visíveis`
      : `${meta.sectionCount} seções editoriais • glossário disponível no catálogo`;
  const hasContent = chapters.length || glossaryGroups.length;

  return `
    <div class="book-shell ${standalone ? 'book-shell--standalone' : 'book-shell--embedded'}">
      <section class="book-command">
        <div class="book-command__intro">
          <div class="book-command__copy">
            ${renderHeading('h1', 'Livro de Regras', 'Arquivo amaldiçoado', 'hero')}
            <p class="book-command__lede">
              Consulta rápida, leitura guiada e referências da obra reunidas em um painel coerente com o restante do site.
            </p>
            ${renderJumpLinks(outline, glossaryGroups)}
          </div>
          <div class="book-command__art">
            <img src="assets/cover.png" alt="Capa do livro Singularidade" class="book-command__cover" />
          </div>
        </div>

        <div class="book-command__metrics">
          ${renderMetric('Capítulos', meta.chapterCount, 'Linhas principais')}
          ${renderMetric('Seções', meta.sectionCount, 'Leitura ativa')}
          ${renderMetric('Tabelas', meta.tableCount, 'Referência rápida')}
          ${renderMetric('Glossário', visibleGlossary ? glossaryCount : totalGlossaryCount, visibleGlossary ? 'Verbetes visíveis' : 'Catalogados')}
        </div>

        <div class="book-command__controls">
          <label class="book-search">
            ${renderIcon('search')}
            <input id="compendiumSearchInput" type="search" placeholder="Buscar regra, combate, domínio, voto, SAN, arma, técnica..." value="${escapeAttribute(query)}" />
          </label>
          ${standalone ? '' : `
            <button id="bookDownloadRulesButton" class="control-button control-button--primary book-download-button" type="button">
              ${renderButtonLabel('download', 'Baixar PDF')}
            </button>
          `}
        </div>

        <div class="book-filters">
          ${categories.map((category) => `
            <button class="filter-chip ${activeCategory === category.key ? 'is-active' : ''}" data-compendium-category="${category.key}" type="button">
              ${escapeHtml(category.label)}
            </button>
          `).join('')}
        </div>

        <div class="book-results-meta">
          <span>${escapeHtml(resultLabel)}</span>
          <span>${meta.chapterCount} capítulos principais</span>
        </div>
      </section>

      <div class="book-reader">
        <aside class="book-rail">
          ${renderOutline(outline, glossaryGroups)}
        </aside>
        <div class="book-content">
          ${hasContent ? `
            ${chapters.map((chapter, index) => renderChapter(chapter, index)).join('')}
            ${renderGlossary(glossaryGroups)}
          ` : `
            <div class="empty-state">
              Nenhum trecho do livro ou do glossário corresponde ao filtro atual.
            </div>
          `}
        </div>
      </div>
      ${renderReferenceCards(query, externalCards, referencesLoading)}
    </div>
  `;
}

function syncBookRoot(root, markup) {
  const host = document.createElement('div');
  host.innerHTML = markup.trim();

  const nextShell = host.firstElementChild;
  const currentShell = root.querySelector('.book-shell');

  if (!currentShell || !nextShell) {
    root.innerHTML = markup;
    return;
  }

  const currentInput = currentShell.querySelector('#compendiumSearchInput');
  const nextInput = nextShell.querySelector('#compendiumSearchInput');
  if (currentInput && nextInput && document.activeElement !== currentInput && currentInput.value !== nextInput.value) {
    currentInput.value = nextInput.value;
  }

  [
    '.book-command__jump-list',
    '.book-command__metrics',
    '.book-filters',
    '.book-results-meta',
    '.book-reader'
  ].forEach((selector) => {
    const currentNode = currentShell.querySelector(selector);
    const nextNode = nextShell.querySelector(selector);
    const detached = replaceNode(currentNode, nextNode);
    if (detached && selector === '.book-command__jump-list') {
      currentShell.querySelector('.book-command__copy')?.appendChild(detached);
    }
  });

  const currentReferenceShell = currentShell.querySelector('.book-reference-shell');
  const nextReferenceShell = nextShell.querySelector('.book-reference-shell');
  const detachedReferenceShell = replaceNode(currentReferenceShell, nextReferenceShell);
  if (detachedReferenceShell) currentShell.appendChild(detachedReferenceShell);
}

function downloadRulesFile() {
  const anchor = document.createElement('a');
  anchor.href = 'assets/Singularidade_Livro_de_Regras.pdf';
  anchor.download = 'Singularidade_Livro_de_Regras.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function clearOutlineObserver(root) {
  if (typeof root.__bookRailCleanup === 'function') {
    root.__bookRailCleanup();
    root.__bookRailCleanup = null;
  }
}

function bindActiveOutline(root, observerRoot = null) {
  clearOutlineObserver(root);

  const targetNodes = Array.from(root.querySelectorAll('.book-chapter[id], .book-section[id]'));
  const outlineLinks = Array.from(root.querySelectorAll('[data-outline-target]'));
  if (!targetNodes.length || !outlineLinks.length || typeof IntersectionObserver === 'undefined') return;

  const linkMap = new Map(outlineLinks.map((link) => [link.dataset.outlineTarget, link]));

  const setActive = (id) => {
    outlineLinks.forEach((link) => {
      const isCurrent = link.dataset.outlineTarget === id;
      link.classList.toggle('is-current', isCurrent);
      if (isCurrent) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    const next = visible[0]?.target?.id;
    if (next && linkMap.has(next)) setActive(next);
  }, {
    root: observerRoot,
    rootMargin: '-18% 0px -62% 0px',
    threshold: [0.12, 0.3, 0.6]
  });

  targetNodes.forEach((node) => observer.observe(node));
  setActive(targetNodes[0].id);

  root.__bookRailCleanup = () => observer.disconnect();
}

function bindBookInteractions(root, { onQueryChange, onCategoryChange, onDownload, observerRoot = null }) {
  const searchInput = root.querySelector('#compendiumSearchInput');
  if (searchInput) {
    searchInput.oninput = (event) => {
      onQueryChange(event.target.value);
    };
  }

  root.querySelectorAll('[data-compendium-category]').forEach((button) => {
    button.onclick = () => onCategoryChange(button.dataset.compendiumCategory);
  });

  const downloadButton = root.querySelector('#bookDownloadRulesButton');
  if (downloadButton) downloadButton.onclick = onDownload;
  bindActiveOutline(root, observerRoot);
}

export function renderCompendiumSection(ctx) {
  const { dom, runtime, actions } = ctx;
  const chapters = runtime.compendiumCategory === 'glossary'
    ? []
    : filterCompendiumEntries(runtime.compendiumQuery, runtime.compendiumCategory);

  syncBookRoot(dom.compendiumSection, buildBookMarkup({
    chapters,
    query: runtime.compendiumQuery,
    activeCategory: runtime.compendiumCategory,
    standalone: false,
    externalCards: runtime.online.references || [],
    referencesLoading: runtime.online.referencesLoading
  }));

  bindBookInteractions(dom.compendiumSection, {
    onQueryChange(query) {
      runtime.compendiumFocusSearch = true;
      actions.setCompendiumQuery(query);
    },
    onCategoryChange(category) {
      actions.setCompendiumCategory(category);
    },
    onDownload: actions.downloadRules,
    observerRoot: null
  });

  if (runtime.compendiumFocusSearch) {
    const searchInput = dom.compendiumSection.querySelector('#compendiumSearchInput');
    searchInput?.focus();
    const length = searchInput?.value.length || 0;
    searchInput?.setSelectionRange(length, length);
    runtime.compendiumFocusSearch = false;
  }
}

export function mountStandaloneBook(root) {
  if (!root) return;

  const loadReferences = async (query) => {
    if (!query || query.trim().length < 2) {
      standaloneState.references = [];
      standaloneState.referencesLoading = false;
      render();
      return;
    }

    const requestId = Date.now();
    standaloneState.requestId = requestId;
    standaloneState.referencesLoading = true;
    render();

    try {
      const response = await fetch(`/api/reference/search?q=${encodeURIComponent(query.trim())}`);
      const payload = await response.json();
      if (standaloneState.requestId !== requestId) return;
      standaloneState.references = payload.cards || [];
    } catch (error) {
      if (standaloneState.requestId !== requestId) return;
      standaloneState.references = [];
    } finally {
      if (standaloneState.requestId === requestId) {
        standaloneState.referencesLoading = false;
        render();
      }
    }
  };

  const render = () => {
    const chapters = standaloneState.category === 'glossary'
      ? []
      : filterCompendiumEntries(standaloneState.query, standaloneState.category);

    syncBookRoot(root, buildBookMarkup({
      chapters,
      query: standaloneState.query,
      activeCategory: standaloneState.category,
      standalone: true,
      externalCards: standaloneState.references,
      referencesLoading: standaloneState.referencesLoading
    }));

    bindBookInteractions(root, {
      onQueryChange(query) {
        standaloneState.query = query;
        render();
        loadReferences(query);
      },
      onCategoryChange(category) {
        standaloneState.category = category;
        render();
      },
      onDownload: downloadRulesFile,
      observerRoot: null
    });
  };

  render();
}
