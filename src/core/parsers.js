import { ATTRIBUTE_CONFIG } from './constants.js';
import { makeCharacter } from './model.js';
import { inferTags, inferTechniqueType } from './rules.js';
import {
  extractLineValue,
  parseLooseNumber,
  parseTags,
  safeNumber,
  splitTextSheets
} from './utils.js';

const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });
const BULLET_PREFIX = /^[*\u2022?-]\s*/;
const BULLET_MARKERS = /[\u2022\u00B7\u25C6\u2666]/g;
const BOX_DRAWING = /[\u2500-\u257F]+/g;

function tryDecodeMojibake(value) {
  const input = String(value || '');
  if (!input) return input;

  try {
    const bytes = Uint8Array.from(Array.from(input), (character) => character.codePointAt(0) & 0xff);
    return UTF8_DECODER.decode(bytes);
  } catch (error) {
    return input;
  }
}

function normalizeImportedText(value) {
  let output = String(value || '');

  for (let pass = 0; pass < 2; pass += 1) {
    const decoded = tryDecodeMojibake(output);
    if (decoded === output) break;
    output = decoded;
  }

  return output
    .replace(/\u00A0/g, ' ')
    .replace(/\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\uFFFD/g, '');
}

export function getTextSection(text, key) {
  const sections = [
    { key: 'identity', regex: /Sobre\s+o\s+Personagem/i },
    { key: 'attributes', regex: /Atributos/i },
    { key: 'weapons', regex: /Armas/i },
    { key: 'inventory', regex: /Itens\s*&\s*Recursos/i },
    { key: 'techniques', regex: /T.*cnica\s+amaldi.*oada/i },
    { key: 'passives', regex: /Passivas/i },
    { key: 'vows', regex: /Votos\s+vinculativos/i }
  ];

  const matches = [];
  sections.forEach((section) => {
    const match = section.regex.exec(text);
    if (match) matches.push({ key: section.key, index: match.index });
  });
  matches.sort((a, b) => a.index - b.index);

  const currentIndex = matches.findIndex((entry) => entry.key === key);
  if (currentIndex === -1) return '';

  const start = matches[currentIndex].index;
  const end = currentIndex < matches.length - 1 ? matches[currentIndex + 1].index : text.length;
  return text.slice(start, end).trim();
}

export function cleanSectionLines(sectionText) {
  return String(sectionText || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(BOX_DRAWING, ' ').replace(BULLET_MARKERS, ' ').trim())
    .filter((line) => line && !/^[.\s]+$/.test(line));
}

export function parseInventoryItemsFromText(value) {
  const raw = String(value || '')
    .replace(/\s+e\s+/gi, ', ')
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return raw.map((entry) => {
    const match = entry.match(/^(\d+)\s+(.+)$/);
    if (match) {
      return {
        name: match[2].trim(),
        quantity: safeNumber(match[1], 1),
        effect: ''
      };
    }

    return {
      name: entry,
      quantity: 1,
      effect: ''
    };
  });
}

export function parseWeaponsFromText(sectionText) {
  const lines = cleanSectionLines(sectionText);
  const results = [];
  let current = null;

  lines.forEach((line) => {
    if (/^Armas/i.test(line)) return;

    if (BULLET_PREFIX.test(line) || (!/^Grau|^Dano|^Tags/i.test(line) && !current)) {
      if (current?.name) results.push(current);
      current = {
        name: line.replace(BULLET_PREFIX, '').trim(),
        grade: '',
        damage: '',
        tags: [],
        description: ''
      };
      return;
    }

    if (!current) return;

    if (/^Grau\s*:/i.test(line)) {
      const grade = line.split(':').slice(1).join(':').trim();
      current.grade = /^Grau/i.test(grade) ? grade : `Grau ${grade}`;
      return;
    }

    if (/^Dano\s*:/i.test(line)) {
      current.damage = line.split(':').slice(1).join(':').trim();
      return;
    }

    if (/^Tags\s*:/i.test(line)) {
      current.tags = parseTags(line.split(':').slice(1).join(':'));
      return;
    }

    current.description = `${current.description} ${line}`.trim();
  });

  if (current?.name) results.push(current);
  return results;
}

export function parseTechniquesFromText(sectionText) {
  const lines = cleanSectionLines(sectionText);
  const results = [];
  let current = null;

  lines.forEach((line) => {
    if (/^T.*cnica/i.test(line)) return;

    if (BULLET_PREFIX.test(line) || (/^[A-Z0-9].+:/i.test(line) && !/^Dano|^Custo|^Tags|^Tipo/i.test(line))) {
      if (current?.name) {
        current.type = current.type || inferTechniqueType(current.name, current.description, current.damage);
        current.tags = current.tags.length ? current.tags : inferTags(`${current.name} ${current.description}`);
        results.push(current);
      }

      const clean = line.replace(BULLET_PREFIX, '').trim();
      const pairMatch = clean.match(/^(.+?)\s*:\s*(.+)$/);
      current = pairMatch
        ? {
            name: pairMatch[1].trim(),
            cost: 0,
            damage: '',
            type: '',
            tags: [],
            description: pairMatch[2].trim()
          }
        : {
            name: clean,
            cost: 0,
            damage: '',
            type: '',
            tags: [],
            description: ''
          };
      return;
    }

    if (!current) return;

    if (/^Dano\s*:/i.test(line)) {
      current.damage = line.split(':').slice(1).join(':').trim();
      return;
    }

    if (/^Custo\s*:/i.test(line)) {
      current.cost = parseLooseNumber(line.split(':').slice(1).join(':'), 0);
      return;
    }

    if (/^Tipo\s*:/i.test(line)) {
      current.type = line.split(':').slice(1).join(':').trim();
      return;
    }

    if (/^Tags\s*:/i.test(line)) {
      current.tags = parseTags(line.split(':').slice(1).join(':'));
      return;
    }

    current.description = `${current.description} ${line}`.trim();
  });

  if (current?.name) {
    current.type = current.type || inferTechniqueType(current.name, current.description, current.damage);
    current.tags = current.tags.length ? current.tags : inferTags(`${current.name} ${current.description}`);
    results.push(current);
  }

  return results;
}

export function parsePassivesFromText(sectionText) {
  const lines = cleanSectionLines(sectionText);
  return lines
    .filter((line) => !/^Passivas/i.test(line))
    .map((line) => {
      const pairMatch = line.match(/^(.+?)\s*:\s*(.+)$/);
      const name = pairMatch ? pairMatch[1].trim() : line.trim();
      const description = pairMatch ? pairMatch[2].trim() : '';
      return {
        name,
        tags: inferTags(`${name} ${description}`),
        description
      };
    })
    .filter((item) => item.name);
}

export function parseVowsFromText(sectionText) {
  const lines = cleanSectionLines(sectionText);
  const results = [];
  let current = null;

  lines.forEach((line) => {
    if (/^Votos/i.test(line)) return;

    if (BULLET_PREFIX.test(line) || (!/^Benef\u00EDcio|^Restri\u00E7\u00E3o|^Penalidade/i.test(line) && !current)) {
      if (current?.name) results.push(current);
      current = {
        name: line.replace(BULLET_PREFIX, '').trim(),
        benefit: '',
        restriction: '',
        penalty: ''
      };
      return;
    }

    if (!current) return;

    if (/^Benef\u00EDcio\s*:/i.test(line)) current.benefit = line.split(':').slice(1).join(':').trim();
    else if (/^Restri\u00E7\u00E3o\s*:/i.test(line)) current.restriction = line.split(':').slice(1).join(':').trim();
    else if (/^Penalidade\s*:/i.test(line)) current.penalty = line.split(':').slice(1).join(':').trim();
    else current.benefit = `${current.benefit} ${line}`.trim();
  });

  if (current?.name) results.push(current);
  return results;
}

export function parseCharacterSheetText(rawText) {
  const text = normalizeImportedText(String(rawText || '').replace(/\r/g, '').trim());
  if (!/^\s*Nome\s*:/im.test(text)) return null;

  const identitySection = getTextSection(text, 'identity');
  const weaponsSection = getTextSection(text, 'weapons');
  const inventorySection = getTextSection(text, 'inventory');
  const techniquesSection = getTextSection(text, 'techniques');
  const passivesSection = getTextSection(text, 'passives');
  const vowsSection = getTextSection(text, 'vows');
  const attributesSection = getTextSection(text, 'attributes');

  const inventoryLine = extractLineValue(inventorySection || text, 'Invent[^:]*');
  const character = makeCharacter({
    name: extractLineValue(text, 'Nome') || 'Novo personagem',
    age: parseLooseNumber(extractLineValue(text, 'Idade'), 0),
    appearance: extractLineValue(identitySection || text, 'Apar(?:encia|\u00EAncia)'),
    clan: extractLineValue(identitySection || text, 'Cl(?:a|\u00E3)'),
    grade: String(
      parseLooseNumber(extractLineValue(identitySection || text, 'Grau'), extractLineValue(identitySection || text, 'Grau') || '')
    ).replace(/^0$/, ''),
    resources: {
      hp: (() => {
        const match = text.match(/^\s*Vida\s*:\s*(\d+)\s*\/\s*(\d+)\s*$/im);
        return { current: safeNumber(match?.[1], 20), max: safeNumber(match?.[2], 20) };
      })(),
      energy: (() => {
        const match = text.match(/^\s*Energia[^:]*:\s*(\d+)\s*\/\s*(\d+)\s*$/im);
        return { current: safeNumber(match?.[1], 10), max: safeNumber(match?.[2], 10) };
      })(),
      sanity: (() => {
        const match = text.match(/^\s*Sanidade\s*:\s*(\d+)\s*\/\s*(\d+)\s*$/im);
        return { current: safeNumber(match?.[1], 50), max: safeNumber(match?.[2], 50) };
      })()
    },
    attributes: ATTRIBUTE_CONFIG.reduce((acc, attribute) => {
      const value = parseLooseNumber(extractLineValue(attributesSection || text, attribute.label), 0);
      acc[attribute.key] = { value };
      return acc;
    }, {}),
    weapons: parseWeaponsFromText(weaponsSection),
    techniques: parseTechniquesFromText(techniquesSection),
    passives: parsePassivesFromText(passivesSection),
    vows: parseVowsFromText(vowsSection),
    inventory: {
      money: parseLooseNumber(extractLineValue(inventorySection || text, 'Dinheiro'), 0),
      items: parseInventoryItemsFromText(inventoryLine)
    }
  });

  if (!character.grade) {
    character.grade = extractLineValue(identitySection || text, 'Grau') || '';
  }

  return character;
}

export function parseCharacterSheetsText(rawText) {
  return splitTextSheets(rawText)
    .map(parseCharacterSheetText)
    .filter(Boolean);
}

export function serializeCharacterToText(character) {
  const lines = [
    `Nome: ${character.name}`,
    `Idade: ${character.age || 0}`,
    '',
    `Vida: ${character.resources.hp.current} / ${character.resources.hp.max}`,
    `Energia amaldi\u00E7oada: ${character.resources.energy.current} / ${character.resources.energy.max}`,
    `Sanidade: ${character.resources.sanity.current} / ${character.resources.sanity.max}`,
    '',
    '\u2501\u2501\u2501\u2501 Sobre o Personagem',
    `Apar\u00EAncia: ${character.appearance || '\u2014'}`,
    `Cl\u00E3: ${character.clan || '\u2014'}`,
    `Grau: ${character.grade || '\u2014'}`,
    `Cicatriz: ${character.identity.scar || '\u2014'}`,
    `\u00C2ncora: ${character.identity.anchor || '\u2014'}`,
    `Gatilho: ${character.identity.trigger || '\u2014'}`,
    '',
    '\u2501\u2501\u2501\u2501 Atributos'
  ];

  ATTRIBUTE_CONFIG.forEach((attribute) => {
    lines.push(`${attribute.label}: ${character.attributes[attribute.key].value}`);
  });

  lines.push('', '\u2501\u2501\u2501\u2501 Armas');
  if (character.weapons.length) {
    character.weapons.forEach((weapon) => {
      lines.push(`\u2022 ${weapon.name}`);
      if (weapon.grade) lines.push(`Grau: ${weapon.grade}`);
      if (weapon.damage) lines.push(`Dano: ${weapon.damage}`);
      if (weapon.tags.length) lines.push(`Tags: ${weapon.tags.join(', ')}`);
      if (weapon.description) lines.push(weapon.description);
      lines.push('');
    });
  } else {
    lines.push('\u2022 Nenhuma arma cadastrada', '');
  }

  lines.push('\u2501\u2501\u2501\u2501 Itens & Recursos');
  lines.push(`Invent\u00E1rio: ${character.inventory.items.map((item) => `${item.quantity} ${item.name}`).join(', ') || 'Vazio'}`);
  lines.push(`Dinheiro: \u00A5${character.inventory.money}`);
  lines.push('', '\u2501\u2501\u2501\u2501 T\u00E9cnica amaldi\u00E7oada');

  if (character.techniques.length) {
    character.techniques.forEach((technique) => {
      lines.push(`\u2022 ${technique.name}: ${technique.description || 'Sem descri\u00E7\u00E3o.'}`);
      if (technique.damage) lines.push(`Dano: ${technique.damage}`);
      lines.push(`Custo: ${technique.cost}`);
      lines.push(`Tipo: ${technique.type}`);
      if (technique.tags.length) lines.push(`Tags: ${technique.tags.join(', ')}`);
      lines.push('');
    });
  } else {
    lines.push('\u2022 Nenhuma t\u00E9cnica cadastrada', '');
  }

  lines.push('\u2501\u2501\u2501\u2501 Passivas');
  if (character.passives.length) {
    character.passives.forEach((passive) => {
      lines.push(`${passive.name}: ${passive.description || 'Sem descri\u00E7\u00E3o.'}`);
    });
  } else {
    lines.push('Nenhuma passiva cadastrada.');
  }

  lines.push('', '\u2501\u2501\u2501\u2501 Votos vinculativos');
  if (character.vows.length) {
    character.vows.forEach((vow) => {
      lines.push(`\u2022 ${vow.name}`);
      lines.push(`Benef\u00EDcio: ${vow.benefit || '\u2014'}`);
      lines.push(`Restri\u00E7\u00E3o: ${vow.restriction || '\u2014'}`);
      lines.push(`Penalidade: ${vow.penalty || '\u2014'}`);
      lines.push('');
    });
  } else {
    lines.push('Nenhum voto cadastrado.');
  }

  return lines.join('\n').trim();
}
