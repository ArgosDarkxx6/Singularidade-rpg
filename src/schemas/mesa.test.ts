import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME_SYSTEM_KEY } from '@lib/domain/constants';
import { createTableSchema, gameSystemKeySchema } from './mesa';

describe('mesa schemas', () => {
  it('defaults old create-table payloads to Singularidade', () => {
    const parsed = createTableSchema.parse({
      nickname: 'Nexus GM',
      meta: {
        tableName: 'Mesa antiga',
        description: '',
        slotCount: 0,
        seriesName: 'Jujutsu Kaisen',
        campaignName: ''
      }
    });

    expect(parsed.systemKey).toBe(DEFAULT_GAME_SYSTEM_KEY);
  });

  it('rejects unsupported systems until the registry enables them', () => {
    expect(() => gameSystemKeySchema.parse('fantasy-core')).toThrow();
    expect(gameSystemKeySchema.parse('singularidade')).toBe('singularidade');
  });
});
