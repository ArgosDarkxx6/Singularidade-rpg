import { BOOK_CHAPTERS } from '../content/book-content.js';

export { BOOK_CHAPTERS } from '../content/book-content.js';

const COMPENDIUM_CATEGORIES = [
  { key: 'all', label: 'Tudo' },
  { key: 'abertura', label: 'Abertura' },
  { key: 'fundamentos', label: 'Fundamentos' },
  { key: 'personagem', label: 'Personagem' },
  { key: 'energia', label: 'Energia' },
  { key: 'climax', label: 'Climax' },
  { key: 'combate', label: 'Combate' },
  { key: 'arsenal', label: 'Arsenal e ameacas' },
  { key: 'apendices', label: 'Apendices' },
  { key: 'glossary', label: 'Glossario' }
];

function collectText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((item) => collectText(item)).join(' ');
  if (typeof value === 'object') return Object.values(value).map((item) => collectText(item)).join(' ');
  return String(value);
}

function sectionMatches(section, query) {
  if (!query) return true;
  return collectText(section).toLowerCase().includes(query);
}

export function getCompendiumCategories() {
  return COMPENDIUM_CATEGORIES.map((category) => ({ ...category }));
}

export function filterCompendiumEntries(query, category) {
  const normalizedQuery = String(query || '').trim().toLowerCase();

  return BOOK_CHAPTERS
    .filter((chapter) => !category || category === 'all' || chapter.category === category)
    .map((chapter) => ({
      ...chapter,
      sections: chapter.sections.filter((section) => sectionMatches(section, normalizedQuery))
    }))
    .filter((chapter) => chapter.sections.length > 0);
}

export function getBookMeta(chapters = BOOK_CHAPTERS) {
  const sectionCount = chapters.reduce((total, chapter) => total + chapter.sections.length, 0);
  const tableCount = chapters.reduce((total, chapter) => (
    total + chapter.sections.reduce((sectionTotal, section) => (
      sectionTotal + section.blocks.filter((block) => block.type === 'table').length
    ), 0)
  ), 0);

  return {
    chapterCount: chapters.length,
    sectionCount,
    tableCount
  };
}

export function getBookOutline(chapters = BOOK_CHAPTERS) {
  return chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    label: chapter.label,
    sections: chapter.sections.map((section) => ({
      id: section.id,
      title: section.title
    }))
  }));
}
