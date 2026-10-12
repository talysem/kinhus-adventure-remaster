'use strict';
// Auditoria determinística de mapas/tempos; não estima habilidade humana.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const lines = ['# Auditoria automática da campanha', '', 'Revisão de 11/10/2026. Mapas e parâmetros do jogo; não mede conforto físico nem tempo de um jogador humano.', '',
  '## Percurso e retomada', '', '| Fase | Extensão (blocos) | Checkpoint (bloco) | Até objetivo/arena (blocos) | Inimigo mais próximo do ponto (blocos) | Blocos de comida + marmitas |', '|---|---:|---:|---:|---:|---:|'];
Difficulty.select('normal');
for (let level = 0; level < LEVELS.length; level++) {
  Game.reset(); Game.levelIdx = level; loadLevel(level, false);
  assert.equal(World.cps.length, 1); const cp = World.cps[0];
  const floor = tileAt(Math.floor((cp.x + 8) / TS), Math.floor((cp.y + cp.h) / TS));
  assert(isSolid(floor) && floor !== '^', 'checkpoint em piso seguro');
  assert(!World.ents.some(e => e.enemy && Math.abs(e.x - cp.x) < 4 * TS), 'respiro de quatro blocos ao redor do ponto');
  const nearest = Math.min(...World.ents.filter(e => e.enemy).map(e => Math.abs(e.x - cp.x))) / TS;
  const food = World.map.flat().filter(tile => tile === 'H').length + World.ents.filter(e => e.item === 'lunch').length;
  lines.push(`| ${World.def.name} | ${World.w} | ${cp.x / TS} | ${Math.round(((World.goal || World.arena).x - cp.x) / TS)} | ${nearest.toFixed(1)} | ${food} |`);
  loadLevel(level, true); assert(World.cps[0].on); assert.equal(World.player.x, cp.x + 2);
}
lines.push('', 'O primeiro acionamento do ponto recupera até um coração. A retomada usa o ponto já acionado e não repete a cura. O ponto da fase final fica a 18 blocos da arena. As demais fases mantêm o ponto próximo da metade.', '',
  '## Dificuldades e chefe', '', '| Modo | Tempo inicial em unidades | Limite de gameplay (minutos) | Vida do chefe | Aviso de salto (s) | Aviso de disparo/reforços (s) | Recuperação etapas 1 / 2 (s) |', '|---|---:|---:|---:|---:|---:|---:|');
for (const id of Object.keys(Difficulty.modes)) {
  Difficulty.select(id); Game.reset(); const mode = Difficulty.current();
  Game.levelIdx = 4; loadLevel(4, false);
  if (!mode.enemies) assert(!World.boss && !World.ents.some(e => e.enemy));
  else assert.equal(World.boss.hp, mode.bossHP);
  const seconds = frames => (frames / 60).toFixed(2);
  lines.push(`| ${mode.name} | ${mode.time} | ${(mode.time * 48 / 60 / 60).toFixed(1)} | ${mode.bossHP || 'Sem chefe'} | ${mode.enemies ? seconds(bossWarningFrames('jump')) : '—'} | ${mode.enemies ? seconds(bossWarningFrames('spit')) : '—'} | ${mode.enemies ? seconds(Difficulty.frames(60)) + ' / ' + seconds(Difficulty.frames(48)) : '—'} |`);
}
lines.push('', 'O relógio reduz uma unidade a cada 48 quadros ativos. Assistência acrescenta 50% ao tempo inicial. Pausa e cutscenes não gastam tempo; o cronômetro também para depois da derrota do MEGA BUG, antes da coleta do troféu.', '',
  'O chefe mantém duas etapas e a mesma vida por modo. A preparação fixa a mira; recuperação indicada por ▼. Pisão causa 4 de dano; barrigada durante a recuperação causa 6, com proteção contra acertos repetidos. Ondas e disparos usam a velocidade da dificuldade. Há no máximo três bugs de reforço ativos.', '',
  '## Metas e limites da verificação', '', '| Fase | Meta da medalha de tempo (minutos ativos) |', '|---|---:|');
LEVELS.forEach((level, i) => lines.push(`| ${level.name} | ${(Exploration.targets[i] / 60).toFixed(1)} |`));
lines.push('', 'As metas atuais foram mantidas para preservar conquistas existentes e porque simulação de percurso rápido não mede exploração, experiência ou conforto humanos. Ajustes futuros devem usar tempos de partidas reais, sem revogar medalhas já conquistadas.', '',
  'A auditoria não detectou falta de piso seguro no checkpoint ou necessidade geométrica de um segundo ponto. Isso não garante que o tempo de repetição seja confortável para todos os jogadores.', '',
  'Validações complementares: `tools/test-boss-polish.js` (avisos, ataques, esquiva, recuperação, checkpoints e vitória com um tick restante); `tools/bot.js all inv noitems` (geometria, ignorando golpes comuns); boss sem itens/invencibilidade em fácil/normal e com `bossplan` no difícil. `tools/test-mobile-layout.js` verifica alvos e multitoque nativos em dez resoluções. Gamepad físico e conforto ao segurar o celular continuam sujeitos a uso humano.', '');
const output = path.join(root, 'docs/AUDITORIA-CAMPANHA.md'); fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, lines.join('\n'));
console.log(`OK${bundled ? ' (offline)' : ''}: cinco checkpoints seguros, retomada, quatro dificuldades e tempos; relatório em docs/AUDITORIA-CAMPANHA.md.`);
