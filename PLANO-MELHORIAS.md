# Plano de melhorias — Kinhu's Adventure

Data: 09/10/2026. Atualizado em 11/10/2026.

**Status: etapas 1–6 implementadas. Etapa 6 concluída: marmita, hora extra, salas com crachá, minichefes e cosméticos.**
O save versão 6 preserva campanha, dificuldade, consumo de itens/visitas, coleção permanente, desafios e vitórias em minichefes, migrando os formatos 1–5. A abertura original permanece sem menção aos poderes, com origens individuais apenas nas aquisições. Mochila, café, ímã, marmita e hora extra estão ativos. Há quatro dificuldades, três lembranças por fase, desafios de replay, duas salas bônus, dois minichefes opcionais, quatro recompensas cosméticas e opções de conforto/volume/assistência. Não há entrega numerada pendente. Metas de tempo, equilíbrio e conforto seguem sujeitos a partidas reais; propostas complementares estão na seção 10.

## 1. Objetivo e situação atual

Fazer o jogador sentir que Kinhu aprende durante a aventura, com novas formas de atravessar os cenários, encontrar segredos e enfrentar inimigos. Manter o humor do trajeto de casa ao trabalho, a pixel art, a música chiptune e a facilidade de jogar no navegador e no celular.

Base observada no projeto:

- Cinco fases: Saindo de Casa, Viagem de Ônibus, Centro da Cidade, O Escritório e Sala dos Servidores.
- Movimento com corrida, pulo de altura variável e descida de plataformas; já existem tolerância para pular após sair da borda e memória breve do comando de pulo.
- Pulo duplo permanente ao concluir a primeira fase, aviso com demonstração e comandos do dispositivo ativo, ajuda na pausa e prática nos primeiros 32 blocos do ônibus.
- Quatro cenas de origem de aproximadamente 13 segundos, apenas na aquisição de cada habilidade. A abertura original segue diretamente ao bairro; a pausa oferece comandos e demonstrações das habilidades conquistadas.
- Coca-Cola permite arremessar latas e é perdida ao receber dano; Kinhurine oferece 10 segundos de invencibilidade, com transformação ilustrada.
- Moedas, comida, vida extra, checkpoints, plataformas móveis, perigos próprios de cada cenário e MEGA BUG com duas etapas de combate.
- Salvamento no navegador e importação/exportação de arquivo JSON no formato 6, com migração dos formatos 1–5.
- O código de `js/levels.js` e o README definem 900 no cronômetro; as quatro primeiras fases têm 680 blocos de largura e a última tem 424.

## 2. Progressão de habilidades permanentes

Desbloquear uma habilidade ao concluir cada uma das quatro primeiras fases. Mostrar a origem de cada poder individualmente, com sua própria ilustração, somente no desbloqueio correspondente. Exibir o comando na segunda legenda e oferecer prática segura no início da fase seguinte. O desbloqueio deve ocorrer junto do salvamento da conclusão, antes de qualquer transição que possa ser interrompida.

| Marco | Habilidade proposta | Funcionamento | Primeiro uso planejado |
|---|---|---|---|
| Concluir Saindo de Casa | **Pulo duplo — Perdi o ônibus!** | Um segundo impulso ao apertar pular novamente no ar. Recarrega ao pousar em superfície válida; não permite saltos infinitos. | Alcançar bagageiros no ônibus, corrigir saltos e buscar moedas em caminhos altos. |
| Concluir Viagem de Ônibus | **Pum propulsor — Foi o Mumu!** | Um pum impulsiona Kinhu horizontalmente, no chão ou no ar, sem invencibilidade. Origem: o Mumu (doce de leite) que ele comeu, apesar de ser intolerante à lactose. Proposta inicial: cerca de 3 blocos, recarga de 1 segundo e no máximo um impulso aéreo por salto. | Atravessar intervalos entre perigos no centro e alcançar atalhos laterais. |
| Concluir Centro da Cidade | **Barrigada — Licença, pessoal!** | No ar, baixo + um novo toque em pular inicia uma queda forte. Quebra apenas blocos identificados e atinge inimigos elegíveis por cima. | Abrir passagens entre caixas no escritório e acionar interruptores de chão. |
| Concluir O Escritório | **Passo firme — Veterano do expediente** | Melhoria passiva: reduz em aproximadamente 30% o recuo de golpes e a perda de controle em piso molhado. Preserva dano e perigos elétricos. | Melhorar o controle na sala dos servidores e durante o combate final. |
| Derrotar MEGA BUG | **Expediente encerrado** | Libera seleção de fases para desafios e busca de segredos com as habilidades conquistadas. | Rejogar cenários e completar a coleção; não acrescenta poder necessário à campanha. |

### Cenas individuais de aquisição — implementadas

A abertura original de cinco cenas e oito imagens permanece sem falar dos poderes. Ao concluir cada uma das quatro primeiras fases, a aquisição fica salva antes da comemoração; na transição para a próxima fase surge apenas a cena correspondente:

1. **Pulo duplo:** susto ao ver o ônibus saindo, ao concluir o bairro.
2. **Pum propulsor:** Mumu e intolerância à lactose dentro do ônibus, ao concluir a viagem.
3. **Barrigada:** queda de barriga sobre caixas, ao concluir o centro.
4. **Passo firme:** firmeza adquirida durante o expediente, ao concluir o escritório.

Cada cena usa uma imagem distinta e duas legendas: origem (7 segundos), depois comando e dicas (6 segundos). Avanço por confirmação e pulo por voltar/Start; aba oculta congela. Mundo, recargas e contadores não avançam durante a cena. A apresentação funciona sem som ou, como fallback, sem imagem.

Ver/pular é salvo individualmente. Morte, checkpoint e retomada não repetem cenas concluídas; uma aquisição interrompida volta do início ao continuar. Saves v1/v2 recebem os movimentos compatíveis com sua campanha, sem retrospectiva dos já adquiridos. Aquisições ainda pendentes no v2 são preservadas. Novo jogo reinicia esses estados. Não há replay narrativo no menu: **HABILIDADES / COMO USAR** mostra somente comandos, dicas e demonstrações do que já foi conquistado.

Originais e versões runtime: `assets/cutscenes/09…12-origem-*.png`; prompts em `assets/cutscenes/PROMPTS-PODERES.md`. A antiga ilustração única permanece apenas como arquivo histórico e não entra no jogo ou no bundle.

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
- Configuração de teclado implementada no menu inicial e pausa: clássico (setas/Z/X/C), WASD/J/K/L ou WASD/Espaço/Shift/E. Preferência salva no navegador; dicas e comandos acompanham o conjunto. Nos conjuntos WASD, W não dispara pulo.
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

**Implementado no início da etapa 6:** duas marmitas (escritório/servidores) e três horas extras (centro/escritório/servidores), em desvios altos existentes. Marmita recupera até dois corações; vida cheia concede 1000 pontos. Hora extra recupera até 30 unidades, limitada ao tempo inicial da dificuldade/assistência; não reduz o tempo ativo dos desafios. Ao subir acima de 100, desativa a urgência, que pode retornar em nova contagem regressiva. Efeitos imediatos preservam os poderes e utilitários. Consumo registrado nos IDs existentes do save v5, sem mudança de formato; não reaparecem após morte, reinício ou retomada da fase. Novo jogo/replay renova a coleta. Ícones próprios, mensagem de coleta e terceira página da ajuda disponíveis.

**Salas com crachá implementadas na etapa 6:** Arquivo de Manutenção (escritório) e Passarela de Manutenção (servidores). Crachá em desvio alto, porta sinalizada, cima para entrar/sair e acesso sempre opcional. Uma tentativa por sala na partida da fase, registrada ao entrar no save v5. Crachá consumido na entrada e não salvo; reaparece ao retomar se a sala ainda não foi usada. Cada sala tem 45 segundos, dez moedas e +1000 pontos pela porta final. Moedas recolhidas permanecem mesmo após saída antecipada, queda/dano ou tempo esgotado; falhar não reduz vidas/corações nem registra morte. Fase principal e contadores de poderes ficam congelados; tempo ativo dos desafios continua contando. Pausa/aba oculta congelam a sala. Retorno à porta preserva mapa, inimigos, projéteis, checkpoint, poderes e inventário. Retomar um save dentro dela restaura a fase principal, preserva recompensas e registra a visita como usada. Novo jogo/replay renova o acesso. Quarta página da ajuda e saída dedicada na pausa.

### Coexistência, duração e morte

**Primeiro conjunto implementado na etapa 4:** ímã opcional no bairro, mochila no ônibus, café na reta inicial do centro e pequenas combinações no escritório/servidores. Ícones próprios no cenário e HUD, mochila visível no personagem e contador com `!` nos dois segundos finais. Ajuda dos itens na segunda página e na pausa. Coletáveis fixos consumidos ficam registrados até mudar de fase ou começar novo jogo/replay; recarregar não renova recompensas nem restaura mochila/utilitários. Esmagamento contra o chão é fatal, mesmo com mochila ou Kinhurine.

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

**Implementado na etapa 5:** postal, bilhete e disquete em posições fixas, três por fase. A coleção do perfil persiste após morte, retomada e novo jogo. Primeira coleta concede 500 pontos; repetir no replay conta para a partida, sem duplicar a recompensa. A seleção mostra coleção, desafios, melhor tempo, dificuldade/assistência e poderes disponíveis; o replay preserva a campanha salva.

Desafios independentes: concluir sem morrer, recolher as três lembranças na mesma partida ou concluir em até 5 minutos nas fases 1–4/4 minutos na fase 5. Somente tempo de gameplay ativo conta. Mortes, tempo e lembranças da partida persistem na retomada. Recordes ficam separados por dificuldade e assistência. Saves antigos continuam a campanha com coleção vazia; desafios de tempo/sem mortes exigem uma partida nova, porque não há histórico confiável anterior. Importar saves une coleções e melhores recordes, sem inventar conquistas. Metas são iniciais, aguardando calibração humana.

- **Lembranças do expediente:** três coletáveis únicos por fase, com localização fixa, registro permanente e contador na seleção de fases. Recoletar não duplica a recompensa permanente.
- **Desafios opcionais:** concluir sem morrer, encontrar todos os segredos ou bater um tempo de referência. Calibrar metas com partidas reais; não exigir todos ao mesmo tempo.
- **Recompensas cosméticas — implementadas:** camisetas azul (3 lembranças), verde (15 lembranças), roxa (3 medalhas distintas por fase/meta) e crachá dourado (vitória nos dois minichefes). Prévia/metas em CONFIGURAÇÕES → VISUAL DO KINHU; escolha local persistente. Silhueta, colisão, física e habilidades preservadas. Coca-Cola/Kinhurine mantêm os próprios visuais. Desbloqueios derivam do perfil e persistem em novo jogo/importação.
- **Salas bônus curtas — implementadas:** duas salas de movimento com moedas, sem perda de progresso principal ao falhar. Cosméticos adicionais também implementados.

### Inimigos e chefe

- Introduzir variações por comportamento: skatista que freia antes de investir, impressora com aviso antes da rajada e bug com proteção frontal vulnerável por cima.
- Reaproveitar personagens existentes antes de criar muitos tipos novos; ensinar cada comportamento isoladamente.
- Rever MEGA BUG para oferecer janelas de ataque claras e oportunidades de usar pum propulsor para esquivar e barrigada para atacar. Qualquer nova forma de dano precisa ter intervalo próprio para impedir múltiplos acertos por quadro.
- Manter duas etapas do MEGA BUG. **Fiscal da Linha e Impressora do RH implementados na etapa 6:** portas DESAFIO no ônibus/escritório, cima para entrar, sem crachá e sem bloqueio da rota principal. Aviso visual, ataque e recuperação vulnerável indicada por ▼. Fiscal investe; RH dispara três papéis. Pisão/lata causa um ponto; barrigada causa dois, respeitando 40 quadros entre acertos. Vida fácil/normal/difícil: Fiscal 4/6/8, RH 6/8/10. Os dois são vencíveis sem itens temporários.

Confrontos opcionais de 90 segundos, três corações próprios e uma tentativa por partida da fase. Falha/saída preserva vida, corações, checkpoint e poderes da campanha; o tempo ativo dos desafios conta o confronto. Modo Kinhu não apresenta portas/inimigos. Vitória: +3000 pontos e registro permanente no perfil, usado para o crachá dourado. Save v6 migra v1–v5, preserva coleção/desafios e une vitórias válidas ao importar; saves antigos não ganham vitórias por migração. Replay permite conquistar o registro sem sobrescrever campanha. Quinta página da ajuda e saída dedicada na pausa.

### Clareza, conforto e acessibilidade

**Implementado na etapa 5:** **CONFIGURAÇÕES → ACESSIBILIDADE** no título e pausa, com tremor reduzido e flashes reduzidos; **CONFIGURAÇÕES → ÁUDIO** oferece volumes independentes de música/efeitos (0–100%). Preferências locais persistentes, sem alterar colisões ou invulnerabilidade. Redução de flashes mantém Kinhu visível durante proteção, indicado por um círculo, fixa cores de Kinhurine e efeitos elétricos e remove piscadas de avisos. Tremor é suprimido também nas cenas. Plataforma prestes a cair e emissores antes de disparar têm `!` visual.

Assistência opcional: +50% no tempo inicial, morte após bater o ponto não consome tentativa e retomada com corações cheios. Antes do checkpoint, a morte continua consumindo tentativa. Nenhuma habilidade futura é concedida. A escolha vale para novas partidas e replay; a campanha salva conserva seu estado. Trocar na pausa recarrega do ponto e desabilita desafios de tempo/sem mortes até a próxima fase ou nova partida completa. Os checkpoints atuais foram mantidos; o conforto das retomadas pode ser ajustado sem reabrir a geometria dos cenários.

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

As etapas 1–6 estão concluídas. Implementação encerrada; calibração em partidas reais e refinamentos complementares seguem na seção 10.

1. **Fundação da progressão — concluída em 11/10/2026:** estados, controles e migração de saves implementados; roteiro e contratos da cena, tutoriais e feedback preparados em `js/progression.js` e `assets/cutscenes/ORIGEM-PODERES.md`. A seleção de fases preserva a campanha. Verificação automatizada: saves antigos continuam sem perda de progresso ou concessão de habilidades futuras.
2. **Primeira fatia jogável — concluída em 11/10/2026:** pulo duplo ativo ao concluir o bairro, agora com origem individual persistente, demonstração na pausa e prática segura no ônibus. Verificação automatizada com entrada de teclado, gamepad e toque: pulo/avanço da cena, desbloqueio, interrupção do aviso, morte, retomada e coleta dos bagageiros. A ilustração, o bundle offline e a documentação estão atualizados.
3. **Mobilidade completa — concluída em 11/10/2026:** pum propulsor causado pelo Mumu, barrigada e passo firme, com adaptações das fases e revisão da arena. Pum de 3 blocos/12 quadros, recarga de 60 quadros e um uso aéreo; barrigada em caixas F e botões R; passo firme com redução de 30%. Trechos seguros nos inícios das fases 3/4/5 e avisos de ataques do chefe. Geometria dos cinco cenários validada sem itens temporários; equilíbrio em partidas humanas permanece em avaliação.
4. **Primeiro conjunto de itens — concluída em 11/10/2026:** mochila, café de 8 segundos/+15% sem aumento de pulo e ímã de 12 segundos/3 blocos respeitando paredes. HUD, ajuda, coexistência, suspensão durante Kinhurine, limpeza ao morrer/retomar e consumo persistente no save v4. Quatro modos de dificuldade acrescentados ao menu e à pausa.
5. **Exploração e conforto — concluída em 11/10/2026:** 15 lembranças fixas com coleção permanente, seleção de fases com contadores/poderes/desafios, medalhas independentes e melhor tempo por modo, volumes separados, tremor/flashes reduzidos e assistência de tempo/retomada. Save v5 mantém campanha separada do perfil; replay e importação preservam coleção. Metas aguardam calibração em partidas humanas.
6. **Expansão opcional — concluída em 11/10/2026:** marmita, hora extra, duas salas com crachá, Fiscal da Linha e Impressora do RH opcionais, três camisetas e crachá dourado por coleção/medalhas/vitórias. Save v6 preserva campanha e perfil; confrontos isolados usam corações próprios. Critério técnico atendido: variedade opcional, campanha preservada, vitórias sem itens e testes no fonte/offline. Equilíbrio humano permanece em avaliação.

## 8. Validação

**Executada na etapa 1:** migração de arquivos e armazenamento local v1→v2, checksum antes da migração, manutenção de fase/checkpoint/inventário/recorde, perfil liberado sem poderes futuros, validação dos novos campos, conclusão idempotente, exportação durante comemoração, morte/game over/retomada/novo jogo, preservação da campanha durante replay e paridade da ação C/RB/toque. Roteiro e feedback conferidos quanto à largura das legendas. Ferramenta: `tools/test-progression.js`, também no HTML offline. Regressões de fases, pickups, abertura e Kinhurine cobertas pelas ferramentas existentes.

**Executada na etapa 2:** `tools/test-double-jump.js` verifica a sequência com teclado/gamepad/toque, salto extra único, necessidade de soltar o botão, teto, plataforma móvel, descida de plataforma, recarga ao pousar, bagageiros, freadas suspensas na prática, cena automática, avanço/pulo, aba oculta, fallback, interrupção e retomada, ajuda na pausa sem alteração do mundo/save e continuidade de saves v1. As prévias renderizadas foram inspecionadas. Testes de progressão, fases, pickups, abertura e Kinhurine executados no código fonte e no HTML offline. O conforto em dispositivos físicos segue para avaliação em partidas reais.

**Executada na etapa 3:** `tools/test-mobility.js` cobre alcance e recarga do pum, limites aéreos, paredes, dano, conflito com barrigada, caixas marcadas, interruptores idempotentes, estruturas preservadas, descida de plataformas, redução de recuo/deslizamento, perigos fatais e dano do chefe. A sequência completa de aquisições é exercitada com teclado/gamepad/toque, interrupção, retomada e persistência individual. `tools/test-levels.js` verifica também a queda e coleta do troféu após o chefe. Prévia das quatro cenas e ajuda inspecionadas. `tools/bot.js all inv noitems` conclui os cinco cenários sem itens temporários; ignora golpes comuns para medir geometria, mantendo queda/líquido fatais. Isso não substitui teste humano de dificuldade. Testes executados no fonte e bundle offline.

**Configuração de controles:** `tools/test-controls.js` verifica seleção pelo menu, persistência/fallback, ausência de ações residuais após troca, comandos dos três conjuntos na física real, dicas e ajuda, pausa sem avançar o mundo, gamepad/toque e campanha preservada. Prévias do menu inspecionadas. Código fonte e HTML offline validados.

**Organização da GUI:** menus inicial e de pausa com até seis entradas; configurações agrupadas em controles, jogabilidade, áudio e acessibilidade. Saves e guia têm submenus próprios. Destaque, descrição, mouse/toque e retorno com seleção preservada. `tools/test-menus.js` verifica navegação, áreas de clique, acesso aos arquivos e pausa nos submenus; prévias visuais inspecionadas.

**Ajuste dos controles mobile:** setas de 52–62 px e ações de 64–84 px, grupos centralizados em retrato e aproximados da largura real do jogo em paisagem. A cruz completa reconhece diagonais e tem centro neutro; ações toleram 12 px nas áreas livres. Multitoque, retap entre quadros, captura indisponível e soltura/cancelamento tratados. `tools/test-mobile.js` cobre as entradas; `tools/test-mobile-layout.js` verifica layout e eventos nativos em Chromium em dez resoluções, do celular compacto ao tablet, sem cobrir o canvas. Fonte e offline validados; conforto físico continua sujeito a partidas reais. Visual do ladrão atualizado para idoso com barba/chapéu brancos, faixa preta e camiseta vermelha com estrela branca, sem mudar a colisão/comportamento.

**Validações futuras da campanha completa:**

- Campanha completa com teclado, controle e toque, incluindo salto curto/longo, plataformas móveis, piso molhado e freadas.
- Desbloqueio único por marco, morte logo após desbloquear, game over, novo jogo, seleção de fase e retomada de save anterior à atualização.
- Exportação/importação, arquivos inválidos, checksum e migração do armazenamento local; preservar recordes e coleções conforme as regras propostas.
- Cada origem exibida só na aquisição correspondente, legendas legíveis, avanço/pulo, retomada após interrupção e compatibilidade com saves antigos; nenhuma habilidade é liberada apenas por assistir ou pular a cena.
- Pulo duplo sem recargas infinitas; pum propulsor sem atravessar paredes, causar dano ou exigir consumo de Mumu; barrigada sem quebrar estruturas ou conflitar com descer de plataforma.
- Interação de mochila, Coca-Cola e Kinhurine; nova coleta, fim de duração, pausa, aba oculta e cutscenes.
- Chefes e gatilhos obrigatórios acessíveis com a nova mobilidade, sem sair dos limites da arena ou causar dano repetido indevido.
- Legibilidade do HUD e conforto do botão extra no celular, inclusive com dois dedos pressionando movimento e ação.
- Regressões cobertas pelas ferramentas existentes de fases, pickups, cutscenes e Kinhurine; conferir também a versão HTML offline quando houver implementação.

## 9. Limites desta proposta

Não incluir nesta primeira evolução: multiplayer, ranking online, loja com moeda real, árvore extensa de atributos, geração procedural ou aumento geral do número de fases. Concentrar o trabalho em progressão perceptível, variedade e qualidade das cinco fases existentes.

Antes de cada futura entrega, revisar os valores sugeridos e o estado real do código. Este plano registra as etapas 1–6 concluídas. Somente os itens marcados como implementados ou concluídos estão prontos; sugestões complementares não fazem parte dessa conclusão.


**Executada na etapa 4 e dificuldade:** `tools/test-items-difficulty.js` verifica duração exata, renovação/troca, coexistência, ordem de dano e proteção breve, perigos fatais, aceleração/velocidade e altura do salto, raio/parede/moedas soltas do ímã, congelamento durante pausa/aba oculta/origem/transformação, consumo sem reaparecimento, save v4 e migração v3. Verifica os quatro modos, preferências, retomada mantendo o modo salvo, troca na pausa, replay preservando campanha e conclusão sem chefe no Kinhu. Prévias de ajuda, HUD e dificuldade inspecionadas; regressões no fonte e HTML offline e cinco fases concluídas pelo bot sem itens temporários.

### Dificuldade implementada

| Modo | Tentativas iniciais | Tempo | Inimigos | Vida do chefe |
|---|---:|---:|---|---:|
| Kinhu | 9 | 1500 | Ausentes; emissores de projéteis hostis desativados | Sem chefe; troféu acessível |
| Fácil | 5 | 1200 | Movimento a 75%, intervalo de ataques a 135% | 16 |
| Normal | 3 | 900 | Valores originais | 24 |
| Difícil | 2 | 750 | Movimento a 120%, intervalo de ataques a 80% | 32 |

Todos mantêm três corações. Proteção breve após golpe: 3 segundos no Kinhu/fácil, 2 no normal e 1,5 no difícil. Kinhu mantém perigos ambientais como buracos, líquido, espinhos, pesos e trânsito. A escolha no menu inicial vale para novo jogo e replay; **CONTINUAR** usa o modo da campanha salva. Trocar na pausa recarrega a fase/ponto com os valores do novo modo, removendo os itens temporários e mantendo habilidades e consumo dos coletáveis. O menu comunica isso antes da escolha.

**Executada na etapa 5:** `tools/test-exploration.js` alcança as 15 lembranças com movimento, salto e colisões reais; verifica morte/retomada, pontos apenas na primeira coleta, coleção mantida após novo jogo/replay, campanha preservada, conquistas independentes e categorias, tempo ativo congelado em pausa/cenas/aba oculta, save v5, migração v4, checksum antes da migração, união de coleções/recordes, validação de IDs e históricos, assistência sem habilidades futuras e preservada no save, volume independente e invulnerabilidade com flashes reduzidos. Prévias de seleção, conforto, assistência, pausa e exploração inspecionadas. Regressões executadas no fonte e no bundle offline. Geometria dos cinco cenários validada pelo bot sem itens temporários.

**Executada no início da etapa 6:** `tools/test-expansion-items.js` verifica cura limitada/pontos da marmita, hora extra nos quatro modos com/sem assistência, teto e fração do cronômetro, retorno do aviso de urgência, tempo ativo dos desafios preservado, coexistência com poderes, bloqueio após morte, acesso aos cinco itens por saltos reais e retorno ao chão. Consumo preservado após checkpoint/morte/importação, sem duplicar recompensa; replay preserva a campanha. Terceira página da ajuda e sprites inspecionados. Código fonte e bundle offline validados.

**Executada para salas bônus:** `tools/test-bonus.js` verifica acesso aos crachás/portas, entrada por teclado/gamepad/toque, acesso às vinte moedas e travessia completa dos dois layouts usando entrada e colisões reais. Cobre congelamento da fase/inventário, contagem de tempo dos desafios, pausa/aba oculta, saída antecipada, queda/dano/tempo sem perda de vida/coração/mortes, recompensas, consumo da sala salvo antes da entrada, retomada/importação, crachá não salvo, replay preservando campanha, ajuda e troca de dificuldade. Prévias das portas, salas, pausa e ajuda inspecionadas. Regressões no fonte e bundle offline.

**Executada ao finalizar a etapa 6:** `tools/test-stage-six.js` verifica HP, avisos, ataques, recuperação e intervalo de 40 quadros nos três modos com inimigos; ausência no Kinhu; latas/barrigada; vitórias dos dois minichefes por comandos e física reais, sem itens/invencibilidade. Preserva campanha/inventário/checkpoint, conta o tempo ativo e congela em pausa/aba oculta. Testa quatro cosméticos, metas sem duplicar medalhas entre modos, escolha persistente, física/colisão preservadas e prioridade visual de Coca/Kinhurine. Migração v5→v6 de arquivo e localStorage, união/sanitização de vitórias, novo jogo e replay. Portas/lutas/roupas/ajuda inspecionadas. Regressões e bundle offline validados.

## 10. Depois das seis etapas

**Refinamentos complementares implementados:** skatista com freada e aviso `!`, investida em direção fixa, recuperação `▼` e recarga; respeita paredes/bordas e não detecta através de blocos. Bug com escudo frontal introduzido em duas posições seguras do escritório/servidores: latas pela frente são bloqueadas; pisão/barrigada, latas pelas costas e Kinhurine vencem a proteção. Bugs comuns preservados, inimigos ausentes no Kinhu e guia ampliado dentro das seis entradas. `tools/test-enemy-behaviors.js` valida comportamento, modos, colisões, ataques, congelamento e ajuda no fonte/offline. Bot concluiu os cinco cenários sem itens temporários, ignorando golpes comuns para conferir o percurso; dificuldade humana ainda precisa de avaliação.

**Correção identificada na campanha humana:** ao concluir a última fase, o índice avançava para uma sexta fase inexistente enquanto o HUD ainda desenhava o mundo anterior. A exceção parava o RAF logo após o troféu/pontuação. O índice final permanece válido e o HUD consulta a fase visível durante as transições. `tools/test-ending.js` cobre queda/coleta, pontuação, fade com desenho, créditos e retorno ao menu em quatro dificuldades, campanha/replay e controles teclado/toque/gamepad, incluindo persistência da vitória e preservação de campanha no replay. Fonte/offline validados; `tools/test-ending-browser.js` confirma RAF/áudio reais e vitória após recarregar em Chromium isolado.

Não há etapa numerada pendente. Permanecem **validações humanas e sugestões complementares**, que não foram marcadas como implementadas:

- Jogar a campanha e os confrontos com teclado, gamepad físico e celular; avaliar alcance das ações, legibilidade e conforto de dois dedos.
- Calibrar tempos de medalhas, dificuldades, comida, recargas e distribuição de checkpoints. Considerar segundo checkpoint somente se partidas reais indicarem necessidade.
- Revisar ritmo, descanso e variedade das cinco fases usando observações dessas partidas.
- Ajustes adicionais do MEGA BUG podem seguir após avaliar suas duas etapas e janelas atuais. Não representam uma sétima etapa já planejada.
