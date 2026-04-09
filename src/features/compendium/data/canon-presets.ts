import {
  findCanonPreset as legacyFindCanonPreset,
  getCanonPresets as legacyGetCanonPresets,
  searchCanonPresets as legacySearchCanonPresets
} from './source/canon-presets.js';
import type {
  CanonPreset,
  CanonPresetCollectionKey
} from './types';
import type {
  InventoryPreset,
  PassivePreset,
  TechniquePreset,
  WeaponPreset
} from './types';

type CanonPresetMap = {
  techniques: TechniquePreset;
  weapons: WeaponPreset;
  passives: PassivePreset;
  inventory: InventoryPreset;
};

const normalizePreset = <T extends CanonPreset>(preset: T): T => ({
  ...preset,
  tags: [...preset.tags]
});
type CanonPresetCollections = { [K in CanonPresetCollectionKey]: CanonPresetMap[K][] };

export const CANON_PRESETS: CanonPresetCollections = {
  techniques: (legacyGetCanonPresets('techniques') as TechniquePreset[]).map(normalizePreset),
  weapons: (legacyGetCanonPresets('weapons') as WeaponPreset[]).map(normalizePreset),
  passives: (legacyGetCanonPresets('passives') as PassivePreset[]).map(normalizePreset),
  inventory: (legacyGetCanonPresets('inventory') as InventoryPreset[]).map(normalizePreset)
};

export function getCanonPresets<K extends CanonPresetCollectionKey>(collectionKey: K): CanonPresetMap[K][] {
  return (legacyGetCanonPresets(collectionKey) as CanonPresetMap[K][]).map((preset) => normalizePreset(preset));
}

export function findCanonPreset<K extends CanonPresetCollectionKey>(collectionKey: K, presetId: string): CanonPresetMap[K] | null {
  const preset = legacyFindCanonPreset(collectionKey, presetId) as CanonPresetMap[K] | null;
  return preset ? normalizePreset(preset) : null;
}

export function searchCanonPresets<K extends CanonPresetCollectionKey>(collectionKey: K, query: string): CanonPresetMap[K][] {
  return (legacySearchCanonPresets(collectionKey, query) as CanonPresetMap[K][]).map((preset) => normalizePreset(preset));
}
