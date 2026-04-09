import { BOOK_CHAPTERS as legacyBookChapters } from './source/book-content.js';
import type { BookChapter } from './types';

export const BOOK_CHAPTERS = legacyBookChapters as readonly BookChapter[];

export function getBookChapterById(chapterId: string) {
  return BOOK_CHAPTERS.find((chapter) => chapter.id === chapterId) ?? null;
}

export function getBookSectionById(sectionId: string) {
  for (const chapter of BOOK_CHAPTERS) {
    const section = chapter.sections.find((entry) => entry.id === sectionId);
    if (section) return section;
  }
  return null;
}

export function getBookChapterCount() {
  return BOOK_CHAPTERS.length;
}
