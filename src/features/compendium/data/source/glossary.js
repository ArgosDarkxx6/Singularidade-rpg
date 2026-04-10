export const GLOSSARY_GROUPS = [
  { key: 'ferramentas', label: 'Armas e ferramentas amaldiçoadas' },
  { key: 'tecnicas', label: 'Tecnicas da obra' },
  { key: 'objetos', label: 'Objetos amaldiçoados' },
  { key: 'dominios', label: 'Dominios e expansoes' }
];

export const GLOSSARY_ENTRIES = [
  {
    id: 'inverted-spear-of-heaven',
    group: 'ferramentas',
    name: 'Inverted Spear of Heaven',
    kind: 'Ferramenta amaldiçoada',
    origin: 'Arma de cancelamento técnico',
    tags: ['anti-tecnica', 'toque', 'ruptura'],
    summary: 'Lamina curta associada a neutralizacao de tecnicas e anulacao de efeitos que dependem de energia amaldiçoada ativa.',
    tableUse: 'Funciona como arma de toque rarissima para abrir brechas contra usuarios extremamente tecnicos.',
    templateRule: 'Dê a ela um efeito de negar ou desativar momentaneamente o efeito especial de uma tecnica em contato direto, em vez de apenas aumentar dano.',
    visualCue: 'Forma curta, agressiva e precisa; deve passar sensacao de ferramenta proibida.',
    templateCost: 'Ideal como item de arco, com acesso raro e consequencias narrativas fortes.'
  },
  {
    id: 'playful-cloud',
    group: 'ferramentas',
    name: 'Playful Cloud',
    kind: 'Ferramenta amaldiçoada',
    origin: 'Bastao triplo de impacto',
    tags: ['forca', 'impacto', 'corpo-a-corpo'],
    summary: 'Ferramenta de puro impacto fisico, famosa por premiar usuarios capazes de transformar tecnica corporal em devastacao direta.',
    tableUse: 'Excelente para personagens focados em Lutar, Forca e pressao fisica sem depender de efeito arcano complexo.',
    templateRule: 'Trate como arma que converte atributos fisicos altos em dano consistente, com espaco para empurrao, quebra de guarda e controle corporal.',
    visualCue: 'Volume brutal, leitura imediata de arma pesada e perigosa.',
    templateCost: 'Melhor em campanhas que queiram destacar fisicalidade acima de pirotecnia.'
  },
  {
    id: 'split-soul-katana',
    group: 'ferramentas',
    name: 'Split Soul Katana',
    kind: 'Ferramenta amaldiçoada',
    origin: 'Lamina de corte espiritual',
    tags: ['alma', 'corte', 'precisao'],
    summary: 'Espada conhecida por ferir alem da superficie, tratando corpo e alma como linha de corte única.',
    tableUse: 'Boa para personagens cirurgicos, duelistas e assassinos que preferem acerto limpo a volume de dano.',
    templateRule: 'Use como arma de corte de alto refinamento, com bonus quando a ficcao permitir atingir essencia, vínculo ou ponto vital do alvo.',
    visualCue: 'Lamina fina, elegante e severa.',
    templateCost: 'Combina com chefes, heranças de clan ou recompensas muito específicas.'
  },
  {
    id: 'black-rope',
    group: 'ferramentas',
    name: 'Black Rope',
    kind: 'Ferramenta amaldiçoada',
    origin: 'Corda ritual de sabotagem',
    tags: ['controle', 'anti-tecnica', 'ritual'],
    summary: 'Ferramenta flexível usada para interferir em fluxo técnico, contenção e preparação de aproximação.',
    tableUse: 'Ótima para abrir janelas contra usuários defensivos ou criar vantagem antes do golpe principal.',
    templateRule: 'Transforme em item de suporte que atrapalha leitura, manutenção ou forma final de uma tecnica inimiga quando bem usado.',
    visualCue: 'Textura ritual, uso incomum, leitura de objeto especializado e valioso.',
    templateCost: 'Funciona melhor com limite de usos, preparo ou necessidade de posicionamento.'
  },
  {
    id: 'limitless',
    group: 'tecnicas',
    name: 'Limitless',
    kind: 'Tecnica',
    origin: 'Manipulacao de infinito',
    tags: ['espaco', 'defesa', 'controle'],
    summary: 'Tecnica emblemática de manipulação espacial com leitura de defesa impossível, compressão e controle extremo de distância.',
    tableUse: 'Serve como template para tecnicas que alteram intervalo, aproximação e direção do impacto.',
    templateRule: 'Em Singularidade, modele como tecnica de altíssimo refinamento com modos separados, forte custo e janelas claras de manutenção.',
    visualCue: 'Frieza absoluta, precisão matemática e energia visual limpa.',
    templateCost: 'Deve soar rara, elitista e perigosamente eficiente.'
  },
  {
    id: 'ten-shadows',
    group: 'tecnicas',
    name: 'Ten Shadows Technique',
    kind: 'Tecnica',
    origin: 'Sombras e invocacoes',
    tags: ['invocacao', 'sombras', 'adaptacao'],
    summary: 'Técnica baseada em sombras, invocação e versatilidade tática, ideal para usuários que vencem pela leitura do tabuleiro.',
    tableUse: 'Excelente referência para tecnicas modulares com múltiplas funções, criaturas auxiliares e reposicionamento.',
    templateRule: 'Quebre em modos ou criaturas específicas com papel claro: perseguir, travar, proteger, varrer área ou finalizar.',
    visualCue: 'Silhuetas recortadas, volume escuro e sensação de arsenal vivo.',
    templateCost: 'Quanto mais versátil, mais importante fica limitar custo, tempo ou vulnerabilidade.'
  },
  {
    id: 'cursed-speech',
    group: 'tecnicas',
    name: 'Cursed Speech',
    kind: 'Tecnica',
    origin: 'Comando pela voz',
    tags: ['voz', 'controle', 'comando'],
    summary: 'Tecnica que transforma fala em ordem violenta, impondo ações, travas ou deslocamento sobre o alvo.',
    tableUse: 'Template excelente para tecnicas de comando, autoridade e custo proporcional ao peso da ordem dada.',
    templateRule: 'Trate cada comando como escalonado por perigo e impacto: travar, cair, recuar, calar, largar ou romper.',
    visualCue: 'Linguagem ritualizada, frases curtas e presença vocal esmagadora.',
    templateCost: 'Ordens mais duras devem cobrar EA, desgaste e risco de retorno sobre o próprio usuário.'
  },
  {
    id: 'boogie-woogie',
    group: 'tecnicas',
    name: 'Boogie Woogie',
    kind: 'Tecnica',
    origin: 'Troca instantanea de posicao',
    tags: ['mobilidade', 'troca', 'ritmo'],
    summary: 'Técnica de reposicionamento súbito que transforma espaço e timing em arma.',
    tableUse: 'Perfeita para ensinar como deslocamento pode ser ofensivo, defensivo e psicológico ao mesmo tempo.',
    templateRule: 'Use como tecnica de troca relâmpago que exige gatilho claro e recompensa quem lê ordem de turno, cobertura e alcance.',
    visualCue: 'Energia explosiva, leitura teatral e surpresa constante.',
    templateCost: 'Melhor quando o gatilho é fácil de entender, mas a leitura fina fica com quem domina a técnica.'
  },
  {
    id: 'idle-transfiguration',
    group: 'tecnicas',
    name: 'Idle Transfiguration',
    kind: 'Tecnica',
    origin: 'Manipulacao de forma e alma',
    tags: ['alma', 'toque', 'deformacao'],
    summary: 'Técnica baseada em toque e alteração de corpo/alma, com horror corporal e ameaça existencial embutidos.',
    tableUse: 'Referência forte para técnicas de toque que criam pavor, mutilação e risco narrativo acima do dano comum.',
    templateRule: 'Modele como técnica curta e temida, com ameaça máxima em contato direto, mais do que em alcance longo.',
    visualCue: 'Estranheza imediata, deformação e leitura anti-humana.',
    templateCost: 'Deve ter custo, gatilho e contrajogo claros para não esmagar a mesa.'
  },
  {
    id: 'prison-realm',
    group: 'objetos',
    name: 'Prison Realm',
    kind: 'Objeto amaldiçoado',
    origin: 'Artefato de selamento',
    tags: ['selamento', 'ritual', 'chefes'],
    summary: 'Objeto lendário associado a aprisionamento e remoção total de uma peça crítica da cena.',
    tableUse: 'Ideal como artefato de arco, condição de objetivo e ameaça de campanha, não como item rotineiro de uso comum.',
    templateRule: 'Funciona melhor quando exige condição ritual, janela de preparo ou vulnerabilidade específica do alvo.',
    visualCue: 'Objeto pequeno com peso absurdo, aparência contida e sensação de evento único.',
    templateCost: 'Use raramente e sempre com consequências colaterais reais.'
  },
  {
    id: 'sukunas-fingers',
    group: 'objetos',
    name: 'Dedos de Sukuna',
    kind: 'Objeto amaldiçoado',
    origin: 'Relíquia contaminada',
    tags: ['corrupcao', 'tentacao', 'reliquia'],
    summary: 'Objetos de energia intensa, associados a contaminação, atração de maldições e escalada narrativa.',
    tableUse: 'Funcionam como foco de missão, isca de desastre, amplificador de corrupção e gatilho de facções.',
    templateRule: 'Trate como item que distorce o ambiente e puxa interesse hostil, muito antes de oferecer qualquer vantagem real.',
    visualCue: 'Peça pequena, repulsiva e irresistivelmente importante.',
    templateCost: 'Nunca deveria parecer loot comum; é sempre problema, símbolo ou heresia materializada.'
  },
  {
    id: 'death-paintings',
    group: 'objetos',
    name: 'Death Painting Wombs',
    kind: 'Objeto amaldiçoado',
    origin: 'Convergencia de corpo e maldição',
    tags: ['hibrido', 'ritual', 'horror'],
    summary: 'Objetos ligados a hibridização, herança contaminada e nascimento de exceções violentas.',
    tableUse: 'Bom template para itens ou restos que geram entidades, experimentos ou linhagens deformadas.',
    templateRule: 'Use como artefato de origem, incubação ou projeto proibido, mais ligado a história do que a bônus imediatos.',
    visualCue: 'Biológico, ritualístico e desconfortável.',
    templateCost: 'Quanto mais forte o resultado, mais irreversível a consequência.'
  },
  {
    id: 'unlimited-void',
    group: 'dominios',
    name: 'Unlimited Void',
    kind: 'Expansao de Dominio',
    origin: 'Sobrecarga de informação',
    tags: ['dominio', 'sobrecarga', 'controle'],
    summary: 'Domínio que vence pela incapacidade do alvo de processar o que recebe.',
    tableUse: 'Ótimo template para domínios que não matam só por dano, mas por saturação, paralisia e impossibilidade de reação.',
    templateRule: 'Modele o domínio como ambiente que afoga resposta, reduz agência e exige contramedida imediata.',
    visualCue: 'Vazio, vastidão, calma impossível e terror limpo.',
    templateCost: 'Deve entrar como clímax maior, nunca como ferramenta banal de rotação.'
  },
  {
    id: 'malevolent-shrine',
    group: 'dominios',
    name: 'Malevolent Shrine',
    kind: 'Expansao de Dominio',
    origin: 'Massacre em area e profanacao',
    tags: ['dominio', 'area', 'aniquilacao'],
    summary: 'Domínio de destruição contínua, presença sacrílega e letalidade territorial.',
    tableUse: 'Template para expansões que transformam toda a área em ameaça ativa, com pressão sobre posicionamento e sobrevivência.',
    templateRule: 'Use como domínio de área brutal, que força decisão imediata de fuga, defesa, confronto de domínio ou sacrifício.',
    visualCue: 'Arquitetura ritual, sensação de altar e devastação constante.',
    templateCost: 'Quanto mais amplo, mais o mundo ao redor precisa pagar o preço.'
  }
];

export function filterGlossaryEntries(query, category = 'all') {
  const normalized = String(query || '').trim().toLowerCase();
  return GLOSSARY_GROUPS.map((group) => {
    const entries = GLOSSARY_ENTRIES.filter((entry) => {
      if (category === 'glossary') {
        // all glossary groups stay eligible
      }
      const haystack = `${entry.name} ${entry.kind} ${entry.origin} ${entry.summary} ${entry.tableUse} ${entry.templateRule} ${entry.visualCue} ${entry.templateCost} ${entry.tags.join(' ')}`.toLowerCase();
      return entry.group === group.key && (!normalized || haystack.includes(normalized));
    });
    return { ...group, entries };
  }).filter((group) => group.entries.length > 0);
}
