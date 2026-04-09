import {
  GLOSSARY_ENTRIES as legacyGlossaryEntries,
  GLOSSARY_GROUPS as legacyGlossaryGroups
} from './source/glossary.js';
import type {
  GlossaryEntry,
  GlossaryGroup
} from './types';

export const GLOSSARY_GROUPS = legacyGlossaryGroups as readonly GlossaryGroup[];
export const GLOSSARY_ENTRIES = legacyGlossaryEntries as readonly GlossaryEntry[];

export function getGlossaryGroupByKey(groupKey: string) {
  return GLOSSARY_GROUPS.find((group) => group.key === groupKey) ?? null;
}

export function getGlossaryEntriesByGroup(groupKey: string) {
  return GLOSSARY_ENTRIES.filter((entry) => entry.group === groupKey);
}

export function filterGlossaryEntries(query: string, category = 'all') {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  return GLOSSARY_GROUPS
    .map((group) => {
      const entries = GLOSSARY_ENTRIES.filter((entry) => {
        if (category !== 'all' && category !== 'glossary' && entry.group !== category) {
          return false;
        }

        const searchable = [
          entry.name,
          entry.kind,
          entry.origin,
          entry.summary,
          entry.tableUse,
          entry.templateRule,
          entry.visualCue,
          entry.templateCost,
          ...entry.tags
        ]
          .join(' ')
          .toLowerCase();

        return !normalizedQuery || searchable.includes(normalizedQuery);
      });

      return { ...group, entries };
    })
    .filter((group) => group.entries.length > 0);
}
