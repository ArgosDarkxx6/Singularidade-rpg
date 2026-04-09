import { z } from 'zod';

export const combatantSchema = z.object({
  type: z.enum(['pc', 'npc']),
  characterId: z.string().optional(),
  name: z.string().optional(),
  modifier: z.coerce.number().int().default(0),
  notes: z.string().default('')
});
