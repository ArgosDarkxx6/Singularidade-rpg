import {
  ATTRIBUTE_CONFIG,
  CONDITION_COLORS,
  CURRENT_VERSION,
  RANKS
} from './constants.js';
import { parseTags, safeNumber, uid, clamp } from './utils.js';

export function getDefaultRanks(attributes) {
  const ranked = Object.entries(attributes)
    .map(([key, value]) => ({ key, value: safeNumber(value, 0) }))
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return ATTRIBUTE_CONFIG.findIndex((item) => item.key === a.key)
        - ATTRIBUTE_CONFIG.findIndex((item) => item.key === b.key);
    });

  const distribution = ['S', 'A', 'A', 'B', 'B', 'C', 'C', 'C'];
  const output = {};
  ranked.forEach((entry, index) => {
    output[entry.key] = distribution[index] || 'C';
  });
  return output;
}

export function normalizeAttributeBlock(raw) {
  const values = {};
  ATTRIBUTE_CONFIG.forEach((attribute) => {
    values[attribute.key] = safeNumber(raw?.[attribute.key]?.value ?? raw?.[attribute.key] ?? 0, 0);
  });

  const rankDefaults = getDefaultRanks(values);
  const normalized = {};

  ATTRIBUTE_CONFIG.forEach((attribute) => {
    const incoming = raw?.[attribute.key] || {};
    normalized[attribute.key] = {
      value: safeNumber(incoming.value ?? incoming ?? 0, 0),
      rank: RANKS.includes(incoming.rank) ? incoming.rank : rankDefaults[attribute.key] || 'C'
    };
  });

  return normalized;
}

export function makeCharacter(data = {}) {
  return {
    id: data.id || uid('char'),
    name: data.name || 'Novo personagem',
    age: safeNumber(data.age, 0),
    appearance: data.appearance || '',
    clan: data.clan || '',
    grade: data.grade || '',
    avatarMode: data.avatarMode || 'none',
    avatar: data.avatar || '',
    identity: {
      scar: data.identity?.scar || '',
      anchor: data.identity?.anchor || '',
      trigger: data.identity?.trigger || ''
    },
    resources: {
      hp: {
        current: safeNumber(data.resources?.hp?.current, 20),
        max: Math.max(1, safeNumber(data.resources?.hp?.max, 20))
      },
      energy: {
        current: safeNumber(data.resources?.energy?.current, 10),
        max: Math.max(0, safeNumber(data.resources?.energy?.max, 10))
      },
      sanity: {
        current: safeNumber(data.resources?.sanity?.current, 50),
        max: Math.max(1, safeNumber(data.resources?.sanity?.max, 50))
      }
    },
    attributes: normalizeAttributeBlock(data.attributes),
    weapons: (data.weapons || []).map((weapon) => ({
      id: weapon.id || uid('weapon'),
      name: weapon.name || '',
      grade: weapon.grade || '',
      damage: weapon.damage || '',
      tags: parseTags(weapon.tags),
      description: weapon.description || ''
    })),
    techniques: (data.techniques || []).map((technique) => ({
      id: technique.id || uid('technique'),
      name: technique.name || '',
      cost: safeNumber(technique.cost, 0),
      damage: technique.damage || '',
      type: technique.type || 'Ofensiva',
      tags: parseTags(technique.tags),
      description: technique.description || ''
    })),
    passives: (data.passives || []).map((passive) => ({
      id: passive.id || uid('passive'),
      name: passive.name || '',
      tags: parseTags(passive.tags),
      description: passive.description || ''
    })),
    vows: (data.vows || []).map((vow) => ({
      id: vow.id || uid('vow'),
      name: vow.name || '',
      benefit: vow.benefit || '',
      restriction: vow.restriction || '',
      penalty: vow.penalty || ''
    })),
    inventory: {
      money: safeNumber(data.inventory?.money, 0),
      items: (data.inventory?.items || []).map((item) => ({
        id: item.id || uid('inventory'),
        name: item.name || '',
        quantity: Math.max(1, safeNumber(item.quantity, 1)),
        effect: item.effect || ''
      }))
    },
    conditions: (data.conditions || []).map((condition) => ({
      id: condition.id || uid('condition'),
      name: condition.name || '',
      color: CONDITION_COLORS[condition.color] ? condition.color : 'purple',
      note: condition.note || ''
    }))
  };
}

export function normalizeDisasterEvent(entry) {
  return {
    id: entry?.id || uid('disaster'),
    timestamp: entry?.timestamp || new Date().toISOString(),
    title: entry?.title || 'Evento',
    text: entry?.text || ''
  };
}

export function normalizeLogEntry(entry) {
  return {
    id: entry?.id || uid('log'),
    timestamp: entry?.timestamp || new Date().toISOString(),
    category: entry?.category || 'Sistema',
    title: entry?.title || '',
    text: entry?.text || '',
    meta: entry?.meta || ''
  };
}

export function createLogEntry({ category, title, text, meta = '' }) {
  return normalizeLogEntry({
    id: uid('log'),
    timestamp: new Date().toISOString(),
    category,
    title,
    text,
    meta
  });
}

export function createDisasterEvent(title, text) {
  return normalizeDisasterEvent({
    id: uid('disaster'),
    timestamp: new Date().toISOString(),
    title,
    text
  });
}

export function normalizeOrder(order, characters) {
  const characterIds = new Set(characters.map((character) => character.id));
  const entries = Array.isArray(order?.entries)
    ? order.entries.map((entry) => ({
      id: entry.id || uid('order'),
      name: entry.name || 'Combatente',
      type: entry.type === 'npc' ? 'npc' : 'pc',
      characterId: entry.type === 'pc' && characterIds.has(entry.characterId) ? entry.characterId : null,
      init: entry.init === null || entry.init === undefined ? null : safeNumber(entry.init, 0),
      modifier: safeNumber(entry.modifier, 0),
      notes: entry.notes || ''
    }))
    : [];

  return {
    round: Math.max(1, safeNumber(order?.round, 1)),
    turn: clamp(safeNumber(order?.turn, 0), 0, Math.max(entries.length - 1, 0)),
    entries
  };
}

export function normalizeDisaster(disaster) {
  return {
    criticalFailures: Math.max(0, safeNumber(disaster?.criticalFailures, 0)),
    threshold: Math.max(1, safeNumber(disaster?.threshold, 5)),
    disastersTriggered: Math.max(0, safeNumber(disaster?.disastersTriggered, 0)),
    history: Array.isArray(disaster?.history)
      ? disaster.history.map(normalizeDisasterEvent)
      : []
  };
}

export function uniquifyCharacterName(name, characters) {
  const baseName = String(name || 'Novo personagem').trim() || 'Novo personagem';
  const existing = new Set((characters || []).map((character) => String(character.name || '').trim().toLowerCase()));
  if (!existing.has(baseName.toLowerCase())) return baseName;

  let index = 2;
  while (existing.has(`${baseName} ${index}`.toLowerCase())) index += 1;
  return `${baseName} ${index}`;
}

export function createDefaultState() {
  const mysto = makeCharacter({
    id: 'mysto',
    name: 'Mysto',
    age: 14,
    appearance: 'Pele branca e fria. Cabelo preto com mechas azuis, olhos azul-escuro e postura eletrica.',
    clan: 'Kashimo',
    grade: '3',
    identity: {
      scar: 'Dorme com a tensao do combate no corpo.',
      anchor: 'Quer provar que ainda pode proteger seus aliados.',
      trigger: 'Raiva fria'
    },
    resources: {
      hp: { current: 50, max: 50 },
      energy: { current: 12, max: 12 },
      sanity: { current: 50, max: 50 }
    },
    attributes: {
      strength: { value: 3 },
      resistance: { value: 3 },
      dexterity: { value: 2 },
      speed: { value: 4 },
      fight: { value: 2 },
      precision: { value: 3 },
      intelligence: { value: 2 },
      charisma: { value: 1 }
    },
    weapons: [
      {
        name: 'Luvas de garras triplas felinas',
        grade: 'Grau 3',
        damage: '2d6',
        tags: ['garras', 'corpo a corpo'],
        description: 'Conjunto veloz pensado para rasgos curtos, mobilidade e pressao continua.'
      }
    ],
    techniques: [
      {
        name: 'Descarga de relampago',
        cost: 2,
        damage: '2d10',
        type: 'Ofensiva',
        tags: ['marca', 'acerto garantido'],
        description: 'Dispara um relampago carregado. Ganha acerto garantido contra alvos marcados com energia negativa.'
      },
      {
        name: 'Toque estatico',
        cost: 1,
        damage: '1d6',
        type: 'Toque',
        tags: ['marca', 'debuff'],
        description: 'Marca o alvo com eletricidade residual e reduz a agilidade dele no proximo turno.'
      },
      {
        name: 'Revertimento',
        cost: 2,
        damage: '5',
        type: 'Suporte',
        tags: ['buff', 'velocidade'],
        description: 'Reverte o corpo em eletricidade controlada, aumentando a velocidade e pagando o preco em dor.'
      }
    ],
    passives: [
      {
        name: 'Energia eletrificada',
        tags: ['choque'],
        description: 'Toda aplicacao de energia amaldicoada deste usuario assume uma assinatura eletrica.'
      },
      {
        name: 'Velocidade energetica',
        tags: ['ataques extras'],
        description: 'Os movimentos aceleram naturalmente quando a energia sobe, criando janelas para ataques adicionais.'
      }
    ],
    vows: [],
    inventory: {
      money: 500,
      items: [
        { name: 'Lata de energetico', quantity: 4, effect: 'Recuperacao narrativa em cena, a criterio da mesa.' }
      ]
    }
  });

  const kayo = makeCharacter({
    id: 'kayo',
    name: 'Kayo',
    age: 19,
    appearance: 'Cabelos pretos, olhos verdes, corpo marcado por cicatrizes e presenca agressiva em combate.',
    clan: 'Todou',
    grade: '3',
    identity: {
      scar: 'Carrega no corpo a memoria de missoes que deram errado.',
      anchor: 'Ainda acredita no peso das promessas entre companheiros.',
      trigger: 'Impulso competitivo'
    },
    resources: {
      hp: { current: 55, max: 55 },
      energy: { current: 10, max: 10 },
      sanity: { current: 50, max: 50 }
    },
    attributes: {
      strength: { value: 4 },
      resistance: { value: 3 },
      dexterity: { value: 3 },
      speed: { value: 3 },
      fight: { value: 3 },
      precision: { value: 1 },
      intelligence: { value: 2 },
      charisma: { value: 1 }
    },
    weapons: [
      {
        name: 'Duas espadas ligadas a uma corrente',
        grade: 'Grau 1',
        damage: '2d8',
        tags: ['corrente', 'espadas'],
        description: 'Arma flexivel para pressao, dominio de espaco e trocas brutais de alcance.'
      }
    ],
    techniques: [
      {
        name: 'Troca de lugar',
        cost: 1,
        damage: '',
        type: 'Controle',
        tags: ['teleporte', 'posicionamento'],
        description: 'Ao bater palmas, troca de lugar duas pessoas, objetos ou o proprio usuario, desde que os alvos tenham energia amaldicoada.'
      }
    ],
    passives: [
      {
        name: 'Sensor de energia amaldicoada',
        tags: ['sensor'],
        description: 'Percebe energia amaldicoada em pessoas e objetos com leitura quase instintiva.'
      }
    ],
    vows: [],
    inventory: {
      money: 500,
      items: [
        { name: 'Kit de primeiros socorros', quantity: 1, effect: 'Tratamento rapido em cena, conforme o mestre.' },
        { name: 'Metal Knuckle Duster', quantity: 1, effect: 'Fortalecedor de punhos de ferro com espinhos.' },
        { name: 'Bombinhas', quantity: 1, effect: 'Ruido, luz curta e fumaca leve para distracao.' },
        { name: 'Lata de energetico', quantity: 2, effect: 'Recuperacao narrativa em cena, a criterio da mesa.' }
      ]
    }
  });

  return {
    version: CURRENT_VERSION,
    characters: [mysto, kayo],
    order: {
      round: 1,
      turn: 0,
      entries: []
    },
    disaster: {
      criticalFailures: 0,
      threshold: 5,
      disastersTriggered: 0,
      history: []
    },
    log: [
      createLogEntry({
        category: 'Sistema',
        title: 'Mesa carregada',
        text: 'Estado inicial criado com Mysto e Kayo.'
      })
    ]
  };
}

export function normalizeState(raw) {
  const fallback = createDefaultState();
  const base = raw && typeof raw === 'object' ? raw : fallback;
  const characters = Array.isArray(base.characters) && base.characters.length
    ? base.characters.map(makeCharacter)
    : fallback.characters.map(makeCharacter);

  return {
    version: CURRENT_VERSION,
    characters,
    order: normalizeOrder(base.order, characters),
    disaster: normalizeDisaster(base.disaster),
    log: Array.isArray(base.log) && base.log.length
      ? base.log.map(normalizeLogEntry)
      : fallback.log
  };
}
