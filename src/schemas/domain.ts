import { z } from 'zod';

export const resourceSchema = z.object({
  current: z.number().int(),
  max: z.number().int().nonnegative()
});

export const identitySchema = z.object({
  scar: z.string(),
  anchor: z.string(),
  trigger: z.string()
});

export const characterAttributeSchema = z.object({
  value: z.number().int(),
  rank: z.enum(['C', 'B', 'A', 'S', 'SS', 'SSS'])
});

export const collectionItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1)
});

export const weaponSchema = collectionItemSchema.extend({
  grade: z.string(),
  damage: z.string(),
  tags: z.array(z.string()),
  description: z.string()
});

export const techniqueSchema = collectionItemSchema.extend({
  cost: z.number().int().nonnegative(),
  damage: z.string(),
  type: z.enum(['Ofensiva', 'Suporte', 'Controle', 'Toque']),
  tags: z.array(z.string()),
  description: z.string()
});

export const passiveSchema = collectionItemSchema.extend({
  tags: z.array(z.string()),
  description: z.string()
});

export const vowSchema = collectionItemSchema.extend({
  benefit: z.string(),
  restriction: z.string(),
  penalty: z.string()
});

export const inventoryItemSchema = collectionItemSchema.extend({
  quantity: z.number().int().positive(),
  effect: z.string()
});

export const conditionSchema = collectionItemSchema.extend({
  color: z.enum(['purple', 'red', 'blue', 'green', 'gray']),
  note: z.string()
});

export const characterGalleryImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  path: z.string(),
  caption: z.string(),
  sortOrder: z.number().int().nonnegative()
});

export const characterSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  age: z.number().int().nonnegative(),
  appearance: z.string(),
  lore: z.string(),
  clan: z.string(),
  grade: z.string(),
  avatarMode: z.enum(['none', 'url', 'upload']),
  avatar: z.string(),
  avatarPath: z.string().optional(),
  gallery: z.array(characterGalleryImageSchema),
  identity: identitySchema,
  resources: z.object({
    hp: resourceSchema,
    energy: resourceSchema,
    sanity: resourceSchema
  }),
  attributes: z.object({
    strength: characterAttributeSchema,
    resistance: characterAttributeSchema,
    dexterity: characterAttributeSchema,
    speed: characterAttributeSchema,
    fight: characterAttributeSchema,
    precision: characterAttributeSchema,
    intelligence: characterAttributeSchema,
    charisma: characterAttributeSchema
  }),
  weapons: z.array(weaponSchema),
  techniques: z.array(techniqueSchema),
  passives: z.array(passiveSchema),
  vows: z.array(vowSchema),
  inventory: z.object({
    money: z.number().int().nonnegative(),
    items: z.array(inventoryItemSchema)
  }),
  conditions: z.array(conditionSchema)
});

export const workspaceStateSchema = z.object({
  version: z.number().int(),
  characters: z.array(characterSchema),
  order: z.object({
    round: z.number().int().positive(),
    turn: z.number().int().nonnegative(),
    entries: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['pc', 'npc']),
        characterId: z.string().nullable(),
        init: z.number().int().nullable(),
        modifier: z.number().int(),
        notes: z.string()
      })
    )
  }),
  disaster: z.object({
    criticalFailures: z.number().int().nonnegative(),
    threshold: z.number().int().positive(),
    disastersTriggered: z.number().int().nonnegative(),
    history: z.array(
      z.object({
        id: z.string(),
        timestamp: z.string(),
        title: z.string(),
        text: z.string()
      })
    )
  }),
  log: z.array(
    z.object({
      id: z.string(),
      timestamp: z.string(),
      category: z.string(),
      title: z.string(),
      text: z.string(),
      meta: z.string(),
      event: z
        .object({
          kind: z.string(),
          actorMembershipId: z.string().optional(),
          actorUserId: z.string().optional(),
          characterId: z.string().optional(),
          characterName: z.string().optional(),
          resourceKey: z.enum(['hp', 'energy', 'sanity']).optional(),
          payload: z.record(z.string(), z.unknown()).optional()
        })
        .nullable()
        .optional()
    })
  ),
  activeCharacterId: z.string()
});
