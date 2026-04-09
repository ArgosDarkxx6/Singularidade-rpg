import { ATTRIBUTE_LABELS } from '@lib/domain/constants';
import { clamp, safeNumber } from '@lib/domain/utils';
import type { Character, OrderEntry, RollContext, RollResult, WorkspaceState } from '@/types/domain';

export function getFlags(character: Character): { exhaustion: boolean; san30: boolean; san15: boolean } {
  return {
    exhaustion: character.resources.energy.current <= 0,
    san30: character.resources.sanity.current < 30,
    san15: character.resources.sanity.current < 15
  };
}

export function getAttributeModifier(character: Character, attributeKey: keyof Character['attributes']): number {
  return safeNumber(character.attributes[attributeKey].value, 0);
}

export function getDisasterProgress(disaster: WorkspaceState['disaster']): number {
  return clamp((disaster.criticalFailures / Math.max(1, disaster.threshold)) * 100, 0, 100);
}

export function getPendingDisasters(disaster: WorkspaceState['disaster']): number {
  return Math.floor(disaster.criticalFailures / Math.max(1, disaster.threshold));
}

export function parseDiceNotation(expression: string): { count: number; sides: number } | null {
  const match = String(expression || '')
    .trim()
    .match(/^(\d+)d(\d+)$/i);
  if (!match) return null;
  const count = safeNumber(match[1], 0);
  const sides = safeNumber(match[2], 0);
  if (count <= 0 || sides <= 0) return null;
  return { count, sides };
}

export function rollDice(parsed: { count: number; sides: number }, rng: () => number = Math.random): number[] {
  return Array.from({ length: parsed.count }, () => Math.max(1, Math.floor(rng() * parsed.sides) + 1));
}

export function evaluateDifficulty(total: number, tn: number | null): Pick<RollResult, 'tnResult' | 'margin' | 'outcomeLabel'> {
  if (tn === null || tn === undefined) {
    return {
      tnResult: undefined,
      margin: null,
      outcomeLabel: 'Sem TN'
    };
  }

  const margin = total - tn;
  return {
    tnResult: margin >= 0 ? 'success' : 'failure',
    margin,
    outcomeLabel: margin >= 0 ? 'Sucesso' : 'Falha'
  };
}

export function buildRollOutcome(
  character: Character,
  attributeKey: keyof Character['attributes'],
  context: RollContext,
  extraBonus = 0,
  rng: () => number = Math.random,
  tn: number | null = null
): RollResult {
  const natural = Math.floor(rng() * 20) + 1;
  const effectiveModifier = getAttributeModifier(character, attributeKey);
  const total = natural + effectiveModifier + safeNumber(extraBonus, 0);
  const notes: string[] = [];
  const flags = getFlags(character);

  if (flags.exhaustion) notes.push('Exaustao ativa');
  if (flags.san30) notes.push('SAN abaixo de 30');
  if (natural === 20) notes.push('Critico');
  if (natural <= 3) notes.push('Falha critica');
  if (natural === 20 && context === 'physical-attack') notes.push('Black Flash');

  const tnOutcome = evaluateDifficulty(total, tn);

  return {
    label: `${ATTRIBUTE_LABELS[attributeKey]} de ${character.name}`,
    total,
    tn,
    margin: tnOutcome.margin,
    tnResult: tnOutcome.tnResult,
    outcomeLabel: tnOutcome.outcomeLabel,
    natural,
    characterId: character.id,
    characterName: character.name,
    attributeKey,
    attributeLabel: ATTRIBUTE_LABELS[attributeKey],
    effectiveModifier,
    extraBonus,
    context,
    isCritical: natural === 20,
    isFumble: natural <= 3,
    isBlackFlash: natural === 20 && context === 'physical-attack',
    notes,
    rolls: [natural]
  };
}

export function buildRollMeta(result: RollResult): string {
  const marginLabel = result.margin === null ? '' : `Margem ${result.margin >= 0 ? '+' : ''}${result.margin}`;
  return [result.outcomeLabel, marginLabel].filter(Boolean).join(' - ');
}

export function buildPcInitiative(character: Character, rng: () => number = Math.random): number {
  return Math.floor(rng() * 20) + 1 + getAttributeModifier(character, 'speed');
}

export function buildNpcInitiative(modifier: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * 20) + 1 + safeNumber(modifier, 0);
}

export function sortOrderEntries(entries: OrderEntry[]): OrderEntry[] {
  return [...entries].sort((left, right) => {
    if (left.init === null && right.init === null) return left.name.localeCompare(right.name, 'pt-BR');
    if (left.init === null) return 1;
    if (right.init === null) return -1;
    if (right.init !== left.init) return right.init - left.init;
    return left.name.localeCompare(right.name, 'pt-BR');
  });
}

export function contextLabel(context: RollContext): string {
  if (context === 'physical-attack') return 'Ataque fisico';
  if (context === 'ranged-attack') return 'Ataque a distancia';
  if (context === 'domain-clash') return 'Conflito de dominio';
  return 'Teste padrao';
}

