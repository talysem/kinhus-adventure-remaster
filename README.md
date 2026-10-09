# Kinhu's Adventure

Jogo de plataforma em pixel art no estilo Super Nintendo, feito com HTML, CSS e JavaScript puros: sem frameworks, sem build e sem dependências. Roda direto no navegador e pode ser publicado de graça no **GitHub Pages**.

![Tela de título](assets/screens/01-titulo.png)

Pizza na barriga, conosquinhos e Coca: o home office do Kinhu era tranquilo demais. Até chegar a mensagem: **"ACABOU O HOME OFFICE, ESTEJA AMANHÃ NA EMPRESA"**. Segunda-feira, 07:42: o alarme toca e ele continua esparramado na cama. Ajude o Kinhu a pegar o ônibus, atravessar o centro da cidade e sobreviver a um dia de escritório, até enfrentar o **MEGA BUG** na sala dos servidores.

## Abertura em cutscenes

Ao escolher **NOVO JOGO**, uma sequência de cerca de 45 segundos apresenta a história em cinco cenas de pixel art, com oito ilustrações, poses expressivas, cortes entre quadros, movimentos de câmera, música e efeitos. A direção visual segue as aberturas ilustradas de aventuras dos anos 1990. A arte usa 384×256 pixels, apresentada em canvas de 768×672; o gameplay mantém 256×224.

![Prévia da abertura ilustrada](assets/screens/00-abertura-v2.png)

1. Kinhu come pizza com a caixa apoiada na barriga, no quarto bagunçado e ensolarado, até receber uma notificação.
2. Visto por trás, ergue os braços em desespero e cai com a cadeira. A câmera se aproxima da mensagem na tela.
3. A noite cai sobre a casinha e o dia amanhece.
4. Kinhu dorme esparramado, enquanto o despertador marca **07:42**, até perceber o atraso.
5. Sai correndo pela porta e o jogador assume na primeira fase.

**Enter, Espaço ou Z** avançam uma cena; **Esc ou X** pulam toda a abertura. No controle, **A** avança e **Start/B** pula. No celular, toque na tela ou em **A** para avançar, **Start/B** para pular. A sequência avança sozinha e congela ao ocultar a aba. **CONTINUAR** carrega o save diretamente, sem repetir a abertura.

| | |
|---|---|
| ![Bairro](assets/screens/02-bairro.png) | ![Ônibus](assets/screens/03-onibus.png) |
| ![Centro](assets/screens/04-centro.png) | ![Escritório](assets/screens/05-escritorio.png) |

## Fases

1. **Saindo de Casa** (07:42): calçada de pedra portuguesa, cachorros caramelo, pombos, baratas, muro com caco de vidro, córrego e uma rua com carros. Termina no ponto de ônibus, e o ônibus chega para buscar o Kinhu.
2. **Viagem de Ônibus** (07:55): dentro do ônibus lotado. Bancos, bagageiros, passageira com bolsa, trombadinha que rouba moedas e as **freadas**, **arrancadas** e **lombadas**, que empurram todo mundo.
3. **Centro da Cidade** (08:20): bueiros abertos, hidrante que espirra água, obra com peso de 1 tonelada caindo, tábuas que despencam, avenida movimentada e skatistas.
4. **O Escritório** (09:00): mesas, arquivos, impressoras que atiram papel, colegas estressados jogando aviãozinho, estagiário correndo com café, chão molhado, tachinhas, elevadores e bugs.
5. **Sala dos Servidores** (16:59): faíscas, água eletrificada e a luta contra o **MEGA BUG**.

Os percursos foram ampliados novamente com novos obstáculos e inimigos: as quatro primeiras fases têm **680 blocos de largura** (antes, 424), e a Sala dos Servidores tem **424** (antes, 232). Todas começam com **900 no cronômetro**. Os checkpoints ficam próximos da metade das fases comuns e antes da arena final. O **MEGA BUG tem 24 pontos de vida**, o dobro do original, e entra em fúria ao chegar a 12.

## Controles

| Ação | Teclado | Controle (gamepad) | Celular |
|---|---|---|---|
| Andar | Setas ou A / D | Direcional / analógico | ◀ ▶ |
| Pular (segure para ir mais alto) | Z, Espaço, ↑ ou W | A | A |
| Correr | X ou Shift | B / X | B |
| Arremessar latas (com Coca-Cola) | X | B / X | B |
| Descer de plataforma | ↓ + pular | ↓ + A | ▼ + A |
| Pausa / menu | Enter ou Esc | Start | START |
| Som | M | | |
| Tela cheia | F | | |

## Itens

- **Moeda**: 200 moedas dão uma vida extra; a contagem continua entre fases e fica salva.
- **Cachorro-quente**: recupera um coração.
- **Lata de Coca-Cola**: o Kinhu fica de camiseta vermelha e pode arremessar latas (tecla X). Se levar dano, perde só o poder da Coca-Cola. Segure o botão de pulo para alcançar os itens sobre os blocos.
- **Garras**: ativa o **modo Kinhurine**. Uma cena ilustrada de **4 segundos** mostra a energia se acumulando, três garras metálicas surgindo de cada punho e o grito enfurecido. A música muda para uma trilha de tensão, com som metálico nas garras e um grito sintetizado na pose final; a trilha baixa durante o grito. Depois entra o tema acelerado do poder. O cabelo arrepia e o Kinhu ganha **10 segundos de invencibilidade**. Mundo e poder ficam congelados durante a cena; Z, Enter, A do controle ou toque permitem pular.
- **Crachá 1UP**: vida extra rara, disponível apenas no Centro e no Escritório, um por fase.
- **Relógio de ponto**: é o checkpoint ("bateu o ponto!"). Se morrer, você volta dali.

O jogo começa com **3 tentativas e 3 corações**. Um combo de nove pisões seguidos concede uma única vida extra; os pisões seguintes do mesmo combo rendem pontos.

## Salvamento

- **Automático (cache do navegador)**: o jogo salva sozinho no `localStorage` ao começar cada fase, ao bater o ponto e ao terminar uma fase. Na tela inicial aparece **CONTINUAR**.
- **Arquivo de save (.json)**: na pausa (ou na tela inicial, ou pelos botões abaixo da tela) use **BAIXAR ARQUIVO DE SAVE**. É baixado um arquivo como `kinhus-adventure-save-20261007-0915.json`.
- **Carregar em outro lugar**: em outro computador ou navegador, use **CARREGAR ARQUIVO DE SAVE** e escolha o arquivo, ou simplesmente **arraste o arquivo para a página**. O jogo continua de onde você parou.
- O arquivo tem uma soma de verificação: se for corrompido ou editado à mão, o jogo recusa e avisa.

## Publicar no GitHub Pages (grátis)

O projeto já está pronto como repositório Git local (branch `main`). Para publicar:

1. Entre em [github.com/new](https://github.com/new) e crie um repositório **público** chamado `kinhus-adventure`, sem README, sem .gitignore e sem licença.
2. Nesta pasta, rode (troque `SEU-USUARIO` pelo seu usuário do GitHub):

   ```bash
   git remote add origin https://github.com/SEU-USUARIO/kinhus-adventure.git
   ```

   ```bash
   git push -u origin main
   ```

3. No GitHub, abra **Settings → Pages**. Em **Build and deployment**, escolha **Source: Deploy from a branch**, branch **main**, pasta **/ (root)** e clique em **Save**.
4. Depois de um ou dois minutos o jogo estará em:

   `https://SEU-USUARIO.github.io/kinhus-adventure/`

Sem usar Git: crie o repositório, clique em **Add file → Upload files**, arraste todo o conteúdo desta pasta (menos `.git`) e siga a partir do passo 3.

## Jogar localmente

Dá para abrir o `index.html` direto no navegador (duplo clique).

Também existe a versão em **arquivo único**: `dist/kinhus-adventure.html` (cerca de 4,1 MB, com tudo embutido, incluindo as cutscenes). Dá para mandar esse arquivo por e-mail ou WhatsApp e abrir em qualquer navegador, mesmo sem internet. Depois de mudar o código, gere de novo com:

```bash
node tools/bundle.js
```

Se preferir um servidor local:

```bash
python -m http.server 8765
```

Depois acesse `http://localhost:8765`.

## Estrutura

```
index.html          página do jogo (256×224 no gameplay; 768×672 nas cutscenes)
css/style.css       moldura, barra de opções e controles de toque
js/core.js          tela, entrada (teclado/controle/toque), fonte bitmap, ferramentas de pixel art
js/sprites.js       Kinhu, inimigos, itens e projéteis (pixel art desenhada em código)
js/world.js         temas, blocos, fundos com parallax, decoração, carros, ônibus, prédios
js/audio.js         sintetizador chiptune com eco estilo SNES, músicas e efeitos
js/levels.js        mapas das 5 fases (texto: cada caractere é um bloco de 16×16)
js/save.js          salvamento no navegador e arquivo de save .json
js/game.js          física, Kinhu, inimigos, itens, chefe, chegada nas fases
js/main.js          telas, menus, HUD, transições e laço principal (60 fps fixos)
js/title.js         tela de título: logo em pixel art com relevo e cena animada
js/cutscenes.js     abertura em cinco cenas: arte em camadas, animações, legendas e câmera
js/introart.js      carregamento e apresentação das novas ilustrações, câmera e texto sobreposto
js/kinhurine.js     transformação de 4 segundos ao coletar garras; retoma a mesma fase
assets/cutscenes/   ilustrações originais da abertura e Kinhurine, versões leves e prompts
tools/              ferramentas de desenvolvimento em Node (não são necessárias para jogar)
```

### Editando fases

Cada fase em `js/levels.js` é uma lista de segmentos com 14 linhas cada. A legenda completa está no topo do arquivo: `#` chão, `?` bloco de moeda, `c` moeda, `d` cachorro, `C` relógio de ponto, `G` chegada e assim por diante.

### Ferramentas (opcional, precisa de Node.js)

```bash
node tools/bot.js all
```

O robô de teste tenta zerar cada fase segurando "direita" e pulando obstáculos; use `inv` para ignorar dano.

```bash
node tools/test.js tools/out
```

Gera prints de todas as fases sem abrir o navegador. `tools/sheet.js`, `tools/scenes.js` e `tools/make-assets.js` geram folhas de sprites, cenas especiais, o ícone e os prints deste README.

`node tools/test-cutscenes.js` valida a abertura automática, os controles, o reinício, a pausa em aba oculta e a continuidade de saves; também gera `tools/out/cutscenes-storyboard.png` para conferir os enquadramentos.

`node tools/test-cutscenes.js --bundle` executa os mesmos testes no HTML offline, incluindo as oito imagens embutidas. Os testes também cobrem a troca de resolução, a espera pelo carregamento e o modo simples de segurança se uma imagem faltar. `node tools/prepare-cutscenes.js` regenera os PNGs leves em 384×256 a partir dos originais; depois rode o bundle novamente.

`node tools/test-kinhurine.js` testa a coleta real, o congelamento do mundo e do poder, retorno sem recarga, nova coleta, skip, aba oculta, saves e falha de carregamento das imagens. Acrescente `--bundle` para validar o HTML offline. Prévia: `assets/screens/07-kinhurine.png`. Direção de arte e prompts: `assets/cutscenes/KINHURINE-ART.md`.

`node tools/test-pickups.js` valida a altura dos pulos curto e longo e a coleta por pulo das latas em todos os blocos de bebida, além do arremesso e da perda do poder ao receber dano. Acrescente `--bundle` para testar o HTML offline.

`node tools/test-levels.js` valida as dimensões dos mapas ampliados, checkpoints, tempo, entrada na arena, vida e fúria do chefe, criação do troféu e equilíbrio das vidas extras (moedas, saves e combos). Acrescente `--bundle` para testar o HTML offline.

## Créditos

- Personagem inspirado no Kinhu de verdade: careca, barba, óculos e camiseta laranja.
- Logo, capa, sprites do gameplay, músicas e efeitos sonoros: gerados em código para este projeto.
- Ilustrações da abertura: criadas com ImageGen usando a referência de direção artística fornecida pelo usuário. Prompts e notas em `assets/cutscenes/ART-DIRECTION.md`.
