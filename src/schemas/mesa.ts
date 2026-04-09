import { z } from 'zod';

export const tableMetaSchema = z.object({
  tableName: z.string().min(2, 'Informe o nome da mesa.'),
  seriesName: z.string().min(1, 'Informe a obra ou serie.'),
  campaignName: z.string().default(''),
  episodeNumber: z.string().default(''),
  episodeTitle: z.string().default(''),
  sessionDate: z.string().default(''),
  location: z.string().default(''),
  status: z.string().min(1, 'Informe o status.'),
  expectedRoster: z.string().default(''),
  recap: z.string().default(''),
  objective: z.string().default('')
});

export const createTableSchema = z.object({
  nickname: z.string().min(2, 'Informe o nome de presenca.'),
  meta: tableMetaSchema
});

export const joinInviteSchema = z.object({
  inviteUrl: z.url('Cole uma URL de convite valida.'),
  nickname: z.string().min(2, 'Informe o apelido da sessao.')
});

export const joinCodeSchema = z.object({
  code: z.string().min(6, 'Informe o codigo de 6 digitos.'),
  nickname: z.string().min(2, 'Informe o apelido da sessao.')
});

export const inviteLinkSchema = z.object({
  role: z.enum(['gm', 'player', 'viewer']),
  characterId: z.string().default(''),
  label: z.string().min(2, 'Descreva o convite.')
});

export const joinCodeCreateSchema = z.object({
  role: z.enum(['gm', 'player', 'viewer']),
  characterId: z.string().default(''),
  label: z.string().min(2, 'Descreva o codigo.')
});

export const snapshotSchema = z.object({
  label: z.string().min(2, 'Informe o nome do snapshot.')
});
