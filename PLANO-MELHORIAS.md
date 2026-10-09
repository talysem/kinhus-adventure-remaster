# Plano de melhorias — Kinhu's Adventure

Data: 09/10/2026.

**Status: somente planejamento. Nenhuma funcionalidade deste documento foi implementada.**
Este arquivo registra propostas para uma futura etapa de desenvolvimento; não autoriza executar o plano automaticamente. Valores de duração, alcance e dificuldade são pontos de partida para testes futuros.

## 1. Objetivo e situação atual

Fazer o jogador sentir que Kinhu aprende durante a aventura, com novas formas de atravessar os cenários, encontrar segredos e enfrentar inimigos. Manter o humor do trajeto de casa ao trabalho, a pixel art, a música chiptune e a facilidade de jogar no navegador e no celular.

Base observada no projeto:

- Cinco fases: Saindo de Casa, Viagem de Ônibus, Centro da Cidade, O Escritório e Sala dos Servidores.
- Movimento com corrida, pulo de altura variável e descida de plataformas; já existem tolerância para pular após sair da borda e memória breve do comando de pulo.
- Coca-Cola permite arremessar latas e é perdida ao receber dano; Kinhurine oferece 10 segundos de invencibilidade, com transformação ilustrada.
- Moedas, comida, vida extra, checkpoints, plataformas móveis, perigos próprios de cada cenário e MEGA BUG com duas etapas de combate.
- Salvamento no navegador e importação/exportação de arquivo JSON, atualmente no formato 1.
- O código atual de `js/levels.js` define 900 no cronômetro das cinco fases. O README ainda descreve 600 e dimensões de uma revisão anterior; conferir e atualizar essa documentação apenas na futura implementação.

## 2. Progressão de habilidades permanentes

Desbloquear uma habilidade ao concluir cada uma das quatro primeiras fases. Explicar a origem dos poderes em uma única cena narrativa, descrita abaixo; em cada desbloqueio, mostrar apenas um aviso curto com o comando e oferecer um trecho seguro de prática no início da fase seguinte. O desbloqueio deve ocorrer junto do salvamento da conclusão, antes de qualquer transição que possa ser interrompida.

| Marco | Habilidade proposta | Funcionamento | Primeiro uso planejado |
|---|---|---|---|
| Concluir Saindo de Casa | **Pulo duplo — Perdi o ônibus!** | Um segundo impulso ao apertar pular novamente no ar. Recarrega ao pousar em superfície válida; não permite saltos infinitos. | Alcançar bagageiros no ônibus, corrigir saltos e buscar moedas em caminhos altos. |
| Concluir Viagem de Ônibus | **Pum propulsor — Foi o Mumu!** | Um pum impulsiona Kinhu horizontalmente, no chão ou no ar, sem invencibilidade. Origem: o Mumu (doce de leite) que ele comeu, apesar de ser intolerante à lactose. Proposta inicial: cerca de 3 blocos, recarga de 1 segundo e no máximo um impulso aéreo por salto. | Atravessar intervalos entre perigos no centro e alcançar atalhos laterais. |
| Concluir Centro da Cidade | **Barrigada — Licença, pessoal!** | No ar, baixo + um novo toque em pular inicia uma queda forte. Quebra apenas blocos identificados e atinge inimigos elegíveis por cima. | Abrir passagens entre caixas no escritório e acionar interruptores de chão. |
| Concluir O Escritório | **Passo firme — Veterano do expediente** | Melhoria passiva: reduz em aproximadamente 30% o recuo de golpes e a perda de controle em piso molhado. Preserva dano e perigos elétricos. | Melhorar o controle na sala dos servidores e durante o combate final. |
| Derrotar MEGA BUG | **Expediente encerrado** | Libera seleção de fases para desafios e busca de segredos com as habilidades conquistadas. | Rejogar cenários e completar a coleção; não acrescenta poder necessário à campanha. |

### Cena única — A origem dos poderes

**Proposta de apresentação:** uma única cena adicional, com uma ilustração em pixel art e legendas sequenciais, ao terminar a abertura existente e antes do jogador assumir a primeira fase. Um breve flashback mostra Kinhu em casa após o café da manhã: pote de Mumu aberto com colher, barriga em destaque, mochila com seus itens e expressão de quem acabou de lembrar do atraso. Pequenas animações de expressão e barriga dão vida ao mesmo enquadramento, sem criar uma sequência de novas cenas.

O quadro estabelece a origem das habilidades e apresenta os objetos que ajudam na aventura. Kinhu aprende a dominar os movimentos conforme passa as fases; assistir à cena não libera todos os poderes no início.

**Legendas propostas, exibidas uma por vez:**

1. “O atraso deu um susto tão grande no Kinhu que um pulo só não ia bastar.”
2. “Antes de sair, ele comeu Mumu. Doce de leite. E o Kinhu é intolerante à lactose...”
3. “A barriga roncou. O resultado? Um pum com potência de arrancada. Foi o Mumu!”
4. “A barriga de respeito virou barrigada. E encarar o expediente ia ensinar o Kinhu a firmar os pés.”
5. “Na mochila, cada ajuda tinha seu jeito: café para acelerar, proteção contra pancadas e um ímã para o troco.”
6. “Os poderes estavam ali. Agora era aprender a usar, uma fase de cada vez!”

- Reservar cerca de 25–35 segundos no avanço automático, ajustando o tempo à leitura de cada legenda. Permitir avançar, pular e rever pela ajuda/galeria.
- Exibir legendas em caixa de alto contraste, sem cobrir rosto, pote ou gesto principal; quebrar frases em linhas legíveis na resolução das cutscenes.
- Um ronco de barriga e um efeito curto de pum marcam a terceira legenda, com uma pequena nuvem cômica. A explicação deve funcionar com o som desligado.
- Tratar o impulso como humor cartunesco do personagem. Mumu é a origem narrativa da habilidade permanente; não vira combustível consumível nem exige recolher doce de leite para usar o movimento.
- A cena é vista uma vez por campanha; morrer, voltar ao checkpoint ou carregar uma campanha que já a exibiu não a repete. Novo jogo permite vê-la novamente e a reprodução manual não altera progresso.
- Registrar conclusão ou pulo da cena no save. Se houver interrupção antes disso, reapresentar a cena ao retomar sem conceder habilidades ou recompensas novamente. Saves antigos seguem direto para sua fase, com a cena disponível para reprodução manual.
- A transformação existente de Kinhurine mantém sua apresentação própria. Esta cena adicional explica a nova progressão e não substitui a transformação.

### Identidade do pum propulsor

- Substitui a arrancada em nome, animação e som, mantendo a função de deslocamento e os limites planejados.
- Kinhu faz uma expressão de esforço e deixa uma nuvem pequena atrás do corpo, oposta à direção do impulso. O efeito não cobre perigos ou plataformas.
- Usar som curto e cômico, subordinado ao volume dos efeitos; o movimento continua claramente identificável no modo silencioso.
- O pum não causa dano, não envenena inimigos e não concede invencibilidade. A nuvem é apenas visual.
- Aviso ao concluir o ônibus: **“PUM PROPULSOR — FOI O MUMU!”**, seguido do comando correspondente ao dispositivo e de um trecho seguro para praticar no centro.

### Regras de progressão

- Habilidades conquistadas persistem após dano, morte, checkpoint e retomada da mesma campanha; não dependem de encontrar um item aleatório.
- Novo jogo reinicia as habilidades da campanha. Recordes e recompensas cosméticas podem permanecer no perfil, sem conceder poderes antecipadamente.
- O caminho principal pode exigir habilidades permanentes já ensinadas, mas nunca um power-up temporário. Nos primeiros protótipos, manter caminhos alternativos até validar os novos saltos.
- Segredos de fases antigas podem exigir habilidades posteriores. A seleção de fases deve informar os poderes disponíveis e não sobrescrever silenciosamente uma campanha em andamento.
- Para saves antigos, conceder as habilidades correspondentes às fases já concluídas, usando a fase atual como referência da campanha; não usar apenas o maior nível desbloqueado do perfil.
- A última fase deve combinar habilidades conhecidas, sem depender de um movimento ativo recém-apresentado durante o chefe.

### Controles propostos

- Pulo duplo usa o botão de pulo existente, exigindo soltar e apertar novamente.
- Corrida e arremesso mantêm os comandos atuais. O pum propulsor ganha ação própria: proposta inicial **C no teclado, RB no controle e botão C no toque**.
- Barrigada usa baixo + pular somente quando Kinhu já está no ar. Sobre uma plataforma atravessável, baixo + pular continua significando descer; a descida não dispara barrigada no mesmo toque.
- Barrigada e pum propulsor não ficam ativos simultaneamente. Durante barrigada, bloquear o pum propulsor; um novo comando de barrigada pode encerrar um impulso aéreo. Confirmar o conforto dessa regra em testes.
- Dicas devem mostrar o comando do dispositivo em uso. O botão extra no celular precisa ser testado com o polegar sem cobrir a área útil do jogo.

## 3. Novos power-ups e itens

Preservar a identidade da Coca-Cola e do Kinhurine. Começar com poucos itens de efeito claro e acrescentar os demais depois de validar o equilíbrio.

| Item | Efeito inicial proposto | Introdução | Prioridade |
|---|---|---|---|
| **Café expresso** | Por 8 segundos, aumenta aceleração e velocidade máxima em cerca de 15%; não altera altura do pulo. | Centro da Cidade, antes de uma reta segura. | Primeira entrega |
| **Mochila acolchoada** | Absorve um golpe comum e se desfaz. Não impede morte por queda, esmagamento ou outros perigos fatais definidos pelo cenário. | Viagem de Ônibus. | Primeira entrega |
| **Ímã de troco** | Atrai moedas em até 3 blocos por 12 segundos, respeitando paredes. Não atrai comida, garras ou itens de missão. | Saindo de Casa, em trecho opcional. | Primeira entrega |
| **Marmita caprichada** | Recupera até 2 corações, respeitando o máximo; com vida cheia, concede pontos. | Escritório, em rota de exploração. | Expansão |
| **Hora extra** | Acrescenta 30 unidades ao cronômetro, limitado ao tempo inicial da fase. | Rotas opcionais longas. | Expansão |
| **Crachá de manutenção** | Abre uma sala bônus identificada da fase e é consumido ao abrir a porta. Nunca bloqueia a saída principal. | Escritório ou servidores. | Expansão |

### Coexistência, duração e morte

- Separar habilidades permanentes, arma Coca-Cola, proteção da mochila, bônus temporários e transformação Kinhurine.
- Permitir Coca-Cola, mochila e um bônus utilitário (café **ou** ímã) ao mesmo tempo. Um utilitário diferente substitui o anterior, com aviso curto; o mesmo item renova a duração sem somá-la indefinidamente.
- Durante Kinhurine, suspender o efeito e o contador do café/ímã, preservando o tempo restante. A mochila não é consumida por golpes ignorados pela invencibilidade.
- Fora da invencibilidade, a ordem proposta para um golpe comum é: consumir mochila; se não houver, perder Coca-Cola; se também não houver, perder coração. Conceder a proteção breve após dano sem aplicar dois consumos no mesmo golpe.
- Pausa, aba oculta, tutorial modal e cutscenes congelam os contadores. Mostrar quando um efeito está perto de terminar sem depender apenas de mudança de cor.
- Morte e mudança de fase removem café, ímã e mochila. Habilidades permanecem; a Coca-Cola segue sua regra atual até uma revisão específica de equilíbrio.
- Como continuar recarrega a fase/checkpoint, não restaurar bônus temporários ou mochila ao carregar: evita renovar proteção indefinidamente. Comunicar essa regra no menu de ajuda. Não salvar o crachá de manutenção além da tentativa atual da fase.
- Pontos e moedas de itens reaparecidos devem seguir regras que evitem farm infinito por recarregar checkpoint; definir o estado dos coletáveis junto da revisão do save.

## 4. Melhorias nas fases e nos desafios

| Fase | Mudanças propostas | Aplicação da progressão |
|---|---|---|
| Saindo de Casa | Trechos mais distintos entre quintais, vielas e travessias; primeiro segredo visível; apresentação simples do ímã. | Ensinar salto curto/longo e corrida antes de premiar o pulo duplo. |
| Viagem de Ônibus | Rotas pelos bancos e bagageiros, aviso visual mais claro das freadas e seção segura para praticar pulo duplo. | Rota baixa acessível e rota alta com recompensas; mochila antes de um encontro mais difícil. |
| Centro da Cidade | Travessias com janelas legíveis, atalhos entre andaimes e um pequeno desafio de pum propulsor. | Ensinar a distância do impulso antes de combiná-lo com carros ou plataformas que caem. |
| O Escritório | Caixas frágeis identificadas, interruptores de chão e impressoras com ciclos previsíveis. | Barrigada abre alternativas; combinar pulo duplo e pum propulsor em trechos opcionais. |
| Sala dos Servidores | Corredores que retomam habilidades, checkpoint antes da arena e sinais claros para os ataques do MEGA BUG. | Exigir domínio do que já foi ensinado; manter possibilidade de vencer sem Coca-Cola ou Kinhurine. |

- Organizar cada fase em apresentação, prática, combinação e conclusão, intercalando trechos intensos com áreas de descanso.
- Priorizar variedade e ritmo antes de aumentar novamente o comprimento dos mapas.
- Distribuir comida e checkpoints conforme duração e dificuldade reais, após observar partidas; considerar um segundo checkpoint nas fases mais demoradas.
- Caminhos opcionais devem voltar ao principal, com saída possível sem conservar um efeito temporário.
- Barrigada não quebra chão estrutural, checkpoint, chegada ou limites da arena. Pum propulsor para em paredes; pulo duplo respeita tetos e plataformas móveis.
- Após desbloquear mobilidade, revisar limites da câmera, ativação da arena e saídas para evitar pular gatilhos obrigatórios.

## 5. Outras melhorias propostas

### Exploração e vontade de rejogar

- **Lembranças do expediente:** três coletáveis únicos por fase, com localização fixa, registro permanente e contador na seleção de fases. Recoletar não duplica a recompensa permanente.
- **Desafios opcionais:** concluir sem morrer, encontrar todos os segredos ou bater um tempo de referência. Calibrar metas com partidas reais; não exigir todos ao mesmo tempo.
- **Recompensas cosméticas:** camisetas e detalhes visuais por coleção ou desafios, mantendo silhueta legível e indicação dos poderes ativos.
- **Salas bônus curtas:** um desafio de movimento com moedas ou cosmético, sem perda de progresso principal ao falhar.

### Inimigos e chefe

- Introduzir variações por comportamento: skatista que freia antes de investir, impressora com aviso antes da rajada e bug com proteção frontal vulnerável por cima.
- Reaproveitar personagens existentes antes de criar muitos tipos novos; ensinar cada comportamento isoladamente.
- Rever MEGA BUG para oferecer janelas de ataque claras e oportunidades de usar pum propulsor para esquivar e barrigada para atacar. Qualquer nova forma de dano precisa ter intervalo próprio para impedir múltiplos acertos por quadro.
- Manter duas etapas de combate na primeira revisão. Minichefes como Fiscal da Linha e Impressora do RH ficam para uma expansão, após validar a campanha principal.

### Clareza, conforto e acessibilidade

- Tela de pausa com habilidades desbloqueadas e comandos; mensagens de desbloqueio curtas, com demonstração que possa ser repetida.
- HUD compacto com ícone e duração do utilitário, indicador da mochila e sinal de recarga do pum propulsor; conferir legibilidade na resolução de gameplay de 256×224.
- Opções para reduzir tremor de câmera e flashes, além de volume separado de música e efeitos.
- Assistência opcional com mais tempo de fase e retomadas menos punitivas, sem conceder habilidades futuras antes de serem ensinadas.
- Sinais visuais para eventos sonoros importantes e símbolos diferentes para efeitos, sem depender exclusivamente da cor.

## 6. Plano técnico para uma futura implementação

| Área existente | Alteração futura prevista |
|---|---|
| `js/game.js` | Estados das habilidades, recargas, colisões, efeitos dos itens e ordem de resolução de dano. |
| `js/core.js` e `index.html` | Ação de pum propulsor e paridade entre teclado, controle e toque. |
| `css/style.css` | Espaço e legibilidade do botão adicional no celular. |
| `js/levels.js` | Tutoriais seguros, distribuição de itens, rotas opcionais e blocos frágeis com símbolo próprio. |
| `js/world.js` e `js/sprites.js` | Representação dos novos blocos, itens, movimentos e sinais visuais. |
| `js/main.js` | Desbloqueios, HUD, ajuda na pausa, conclusão, seleção de fases e entrada/retorno da cena de origem. |
| `js/cutscenes.js`, `js/introart.js` e `assets/cutscenes/` | Uma ilustração para a cena de origem, legendas sequenciais, animações discretas e comandos para avançar, pular e rever. |
| `js/save.js` | Versão e migração do save, habilidades da campanha, registro de cena vista/pulada, coleções do perfil e validação dos novos campos. |
| `js/audio.js` | Efeitos curtos e distinguíveis para habilidades e itens, incluindo ronco de barriga e pum. |
| `tools/` | Verificações dos novos comportamentos e, ao final da implementação, regeneração e validação do HTML offline. |

Diretrizes:

- Manter JavaScript puro e funcionamento offline; não introduzir servidor ou dependências de runtime para essa progressão.
- Usar identificadores estáveis para habilidades e itens, com parâmetros concentrados em configurações. Não misturar tudo no número `Game.power`, hoje usado pela Coca-Cola.
- Preservar o passo fixo de simulação de 60 quadros por segundo. Durações e recargas avançam apenas durante gameplay ativo.
- Versionar o save e validar o checksum original antes de migrar arquivos antigos. A migração deve contemplar também o `localStorage`, que armazena dados sem o envelope do arquivo exportado.
- Validar habilidades, coletáveis e estados incompatíveis; salvar o desbloqueio uma única vez e permitir retomar uma apresentação interrompida sem duplicar recompensas.
- Separar progresso da campanha de coleção/recordes do perfil. Projetar a seleção de fases para não destruir a campanha salva.
- Atualizar README e bundle somente quando as funcionalidades correspondentes existirem.

## 7. Ordem sugerida de entrega

Todas as etapas abaixo estão **pendentes**. Este documento não inicia nenhuma delas.

1. **Fundação da progressão:** definir estados, controles e migração de saves; preparar roteiro e apresentação da cena única de origem, tutoriais e feedback. Critério: continuar uma campanha antiga sem perder progresso nem receber habilidade futura indevidamente.
2. **Primeira fatia jogável:** integrar a cena de origem, desbloquear pulo duplo ao concluir o bairro e adaptar o início do ônibus. Critério: completar a sequência nos três tipos de controle, incluindo pulo da cena, morte e retomada.
3. **Mobilidade completa:** pum propulsor causado pelo Mumu, barrigada e passo firme, com adaptações das fases e revisão da arena. Critério: campanha inteira concluível com as habilidades previstas e sem power-up obrigatório.
4. **Primeiro conjunto de itens:** mochila, café e ímã, HUD e regras de coexistência. Critério: efeitos compreensíveis, sem dano duplicado, contadores incorretos ou combinações que eliminem os desafios.
5. **Exploração e conforto:** coletáveis, seleção de fases, desafios, opções de acessibilidade e ajuste de ritmo/checkpoints. Critério: replay preserva campanha e coleções e oferece motivos claros para voltar.
6. **Expansão opcional:** marmita, hora extra, salas com crachá, minichefes e cosméticos adicionais. Critério: acrescentar variedade após estabilizar a experiência principal.

## 8. Validação planejada — não executada

- Campanha completa com teclado, controle e toque, incluindo salto curto/longo, plataformas móveis, piso molhado e freadas.
- Desbloqueio único por marco, morte logo após desbloquear, game over, novo jogo, seleção de fase e retomada de save anterior à atualização.
- Exportação/importação, arquivos inválidos, checksum e migração do armazenamento local; preservar recordes e coleções conforme as regras propostas.
- Cena de origem exibida uma vez por campanha, legendas legíveis, avanço/pulo/reprodução manual, retomada após interrupção e compatibilidade com saves antigos; nenhuma habilidade é liberada apenas por assistir ou pular a cena.
- Pulo duplo sem recargas infinitas; pum propulsor sem atravessar paredes, causar dano ou exigir consumo de Mumu; barrigada sem quebrar estruturas ou conflitar com descer de plataforma.
- Interação de mochila, Coca-Cola e Kinhurine; nova coleta, fim de duração, pausa, aba oculta e cutscenes.
- Chefes e gatilhos obrigatórios acessíveis com a nova mobilidade, sem sair dos limites da arena ou causar dano repetido indevido.
- Legibilidade do HUD e conforto do botão extra no celular, inclusive com dois dedos pressionando movimento e ação.
- Regressões cobertas pelas ferramentas existentes de fases, pickups, cutscenes e Kinhurine; conferir também a versão HTML offline quando houver implementação.

## 9. Limites desta proposta

Não incluir nesta primeira evolução: multiplayer, ranking online, loja com moeda real, árvore extensa de atributos, geração procedural ou aumento geral do número de fases. Concentrar o trabalho em progressão perceptível, variedade e qualidade das cinco fases existentes.

Antes de cada futura entrega, revisar os valores sugeridos e o estado real do código. Este plano é uma proposta de direção e escopo, não um registro de funcionalidades prontas.
