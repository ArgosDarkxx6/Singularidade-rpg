import { z } from 'zod';

export const mesaMetaSchema = z.object({
  tableName: z.string().min(2, 'Informe o nome da mesa.'),
  description: z.string().default(''),
  slotCount: z.number().int().nonnegative().default(0),
  seriesName: z.string().min(1, 'Informe a obra ou série.'),
  campaignName: z.string().default('')
});

export const tableMetaSchema = mesaMetaSchema;

export const gameSessionFormSchema = z.object({
  episodeNumber: z.string().default(''),
  episodeTitle: z.string().default(''),
  sessionDate: z.string().default(''),
  location: z.string().default(''),
  status: z.string().min(1, 'Informe o status.'),
  recap: z.string().default(''),
  objective: z.string().default(''),
  notes: z.string().default(''),
  isActive: z.boolean().default(false)
});

export const gameSessionSchema = gameSessionFormSchema.extend({
  id: z.string().default(''),
  tableId: z.string().default(''),
  createdBy: z.string().default(''),
  createdAt: z.string().default(''),
  updatedAt: z.string().default('')
});

export const sessionAttendanceSchema = z.object({
  id: z.string().default(''),
  sessionId: z.string().min(1, 'Informe a sessão.'),
  membershipId: z.string().min(1, 'Informe o vínculo da mesa.'),
  status: z.enum(['pending', 'present', 'absent']).default('pending'),
  markedAt: z.string().default('')
});

export const createTableSchema = z.object({
  nickname: z.string().min(2, 'Informe o nome de presença.'),
  meta: mesaMetaSchema
});

export const joinInviteSchema = z.object({
  inviteUrl: z.url('Cole uma URL de convite válida.'),
  nickname: z.string().min(2, 'Informe o apelido da sessão.')
});

export const joinCodeSchema = z.object({
  code: z.string().min(6, 'Informe o código de 6 dígitos.'),
  nickname: z.string().min(2, 'Informe o apelido da sessão.')
});

export const inviteLinkSchema = z.object({
  role: z.enum(['gm', 'player', 'viewer']),
  characterId: z.string().default(''),
  label: z.string().min(2, 'Descreva o convite.')
});

export const joinCodeCreateSchema = z.object({
  role: z.enum(['gm', 'player', 'viewer']),
  characterId: z.string().default(''),
  label: z.string().min(2, 'Descreva o código.')
});

export const snapshotSchema = z.object({
  label: z.string().min(2, 'Informe o nome do snapshot.')
});
