# Auditoria automática da campanha

Revisão de 11/10/2026. Mapas e parâmetros do jogo; não mede conforto físico nem tempo de um jogador humano.

## Percurso e retomada

| Fase | Extensão (blocos) | Checkpoint (bloco) | Até objetivo/arena (blocos) | Inimigo mais próximo do ponto (blocos) | Blocos de comida + marmitas |
|---|---:|---:|---:|---:|---:|
| SAINDO DE CASA | 680 | 322 | 345 | 35.0 | 3 |
| VIAGEM DE ÔNIBUS | 680 | 322 | 344 | 7.9 | 2 |
| CENTRO DA CIDADE | 680 | 322 | 340 | 6.9 | 2 |
| O ESCRITÓRIO | 680 | 322 | 339 | 6.1 | 4 |
| SALA DOS SERVIDORES | 424 | 386 | 18 | 27.9 | 4 |

O primeiro acionamento do ponto recupera até um coração. A retomada usa o ponto já acionado e não repete a cura. O ponto da fase final fica a 18 blocos da arena. As demais fases mantêm o ponto próximo da metade.

## Dificuldades e chefe

| Modo | Tempo inicial em unidades | Limite de gameplay (minutos) | Vida do chefe | Aviso de salto (s) | Aviso de disparo/reforços (s) | Recuperação etapas 1 / 2 (s) |
|---|---:|---:|---:|---:|---:|---:|
| KINHU | 1500 | 20.0 | Sem chefe | — | — | — |
| FÁCIL | 1200 | 16.0 | 16 | 0.68 | 0.82 | 1.35 / 1.08 |
| NORMAL | 900 | 12.0 | 24 | 0.50 | 0.60 | 1.00 / 0.80 |
| DIFÍCIL | 750 | 10.0 | 32 | 0.40 | 0.48 | 0.80 / 0.63 |

O relógio reduz uma unidade a cada 48 quadros ativos. Assistência acrescenta 50% ao tempo inicial. Pausa e cutscenes não gastam tempo; o cronômetro também para depois da derrota do MEGA BUG, antes da coleta do troféu.

O chefe mantém duas etapas e a mesma vida por modo. A preparação fixa a mira; recuperação indicada por ▼. Pisão causa 4 de dano; barrigada durante a recuperação causa 6, com proteção contra acertos repetidos. Ondas e disparos usam a velocidade da dificuldade. Há no máximo três bugs de reforço ativos.

## Metas e limites da verificação

| Fase | Meta da medalha de tempo (minutos ativos) |
|---|---:|
| SAINDO DE CASA | 5.0 |
| VIAGEM DE ÔNIBUS | 5.0 |
| CENTRO DA CIDADE | 5.0 |
| O ESCRITÓRIO | 5.0 |
| SALA DOS SERVIDORES | 4.0 |

As metas atuais foram mantidas para preservar conquistas existentes e porque simulação de percurso rápido não mede exploração, experiência ou conforto humanos. Ajustes futuros devem usar tempos de partidas reais, sem revogar medalhas já conquistadas.

A auditoria não detectou falta de piso seguro no checkpoint ou necessidade geométrica de um segundo ponto. Isso não garante que o tempo de repetição seja confortável para todos os jogadores.

Validações complementares: `tools/test-boss-polish.js` (avisos, ataques, esquiva, recuperação, checkpoints e vitória com um tick restante); `tools/bot.js all inv noitems` (geometria, ignorando golpes comuns); boss sem itens/invencibilidade em fácil/normal e com `bossplan` no difícil. `tools/test-mobile-layout.js` verifica alvos e multitoque nativos em dez resoluções. Gamepad físico e conforto ao segurar o celular continuam sujeitos a uso humano.
