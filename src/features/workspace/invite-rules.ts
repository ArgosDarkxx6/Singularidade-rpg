const INVITE_MISSING = 'Convite invalido ou expirado.';
const CODE_MISSING = 'Codigo invalido ou revogado.';
const MIGRATION_MISSING = 'Banco de dados desatualizado. Aplique as migrations do Project Nexus.';

function asText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message || '');
  return String(error || '');
}

function asCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code || '') : '';
}

export function normalizeWorkspaceError(error: unknown, fallback: string): string {
  const message = asText(error);
  const normalized = message.toLowerCase();
  const code = asCode(error);

  if (code === 'PGRST202' || normalized.includes('could not find the function') || normalized.includes('function public.')) {
    return MIGRATION_MISSING;
  }

  if (normalized.includes('system_key') && normalized.includes('does not exist')) {
    return MIGRATION_MISSING;
  }

  if (normalized.includes('invite not found')) return INVITE_MISSING;
  if (normalized.includes('join code not found')) return CODE_MISSING;
  if (normalized.includes('character required')) return 'Escolha um personagem para entrar como player.';
  if (normalized.includes('character already claimed')) return 'Este personagem ja esta vinculado a outra conta.';
  if (normalized.includes('character not found')) return 'Personagem indisponivel para este convite.';
  if (code === '42501' || normalized.includes('permission denied') || normalized.includes('row-level security')) {
    return 'Voce nao tem permissao para esta acao.';
  }

  return message || fallback;
}

export function toWorkspaceError(error: unknown, fallback: string): Error {
  return new Error(normalizeWorkspaceError(error, fallback));
}
