import type { WorkspaceState } from '@/types/domain';

export function hasMeaningfulLegacyWorkspace(state: WorkspaceState | null) {
  if (!state) return false;

  return (
    state.characters.length > 1 ||
    state.characters.some(
      (character) =>
        character.name !== 'Yuji Itadori' ||
        character.weapons.length > 0 ||
        character.techniques.length > 0 ||
        character.conditions.length > 0 ||
        character.inventory.items.length > 0
    ) ||
    state.order.entries.length > 0 ||
    state.log.length > 0
  );
}
