import { describe, expect, it } from 'vitest';
import { buildRollOutcome, parseDiceNotation, rollDice } from '@lib/domain/rules';
import { makeCharacter } from '@lib/domain/state';

describe('domain rules', () => {
  it('parses and rolls dice notation deterministically', () => {
    const parsed = parseDiceNotation('2d6');
    expect(parsed).toEqual({ count: 2, sides: 6 });
    expect(rollDice(parsed!, () => 0.5)).toEqual([4, 4]);
  });

  it('builds a guided roll outcome with critical markers', () => {
    const character = makeCharacter({
      name: 'Mysto',
      attributes: {
        strength: { value: 3, rank: 'A' },
        resistance: { value: 2, rank: 'B' },
        dexterity: { value: 2, rank: 'B' },
        speed: { value: 4, rank: 'S' },
        fight: { value: 2, rank: 'C' },
        precision: { value: 3, rank: 'B' },
        intelligence: { value: 2, rank: 'C' },
        charisma: { value: 1, rank: 'C' }
      }
    });

    const result = buildRollOutcome(character, 'strength', 'physical-attack', 2, () => 0.999, 20);

    expect(result.total).toBe(25);
    expect(result.isCritical).toBe(true);
    expect(result.isBlackFlash).toBe(true);
    expect(result.outcomeLabel).toBe('Sucesso');
  });
});
