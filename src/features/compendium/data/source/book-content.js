const paragraph = (text) => ({ type: 'paragraph', text });
const list = (title, items) => ({ type: 'list', title, items });
const rule = (title, body, label = 'Bloco de regra') => ({ type: 'rule', title, body, label });
const example = (title, body) => ({ type: 'example', title, body, label: 'Exemplo pratico' });
const callout = (tone, title, body, label = 'Destaque') => ({ type: 'callout', tone, title, body, label });
const reference = (title, items, label = 'Referencia rapida') => ({ type: 'reference', title, items, label });
const table = (title, columns, rows, note = '') => ({ type: 'table', title, columns, rows, note });

export const BOOK_CHAPTERS = [
  {
    id: 'abertura',
    category: 'abertura',
    label: 'Abertura',
    title: 'Singularidade, risco e presenca',
    summary: 'Abertura editorial do livro, explicando o tom da mesa, o uso do material e o tipo de historia que o sistema quer sustentar.',
    sections: [
      {
        id: 'sumario-executivo',
        title: 'Sumario executivo',
        summary: 'Singularidade e um jogo sobre decidir quanto de si voce aceita gastar para vencer o incompreensivel.',
        blocks: [
          paragraph('O nucleo mecanico continua direto: quando existe risco real, role 1d20 + Atributo. O peso do jogo nao esta em centenas de subsistemas, mas em quatro motores que se retroalimentam: Energia Amaldicoada, Ranks narrativos, Votos Vinculativos e Dominio.'),
        paragraph('A leitura organiza o sistema para a mesa saber quando agir, cobrar custo, acelerar a cena e deixar a ficcao respirar.'),
          list('Os motores que movem o livro', [
            'Energia Amaldicoada mede combustivel, folego e margem de explosao.',
            'Ranks medem escala narrativa e dizem o tamanho da presenca do personagem.',
            'Votos transformam sacrificio real em vantagem memoravel.',
            'Dominios representam o ponto em que a luta deixa de ser troca de golpes e vira imposicao de mundo.'
          ]),
          callout('gold', 'Regra de ouro', 'Se a acao nao mudar nada, nao role. Se a rolagem entrar em cena, ela precisa empurrar a ficcao para frente com sucesso, falha ou consequencia.', 'Regra de ouro')
        ]
      },
      {
        id: 'como-usar',
        title: 'Como usar este livro',
      summary: 'O livro funciona como leitura corrida e como referencia imediata de mesa.',
        blocks: [
          paragraph('Leia a abertura e os fundamentos antes da primeira sessao. Na criacao de personagem, use os capitulos de Personagem e Energia em paralelo. Em combate, mantenha o capitulo de Conflito aberto: ele foi escrito como procedimento operativo, nao como texto contemplativo.'),
          list('Ordem recomendada de leitura', [
            'Jogadores iniciantes: abertura, fundamentos, criacao de personagem, energia e combate.',
            'Mestre antes da sessao zero: fundamentos, combate, sanidade, arsenal e ameacas.',
            'Mesa em campanha: use a busca e o sumario fixo para ir direto a votos, dominios, Black Flash e referencias rapidas.'
          ]),
          rule('Leitura de mesa', 'Quando surgir uma duvida, resolva em tres passos: 1. decida o que esta em risco, 2. escolha o atributo que representa a intencao, 3. aplique o procedimento da secao adequada. O livro privilegia consistencia operacional acima de excecoes rebuscadas.'),
          example('Uso rapido em cena', 'A personagem quer atravessar uma passarela destruida enquanto evita uma maldicao pendurada no teto. A mesa identifica risco fisico imediato, escolhe Destreza ou Velocidade de acordo com a abordagem e consulta a tabela de dificuldades. Nao e necessario abrir nenhuma outra secao.')
        ]
      },
      {
        id: 'tom-e-campanha',
        title: 'Tom de campanha',
        summary: 'Jujutsu aqui nao e fantasia heroica limpa. E pressao, custo emocional e impacto visual.',
        blocks: [
          paragraph('Campanhas de Singularidade funcionam melhor quando a mesa trata a energia como sintoma emocional, nao apenas como mana. Mesmo personagens frios precisam ter um gatilho interno reconhecivel, porque toda grande cena do sistema nasce do ponto em que controle e descontrole quase se confundem.'),
          list('O tom que o sistema favorece', [
            'Conflitos curtos, violentos e com imagem forte.',
            'Decisoes de custo que parecem pequenas no inicio e brutais depois.',
            'Maldicoes que sao ameacas fisicas e psicologicas ao mesmo tempo.',
            'Momentos de climas maximos reservados para Black Flash, Votos graves e Dominio.'
          ]),
          callout('optional', 'Ajuste de brutalidade', 'Se o seu grupo prefere uma campanha mais escolar e menos tragica, alivie a frequencia de perdas permanentes, mas preserve o custo emocional. O jogo perde identidade quando o poder deixa de doer.', 'Caixa opcional')
        ]
      }
    ]
  },
  {
    id: 'fundamentos',
    category: 'fundamentos',
    label: 'Fundamentos',
    title: 'Fundamentos do jogo',
    summary: 'As regras-base que sustentam toda decisao de mesa: o que e jujutsu, como rolar, como definir alvo e quando transformar uma disputa em teste oposto.',
    sections: [
      {
        id: 'conceitos-do-mundo',
        title: 'Conceitos do mundo e o que e jujutsu',
        summary: 'Jujutsu e o oficio de encarar o excesso emocional do mundo e sobreviver ao contato.',
        blocks: [
          paragraph('Energia Amaldicoada nasce de emocao negativa. Maldicoes sao acumulacoes, residuos ou organizacoes dessa pressao. Feiticeiros nao sao aventureiros em busca de loot: sao pessoas que aprenderam a dar forma, direcao e violencia a algo que destruiria o resto do mundo sem aviso.'),
          list('Perguntas que ajudam a manter o tom certo', [
            'De onde vem a energia desta cena: medo, culpa, luto, inveja, humilhacao',
            'O que esta sendo corrompido: um lugar, uma relacao, um corpo ou uma memoria',
            'Por que exorcizar isto custa mais do que apenas acertar um golpe'
          ]),
          example('Leitura correta da ficcao', 'Uma maldicao feita de raiva escolar nao precisa ser forte apenas no dano. Ela pode dominar corredores, ecoar insultos e atacar Sanidade antes de atacar PV. O sistema deixa espaco para isso porque a ficcao vem primeiro.')
        ]
      },
      {
        id: 'dados-e-alvos',
        title: 'Dados e alvos',
        summary: 'Toda resolucao basica do jogo parte de 1d20 + Atributo.',
        blocks: [
          paragraph('Atributos numericos dizem o tamanho do seu empurrao mecanico. O valor rolado conversa com dificuldade fixa, Defesa fixa ou teste oposto, conforme a estrutura da cena.'),
          table('Dificuldades sugeridas', ['TN', 'Uso em mesa', 'Leitura narrativa'], [
            ['10', 'Facil sob pressao', 'Exige atencao, mas nao treinamento raro.'],
            ['13', 'Padrao de cena', 'E o alvo mais comum para tarefas perigosas ou tensas.'],
            ['15', 'Dificil e exigente', 'Pede treino, foco ou boa posicao.'],
            ['17', 'Alto risco', 'Cena hostil, alvo preparado ou situacao ruim.'],
            ['20', 'Lendario', 'Feito raro, instante extremo ou confronto decisivo.']
          ], 'Se a dificuldade parecer mudar a todo momento, pare e redefina o risco antes de rolar.'),
          rule('Escolha do atributo', 'Escolha o atributo pela intencao principal da acao. Correr por uma parede pode ser Destreza se o foco for equilibrio, Velocidade se o foco for ganhar terreno, ou Lutar se a acao for uma investida agressiva contra alguem.'),
          callout('gold', 'Empates', 'Em teste oposto, empates favorecem quem estava sustentando posicao, defendendo terreno ou mantendo controle de uma tecnica. Em Defesa fixa, igualar o alvo ja basta para sucesso.', 'Regra de ouro')
        ]
      },
      {
        id: 'testes-opostos-e-defesas',
        title: 'Testes opostos e defesas',
        summary: 'Nem toda disputa pede duas rolagens. A mesa ganha velocidade quando sabe diferenciar defesa fixa de oposicao ativa.',
        blocks: [
          paragraph('Use Defesa fixa quando um lado esta executando uma acao direta e o outro e medido pela sua prontidao geral, armadura, postura ou bloco de ameaca. Use teste oposto quando ambos estao impondo vontade no mesmo instante e o resultado depende da forca relativa dos dois.'),
          table('Quando usar cada procedimento', ['Situacao', 'Ferramenta principal', 'Leitura'], [
            ['Ataque contra monstro com DEF no bloco', 'Ataque x DEF fixa', 'Padrao rapido e mais comum do livro.'],
            ['Golpe contra duelista preparado para aparar ou esquivar', 'Teste oposto', 'Os dois estao disputando o mesmo instante.'],
            ['Corrida para atravessar uma ponte antes do desabamento', 'TN fixa', 'A oposicao e o ambiente, nao uma mente inimiga.'],
            ['Empurrao, agarrar, disputa por arma ou Dominio', 'Teste oposto', 'Controle simultaneo pede rolagens dos dois lados.'],
            ['Maldicao com aura que so resiste por robustez bruta', 'Ataque x DEF fixa', 'A criatura nao executa defesa tecnica; ela aguenta o impacto.']
          ]),
          rule('DEF dos monstros', 'Se um monstro ou NPC tem DEF listada, ela e o alvo padrao do ataque dos jogadores. O jogador rola 1d20 + atributo ofensivo e compara o total com a DEF. So troque para teste oposto quando a criatura estiver usando uma reacao, uma tecnica defensiva ou quando a ficcao indicar uma disputa simultanea de controle.'),
          example('DEF em pratica', 'A maldicao tem DEF 14. O jogador ataca com 1d20 + Lutar e totaliza 16. O golpe conecta sem que o mestre precise rolar nada. Se a criatura gastar a propria reacao para aparar com uma lamina amaldicoada, a mesa pode converter essa janela em teste oposto.')
        ]
      },
      {
        id: 'criticos-e-desastre',
        title: 'Critico, falha critica e desastre narrativo',
        summary: 'O jogo quer explosoes de gloria e rachaduras de caos com a mesma intensidade.',
        blocks: [
          table('Gatilhos de mesa', ['Resultado natural', 'Efeito base', 'Leitura'], [
            ['20', 'Critico', 'A acao acerta o ponto perfeito e merece impacto ampliado.'],
            ['1 a 3', 'Falha critica', 'Algo se rompe: postura, energia, cobertura, foco ou inocencia.'],
            ['5 falhas criticas do grupo', 'Desastre narrativo', 'O mundo responde de forma maior do que uma simples punicao local.']
          ]),
          paragraph('Criticos nao servem apenas para dano. Eles podem ampliar area, abrir vantagem tatica, permitir uma leitura perfeita da tecnica inimiga ou antecipar a proxima jogada do personagem. Falhas criticas devem deslocar o estado da cena, e nao apenas gerar um numero pior.'),
          rule('Desastre narrativo', 'A cada cinco falhas criticas acumuladas pelo grupo, o mestre recebe autorizacao sistemica para escalar a ficcao: reforco inimigo, colapso do local, vitima em risco, revelacao ruim ou mudanca de objetivo.'),
          example('Falha que muda o quadro', 'Uma tecnica erra o alvo e rompe a barreira que isolava civis. O dano nao aumenta, mas o combate muda de natureza e a pressao sobre os jogadores cresce imediatamente.')
        ]
      }
    ]
  },
  {
    id: 'personagem',
    category: 'personagem',
    label: 'Personagem',
    title: 'Criacao de personagem',
    summary: 'A ficha nasce de poucos numeros e varias escolhas de leitura dramatica. O objetivo e formar um feiticeiro que ja entre em cena com presenca reconhecivel.',
    sections: [
      {
        id: 'visao-geral-criacao',
        title: 'Visao geral rapida',
        summary: 'A criacao funciona bem em mesa se for conduzida como montagem de foco, nao como preenchimento burocratico.',
        blocks: [
          list('Passo a passo recomendado', [
            'Distribua 20 pontos entre os atributos numericos.',
            'Aplique os ranks narrativos iniciais: 1 S, 2 A, 2 B e 3 C.',
            'Anote PV, EA e SAN iniciais.',
            'Defina grau inicial, clan ou origem social relevante.',
            'Escolha cicatriz, ancora e gatilho.',
            'Escreva a tecnica, uma passiva marcante e, se desejar, um voto.'
          ]),
          paragraph('Se o personagem nao ficar claro em uma frase depois desses passos, a criacao ainda esta incompleta. O livro funciona melhor quando cada ficha carrega um verbo forte: perseguir, conter, salvar, punir, provar, negar, sobreviver.'),
          example('Resumo de ficha funcional', 'Kayo, Grau 3, tecnica de pressao sonora, ancora na familia, gatilho de culpa e estilo de luta ofensivo a media distancia. Isso ja basta para a mesa entender o personagem antes de qualquer background longo.')
        ]
      },
      {
        id: 'atributos-numericos',
        title: 'Atributos numericos',
        summary: 'Os oito atributos cobrem presenca fisica, tecnica e social sem inflar o sistema.',
        blocks: [
          table('Atributos e seu papel principal', ['Atributo', 'Pergunta que ele responde', 'Uso comum'], [
            ['Forca', 'Quanto impacto bruto voce imprime', 'Empurrao, carga, dano corporal, romper obstaculos.'],
            ['Resistencia', 'Quanto voce aguenta antes de quebrar', 'Dor, veneno, choque, manter postura.'],
            ['Destreza', 'Quao fino e o seu controle de corpo', 'Equilibrio, furtividade, manuseio preciso.'],
            ['Velocidade', 'Quao rapido voce muda a cena', 'Iniciativa, corrida, troca de posicao, perseguicao.'],
            ['Lutar', 'Quao bem voce vence no corpo a corpo', 'Ataque fisico, aparo, pressao frontal.'],
            ['Precisao', 'Quao limpo e o seu acerto a distancia', 'Disparo, arremesso, tecnicas de linha.'],
            ['Inteligencia', 'Quao bem voce entende e calcula', 'Analise, leitura de tecnica, ritual, reversao.'],
            ['Carisma', 'Quao forte e sua imposicao humana', 'Comando, intimidacao, acalmar, conduzir.']
          ]),
          rule('Distribuicao inicial', 'Os 20 pontos iniciais definem a coluna mecanica da ficha. Um personagem equilibrado funciona muito bem em Singularidade; um personagem extremamente polarizado precisa de ficcao e recursos para sustentar as fraquezas.'),
          callout('optional', 'Especializacao cedo ou tarde', 'Se o grupo quer uma campanha mais escolar, distribua atributos sem valores muito altos. Se a campanha ja comeca em operacoes perigosas, permita um pico forte em um ou dois atributos para marcar diferencas de estilo.', 'Caixa opcional')
        ]
      },
      {
        id: 'ranks-narrativos',
        title: 'Ranks narrativos',
        summary: 'Ranks nao substituem o numero. Eles dizem o tamanho do personagem dentro da ficcao.',
        blocks: [
          table('Leitura dos ranks', ['Rank', 'Escala', 'Como se percebe em cena'], [
            ['C', 'Base de sobrevivencia', 'Funciona, mas custa e falha sob muita pressao.'],
            ['B', 'Competencia real', 'Consegue cumprir a funcao em campo.'],
            ['A', 'Consistencia sobre-humana', 'Ja altera o ritmo de uma cena comum.'],
            ['S', 'Presenca dominante', 'Faz a mesa olhar quando entra em jogo.'],
            ['SS', 'Figura de referencia', 'A cena passa a orbitar a capacidade do usuario.'],
            ['SSS', 'Singularidade', 'Nivel de simbolo, mito ou desastre encarnado.']
          ]),
          paragraph('Ranks servem para calibrar permissao narrativa, leitura de perigo, acesso a tecnicas mais raras e peso de certas decisoes. Um rank alto nao precisa de bonus no d20 para ser sentido em mesa; ele precisa de reacao ficcional apropriada.'),
          example('Rank sem bonus bruto', 'Dois personagens podem ter Inteligencia 3, mas um com Rank A e outro com Rank C. O primeiro e reconhecido como alguem que domina leitura de tecnicas; o segundo ainda esta aprendendo a nao se afogar no proprio calculo.')
        ]
      },
      {
        id: 'recursos-e-grau',
        title: 'PV, EA, SAN e grau inicial',
        summary: 'Os recursos iniciais precisam ser claros porque todo o resto da ficha gira ao redor deles.',
        blocks: [
          table('Base inicial sugerida', ['Recurso', 'Valor inicial', 'Observacao'], [
            ['PV', 'Definido pela ficha de mesa', 'Representa capacidade de aguentar dano antes da queda.'],
            ['EA', '10', 'Combustivel padrao do usuario iniciante.'],
            ['SAN', '50/50', 'Janela emocional de estabilidade.'],
            ['Grau', '4 ou 3', 'Escolha narrativa para calibrar missao e expectativa.']
          ]),
          paragraph('O Grau inicial nao substitui o level de um jogo de progressao longa. Ele serve para informar a proporcao da campanha: Grau 4 funciona para inicio escolar; Grau 3 coloca o grupo em operacoes reais desde cedo.'),
          rule('Leitura pratica de recurso', 'PV mede se o corpo aguenta. EA mede se a tecnica ainda responde. SAN mede se a pessoa continua inteira por dentro. Em boa mesa, os tres recursos caem por motivos diferentes.')
        ]
      },
      {
        id: 'identidade',
        title: 'Escolhas de identidade',
        summary: 'Cicatriz, ancora e gatilho existem para alimentar cena, nao para virar adorno poetico.',
        blocks: [
          paragraph('A cicatriz diz o que o jujutsu ja arrancou do personagem. A ancora diz o que ainda o mantem humano. O gatilho identifica a emocao que mais facilmente alimenta sua energia. Juntos, os tres elementos formam o eixo dramatigo da ficha.'),
          list('Como escrever sem ficar generico', [
            'Cicatriz: escreva perda concreta, nao abstracao elegante.',
            'Ancora: escolha algo que realmente possa ser ameacado em jogo.',
            'Gatilho: nomeie emocao viva, nao uma tese sobre o personagem.'
          ]),
          example('Exemplo completo', 'Cicatriz: nao conseguiu salvar o irmao mais velho durante uma cortina. Ancora: a irma mais nova, que ainda acredita que ele sempre chega a tempo. Gatilho: raiva. Quando a cena envolve protecao, o personagem brilha e tambem se descontrola com mais facilidade.'),
          callout('gold', 'Pergunta de mestre', 'Sempre que uma sessao for preparar uma luta maior, pergunte: qual parte da identidade deste personagem a cena vai apertar', 'Regra de ouro')
        ]
      }
    ]
  },
  {
    id: 'energia',
    category: 'energia',
    label: 'Energia',
    title: 'Energia, tecnicas e votos',
    summary: 'Este capitulo concentra a economia emocional do sistema: como gastar, segurar, recuperar, inverter e transformar pressao em poder.',
    sections: [
      {
        id: 'energia-amaldicoada',
        title: 'Energia Amaldicoada (EA)',
        summary: 'EA e recurso tatico e declaracao dramatica ao mesmo tempo.',
        blocks: [
          paragraph('EA nao deve ser lida como uma barra neutra de mana. Ela representa a capacidade do personagem de mobilizar o proprio excesso emocional com controle suficiente para transformar isso em tecnica, reforco ou imposicao.'),
          table('Decisoes mais comuns de EA', ['Escolha', 'Custo padrao', 'O que isso comunica'], [
            ['Usar tecnica', 'Variavel', 'Voce aceita gastar impacto agora para controlar a cena.'],
            ['Reforcar dano', '1 EA para +3 dano', 'Voce transforma energia em letalidade imediata.'],
            ['Reduzir dano', '1 EA para -3 dano', 'Voce compra sobrevivencia com folego.'],
            ['Amplificar ou manter Dominio', 'Ver secao propria', 'Voce entra no teto da escalada do sistema.']
          ]),
          rule('EA e pressao visivel', 'Quando um personagem baixa para poucos pontos de EA, a mesa deve sentir isso na ficcao. Respiracao muda, postura endurece, tecnica perde acabamento e o risco de Exaustao se torna parte do enquadramento da cena.')
        ]
      },
      {
        id: 'gasto-e-recuperacao',
        title: 'Gasto, poupanca e recuperacao',
        summary: 'A boa gestao de EA nao e gastar pouco; e gastar no momento em que a cena realmente vira.',
        blocks: [
          paragraph('Segurar EA demais pode transformar um personagem em espectador da propria luta. Gastar cedo demais pode condena-lo a Exaustao antes do climas. O jogo funciona melhor quando a mesa entende que guardar recurso e uma escolha dramatica, nao um mandamento.'),
          rule('Recuperacao basica', 'Se o personagem nao gastou EA no turno anterior, ele pode recuperar +1 EA ao fim do proprio turno, desde que a ficcao permita algum respiro ou recomposicao.'),
          list('Sinais de que vale gastar EA agora', [
            'Voce precisa encerrar uma ameaca antes que ela mude o objetivo da cena.',
            'A cobertura inimiga vai ruir e a janela nao volta.',
            'A luta caminha para Dominio, Black Flash ou desastre narrativo.',
            'Proteger alguem exige impacto imediato, nao economia para depois.'
          ]),
          example('Boa poupanca', 'A personagem evita gastar nos dois primeiros turnos, usa o deslocamento para buscar linha de ataque e entra no terceiro turno com recurso suficiente para reforcar o golpe decisivo.')
        ]
      },
      {
        id: 'exaustao',
        title: 'Exaustao',
        summary: 'Chegar a 0 EA precisa soar como colapso de controle.',
        blocks: [
          rule('Efeito de Exaustao', 'Ao chegar a 0 EA, o personagem entra em Exaustao: sofre -2 em todos os atributos, perde acesso a tecnicas e nao pode usar reforco ate recuperar energia suficiente.'),
          paragraph('Exaustao nao e apenas penalidade numerica. Ela muda o ritmo do personagem, estreita suas opcoes e obriga a mesa a pensar em retirada, protecao de aliados, reposicionamento ou sobrevivencia pura.'),
          reference('Leitura rapida de Exaustao', [
            'Atributos caem imediatamente.',
            'Tecnicas saem da mesa enquanto o estado durar.',
            'Reforco ofensivo e defensivo deixam de estar disponiveis.',
            'Recuperar EA suficiente encerra a Exaustao.'
          ]),
          example('Exaustao bem narrada', 'A tecnica ainda ate tenta surgir, mas a energia se desfaz antes da forma final. O personagem continua em pe porque quer, nao porque o corpo ou o ritual estejam respondendo bem.')
        ]
      },
      {
        id: 'tecnicas-amaldicoadas',
        title: 'Tecnicas amaldicoadas',
        summary: 'Tecnicas sao a linguagem unica pela qual cada personagem impõe a propria assinatura sobre a luta.',
        blocks: [
          paragraph('Uma tecnica so fica boa em Singularidade quando a descricao ja sugere acao de mesa. Em vez de escrever apenas um efeito bruto, descreva o que ela altera: espaco, velocidade, defesa, leitura, area, pressao mental ou condicao de aproximacao.'),
          list('Checklist de tecnica funcional', [
            'Tema claro e reconhecivel em uma frase.',
            'Custo de EA indicado.',
            'Uso principal definido: ofensiva, suporte, controle ou toque.',
            'Linguagem de cena: o que o resto da mesa enxerga quando ela entra em jogo.'
          ]),
          callout('optional', 'Evite tecnica sem corpo', 'Se uma tecnica parece fazer tudo, ela provavelmente ainda nao foi lapidada. Em vez de inflar versatilidade, escreva modos, limites ou situacoes em que ela fica especialmente brilhante.', 'Caixa opcional'),
          example('Descricao com mesa em mente', 'Em vez de "manipula sombras", prefira "espalha sombras liquidas pelo chao, prendendo tornozelos e abrindo rotas de emboscada para ataques de toque".')
        ]
      },
      {
        id: 'votos-vinculativos',
        title: 'Votos Vinculativos',
        summary: 'Voto bom altera decisao. Voto fraco vira nota de rodape esquecida.',
        blocks: [
          paragraph('Um Voto Vinculativo precisa ter custo legivel em jogo. Restricoes vagas demais nao geram tensao. Beneficios exagerados sem risco percebido enfraquecem o tom do sistema.'),
          table('Peso sugerido do voto', ['Peso', 'Tipo de restricao', 'Escala de beneficio'], [
            ['Leve', 'Limita detalhe de cena ou frequencia curta', 'Pequeno empurrao confiavel.'],
            ['Medio', 'Muda rotina real de combate ou investigacao', 'Beneficio nitido e lembravel.'],
            ['Pesado', 'Afeta identidade, codigo ou conduta central', 'Aumento claro de poder e presenca.'],
            ['Extremo', 'Pode custar relacao, corpo ou futuro', 'Marca a campanha inteira.']
          ]),
          rule('Estrutura minima', 'Todo voto precisa responder tres coisas: o que eu ganho, o que eu nao posso fazer e o que acontece se eu quebrar isso.'),
          example('Voto funcional', 'Enquanto luta para proteger alguem que nomeou como ancora, a personagem ganha +2 na primeira rolagem ofensiva de cada cena. Se abandonar a ancora deliberadamente, perde 3 de SAN e nao pode usar a tecnica principal ate o fim do conflito.')
        ]
      },
      {
        id: 'energia-reversa',
        title: 'Energia Reversa',
        summary: 'Energia Reversa e deliberadamente rara. O livro a trata como ferramenta de crise, nao como rotina segura.',
        blocks: [
          paragraph('Converter energia de sinal negativo em energia de cura exige controle fino e custo emocional. Por isso, a mesa deve sentir Energia Reversa como algo sofisticado, cansativo e ligeiramente assustador.'),
          rule('Regra-base de Energia Reversa', 'Para usar Energia Reversa, o personagem precisa de Inteligencia Rank A ou superior, ou de um treino ou marco narrativo claramente estabelecido pela campanha. Cada uso cobra EA e pede controle sob estresse.'),
          table('Cura reversa', ['Acao', 'Custo', 'Efeito', 'Falha critica'], [
            ['Cura Reversa', '2 EA', 'Recupera 6 PV', 'Recupera metade e perde 5 de SAN pela dor e pelo panico.'],
            ['Cura ampliada', 'Custo base + gasto adicional', 'A mesa pode escalar o efeito conforme o EA investido', 'O excesso pode causar colapso emocional ou saturacao corporal.']
          ], 'Energia Reversa nao deve limpar corrupcao, possessao ou consequencias narrativas graves sem custo extra.'),
          example('Uso correto', 'O personagem nao usa cura reversa para apagar cada arranhao. Ele guarda a tecnica para estabilizar alguem que ficaria fora da luta ou para atravessar a ultima fase de um confronto.')
        ]
      },
      {
        id: 'reversao-de-tecnica',
        title: 'Reversao de tecnica',
        summary: 'Reverter uma tecnica nao cria um feitico novo; revela a face oposta do mesmo principio.',
        blocks: [
          paragraph('Reversao funciona melhor quando o tema permanece inteiro. A tecnica nao vira outra coisa: ela inverte direcao, polaridade, funcao ou modo de impacto. Atracao vira repulsao. Luz vira apagamento. Contencao vira expulsao.'),
          rule('Uso da forma reversa', 'Para ativar a forma reversa de uma tecnica, pague +2 EA alem do custo normal. A reversao deve manter o mesmo tema central e inverter a funcao principal.'),
          list('Boas perguntas para validar a reversao', [
            'O nucleo da tecnica continua reconhecivel',
            'A inversao cria um uso novo, mas coerente',
            'O custo adicional faz sentido para a escala do efeito'
          ]),
          example('Reversao clara', 'Uma tecnica de compressao que prende o alvo em um ponto pode ganhar forma reversa de expulsao radial, jogando tudo para longe. O tema continua sendo controle de pressao; so a direcao muda.')
        ]
      }
    ]
  },
  {
    id: 'climax',
    category: 'climax',
    label: 'Climax',
    title: 'Black Flash, Dominio e pontos de ruptura',
    summary: 'As ferramentas de climas do sistema recebem tratamento visual e operacional proprio porque devem parecer especiais na leitura e na mesa.',
    sections: [
      {
        id: 'black-flash',
        title: 'Black Flash',
        summary: 'Black Flash e o pico do combate fisico: o instante perfeito em que golpe e energia se encontram sem folga.',
        blocks: [
          paragraph('No sistema, Black Flash nasce do 20 natural em ataque fisico com Lutar. Ele nao e um critico comum com nome bonito; e uma assinatura de cena, um momento que reordena a percepcao do usuario e de todos ao redor.'),
          callout('climax', 'Regra do sistema', 'Quando um ataque fisico usando Lutar acerta 20 natural, ocorre Black Flash. Trate o impacto como excepcional, aplique o efeito do sistema e narre o golpe como um instante de precisao impossivel.', 'Climax do sistema'),
          list('Como narrar bem', [
            'Descreva a fracao de segundo entre contato e liberacao da energia.',
            'Mostre como o ambiente responde: silencio, racha, eco ou deformacao.',
            'Deixe claro que o usuario sente um pico raro de entendimento do proprio fluxo.'
          ]),
          example('Imagem de cena', 'O punho chega primeiro, a energia chega depois em um estalo negro e atrasado, e o corredor inteiro parece tremer por dentro antes do inimigo realmente ser arremessado.')
        ]
      },
      {
        id: 'dominio-simples',
        title: 'Dominio Simples',
        summary: 'Dominio Simples e resposta tecnica, nao substituto de Expansao.',
        blocks: [
          paragraph('Dominio Simples serve para resistir, filtrar, ganhar um instante de seguranca ou atravessar uma tecnica perigosa sem tentar dominar o espaco inteiro. Ele e precioso porque permite sobreviver onde muita gente so explodiria.'),
          rule('Leitura de uso', 'Ativar Dominio Simples deve soar como postura especializada. O personagem ergue um limite funcional, reduz ruido externo e cria um espaco controlado o bastante para respirar, defender ou preparar uma resposta.'),
          example('Uso de emergencia', 'Ao ver uma Expansao surgir, o feiticeiro nao tenta vencer o campo inteiro; ele ergue um Dominio Simples para nao morrer no primeiro segundo e ganhar a janela de reposicionamento.')
        ]
      },
      {
        id: 'expansao-de-dominio',
        title: 'Expansao de Dominio',
        summary: 'Expansao e o momento em que a luta deixa de ocorrer dentro do mundo e passa a ocorrer dentro da verdade do usuario.',
        blocks: [
          paragraph('Uma Expansao de Dominio precisa mudar espaco, ritmo e seguranca de forma visivel. Quando um Dominio entra, a cena deve sentir que as regras locais foram reorganizadas em favor do usuario.'),
          table('O que uma Expansao precisa entregar', ['Camada', 'Pergunta de mesa', 'Exemplo de efeito'], [
            ['Espaco', 'O ambiente mudou de verdade', 'Barreira fecha, geografia se deforma, simbolos aparecem.'],
            ['Ritmo', 'O turno ficou mais perigoso', 'O alvo perde conforto, acertos parecem inevitaveis.'],
            ['Assinatura', 'Isto so poderia vir deste usuario', 'A tecnica vira paisagem, lei e ameaca ao mesmo tempo.']
          ]),
          callout('climax', 'Sinal de climas', 'Nao banalize Expansao. Se um Dominio entra em cena, ele deve anunciar virada, custo ou fim de fase do conflito.', 'Climax do sistema')
        ]
      },
      {
        id: 'amplificacao-de-dominio',
        title: 'Amplificacao de Dominio',
        summary: 'Amplificacao troca refinamento de tecnica por atravesamento bruto e perigoso.',
        blocks: [
          rule('Amplificacao de Dominio', 'Ativar Amplificacao custa 2 EA para entrar em postura e 1 EA por rodada para manter. Enquanto ativa, o usuario abre mao da tecnica principal; em troca, quando uma tecnica o toca ou ele toca o usuario rival, o efeito especial pode ser reduzido a dano ou impacto cru, conforme a ficcao.'),
          paragraph('Amplificacao nao vence Dominio completo por si so. Ela existe para atravessar tecnicas perigosas, sobreviver a contato ruim e transformar uma luta tecnica em pressao corporal.'),
          example('Uso correto', 'O duelista entra em Amplificacao para suportar uma tecnica de toque e forcar o inimigo a lidar com combate corpo a corpo, onde sua propria leitura e melhor.')
        ]
      },
      {
        id: 'conflito-de-dominios',
        title: 'Conflito de Dominios',
        summary: 'Quando dois dominios completos se chocam, a disputa deixa de ser dano e passa a ser refinamento, controle de barreira e vontade.',
        blocks: [
          paragraph('O Conflito de Dominios precisava de mais clareza operacional. A seguir esta o procedimento padrao para mesa, mantendo a regra-base do sistema e tornando a disputa facil de aplicar sob pressao.'),
          list('Procedimento de Conflito de Dominios', [
            '1. Um usuario ativa Expansao de Dominio.',
            '2. O oponente pode usar a propria Reacao para tentar responder com outro Dominio completo.',
            '3. Ao responder dessa forma, o oponente perde a Acao comum do proximo turno, pois antecipou o refinamento.',
            '4. Ambos rolam D30 para resolver o choque. O mestre pode conceder vantagem narrativa pela ficcao ou pelo Rank de Inteligencia.',
            '5. O vencedor impõe superioridade de barreira, refinamento ou estabilidade. O perdedor sofre compressao, rachadura ou queda do proprio campo.'
          ]),
          table('Leituras de resultado', ['Resultado', 'Efeito de mesa', 'Leitura dramatica'], [
            ['Vitoria clara', 'Um Dominio engole ou neutraliza o outro', 'Refinamento muito superior.'],
            ['Vitoria apertada', 'O campo vence, mas fica instavel', 'A cena continua perigosa para ambos.'],
            ['Empate pratico', 'As barreiras se chocam sem definicao imediata', 'Use um turno de tensao e rerrole se a cena pedir.']
          ]),
          example('Tres dominios', 'Se tres dominios completos sobrepoem a mesma area, trate o primeiro impacto como empate prolongado por uma rodada. Em seguida, rerrole entre os dois campos que a ficcao apontar como mais refinados.')
        ]
      }
    ]
  },
  {
    id: 'combate',
    category: 'combate',
    label: 'Combate',
    title: 'Conflito, dano e leitura de turno',
      summary: 'O capitulo de combate funciona como manual operacional de mesa: procedimento claro e relacao direta entre rolagem, EA, DEF e consequencia.',
    sections: [
      {
        id: 'fluxo-geral-combate',
        title: 'Fluxo geral de combate',
        summary: 'Toda rodada precisa poder ser resolvida pelo mesmo esqueleto, mesmo quando a cena fica caotica.',
        blocks: [
          list('Sequencia-padrao da acao', [
            '1. Declare intencao: o que o personagem quer fazer e contra quem.',
            '2. Verifique posicao: alcance, cobertura, reacao disponivel e efeito de estados.',
            '3. Role: use TN fixa, DEF fixa ou teste oposto conforme a situacao.',
            '4. Gaste EA se necessario: tecnica, reforco, amplificacao, reversao ou manutencao.',
            '5. Resolva dano, estados, deslocamento ou alteracao do campo.',
            '6. Narre a consequencia e marque o novo estado da cena.'
          ]),
          paragraph('Esse fluxo vale para golpes simples, tecnicas, corridas desesperadas e interacoes com Dominio. O que muda entre uma acao e outra e a ferramenta do passo 3 e o custo do passo 4.'),
          example('Fluxo aplicado', 'A personagem quer atravessar a cobertura do corredor e acertar a maldicao com a ponta da lamina. A mesa confere alcance, identifica cobertura parcial, rola o ataque contra a DEF da criatura, gasta 1 EA para reforco no impacto e fecha a acao descrevendo o corte e a abertura criada.')
        ]
      },
      {
        id: 'iniciativa-e-turno',
        title: 'Iniciativa, rodadas e ordem de turno',
        summary: 'A ordem de combate organiza pressao. Ela nao precisa ser complicada para produzir leitura dramatica clara.',
        blocks: [
          rule('Iniciativa dos PCs', 'Role 1d20 e some o maior valor entre Velocidade e Lutar. Isso mede quem le o ritmo da luta mais cedo e toma a dianteira na troca inicial.'),
          rule('Iniciativa dos NPCs e monstros', 'Para ameacas simples, role 1d20 + modificador. Para duelistas, use um modificador compativel com o grau da ameaca ou com o atributo dominante do bloco.'),
          table('Leitura da rodada', ['Elemento', 'Funcao', 'Observacao'], [
            ['Round', 'Marca o ciclo coletivo', 'Sobe quando todos na ordem agem.'],
            ['Turno', 'Janela individual de acao', 'Cada entrada resolve suas escolhas completas.'],
            ['Ordem', 'Fila ativa', 'Da mais alta iniciativa para a mais baixa.']
          ]),
          paragraph('Nao rerrole iniciativa a cada rodada, a menos que a propria cena mude de natureza de forma radical, como um novo Dominio, um colapso de cenario ou entrada de um grupo inteiro na luta.'),
          example('Mudanca real de quadro', 'A luta estava num patio aberto e passa a ocorrer dentro de uma cortina deformada por Dominio. Se a mesa quiser marcar essa virada, ela pode rerrolar iniciativa como sinal de nova fase.')
        ]
      },
      {
        id: 'acoes-reacoes-interrupcoes',
        title: 'Acoes, reacoes e interrupcoes',
        summary: 'O turno precisava de uma economia explicita. Esta e a padronizacao recomendada para a mesa.',
        blocks: [
          table('Economia padrao do turno', ['Recurso do turno', 'Quantidade', 'Uso'], [
            ['Acao principal', '1', 'Atacar, usar tecnica, curar, preparar, interagir de forma decisiva.'],
            ['Deslocamento', '1', 'Mover, trocar faixa de alcance, buscar cobertura, reposicionar.'],
            ['Reacao', '1 por intervalo entre seus turnos', 'Aparar, esquivar, responder a Dominio, defender alguem ou ativar resposta especifica.']
          ]),
          paragraph('Reacoes existem para resposta curta e imediata. Se a mesa perceber que uma resposta parece um turno inteiro disfarçado, aquilo provavelmente deveria ser Acao principal no proximo turno e nao Reacao agora.'),
          rule('Interrupcao', 'Interrupcoes acontecem quando uma Reacao altera diretamente a resolucao de uma acao em andamento: aparar um golpe, tentar fechar a distancia antes de um disparo, abrir Dominio em resposta, empurrar um aliado para fora da area. A interrupcao resolve primeiro; depois a acao original continua ou falha conforme o novo estado da cena.'),
          list('Exemplos comuns de Reacao', [
            'Aparar um golpe corporal com Lutar ou ferramenta apropriada.',
            'Esquivar para trocar posicao curta e sair da linha direta.',
            'Assumir cobertura para proteger um aliado adjacente.',
            'Responder a uma Expansao de Dominio com o proprio Dominio.'
          ]),
          example('Interrupcao em mesa', 'A maldicao dispara um projetil. Antes do dano ser aplicado, a feiticeira gasta sua Reacao para puxar um aliado para tras da pilastra mais proxima. A cobertura muda o alvo ou a dificuldade do disparo antes da resolucao final.')
        ]
      },
      {
        id: 'deslocamento-alcance-cobertura',
        title: 'Deslocamento, alcance e cobertura',
        summary: 'Posicao precisa ser legivel sem transformar o jogo em miniaturas obrigatorias.',
        blocks: [
          paragraph('Singularidade funciona bem com faixas narrativas de distancia. Se voce usa grade ou mapa, trate estas faixas como equivalencias. Se joga no teatro da mente, use as categorias abaixo para manter a mesa sincronizada.'),
          table('Faixas de alcance', ['Faixa', 'Leitura pratica', 'Uso comum'], [
            ['Toque', 'Contato direto', 'Tecnicas de toque, agarrar, aparar, lamina curta.'],
            ['Curto', 'Uma investida ou passo agressivo', 'Golpes corpo a corpo e tecnicas curtas.'],
            ['Medio', 'Do outro lado do comodo ou corredor', 'Disparos, linhas de energia, pressao tatica.'],
            ['Longo', 'Rua, patio ou grande sala', 'Ataques de alcance e cobertura pesada.'],
            ['Extremo', 'Alem da cena imediata', 'So vale quando a ficcao justifica preparo ou mira adequada.']
          ]),
          table('Cobertura', ['Tipo', 'Efeito padrao', 'Leitura'], [
            ['Sem cobertura', 'Sem bonus', 'Alvo totalmente exposto.'],
            ['Parcial', '+2 na DEF fixa ou +2 no teste defensivo', 'Metade do corpo protegida.'],
            ['Pesada', '+5 na DEF fixa ou +5 no teste defensivo', 'Poucas janelas reais de acerto.'],
            ['Total', 'Nao pode ser alvo direto', 'E preciso quebrar, contornar ou negar a cobertura primeiro.']
          ]),
          rule('Deslocamento', 'Cada turno concede um deslocamento. Use-o para mudar de faixa, buscar cobertura, sair de zona perigosa ou se aproximar de toque. Gastar a Acao principal para correr, perseguir ou atravessar terreno hostil permite uma mudanca maior, decidida pela ficcao.'),
          example('Leitura simples', 'Se dois combatentes estao em faixa media e um deles quer usar uma tecnica de toque, ele gasta o deslocamento para entrar em curta e ainda precisa de uma janela ou de outra acao para realmente chegar ao toque de forma segura.')
        ]
      },
      {
        id: 'ataques-defesas-e-def',
        title: 'Ataques, DEF fixa e teste oposto',
        summary: 'Esta secao define de forma clara quando a mesa rola de um lado, de dois lados ou consulta DEF.',
        blocks: [
          rule('Ataque contra DEF fixa', 'Quando o alvo possui DEF no bloco e nao esta executando defesa ativa, o atacante rola 1d20 + atributo ofensivo. Se igualar ou superar a DEF, acerta. Este e o procedimento-padrao contra a maioria dos monstros e NPCs.'),
          rule('Ataque com teste oposto', 'Use teste oposto quando o alvo estiver gastando sua propria acao ou reacao para disputar aquele instante: aparo, esquiva tecnica, disputa de arma, empurrao, agarrar, corrida pelo mesmo objetivo, defesa de Dominio ou qualquer situacao em que os dois lados estejam impondo vontade simultaneamente.'),
          table('Atributos ofensivos mais comuns', ['Acao', 'Rolagem base', 'Observacao'], [
            ['Golpe corporal', '1d20 + Lutar', 'Padrao para corpo a corpo e gatilho de Black Flash.'],
            ['Ataque a distancia', '1d20 + Precisao', 'Disparo, arremesso e linha de impacto.'],
            ['Pressao fisica bruta', '1d20 + Forca', 'Quebrar, empurrar, abrir passagem.'],
            ['Defesa de postura', '1d20 + Resistencia ou Lutar', 'Segurar linha, aparar, manter base.']
          ]),
          table('DEF sugerida por escala de ameaca', ['Faixa de ameaca', 'DEF sugerida', 'Leitura'], [
            ['Grau 4', '10 a 11', 'Ameaca simples ou ainda instavel.'],
            ['Grau 3', '12 a 13', 'Inimigo treinado ou maldicao funcional.'],
            ['Grau 2', '14 a 15', 'Ameaca seria, ja exigindo boa leitura.'],
            ['Grau 1', '16 a 17', 'Elite perigosa, duelista ou maldicao refinada.'],
            ['Especial', '18 a 20', 'Climax alto, chefe de arco ou entidade central.']
          ], 'Use a faixa como calibracao rapida, nao como jaula. Se a ficcao pede algo mais facil de tocar, reduza a DEF e compense em dano, area ou recurso.'),
          example('Dois procedimentos diferentes', 'Contra um espirito bruto de DEF 13, o jogador rola Lutar e resolve o dano imediatamente. Contra um feiticeiro rival que usou Reacao para aparar, ambos rolam: o atacante com Lutar, o defensor com Lutar ou Resistencia, e o resultado compara os dois totais.')
        ]
      },
      {
        id: 'dano-ferimentos-estados',
        title: 'Dano, ferimentos e estados',
        summary: 'Dano em Singularidade nao precisa ser so subtracao. Ele tambem cria postura, perda de terreno e abertura narrativa.',
        blocks: [
          paragraph('Depois do acerto, resolva o dano, aplique reforco ou mitigacao por EA e registre estados relevantes. Um golpe forte pode ferir sem derrubar; um golpe mediano pode ser decisivo se abrir cobertura, empurrar alguem para uma area ruim ou forcar Exaustao.'),
          table('Leituras comuns de dano', ['Evento', 'Efeito base', 'Consequencia comum'], [
            ['Soco ou chute normal', '1d6 + Forca, se a mesa estiver usando dano narrado do livro', 'Pressao local, deslocamento ou abertura.'],
            ['Black Flash', '+5 fixo alem do impacto', 'Virada de fase, colapso de defesa ou terror coletivo.'],
            ['Tecnica ou arma', 'Conforme descricao', 'Pode gerar area, controle, estados ou custo extra.']
          ]),
          list('Estados sempre importantes', [
            'Exaustao: 0 EA, -2 em tudo, sem tecnica, sem reforco.',
            'Abalado: SAN abaixo de 30, -1 em testes mentais.',
            'A beira do surto: SAN abaixo de 15, risco de perder acao ou agir por impulso.',
            'Cobertura quebrada, derrubado, travado ou marcado: estados de cena que alteram o proximo turno.'
          ]),
          example('Dano com consequencia melhor que numero', 'O ataque nao reduz tantos PV, mas arremessa a maldicao para fora da cobertura e abre a janela perfeita para o aliado acertar a tecnica principal no turno seguinte.')
        ]
      },
      {
        id: 'sanidade',
        title: 'Sanidade em cena',
        summary: 'SAN mede desgaste de contato com horror, culpa e presenca sobrenatural demais para o corpo sustentar bem.',
        blocks: [
          paragraph('Sanidade comeca em 50/50 e deve cair por motivos concretos: horror explicito, falha traumatica, morte de aliado, contato prolongado com objeto amaldicoado, pressao de Dominio ou visao impossivel.'),
          rule('Surto', 'Se SAN estiver abaixo de 15, o mestre pode pedir um teste mental, geralmente Inteligencia ou Carisma, TN 13, em cenas de horror agudo. Falha: o personagem perde a acao ou executa uma resposta involuntaria coerente com medo, culpa ou raiva.'),
          reference('Redutores de SAN mais comuns', [
            'Ver alguem importante morrer ou ser deformado.',
            'Falhar criticamente em uma cena de alto custo emocional.',
            'Tocar ou portar objeto amaldicoado instavel por muito tempo.',
            'Ser comprimido por Dominio, presenca absurda ou visao anti-humana.'
          ]),
          example('Boa recuperacao de SAN', 'SAN volta por descanso, conversa, ancoras reais, vitoria significativa ou cena emocional bem conduzida. Nao trate recuperacao como botao de reset; trate como reconstrucao de folego humano.')
        ]
      }
    ]
  },
  {
    id: 'arsenal',
    category: 'arsenal',
    label: 'Arsenal',
    title: 'Ferramentas, objetos e ameacas',
    summary: 'Ferramentas Amaldicoadas, objetos contaminados e espiritos ganham apresentacao mais organizada para leitura rapida de mestre e jogador.',
    sections: [
      {
        id: 'ferramentas-amaldicoadas',
        title: 'Ferramentas Amaldicoadas',
        summary: 'Ferramentas sao a ponte material entre mundo humano e maldicoes.',
        blocks: [
          paragraph('Ferramentas Amaldicoadas nao sao apenas armas melhores. Elas carregam forma, historia e insistencia. Em campanha, sao premio, heranca, risco, tentacao e simbolo de status.'),
          table('Graus de ferramenta', ['Grau', 'Leitura de campanha', 'Presenca em jogo'], [
            ['Grau 4', 'Entrada de campanha', 'Raras, mas plausiveis como recompensa inicial.'],
            ['Grau 3', 'Campo padrao', 'Ferramentas confiaveis de equipes ativas.'],
            ['Grau 2', 'Qualidade alta', 'Ja mudam o equilibrio da luta.'],
            ['Grau 1', 'Perigosa', 'Valor tatico e simbolico evidente.'],
            ['Especial', 'Peca de arco', 'Objeto que pode definir missao inteira.']
          ]),
          table('Ferramentas prontas para mesa', ['Nome', 'Grau', 'Funcao', 'Observacao'], [
            ['Lamina de corte frio', '4', 'Ataque direto', 'Mais eficiente contra corpos espirituais densos.'],
            ['Bastao de selamento', '3', 'Controle', 'Melhor em contencao e abertura de janela.'],
            ['Fio amaldicoado de captura', '3', 'Imobilizacao', 'Excelente para prender ou puxar.'],
            ['Luva de impacto ritual', '2', 'Pressao corporal', 'Casa bem com Lutar e reforco.'],
            ['Mascara de leitura', '2', 'Percepcao', 'Ajuda a identificar fluxo e foco tecnico.'],
            ['Lanca de ruptura', '1', 'Perfuracao', 'Destroi cobertura e defesa bruta.']
          ]),
          example('Boa recompensa', 'Dar uma ferramenta cedo nao quebra o jogo se ela vier com historia, manutencao, fama ruim ou rivais interessados nela.')
        ]
      },
      {
        id: 'objetos-amaldicoados',
        title: 'Objetos Amaldicoados',
        summary: 'Objetos acumulam energia ate se tornarem focos de tentacao, contaminacao ou posse.',
        blocks: [
          paragraph('Um bom objeto amaldicoado nao e apenas item magico. Ele pressiona a mesa com desejo e custo: alguem quer usar, alguem teme quebrar, alguem precisa transportar, esconder ou destruir.'),
          table('Escalas de corrupcao', ['Sinal', 'Efeito inicial', 'Escalada'], [
            ['Sussurro', 'Desconforto, sonhos, pequenos impulsos', 'Pode drenar SAN com convivio prolongado.'],
            ['Marca', 'Mudancas de humor e foco obsessivo', 'A pessoa passa a justificar o objeto.'],
            ['Tomada', 'Vontade do objeto atravessa o usuario', 'Risco de possessao, voto torto ou descontrole.']
          ]),
          rule('Leitura do mestre', 'Objetos funcionam melhor como dilema. Se o item so entrega bonus sem custo, ele perde identidade. Sempre pense no que o objeto quer do usuario ou do ambiente.'),
          example('Gatilho simples', 'Um amuleto que promete proteger a ancora do personagem pode de fato repelir maldicoes, mas cobra SAN toda vez que o usuario deixa outra pessoa em perigo para honrar essa promessa.')
        ]
      },
      {
        id: 'corrupcao-e-possessao',
        title: 'Regras de corrupcao e possessao',
        summary: 'Corrupcao entra aos poucos. Possessao e o ponto em que a vontade estrangeira passa a disputar o corpo.',
        blocks: [
          list('Passos sugeridos para corrupcao', [
            'Apresente atracao ou utilidade real do objeto.',
            'Associe cada uso a um pequeno desgaste, escolha ruim ou perda de SAN.',
            'Quando a relacao ficar intima demais, passe a pedir testes mentais em momentos de stress.',
            'Se a mesa insistir, a possessao deixa de ser susto e vira disputa aberta.'
          ]),
          table('Leituras de possessao', ['Estado', 'Como aparece', 'Resposta da mesa'], [
            ['Latente', 'Voz, reflexo, impulso estranho', 'Cena de suspeita e pressao.'],
            ['Parcial', 'Mudanca corporal ou perda curta de controle', 'Teste mental e custo de SAN.'],
            ['Aberta', 'Outro agente usa o corpo', 'Conflito direto, exorcismo, voto ou ruptura.']
          ]),
          callout('optional', 'Possessao em campanha longa', 'Em campanhas mais focadas em drama do que em horror, trate a possessao como relacao parasitaria em crescimento, nao como perda total imediata. Isso rende melhores escolhas para jogador e mestre.', 'Caixa opcional')
        ]
      },
      {
        id: 'espiritos-amaldicoados',
        title: 'Espiritos Amaldicoados',
        summary: 'Ameacas funcionam melhor quando tem assinatura, comportamento e leitura de escala, e nao apenas PV.',
        blocks: [
          paragraph('Uma maldicao precisa ter verbo. Perseguir, afogar, emparedar, ferver, imitar, seduzir, esmagar. Esse verbo ajuda o mestre a narrar a criatura sem depender de lista de acoes excessiva.'),
          table('Taxonomia rapida', ['Tipo', 'Como age', 'O que pressiona'], [
            ['Bruta', 'Ataca de frente', 'PV, cobertura e deslocamento.'],
            ['Predadora', 'Espera erro ou isolamento', 'Posicao, SAN e aliados expostos.'],
            ['Territorial', 'Controla area', 'Movimento, rota de fuga, objetivo da cena.'],
            ['Parasitaria', 'Gruda, sussurra ou infiltra', 'SAN, vontade e corrupcao.'],
            ['Especial', 'Quebra padrao local', 'Obrigacao de leitura e adaptacao.']
          ]),
          table('Faixa de ameaca por grau', ['Grau', 'DEF sugerida', 'Atributos', 'Assinatura'], [
            ['4', '10 a 11', '1 a 2', 'Ameaca localizada, ainda pouco refinada.'],
            ['3', '12 a 13', '2 a 3', 'Ja entende o proprio padrao de ataque.'],
            ['2', '14 a 15', '3 a 4', 'Pressiona time despreparado com facilidade.'],
            ['1', '16 a 17', '4 a 5', 'Exige recurso, leitura e boa ordem de turno.'],
            ['Especial', '18 a 20', '5+', 'Ameaca de arco, dominio ou desastre maior.']
          ], 'Atributos aqui representam faixa operacional para blocos rapidos de mestre.'),
          example('Bloco rapido funcional', 'Maldicao Grau 3, DEF 13, Lutar 3, Resistencia 2, assinatura: vomita fios negros que prendem tornozelos e puxam para o teto. Isso ja basta para rodar uma cena boa sem pagina inteira de estatistica.')
        ]
      }
    ]
  },
  {
    id: 'apendices',
    category: 'apendices',
    label: 'Apendices',
    title: 'Referencia rapida e calibracao',
    summary: 'Fechamento do livro com material de consulta imediata para jogador, mestre e playtest.',
    sections: [
      {
        id: 'referencia-jogador',
        title: 'Referencia rapida do jogador',
        summary: 'O essencial para agir sem travar a mesa.',
        blocks: [
          table('Jogador em cena', ['Voce quer...', 'Faca...', 'Rolagem ou regra'], [
            ['Acertar no corpo a corpo', 'Atacar', '1d20 + Lutar contra DEF ou teste oposto.'],
            ['Acertar a distancia', 'Atacar', '1d20 + Precisao contra DEF ou TN.'],
            ['Resistir dor, impacto ou veneno', 'Agir sob pressao', '1d20 + Resistencia.'],
            ['Cruzar a cena ou fugir', 'Mover e reposicionar', 'Deslocamento; role so se houver risco real.'],
            ['Forcar reforco ofensivo', 'Gastar EA', '+3 dano por 1 EA.'],
            ['Reduzir dano recebido', 'Gastar EA', '-3 dano por 1 EA.'],
            ['Recuperar EA', 'Poupar no turno', '+1 EA se nao tiver gasto no turno anterior.'],
            ['Ativar Black Flash', 'Acertar 20 natural com Lutar', 'Momento de climax do combate fisico.']
          ]),
          reference('Lembretes que merecem ficar visiveis', [
            'Nao role sem risco e consequencia.',
            'Explique sua intencao antes da rolagem.',
            'Cheque alcance e cobertura antes de declarar acerto.',
            'Exaustao muda seu turno inteiro, nao so um numero.',
            'Gastar EA na hora certa vale mais do que guardar sempre.'
          ])
        ]
      },
      {
        id: 'referencia-mestre',
        title: 'Referencia rapida do mestre',
        summary: 'Ferramentas para manter ritmo, perigo e clareza sem abrir cinco paginas por vez.',
        blocks: [
          table('Mestre em resolucao', ['Se acontecer...', 'Voce aplica...', 'Resultado de cena'], [
            ['20 natural', 'Critico', 'Amplie impacto, vantagem ou imagem da acao.'],
            ['1 a 3 natural', 'Falha critica', 'Consequencia imediata e marca para desastre.'],
            ['Ameaca tem DEF', 'Ataque x DEF fixa', 'Resolucao rapida contra monstros e NPCs.'],
            ['Dois lados disputam o mesmo instante', 'Teste oposto', 'A mesa sente a colisao de vontade.'],
            ['Cobertura relevante', 'Bonus defensivo', 'A posicao importa sem travar o ritmo.'],
            ['Cinco falhas criticas no grupo', 'Desastre narrativo', 'Escalone a situacao de forma memoravel.']
          ]),
          list('Perguntas boas para fazer antes de chamar rolagem', [
            'O que esta realmente em risco agora',
            'Este alvo esta so suportando o ataque ou esta disputando ativamente',
            'Existe cobertura, terreno hostil ou faixa de alcance que mude a leitura',
            'A consequencia precisa ser dano ou a cena pede outro tipo de perda'
          ]),
          example('Boa chamada de mestre', 'Voce nao diz apenas "rola Lutar". Voce diz: "Voce quer quebrar a guarda dele ou so tirar PV Porque, se for quebrar guarda, eu vou tratar isso como disputa de postura, nao como ataque simples."')
        ]
      },
      {
        id: 'playtest-e-calibracao',
        title: 'Metricas de playtest e perguntas',
        summary: 'Este apendice ajuda a medir se a campanha esta viva, clara e afinada com o tom do livro.',
        blocks: [
          list('Metricas uteis para observar', [
            'Quantas vezes alguem esqueceu EA, SAN ou Reacao em uma mesma sessao.',
            'Quantos combates terminaram cedo demais ou longos demais.',
            'Com que frequencia cobertura, alcance e deslocamento realmente importaram.',
            'Quantas falhas criticas surgiram por sessao e que tipo de desastre elas geraram.',
            'Se Black Flash, Dominio e Energia Reversa pareceram especiais ou rotineiros.'
          ]),
          reference('Perguntas de avaliacao de 1 a 5', [
            'Eu entendi claramente quando gastar EA',
            'O combate foi rapido e operacional',
            'As tabelas foram faceis de consultar sob pressao',
            'Dominio e Black Flash pareceram momentos de climax reais',
            'A identidade do personagem apareceu na ficcao, nao apenas na ficha'
          ]),
          callout('gold', 'Fechamento', 'Singularidade funciona melhor quando cada regra empurra a historia para mais perto do risco, da imagem forte e da decisao dificil. Se a mesa saiu da sessao lembrando momentos, e nao planilhas, o sistema cumpriu seu papel.', 'Regra de ouro')
        ]
      }
    ]
  }
];


