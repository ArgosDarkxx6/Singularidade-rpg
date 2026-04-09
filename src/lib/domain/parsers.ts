import { makeCharacter } from '@lib/domain/state';
import { safeNumber } from '@lib/domain/utils';
import type { Character } from '@/types/domain';

function getTextSection(text: string, key: string): string {
  const pattern = new RegExp(`${key}:?([\\s\\S]*?)(?:\\n[A-Z].+?:|$)`, 'i');
  return text.match(pattern)?.[1]?.trim() || '';
}

function extractLineValue(text: string, label: string): string {
  const match = text.match(new RegExp(`${label}:\\s*(.+)`, 'i'));
  return match?.[1]?.trim() || '';
}

function parseInventoryItemsFromText(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      return {
        name: match ? match[2].trim() : line,
        quantity: match ? safeNumber(match[1], 1) : 1,
        effect: ''
      };
    });
}

function parseSimpleList(sectionText: string): string[] {
  return sectionText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith('-') || line.startsWith('•'))
    .map((line) => line.replace(/^[-•]\s*/, '').trim());
}

export function parseCharacterSheetText(rawText: string): Character {
  const text = String(rawText || '').trim();
  const name = extractLineValue(text, 'Nome') || 'Novo personagem';
  const age = safeNumber(extractLineValue(text, 'Idade'), 0);
  const clan = extractLineValue(text, 'Cla');
  const grade = extractLineValue(text, 'Grau');
  const appearance = extractLineValue(text, 'Aparencia');
  const scar = extractLineValue(text, 'Cicatriz');
  const anchor = extractLineValue(text, 'Ancora');
  const trigger = extractLineValue(text, 'Gatilho');

  const character = makeCharacter({
    name,
    age,
    clan,
    grade,
    appearance,
    identity: { scar, anchor, trigger },
    resources: {
      hp: { current: safeNumber(extractLineValue(text, 'Vida').split('/')[0], 20), max: safeNumber(extractLineValue(text, 'Vida').split('/')[1], 20) },
      energy: {
        current: safeNumber(extractLineValue(text, 'Energia amaldicoada').split('/')[0], 10),
        max: safeNumber(extractLineValue(text, 'Energia amaldicoada').split('/')[1], 10)
      },
      sanity: {
        current: safeNumber(extractLineValue(text, 'Sanidade').split('/')[0], 50),
        max: safeNumber(extractLineValue(text, 'Sanidade').split('/')[1], 50)
      }
    }
  });

  const attributesSection = getTextSection(text, 'Atributos');
  character.attributes.strength.value = safeNumber(extractLineValue(attributesSection, 'Forca'), character.attributes.strength.value);
  character.attributes.resistance.value = safeNumber(extractLineValue(attributesSection, 'Resistencia'), character.attributes.resistance.value);
  character.attributes.dexterity.value = safeNumber(extractLineValue(attributesSection, 'Destreza'), character.attributes.dexterity.value);
  character.attributes.speed.value = safeNumber(extractLineValue(attributesSection, 'Velocidade'), character.attributes.speed.value);
  character.attributes.fight.value = safeNumber(extractLineValue(attributesSection, 'Lutar'), character.attributes.fight.value);
  character.attributes.precision.value = safeNumber(extractLineValue(attributesSection, 'Precisao'), character.attributes.precision.value);
  character.attributes.intelligence.value = safeNumber(extractLineValue(attributesSection, 'Inteligencia'), character.attributes.intelligence.value);
  character.attributes.charisma.value = safeNumber(extractLineValue(attributesSection, 'Carisma'), character.attributes.charisma.value);

  character.weapons = parseSimpleList(getTextSection(text, 'Armas')).map((nameValue) => ({
    id: crypto.randomUUID(),
    name: nameValue,
    grade: '',
    damage: '',
    tags: [],
    description: ''
  }));

  character.techniques = parseSimpleList(getTextSection(text, 'Tecnica amaldicoada')).map((nameValue) => ({
    id: crypto.randomUUID(),
    name: nameValue,
    cost: 0,
    damage: '',
    type: 'Ofensiva',
    tags: [],
    description: ''
  }));

  character.passives = parseSimpleList(getTextSection(text, 'Passivas')).map((nameValue) => ({
    id: crypto.randomUUID(),
    name: nameValue,
    tags: [],
    description: ''
  }));

  character.vows = parseSimpleList(getTextSection(text, 'Votos vinculativos')).map((nameValue) => ({
    id: crypto.randomUUID(),
    name: nameValue,
    benefit: '',
    restriction: '',
    penalty: ''
  }));

  character.inventory.money = safeNumber(String(extractLineValue(text, 'Dinheiro')).replace(/[^\d-]/g, ''), character.inventory.money);
  character.inventory.items = parseInventoryItemsFromText(getTextSection(text, 'Inventario')).map((item) => ({
    id: crypto.randomUUID(),
    ...item
  }));

  return character;
}

export function parseCharacterSheetsText(rawText: string): Character[] {
  return String(rawText || '')
    .split(/\n{2,}(?=Nome:)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map(parseCharacterSheetText);
}

export function serializeCharacterToText(character: Character): string {
  return [
    `Nome: ${character.name}`,
    `Idade: ${character.age}`,
    `Vida: ${character.resources.hp.current} / ${character.resources.hp.max}`,
    `Energia amaldicoada: ${character.resources.energy.current} / ${character.resources.energy.max}`,
    `Sanidade: ${character.resources.sanity.current} / ${character.resources.sanity.max}`,
    '',
    'Sobre o Personagem',
    `Aparencia: ${character.appearance}`,
    `Cla: ${character.clan}`,
    `Grau: ${character.grade}`,
    `Cicatriz: ${character.identity.scar}`,
    `Ancora: ${character.identity.anchor}`,
    `Gatilho: ${character.identity.trigger}`,
    '',
    'Atributos',
    `Forca: ${character.attributes.strength.value}`,
    `Resistencia: ${character.attributes.resistance.value}`,
    `Destreza: ${character.attributes.dexterity.value}`,
    `Velocidade: ${character.attributes.speed.value}`,
    `Lutar: ${character.attributes.fight.value}`,
    `Precisao: ${character.attributes.precision.value}`,
    `Inteligencia: ${character.attributes.intelligence.value}`,
    `Carisma: ${character.attributes.charisma.value}`,
    '',
    'Armas',
    ...character.weapons.map((weapon) => `- ${weapon.name}`),
    '',
    'Itens & Recursos',
    'Inventario:',
    ...character.inventory.items.map((item) => `${item.quantity} ${item.name}`),
    `Dinheiro: ${character.inventory.money}`,
    '',
    'Tecnica amaldicoada',
    ...character.techniques.map((technique) => `- ${technique.name}`),
    '',
    'Passivas',
    ...character.passives.map((passive) => `- ${passive.name}`),
    '',
    'Votos vinculativos',
    ...(character.vows.length ? character.vows.map((vow) => `- ${vow.name}`) : ['Nenhum voto cadastrado.'])
  ].join('\n');
}

