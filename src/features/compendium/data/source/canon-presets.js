const CANON_PRESETS = {
  techniques: [
    {
      id: 'dismantle',
      name: 'Dismantle',
      origin: 'Ryomen Sukuna',
      type: 'Ofensiva',
      cost: 3,
      damage: '3d8',
      tags: ['corte', 'alcance', 'letal'],
      description: 'Corte amaldicoado disparado em linha. Excelente para punir alvos expostos, abrir cobertura ou forcar recuo imediato.'
    },
    {
      id: 'cleave',
      name: 'Cleave',
      origin: 'Ryomen Sukuna',
      type: 'Ofensiva',
      cost: 4,
      damage: '4d6',
      tags: ['corte', 'ajuste', 'execucao'],
      description: 'Golpe que ajusta a pressao de corte ao alvo em alcance imediato. Ideal para finalizar inimigos ja quebrados.'
    },
    {
      id: 'divergent-fist',
      name: 'Divergent Fist',
      origin: 'Yuji Itadori',
      type: 'Ofensiva',
      cost: 1,
      damage: '2d6 + eco',
      tags: ['corpo a corpo', 'impacto', 'atrasado'],
      description: 'Soco com atraso entre impacto fisico e energia amaldicoada. Pode gerar segundo abalo narrativo se o alvo ficar em guarda baixa.'
    },
    {
      id: 'ratio-technique',
      name: 'Ratio Technique',
      origin: 'Kento Nanami',
      type: 'Ofensiva',
      cost: 2,
      damage: '3d6',
      tags: ['ponto fraco', 'precisao', 'ruptura'],
      description: 'Divide o alvo em proporcao vulneravel e concentra o golpe no ponto de ruptura, ampliando dano contra defesa previsivel.'
    },
    {
      id: 'boogie-woogie',
      name: 'Boogie Woogie',
      origin: 'Aoi Todo',
      type: 'Controle',
      cost: 2,
      damage: '',
      tags: ['troca', 'posicionamento', 'ritmo'],
      description: 'Troca a posicao de dois alvos validos num instante de palma. Perfeito para quebrar formacoes, salvar aliados ou abrir combo.'
    },
    {
      id: 'cursed-speech',
      name: 'Cursed Speech',
      origin: 'Toge Inumaki',
      type: 'Controle',
      cost: 3,
      damage: '',
      tags: ['ordem', 'vocal', 'controle'],
      description: 'Palavra imbuida de energia que empurra o alvo a obedecer um comando curto. Quanto mais severa a ordem, maior o custo narrativo.'
    },
    {
      id: 'blue',
      name: 'Limitless: Blue',
      origin: 'Satoru Gojo',
      type: 'Controle',
      cost: 4,
      damage: '3d6',
      tags: ['atracao', 'espaco', 'compressao'],
      description: 'Cria um ponto de colapso espacial que puxa objetos e inimigos, desorganizando campo, cobertura e postura.'
    },
    {
      id: 'red',
      name: 'Limitless: Red',
      origin: 'Satoru Gojo',
      type: 'Ofensiva',
      cost: 5,
      damage: '4d8',
      tags: ['repulsao', 'explosao', 'impacto'],
      description: 'Oposto explosivo de Blue. Arremessa alvos, rompe barreiras e muda a geografia do combate em um unico disparo.'
    },
    {
      id: 'divine-dogs',
      name: 'Ten Shadows: Divine Dogs',
      origin: 'Megumi Fushiguro',
      type: 'Suporte',
      cost: 2,
      damage: '2d6',
      tags: ['invocacao', 'rastreamento', 'pressao'],
      description: 'Invoca shikigamis para rastrear presenca, perseguir em deslocamento e aplicar pressao coordenada.'
    },
    {
      id: 'nue',
      name: 'Ten Shadows: Nue',
      origin: 'Megumi Fushiguro',
      type: 'Controle',
      cost: 3,
      damage: '2d8',
      tags: ['invocacao', 'voo', 'raio'],
      description: 'Shikigami voador usado para choque, superioridade aerea e controle do mapa com investidas eletrificadas.'
    },
    {
      id: 'idle-transfiguration',
      name: 'Idle Transfiguration',
      origin: 'Mahito',
      type: 'Toque',
      cost: 4,
      damage: '3d8',
      tags: ['alma', 'toque', 'mutacao'],
      description: 'Tecnica de toque que deforma alma e corpo. Em mesa, funciona melhor como dano brutal com efeito colateral marcante.'
    },
    {
      id: 'blood-manipulation-piercing-blood',
      name: 'Piercing Blood',
      origin: 'Manipulacao de Sangue',
      type: 'Ofensiva',
      cost: 3,
      damage: '3d8',
      tags: ['sangue', 'perfuracao', 'linha'],
      description: 'Disparo comprimido de sangue que atravessa espacos estreitos e pune alvos alinhados ou atras de cobertura parcial.'
    }
  ],
  weapons: [
    {
      id: 'split-soul-katana',
      name: 'Split Soul Katana',
      origin: 'Maki Zenin / Toji Fushiguro',
      grade: 'Grau Especial',
      damage: '3d8',
      tags: ['katana', 'alma', 'ignora-resistencia'],
      description: 'Lamina que corta a alma quando o usuario le a forma real do alvo. Excelente contra defesas brutas e monstros resistentes.'
    },
    {
      id: 'playful-cloud',
      name: 'Playful Cloud',
      origin: 'Ferramenta amaldicoada especial',
      grade: 'Grau Especial',
      damage: '3d10',
      tags: ['corpo a corpo', 'forca', 'impacto'],
      description: 'Bastao triplo focado em impacto puro. Escala muito bem com Forca, sem exigir tecnica refinada.'
    },
    {
      id: 'inverted-spear-of-heaven',
      name: 'Inverted Spear of Heaven',
      origin: 'Toji Fushiguro',
      grade: 'Grau Especial',
      damage: '2d8',
      tags: ['anulacao', 'anti-tecnica', 'punhal'],
      description: 'Arma iconica capaz de interromper ou atravessar tecnicas. Em mesa, brilha quando a ficcao gira em torno de anti-habilidade.'
    },
    {
      id: 'chain-of-a-thousand-miles',
      name: 'Chain of a Thousand Miles',
      origin: 'Toji Fushiguro',
      grade: 'Grau 1',
      damage: '2d6',
      tags: ['alcance', 'captura', 'corrente'],
      description: 'Corrente longa para controlar distancia, puxar, travar arma ou criar angulos incomodos.'
    },
    {
      id: 'dragon-bone',
      name: 'Dragon-Bone',
      origin: 'Ferramenta amaldicoada',
      grade: 'Grau 1',
      damage: '3d6',
      tags: ['lamina', 'energia', 'aceleracao'],
      description: 'Arma que acumula e descarrega energia amaldicoada, permitindo golpes de ruptura em janelas curtas.'
    },
    {
      id: 'slaughter-demon',
      name: 'Slaughter Demon',
      origin: 'Arsenal escolar',
      grade: 'Grau 2',
      damage: '2d6',
      tags: ['faca', 'curta', 'versatil'],
      description: 'Faca amaldicoada de resposta rapida, boa para luta curta, contra-ataque e situacoes de improviso.'
    },
    {
      id: 'cursed-tool-gauntlets',
      name: 'Luvas de Impacto Ritual',
      origin: 'Arsenal de campo',
      grade: 'Grau 2',
      damage: '2d6',
      tags: ['luvas', 'choque', 'combo'],
      description: 'Ferramenta de curto alcance feita para usuarios de corpo a corpo que precisam converter reforco em pressao continua.'
    },
    {
      id: 'barrier-pin',
      name: 'Pino de Barreira',
      origin: 'Kit de suporte',
      grade: 'Grau 3',
      damage: '1d4',
      tags: ['ritual', 'suporte', 'barreira'],
      description: 'Ferramenta menor usada para ancorar veus, improvisar selos e marcar perimetro de contencao.'
    }
  ],
  passives: [
    {
      id: 'six-eyes',
      name: 'Six Eyes',
      origin: 'Satoru Gojo',
      tags: ['sensor', 'eficiencia', 'elite'],
      description: 'Leitura absurda de fluxo amaldicoado. Em mesa, reduz desperdicio, amplia leitura tecnica e melhora respostas a truques inimigos.'
    },
    {
      id: 'heavenly-restriction',
      name: 'Heavenly Restriction',
      origin: 'Toji / Maki',
      tags: ['corpo', 'ausencia-de-ea', 'monstruoso'],
      description: 'Troca extrema entre capacidade amaldicoada e supremacia fisica. Excelente para fichas focadas em corpo, arma e leitura brutal da cena.'
    },
    {
      id: 'reverse-cursed-aptitude',
      name: 'Aptidao para Energia Reversa',
      origin: 'Alta escola de jujutsu',
      tags: ['cura', 'controle', 'reversa'],
      description: 'Facilidade rara para converter energia em estabilizacao corporal, manter combate longo e sustentar aliados.'
    },
    {
      id: 'battle-genius',
      name: 'Genio de Combate',
      origin: 'Yuji / Todo',
      tags: ['combate', 'adaptacao', 'ritmo'],
      description: 'Le a luta em alta velocidade, adapta angulos e aprende no choque. Funciona bem como permissao para jogadas agressivas em cadeia.'
    },
    {
      id: 'electric-trait',
      name: 'Assinatura Eletrica',
      origin: 'Kashimo',
      tags: ['energia', 'choque', 'assinatura'],
      description: 'Toda aplicacao de energia deixa rastro eletrificado, tornando a presenca do usuario imediatamente reconhecivel em campo.'
    },
    {
      id: 'barrier-theory',
      name: 'Teoria de Barreiras',
      origin: 'Usuario de suporte',
      tags: ['barreira', 'analise', 'ritual'],
      description: 'Familiaridade alta com veus, dominios simples e estruturas de contencao. Favorece leituras taticas e respostas de suporte.'
    }
  ],
  inventory: [
    {
      id: 'seal-talismans',
      name: 'Talismas de Selamento',
      origin: 'Kit escolar',
      quantity: 3,
      effect: 'Usados para marcar area, reforcar contencao, lacrar resquicios ou improvisar selos em cena.'
    },
    {
      id: 'barrier-tags',
      name: 'Etiquetas de Veu',
      origin: 'Equipe de barreira',
      quantity: 2,
      effect: 'Componentes descartaveis para levantar ou reforcar veus simples em locais pequenos.'
    },
    {
      id: 'ritual-bandages',
      name: 'Bandagens Rituais',
      origin: 'Suporte medico',
      quantity: 4,
      effect: 'Tratamento rapido de estabilizacao e isolamento espiritual depois de contato com energia agressiva.'
    },
    {
      id: 'cursed-medicine',
      name: 'Ampola de Medicina Amaldicoada',
      origin: 'Laboratorio de suporte',
      quantity: 2,
      effect: 'Recurso emergencial para reduzir desgaste narrativo, conter dor extrema ou segurar colapso momentaneo.'
    },
    {
      id: 'recording-charm',
      name: 'Amuleto de Registro',
      origin: 'Investigacao',
      quantity: 1,
      effect: 'Item usado para registrar assinatura espiritual, rastrear ecos de tecnica ou guardar uma leitura breve da cena.'
    },
    {
      id: 'rosary-beads',
      name: 'Rosario de Contencao',
      origin: 'Templo jujutsu',
      quantity: 1,
      effect: 'Foco ritual para expulsao, acalmar residuos e conduzir cenas de exorcismo fora do pico do combate.'
    },
    {
      id: 'cursed-bait',
      name: 'Isca Amaldicoada',
      origin: 'Operacao de campo',
      quantity: 2,
      effect: 'Atrai espiritos menores ou desvia criaturas sensiveis a assinatura negativa para uma rota planejada.'
    },
    {
      id: 'reserve-mask',
      name: 'Mascara de Reserva',
      origin: 'Kit tatico',
      quantity: 1,
      effect: 'Suporte de respiracao e foco para ambientes contaminados, nevoa ritual ou corredores cheios de residuos.'
    }
  ]
};

function normalizePreset(preset) {
  return {
    ...preset,
    tags: Array.isArray(preset.tags) ? [...preset.tags] : []
  };
}

export function getCanonPresets(collectionKey) {
  return (CANON_PRESETS[collectionKey] || []).map(normalizePreset);
}

export function findCanonPreset(collectionKey, presetId) {
  const preset = (CANON_PRESETS[collectionKey] || []).find((entry) => entry.id === presetId);
  return preset ? normalizePreset(preset) : null;
}

export function searchCanonPresets(collectionKey, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return getCanonPresets(collectionKey);

  return getCanonPresets(collectionKey).filter((preset) => (
    [preset.name, preset.origin, preset.description, preset.effect, ...(preset.tags || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  ));
}

