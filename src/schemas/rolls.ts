import { z } from 'zod';

export const guidedRollSchema = z.object({
  characterId: z.string().min(1, 'Selecione um personagem.'),
  attributeKey: z.enum(['strength', 'resistance', 'dexterity', 'speed', 'fight', 'precision', 'intelligence', 'charisma']),
  context: z.enum(['standard', 'physical-attack', 'ranged-attack', 'domain-clash']),
  extraBonus: z.coerce.number().int().default(0),
  tn: z.union([z.literal(''), z.coerce.number().int().min(1)]).default('')
});

export const customRollSchema = z.object({
  expression: z.string().regex(/^\d+d\d+$/i, 'Use formato como 2d6.'),
  bonus: z.coerce.number().int().default(0),
  label: z.string().min(2, 'Dê um nome curto para a rolagem.'),
  tn: z.union([z.literal(''), z.coerce.number().int().min(1)]).default('')
});
