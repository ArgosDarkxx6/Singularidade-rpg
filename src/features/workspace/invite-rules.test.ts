import { describe, expect, it } from 'vitest';
import { normalizeWorkspaceError } from './invite-rules';

describe('workspace invite error rules', () => {
  it('maps invite and code states to clear messages', () => {
    expect(normalizeWorkspaceError(new Error('invite not found'), 'fallback')).toBe('Convite invalido ou expirado.');
    expect(normalizeWorkspaceError(new Error('join code not found'), 'fallback')).toBe('Codigo invalido ou revogado.');
    expect(normalizeWorkspaceError(new Error('character required'), 'fallback')).toBe('Escolha um personagem para entrar como player.');
    expect(normalizeWorkspaceError(new Error('character already claimed'), 'fallback')).toBe('Este personagem ja esta vinculado a outra conta.');
  });

  it('flags missing migrations instead of hiding them as invalid links', () => {
    expect(normalizeWorkspaceError({ code: 'PGRST202', message: 'Could not find the function public.claim_join_code_v2' }, 'fallback')).toBe(
      'Banco de dados desatualizado. Aplique as migrations do Project Nexus.'
    );
    expect(normalizeWorkspaceError(new Error('column tables.system_key does not exist'), 'fallback')).toBe(
      'Banco de dados desatualizado. Aplique as migrations do Project Nexus.'
    );
  });
});
