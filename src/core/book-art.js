const figure = (id, src, alt, subject, orientation, tone, isCutout, recommendedPlacements, caption = '') => ({
  id,
  kind: 'figure',
  src,
  alt,
  subject,
  orientation,
  tone,
  isCutout,
  recommendedPlacements,
  caption
});

const ornament = (id, src, alt, subject, orientation, tone, recommendedPlacements) => ({
  id,
  kind: 'ornament',
  src,
  alt,
  subject,
  orientation,
  tone,
  isCutout: false,
  recommendedPlacements
});

const brush = (id, src, role) => ({ id, src, role });

export const BOOK_ART_LIBRARY = [
  figure(
    'opening-trio-hero',
    'assets/book_art/figures/opening-trio-hero.png',
    'Trio de feiticeiros em contraste preto e branco',
    'ensemble',
    'landscape',
    'ink',
    false,
    ['chapterHero'],
    'Abertura coral para o livro: presenca, risco e hierarquia visual.'
  ),
  figure(
    'trio-gojo-panel',
    'assets/book_art/figures/trio-gojo-panel.png',
    'Retrato de Gojo em close',
    'gojo',
    'portrait',
    'ink',
    false,
    ['chapterHero', 'sectionFlank']
  ),
  figure(
    'trio-yuji-panel',
    'assets/book_art/figures/trio-yuji-panel.png',
    'Retrato de Yuji em close',
    'yuji',
    'portrait',
    'ink',
    false,
    ['chapterHero', 'sectionFlank']
  ),
  figure(
    'trio-megumi-panel',
    'assets/book_art/figures/trio-megumi-panel.png',
    'Retrato de Megumi em close',
    'megumi',
    'portrait',
    'ink',
    false,
    ['chapterHero', 'sectionFlank']
  ),
  figure(
    'sword-sorcerer-cutout',
    'assets/book_art/figures/sword-sorcerer-cutout.png',
    'Feiticeira com katana em movimento',
    'swordsman',
    'portrait',
    'ink',
    true,
    ['chapterHero', 'sectionFlank'],
    'Ferramentas e posturas de combate entram como silhueta lateral, nao como ilustração central repetida.'
  ),
  figure(
    'aerial-sorcerer-cutout',
    'assets/book_art/figures/aerial-sorcerer-cutout.png',
    'Feiticeira saltando em diagonal',
    'acrobat',
    'portrait',
    'ink',
    true,
    ['chapterHero', 'sectionFlank'],
    'Um gesto diagonal para encerrar a leitura com mobilidade, transicao e referencia rapida.'
  ),
  figure(
    'standing-sorcerer-cutout',
    'assets/book_art/figures/standing-sorcerer-cutout.png',
    'Feiticeiro em pose ereta',
    'observer',
    'portrait',
    'ink',
    true,
    ['chapterHero', 'sectionFlank'],
    'Criacao de personagem tratada como presenca em cena, nao so distribuicao de numeros.'
  ),
  figure(
    'yuji-strike-cutout',
    'assets/book_art/figures/yuji-strike-cutout.png',
    'Yuji em ataque com energia',
    'yuji',
    'portrait',
    'blood',
    true,
    ['chapterHero', 'sectionFlank'],
    'Ataque frontal para o capitulo em que o fluxo operativo do combate fica mais claro.'
  ),
  figure(
    'gojo-infinity-hero',
    'assets/book_art/figures/gojo-infinity-hero.png',
    'Gojo com energia concentrada nas maos',
    'gojo',
    'portrait',
    'cyan',
    true,
    ['chapterHero', 'sectionFlank'],
    'Energia amaldicoada e reversao aparecem como presenca visual limpa e perigosa.'
  ),
  figure(
    'gojo-focus-panel',
    'assets/book_art/figures/gojo-focus-panel.png',
    'Close de Gojo preparando tecnica',
    'gojo',
    'portrait',
    'cyan',
    true,
    ['sectionFlank']
  ),
  figure(
    'katana-vertical-mark',
    'assets/book_art/figures/katana-vertical-mark.png',
    'Marca vertical de katana',
    'katana',
    'portrait',
    'ink',
    true,
    ['sectionFlank', 'glossaryHero']
  ),
  figure(
    'yuji-uppercut-panel',
    'assets/book_art/figures/yuji-uppercut-panel.png',
    'Close de Yuji avancando',
    'yuji',
    'portrait',
    'blood',
    true,
    ['sectionFlank']
  )
];

export const BOOK_ORNAMENT_LIBRARY = [
  ornament('ofuda-northwest', 'assets/book_art/ornaments/ofuda-northwest.png', 'Ofuda com inscricoes rituais', 'ofuda', 'portrait', 'gold', ['spotArt', 'glossaryHero']),
  ornament('ofuda-northeast', 'assets/book_art/ornaments/ofuda-northeast.png', 'Ofuda vertical', 'ofuda', 'portrait', 'gold', ['spotArt', 'glossaryHero']),
  ornament('ofuda-southwest', 'assets/book_art/ornaments/ofuda-southwest.png', 'Ofuda gasto com marcas de uso', 'ofuda', 'portrait', 'gold', ['spotArt', 'glossaryHero']),
  ornament('sigil-azure', 'assets/book_art/ornaments/sigil-azure.png', 'Sigilo azul brilhante', 'sigil', 'square', 'cyan', ['spotArt', 'glossaryHero']),
  ornament('sigil-domain', 'assets/book_art/ornaments/sigil-domain.png', 'Circulo ritual de dominio', 'sigil', 'square', 'cyan', ['spotArt', 'glossaryHero']),
  ornament('sigil-rift', 'assets/book_art/ornaments/sigil-rift.png', 'Rift e marcas ritualizadas', 'sigil', 'portrait', 'cyan', ['spotArt']),
  ornament('paper-grain-a', 'assets/book_art/ornaments/paper-grain-a.jpg', 'Textura de papel fibroso', 'paper', 'landscape', 'paper', ['surface']),
  ornament('paper-grain-b', 'assets/book_art/ornaments/paper-grain-b.jpg', 'Textura de papel com fibras visiveis', 'paper', 'landscape', 'paper', ['surface']),
  ornament('paper-grain-c', 'assets/book_art/ornaments/paper-grain-c.jpg', 'Textura de papel envelhecido', 'paper', 'landscape', 'paper', ['surface']),
  ornament('ink-cloud-1', 'assets/book_art/ornaments/ink-cloud-1.png', 'Nuvem de tinta preta', 'ink', 'square', 'ink', ['spotArt']),
  ornament('ink-cloud-2', 'assets/book_art/ornaments/ink-cloud-2.png', 'Nuvem de tinta escura', 'ink', 'square', 'ink', ['spotArt']),
  ornament('ink-cloud-3', 'assets/book_art/ornaments/ink-cloud-3.png', 'Neblina de tinta', 'ink', 'square', 'ink', ['spotArt']),
  ornament('ink-cloud-4', 'assets/book_art/ornaments/ink-cloud-4.png', 'Vortex de tinta', 'ink', 'square', 'ink', ['spotArt']),
  ornament('ritual-ring-1', 'assets/book_art/ornaments/ritual-ring-1.png', 'Anel ritual fino', 'ritual-ring', 'square', 'cyan', ['spotArt']),
  ornament('ritual-ring-2', 'assets/book_art/ornaments/ritual-ring-2.png', 'Anel ritual interno', 'ritual-ring', 'square', 'cyan', ['spotArt']),
  ornament('ritual-ring-3', 'assets/book_art/ornaments/ritual-ring-3.png', 'Anel ritual com marcas cardeais', 'ritual-ring', 'square', 'gold', ['spotArt']),
  ornament('ritual-ring-4', 'assets/book_art/ornaments/ritual-ring-4.png', 'Anel ritual de contencao', 'ritual-ring', 'square', 'gold', ['spotArt'])
];

export const BOOK_BRUSH_LIBRARY = [
  brush('chapter-1', 'assets/book_art/brushes/chapter-1.png', 'chapter'),
  brush('chapter-2', 'assets/book_art/brushes/chapter-2.png', 'chapter'),
  brush('section-1', 'assets/book_art/brushes/section-1.png', 'section'),
  brush('section-2', 'assets/book_art/brushes/section-2.png', 'section'),
  brush('compact-1', 'assets/book_art/brushes/compact-1.png', 'compact'),
  brush('compact-2', 'assets/book_art/brushes/compact-2.png', 'compact')
];

export const BOOK_ART_ASSIGNMENTS = {
  chapterHero: {
    abertura: ['opening-trio-hero'],
    fundamentos: ['trio-megumi-panel'],
    personagem: ['standing-sorcerer-cutout'],
    energia: ['gojo-infinity-hero'],
    climax: ['trio-yuji-panel'],
    combate: ['yuji-strike-cutout'],
    arsenal: ['sword-sorcerer-cutout'],
    apendices: ['aerial-sorcerer-cutout']
  },
  sectionFlank: {
    identidade: ['trio-gojo-panel'],
    'energia-reversa': ['ofuda-northwest'],
    'black-flash': ['yuji-uppercut-panel'],
    'conflito-de-dominios': ['gojo-focus-panel'],
    'deslocamento-alcance-cobertura': ['sigil-rift'],
    'ferramentas-amaldicoadas': ['katana-vertical-mark']
  },
  glossaryHero: {
    ferramentas: ['katana-vertical-mark'],
    tecnicas: ['sigil-azure'],
    objetos: ['ofuda-southwest'],
    dominios: ['sigil-domain']
  },
  glossaryEntrySpot: {
    ferramentas: ['ofuda-northwest', 'ritual-ring-3', 'ofuda-northeast', 'ink-cloud-1'],
    tecnicas: ['sigil-azure', 'ritual-ring-1', 'ink-cloud-2', 'sigil-rift'],
    objetos: ['ofuda-southwest', 'ink-cloud-3', 'ritual-ring-4'],
    dominios: ['sigil-domain', 'ritual-ring-2', 'ink-cloud-4']
  },
  blockSpotArt: {
    table: ['ritual-ring-1', 'ritual-ring-2', 'sigil-azure'],
    list: ['ofuda-northwest', 'ink-cloud-2', 'ofuda-southwest'],
    rule: ['sigil-azure', 'ritual-ring-3', 'ink-cloud-1'],
    gold: ['ofuda-northeast', 'sigil-azure'],
    optional: ['ink-cloud-3', 'ofuda-southwest'],
    example: ['ritual-ring-4', 'ink-cloud-4', 'ofuda-northwest'],
    reference: ['sigil-domain', 'ritual-ring-2', 'ofuda-northeast'],
    climax: ['sigil-domain', 'sigil-rift', 'ritual-ring-1']
  }
};

const ART_BY_ID = new Map(BOOK_ART_LIBRARY.map((entry) => [entry.id, entry]));
const ORNAMENT_BY_ID = new Map(BOOK_ORNAMENT_LIBRARY.map((entry) => [entry.id, entry]));
const BRUSH_BY_ROLE = BOOK_BRUSH_LIBRARY.reduce((accumulator, entry) => {
  accumulator[entry.role] = accumulator[entry.role] || [];
  accumulator[entry.role].push(entry);
  return accumulator;
}, {});

function hashString(value) {
  return Array.from(String(value || '')).reduce((total, character) => total + character.charCodeAt(0), 0);
}

function getAssetById(id) {
  return ART_BY_ID.get(id) || ORNAMENT_BY_ID.get(id) || null;
}

function pickFromList(ids, key) {
  if (!ids || !ids.length) return null;
  const offset = hashString(key) % ids.length;
  for (let index = 0; index < ids.length; index += 1) {
    const candidateId = ids[(offset + index) % ids.length];
    const asset = getAssetById(candidateId);
    if (asset) return asset;
  }
  return null;
}

export function getBookAssetById(id) {
  return getAssetById(id);
}

export function createBookArtSession() {
  const usedFigureIds = new Set();

  function claimUnique(ids) {
    if (!ids || !ids.length) return null;
    for (const id of ids) {
      const asset = getAssetById(id);
      if (!asset) continue;
      if (asset.kind !== 'figure') return asset;
      if (usedFigureIds.has(asset.id)) continue;
      usedFigureIds.add(asset.id);
      return asset;
    }
    return null;
  }

  return {
    getBrush(role, key) {
      const brushes = BRUSH_BY_ROLE[role] || BRUSH_BY_ROLE.compact || [];
      if (!brushes.length) return null;
      return brushes[hashString(`${role}:${key}`) % brushes.length];
    },
    resolveChapterHero(chapterId) {
      return claimUnique(BOOK_ART_ASSIGNMENTS.chapterHero[chapterId] || []);
    },
    resolveSectionFlank(sectionId) {
      return claimUnique(BOOK_ART_ASSIGNMENTS.sectionFlank[sectionId] || []);
    },
    resolveGlossaryHero(groupKey) {
      return claimUnique(BOOK_ART_ASSIGNMENTS.glossaryHero[groupKey] || []);
    },
    resolveGlossaryEntrySpot(entry) {
      return pickFromList(BOOK_ART_ASSIGNMENTS.glossaryEntrySpot[entry.group] || [], entry.id);
    },
    resolveBlockSpot(block, scopeKey = '') {
      const tone = block.type === 'callout'  block.tone || 'rule' : block.type;
      const key = BOOK_ART_ASSIGNMENTS.blockSpotArt[tone]  tone : block.type;
      return pickFromList(BOOK_ART_ASSIGNMENTS.blockSpotArt[key] || [], `${scopeKey}:${block.title || tone}`);
    },
    getUsedFigureIds() {
      return [...usedFigureIds];
    }
  };
}
