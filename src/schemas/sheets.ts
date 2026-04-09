import { z } from 'zod';

export const characterProfileSchema = z.object({
  name: z.string().min(2, 'Informe um nome.'),
  age: z.coerce.number().int().min(0, 'Use uma idade valida.'),
  clan: z.string().min(1, 'Informe o cla.'),
  grade: z.string().min(1, 'Informe o grau.'),
  appearance: z.string().min(4, 'Descreva a aparencia.'),
  scar: z.string().min(2, 'Informe a cicatriz.'),
  anchor: z.string().min(2, 'Informe a ancora.'),
  trigger: z.string().min(2, 'Informe o gatilho.'),
  hpCurrent: z.coerce.number().int().min(0),
  hpMax: z.coerce.number().int().min(1),
  energyCurrent: z.coerce.number().int().min(0),
  energyMax: z.coerce.number().int().min(0),
  sanityCurrent: z.coerce.number().int().min(0),
  sanityMax: z.coerce.number().int().min(1),
  strength: z.coerce.number().int().min(0),
  resistance: z.coerce.number().int().min(0),
  dexterity: z.coerce.number().int().min(0),
  speed: z.coerce.number().int().min(0),
  fight: z.coerce.number().int().min(0),
  precision: z.coerce.number().int().min(0),
  intelligence: z.coerce.number().int().min(0),
  charisma: z.coerce.number().int().min(0),
  strengthRank: z.enum(['C', 'B', 'A', 'S', 'SS', 'SSS']),
  resistanceRank: z.enum(['C', 'B', 'A', 'S', 'SS', 'SSS']),
  dexterityRank: z.enum(['C', 'B', 'A', 'S', 'SS', 'SSS']),
  speedRank: z.enum(['C', 'B', 'A', 'S', 'SS', 'SSS']),
  fightRank: z.enum(['C', 'B', 'A', 'S', 'SS', 'SSS']),
  precisionRank: z.enum(['C', 'B', 'A', 'S', 'SS', 'SSS']),
  intelligenceRank: z.enum(['C', 'B', 'A', 'S', 'SS', 'SSS']),
  charismaRank: z.enum(['C', 'B', 'A', 'S', 'SS', 'SSS'])
});

export const conditionFormSchema = z.object({
  name: z.string().min(2, 'Informe o nome da condicao.'),
  color: z.enum(['purple', 'red', 'blue', 'green', 'gray']),
  note: z.string().min(2, 'Adicione uma nota curta.')
});

export const weaponFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Informe o nome da arma.'),
  grade: z.string().min(1, 'Informe o grau.'),
  damage: z.string().min(1, 'Informe o dano.'),
  tags: z.string().default(''),
  description: z.string().min(4, 'Descreva a arma.')
});

export const techniqueFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Informe o nome da tecnica.'),
  cost: z.coerce.number().int().min(0),
  damage: z.string(),
  type: z.enum(['Ofensiva', 'Suporte', 'Controle', 'Toque']),
  tags: z.string().default(''),
  description: z.string().min(4, 'Descreva a tecnica.')
});

export const passiveFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Informe o nome da passiva.'),
  tags: z.string().default(''),
  description: z.string().min(4, 'Descreva a passiva.')
});

export const vowFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Informe o nome do voto.'),
  benefit: z.string().min(2, 'Descreva o beneficio.'),
  restriction: z.string().min(2, 'Descreva a restricao.'),
  penalty: z.string().min(2, 'Descreva a penalidade.')
});

export const inventoryItemFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Informe o item.'),
  quantity: z.coerce.number().int().min(1),
  effect: z.string().min(2, 'Descreva o efeito.')
});

export const characterCreateSchema = z.object({
  name: z.string().min(2, 'Informe o nome do personagem.'),
  clan: z.string().min(1, 'Informe o cla.'),
  grade: z.string().min(1, 'Informe o grau.'),
  age: z.coerce.number().int().min(0)
});

export const avatarUrlSchema = z.object({
  avatarUrl: z.url('Informe uma URL valida para o avatar.')
});
