import {
  ATTRIBUTE_CONFIG,
  ATTRIBUTE_LABELS
} from './constants.js';
import { safeNumber } from './utils.js';

export function getFlags(character) {
  const energy = character.resources.energy.current;
  const sanity = character.resources.sanity.current;
  return {
    exhaustion: energy <= 0,
    san30: sanity < 30,
    san15: sanity < 15
  };
}

export function getAttributeModifier(character, attributeKey) {
  const attribute = character.attributes[attributeKey];
  const flags = getFlags(character);
  let modifier = safeNumber(attribute?.value, 0);
  if (flags.exhaustion) modifier -= 2;
  const config = ATTRIBUTE_CONFIG.find((item) => item.key === attributeKey);
  if (config?.isMental && flags.san30) modifier -= 1;
  return modifier;
}

export function getDisasterProgress(disaster) {
  if (!disaster?.threshold) return 0;
  return Math.min(
    (Math.max(0, safeNumber(disaster.criticalFailures, 0)) / Math.max(1, safeNumber(disaster.threshold, 5))) * 100,
    100
  );
}

export function getPendingDisasters(disaster) {
  return Math.floor(
    Math.max(0, safeNumber(disaster?.criticalFailures, 0)) / Math.max(1, safeNumber(disaster?.threshold, 5))
  );
}

export function parseDiceNotation(expression) {
  const raw = String(expression || '').trim();
  if (!raw) return null;

  const sanitized = raw.replace(/\s+/g, '');
  const match = sanitized.match(/^(-?\d+)?d(\d+)([+-]\d+)?$/i) || sanitized.match(/^(\d+)([+-]\d+)?$/);
  if (!match) return null;

  if (sanitized.includes('d')) {
    const count = safeNumber(match[1] || 1, 1);
    const sides = safeNumber(match[2], 0);
    const bonus = safeNumber(match[3] || 0, 0);
    if (count < 1 || sides < 2 || count > 100 || sides > 1000) return null;
    return { type: 'dice', count, sides, bonus, raw: sanitized };
  }

  return { type: 'flat', count: 0, sides: 0, bonus: safeNumber(match[1] || 0, 0), raw: sanitized };
}

export function rollDice(parsed, rng = Math.random) {
  if (!parsed) throw new Error('Expressão inválida.');

  if (parsed.type === 'flat') {
    return {
      rolls: [],
      subtotal: 0,
      bonus: parsed.bonus,
      total: parsed.bonus
    };
  }

  const rolls = [];
  let subtotal = 0;

  for (let index = 0; index < parsed.count; index += 1) {
    const result = Math.floor(rng() * parsed.sides) + 1;
    rolls.push(result);
    subtotal += result;
  }

  return {
    rolls,
    subtotal,
    bonus: parsed.bonus,
    total: subtotal + parsed.bonus
  };
}

export function evaluateDifficulty(total, tn = null) {
  if (tn === null || tn === undefined || String(tn).trim() === '') {
    return {
      tn: null,
      tnResult: null,
      margin: null,
      outcomeLabel: ''
    };
  }

  const normalizedTn = Math.max(0, safeNumber(tn, 0));
  const isSuccess = total > normalizedTn;

  return {
    tn: normalizedTn,
    tnResult: isSuccess ? 'success' : 'failure',
    margin: total - normalizedTn,
    outcomeLabel: isSuccess ? 'Sucesso' : 'Falha'
  };
}

export function buildRollOutcome(character, attributeKey, context, extraBonus = 0, rng = Math.random, tn = null) {
  const natural = Math.floor(rng() * 20) + 1;
  const baseModifier = safeNumber(character.attributes[attributeKey]?.value, 0);
  const effectiveModifier = getAttributeModifier(character, attributeKey);
  const flags = getFlags(character);
  const modifiers = [];

  if (effectiveModifier !== baseModifier) {
    modifiers.push(`base ${baseModifier >= 0 ? '+' : ''}${baseModifier}`);
    if (flags.exhaustion) modifiers.push('Exaustão -2');
    const config = ATTRIBUTE_CONFIG.find((item) => item.key === attributeKey);
    if (config?.isMental && flags.san30) modifiers.push('SAN<30 -1 mental');
  }

  const appliedBonus = safeNumber(extraBonus, 0);
  const total = natural + effectiveModifier + appliedBonus;
  const difficulty = evaluateDifficulty(total, tn);
  const isCritical = natural === 20;
  const isFumble = natural >= 1 && natural <= 3;
  const isBlackFlash = context === 'physical-attack' && attributeKey === 'fight' && natural === 20;

  if (appliedBonus) {
    modifiers.push(`Bônus extra ${appliedBonus >= 0 ? '+' : ''}${appliedBonus}`);
  }

  return {
    characterId: character.id,
    characterName: character.name,
    attributeKey,
    attributeLabel: ATTRIBUTE_LABELS[attributeKey],
    context,
    natural,
    effectiveModifier,
    total,
    tn: difficulty.tn,
    tnResult: difficulty.tnResult,
    margin: difficulty.margin,
    outcomeLabel: difficulty.outcomeLabel,
    isCritical,
    isFumble,
    isBlackFlash,
    extraBonus: appliedBonus,
    notes: modifiers,
    domainRoll: context === 'domain-clash'
  };
}

export function buildRollMeta(result) {
  const tags = [];
  if (result.tn !== null) {
    const marginLabel = result.margin === null ? '' : ` (${result.margin >= 0 ? '+' : ''}${result.margin})`;
    tags.push(`TN ${result.tn}: ${result.outcomeLabel}${marginLabel}`);
  }
  if (result.isCritical) tags.push('Crítico');
  if (result.isFumble) tags.push('Falha crítica');
  if (result.isBlackFlash) tags.push('Black Flash');
  if (result.notes.length) tags.push(result.notes.join(' • '));
  return tags.join(' | ');
}

export function buildPcInitiative(character, rng = Math.random) {
  const modifier = Math.max(
    safeNumber(character.attributes.speed?.value, 0),
    safeNumber(character.attributes.fight?.value, 0)
  );
  const natural = Math.floor(rng() * 20) + 1;
  return { natural, modifier, total: natural + modifier };
}

export function buildNpcInitiative(modifier, rng = Math.random) {
  const natural = Math.floor(rng() * 20) + 1;
  return { natural, modifier, total: natural + modifier };
}

export function sortOrderEntries(entries) {
  return entries.slice().sort((a, b) => {
    const aInit = a.init === null || a.init === undefined ? -Infinity : a.init;
    const bInit = b.init === null || b.init === undefined ? -Infinity : b.init;
    return bInit - aInit;
  });
}

export function contextLabel(context) {
  return {
    standard: 'Teste padrão',
    'physical-attack': 'Ataque físico',
    'ranged-attack': 'Ataque à distância',
    'domain-clash': 'Conflito de domínio'
  }[context] || 'Teste';
}

export function inferTechniqueType(name, description, damage) {
  const haystack = `${name} ${description}`.toLowerCase();
  if (haystack.includes('toque')) return 'Toque';
  if (/(bonus|aumenta|reverte|cura|buff|velocidade|defesa|suporte)/.test(haystack)) return 'Suporte';
  if (damage && /(dispara|dano|relampago|golpe|ataque|raio|explos)/.test(haystack)) return 'Ofensiva';
  if (!damage && /(troca|controle|prende|marca|teleporte|reposiciona)/.test(haystack)) return 'Controle';
  if (/(controle|marca|lento|lentidao|atordo|prende|empurra)/.test(haystack) && !damage) return 'Controle';
  return 'Ofensiva';
}

export function inferTags(text) {
  const haystack = String(text || '').toLowerCase();
  const mapping = [
    ['marca', 'marca'],
    ['acerto garantido', 'acerto garantido'],
    ['choque', 'choque'],
    ['teleporte', 'teleporte'],
    ['velocidade', 'velocidade'],
    ['sensor', 'sensor'],
    ['debuff', 'debuff'],
    ['buff', 'buff']
  ];
  return mapping.filter(([needle]) => haystack.includes(needle)).map(([, tag]) => tag);
}
