export type BookBlockType =
  | 'paragraph'
  | 'list'
  | 'rule'
  | 'example'
  | 'callout'
  | 'reference'
  | 'table';

export interface BookParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface BookListBlock {
  type: 'list';
  title: string;
  items: readonly string[];
}

export interface BookRuleBlock {
  type: 'rule';
  title: string;
  body: string;
  label?: string;
}

export interface BookExampleBlock {
  type: 'example';
  title: string;
  body: string;
  label?: string;
}

export interface BookCalloutBlock {
  type: 'callout';
  tone: string;
  title: string;
  body: string;
  label?: string;
}

export interface BookReferenceBlock {
  type: 'reference';
  title: string;
  items: readonly string[];
  label?: string;
}

export interface BookTableBlock {
  type: 'table';
  title: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  note?: string;
}

export type BookBlock =
  | BookParagraphBlock
  | BookListBlock
  | BookRuleBlock
  | BookExampleBlock
  | BookCalloutBlock
  | BookReferenceBlock
  | BookTableBlock;

export interface BookSection {
  id: string;
  title: string;
  summary: string;
  blocks: readonly BookBlock[];
}

export interface BookChapter {
  id: string;
  category: string;
  label: string;
  title: string;
  summary: string;
  sections: readonly BookSection[];
}

export interface CanonPresetBase {
  id: string;
  name: string;
  origin: string;
  tags: readonly string[];
  description: string;
}

export interface TechniquePreset extends CanonPresetBase {
  type: string;
  cost: number;
  damage: string;
}

export interface WeaponPreset extends CanonPresetBase {
  grade: string;
  damage: string;
}

export type PassivePreset = CanonPresetBase;

export interface InventoryPreset extends CanonPresetBase {
  quantity: number;
  effect: string;
}

export type CanonPreset =
  | TechniquePreset
  | WeaponPreset
  | PassivePreset
  | InventoryPreset;

export type CanonPresetCollectionKey =
  | 'techniques'
  | 'weapons'
  | 'passives'
  | 'inventory';

export interface GlossaryGroup {
  key: string;
  label: string;
  art: string;
}

export interface GlossaryEntry {
  id: string;
  group: string;
  name: string;
  kind: string;
  origin: string;
  tags: readonly string[];
  summary: string;
  tableUse: string;
  templateRule: string;
  visualCue: string;
  templateCost: string;
}
