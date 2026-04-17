import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GAME_SYSTEM_KEY,
  GAME_SYSTEMS,
  getDefaultTableMetaForSystem,
  getGameSystem,
  isGameSystemKey,
  resolveGameSystemKey
} from './registry';

describe('game system registry', () => {
  it('exposes Singularidade as the first enabled system', () => {
    expect(GAME_SYSTEMS.singularidade.status).toBe('enabled');
    expect(GAME_SYSTEMS.singularidade.modules).toContain('fichas');
    expect(GAME_SYSTEMS.singularidade.modules).toContain('livro');
  });

  it('falls back to Singularidade for old tables without a system key', () => {
    expect(resolveGameSystemKey(undefined)).toBe(DEFAULT_GAME_SYSTEM_KEY);
    expect(resolveGameSystemKey('unknown-system')).toBe(DEFAULT_GAME_SYSTEM_KEY);
    expect(getGameSystem(null).key).toBe('singularidade');
  });

  it('returns system-specific creation defaults', () => {
    const defaults = getDefaultTableMetaForSystem('singularidade');

    expect(defaults.tableName).toContain('Singularidade');
    expect(defaults.seriesName).toBe('Jujutsu Kaisen');
    expect(isGameSystemKey('singularidade')).toBe(true);
  });
});
