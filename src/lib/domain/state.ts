import { ATTRIBUTE_CONFIG, CONDITION_COLORS, CURRENT_VERSION } from '@lib/domain/constants';
import { clamp, parseTags, safeNumber, uid } from '@lib/domain/utils';
import type {
  AttributeKey,
  Character,
  CharacterAttribute,
  Condition,
  DisasterEvent,
  DisasterState,
  InventoryItem,
  LogEntry,
  OrderState,
  Passive,
  Technique,
  Vow,
  Weapon,
  WorkspaceState
} from '@/types/domain';

export function getDefaultRanks(attributes: Record<AttributeKey, number>): Record<AttributeKey, CharacterAttribute['rank']> {
  const ranked = Object.entries(attributes)
    .map(([key, value]) => ({ key: key as AttributeKey, value: safeNumber(value, 0) }))
    .sort((left, right) => {
      if (right.value !== left.value) return right.value - left.value;
      return ATTRIBUTE_CONFIG.findIndex((item) => item.key === left.key) - ATTRIBUTE_CONFIG.findIndex((item) => item.key === right.key);
    });

  const distribution: CharacterAttribute['rank'][] = ['S', 'A', 'A', 'B', 'B', 'C', 'C', 'C'];
  return Object.fromEntries(ranked.map((item, index) => [item.key, distribution[index] ?? 'C'])) as Record<
    AttributeKey,
    CharacterAttribute['rank']
  >;
}

export function normalizeAttributeBlock(raw: Partial<Record<AttributeKey, CharacterAttribute | number>> = {}): Character['attributes'] {
  const values = Object.fromEntries(
    ATTRIBUTE_CONFIG.map((attribute) => [attribute.key, safeNumber((raw[attribute.key] as CharacterAttribute | undefined)?.value ?? raw[attribute.key], 0)])
  ) as Record<AttributeKey, number>;
  const defaults = getDefaultRanks(values);

  return Object.fromEntries(
    ATTRIBUTE_CONFIG.map((attribute) => {
      const incoming = raw[attribute.key] as CharacterAttribute | number | undefined;
      const normalized: CharacterAttribute = {
        value: safeNumber(typeof incoming === 'object' ? incoming.value : incoming, 0),
        rank: typeof incoming === 'object' && incoming.rank ? incoming.rank : defaults[attribute.key]
      };
      return [attribute.key, normalized];
    })
  ) as Character['attributes'];
}

function normalizeWeapon(item: Partial<Weapon>): Weapon {
  return {
    id: item.id || uid('weapon'),
    name: item.name || '',
    grade: item.grade || '',
    damage: item.damage || '',
    tags: parseTags(item.tags),
    description: item.description || ''
  };
}

function normalizeTechnique(item: Partial<Technique>): Technique {
  return {
    id: item.id || uid('technique'),
    name: item.name || '',
    cost: safeNumber(item.cost, 0),
    damage: item.damage || '',
    type: item.type || 'Ofensiva',
    tags: parseTags(item.tags),
    description: item.description || ''
  };
}

function normalizePassive(item: Partial<Passive>): Passive {
  return {
    id: item.id || uid('passive'),
    name: item.name || '',
    tags: parseTags(item.tags),
    description: item.description || ''
  };
}

function normalizeVow(item: Partial<Vow>): Vow {
  return {
    id: item.id || uid('vow'),
    name: item.name || '',
    benefit: item.benefit || '',
    restriction: item.restriction || '',
    penalty: item.penalty || ''
  };
}

function normalizeInventoryItem(item: Partial<InventoryItem>): InventoryItem {
  return {
    id: item.id || uid('inventory'),
    name: item.name || '',
    quantity: Math.max(1, safeNumber(item.quantity, 1)),
    effect: item.effect || ''
  };
}

function normalizeCondition(item: Partial<Condition>): Condition {
  return {
    id: item.id || uid('condition'),
    name: item.name || '',
    color: item.color && CONDITION_COLORS[item.color] ? item.color : 'purple',
    note: item.note || ''
  };
}

export function makeCharacter(data: Partial<Character> = {}): Character {
  return {
    id: data.id || uid('char'),
    name: data.name || 'Novo personagem',
    age: safeNumber(data.age, 0),
    appearance: data.appearance || '',
    clan: data.clan || '',
    grade: data.grade || '',
    avatarMode: data.avatarMode || 'none',
    avatar: data.avatar || '',
    avatarPath: data.avatarPath || '',
    identity: {
      scar: data.identity?.scar || '',
      anchor: data.identity?.anchor || '',
      trigger: data.identity?.trigger || ''
    },
    resources: {
      hp: {
        current: safeNumber(data.resources?.hp.current, 20),
        max: Math.max(1, safeNumber(data.resources?.hp.max, 20))
      },
      energy: {
        current: safeNumber(data.resources?.energy.current, 10),
        max: Math.max(0, safeNumber(data.resources?.energy.max, 10))
      },
      sanity: {
        current: safeNumber(data.resources?.sanity.current, 50),
        max: Math.max(1, safeNumber(data.resources?.sanity.max, 50))
      }
    },
    attributes: normalizeAttributeBlock(data.attributes),
    weapons: (data.weapons || []).map(normalizeWeapon),
    techniques: (data.techniques || []).map(normalizeTechnique),
    passives: (data.passives || []).map(normalizePassive),
    vows: (data.vows || []).map(normalizeVow),
    inventory: {
      money: safeNumber(data.inventory?.money, 0),
      items: (data.inventory?.items || []).map(normalizeInventoryItem)
    },
    conditions: (data.conditions || []).map(normalizeCondition)
  };
}

export function normalizeLogEntry(entry: Partial<LogEntry>): LogEntry {
  return {
    id: entry.id || uid('log'),
    timestamp: entry.timestamp || new Date().toISOString(),
    category: entry.category || 'Sistema',
    title: entry.title || '',
    text: entry.text || '',
    meta: entry.meta || ''
  };
}

export function createLogEntry(input: Pick<LogEntry, 'category' | 'title' | 'text'> & Partial<Pick<LogEntry, 'meta'>>): LogEntry {
  return normalizeLogEntry({
    ...input,
    timestamp: new Date().toISOString()
  });
}

export function normalizeDisasterEvent(entry: Partial<DisasterEvent>): DisasterEvent {
  return {
    id: entry.id || uid('disaster'),
    timestamp: entry.timestamp || new Date().toISOString(),
    title: entry.title || 'Evento',
    text: entry.text || ''
  };
}

export function normalizeDisaster(disaster: Partial<DisasterState> = {}): DisasterState {
  return {
    criticalFailures: Math.max(0, safeNumber(disaster.criticalFailures, 0)),
    threshold: Math.max(1, safeNumber(disaster.threshold, 5)),
    disastersTriggered: Math.max(0, safeNumber(disaster.disastersTriggered, 0)),
    history: (disaster.history || []).map(normalizeDisasterEvent)
  };
}

export function normalizeOrder(order: Partial<OrderState> = {}, characters: Character[] = []): OrderState {
  const characterIds = new Set(characters.map((character) => character.id));
  const entries = (order.entries || []).map((entry) => ({
    id: entry.id || uid('order'),
    name: entry.name || 'Combatente',
    type: (entry.type === 'npc' ? 'npc' : 'pc') as 'pc' | 'npc',
    characterId: entry.type === 'pc' && entry.characterId && characterIds.has(entry.characterId) ? entry.characterId : null,
    init: entry.init === null || entry.init === undefined ? null : safeNumber(entry.init, 0),
    modifier: safeNumber(entry.modifier, 0),
    notes: entry.notes || ''
  }));

  return {
    round: Math.max(1, safeNumber(order.round, 1)),
    turn: clamp(safeNumber(order.turn, 0), 0, Math.max(entries.length - 1, 0)),
    entries
  };
}

export function uniquifyCharacterName(name: string, characters: Character[]): string {
  const baseName = String(name || 'Novo personagem').trim() || 'Novo personagem';
  const existing = new Set(characters.map((character) => character.name.trim().toLowerCase()));
  if (!existing.has(baseName.toLowerCase())) return baseName;

  let index = 2;
  while (existing.has(`${baseName} ${index}`.toLowerCase())) index += 1;
  return `${baseName} ${index}`;
}

export function createDefaultState(): WorkspaceState {
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
      strength: { value: 3, rank: 'A' },
      resistance: { value: 3, rank: 'A' },
      dexterity: { value: 2, rank: 'B' },
      speed: { value: 4, rank: 'S' },
      fight: { value: 2, rank: 'C' },
      precision: { value: 3, rank: 'B' },
      intelligence: { value: 2, rank: 'C' },
      charisma: { value: 1, rank: 'C' }
    }
  });

  mysto.weapons = [
    {
      id: uid('weapon'),
      name: 'Luvas de garras triplas felinas',
      grade: 'Grau 3',
      damage: '2d6',
      tags: ['garras', 'corpo a corpo'],
      description: 'Conjunto veloz pensado para rasgos curtos, mobilidade e pressao continua.'
    }
  ];
  mysto.techniques = [
    {
      id: uid('technique'),
      name: 'Descarga de relampago',
      cost: 2,
      damage: '2d10',
      type: 'Ofensiva',
      tags: ['marca', 'acerto garantido'],
      description: 'Dispara um relampago carregado. Ganha acerto garantido contra alvos marcados com energia negativa.'
    },
    {
      id: uid('technique'),
      name: 'Toque estatico',
      cost: 1,
      damage: '1d6',
      type: 'Toque',
      tags: ['marca', 'debuff'],
      description: 'Marca o alvo com eletricidade residual e reduz a agilidade dele no proximo turno.'
    },
    {
      id: uid('technique'),
      name: 'Revertimento',
      cost: 2,
      damage: '5',
      type: 'Suporte',
      tags: ['buff', 'velocidade'],
      description: 'Reverte o corpo em eletricidade controlada, aumentando a velocidade e pagando o preco em dor.'
    }
  ];
  mysto.passives = [
    {
      id: uid('passive'),
      name: 'Energia eletrificada',
      tags: ['choque'],
      description: 'Toda aplicacao de energia amaldicoada deste usuario assume uma assinatura eletrica.'
    },
    {
      id: uid('passive'),
      name: 'Velocidade energetica',
      tags: ['ataques extras'],
      description: 'Os movimentos aceleram naturalmente quando a energia sobe, criando janelas para ataques adicionais.'
    }
  ];
  mysto.inventory = {
    money: 500,
    items: [{ id: uid('inventory'), name: 'Lata de energetico', quantity: 4, effect: 'Recuperacao narrativa em cena, a criterio da mesa.' }]
  };

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
      strength: { value: 4, rank: 'S' },
      resistance: { value: 3, rank: 'A' },
      dexterity: { value: 3, rank: 'A' },
      speed: { value: 3, rank: 'B' },
      fight: { value: 3, rank: 'B' },
      precision: { value: 1, rank: 'C' },
      intelligence: { value: 2, rank: 'C' },
      charisma: { value: 1, rank: 'C' }
    }
  });

  kayo.weapons = [
    {
      id: uid('weapon'),
      name: 'Duas espadas ligadas a uma corrente',
      grade: 'Grau 1',
      damage: '2d8',
      tags: ['corrente', 'espadas'],
      description: 'Arma flexivel para pressao, dominio de espaco e trocas brutais de alcance.'
    }
  ];
  kayo.techniques = [
    {
      id: uid('technique'),
      name: 'Troca de lugar',
      cost: 1,
      damage: '',
      type: 'Controle',
      tags: ['teleporte', 'posicionamento'],
      description: 'Ao bater palmas, troca de lugar duas pessoas, objetos ou o proprio usuario, desde que os alvos tenham energia amaldicoada.'
    }
  ];
  kayo.passives = [
    {
      id: uid('passive'),
      name: 'Sensor de energia amaldicoada',
      tags: ['sensor'],
      description: 'Percebe energia amaldicoada em pessoas e objetos com leitura quase instintiva.'
    }
  ];
  kayo.inventory = {
    money: 500,
    items: [
      { id: uid('inventory'), name: 'Kit de primeiros socorros', quantity: 1, effect: 'Tratamento rapido em cena, conforme o mestre.' },
      { id: uid('inventory'), name: 'Metal Knuckle Duster', quantity: 1, effect: 'Fortalecedor de punhos de ferro com espinhos.' },
      { id: uid('inventory'), name: 'Bombinhas', quantity: 1, effect: 'Ruido, luz curta e fumaca leve para distracao.' },
      { id: uid('inventory'), name: 'Lata de energetico', quantity: 2, effect: 'Recuperacao narrativa em cena, a criterio da mesa.' }
    ]
  };

  return {
    version: CURRENT_VERSION,
    characters: [mysto, kayo],
    order: { round: 1, turn: 0, entries: [] },
    disaster: { criticalFailures: 0, threshold: 5, disastersTriggered: 0, history: [] },
    log: [
      createLogEntry({
        category: 'Sistema',
        title: 'Mesa carregada',
        text: 'Estado inicial criado com Mysto e Kayo.'
      })
    ],
    currentView: 'sheet',
    activeCharacterId: 'mysto'
  };
}

export function normalizeState(raw: Partial<WorkspaceState> | null | undefined): WorkspaceState {
  const fallback = createDefaultState();
  const base = raw && typeof raw === 'object' ? raw : fallback;
  const characters = base.characters?.length ? base.characters.map(makeCharacter) : fallback.characters.map(makeCharacter);
  const activeCharacterId = characters.some((character) => character.id === base.activeCharacterId)
    ? String(base.activeCharacterId)
    : characters[0]?.id || '';

  return {
    version: CURRENT_VERSION,
    characters,
    order: normalizeOrder(base.order, characters),
    disaster: normalizeDisaster(base.disaster),
    log: base.log?.length ? base.log.map(normalizeLogEntry) : fallback.log,
    currentView: base.currentView || 'sheet',
    activeCharacterId
  };
}

