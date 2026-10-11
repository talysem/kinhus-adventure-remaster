'use strict';
// Valida mapas ampliados, retomada de checkpoints e o ciclo completo do chefe.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..');
const bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);

for (const [i, def] of LEVELS.entries()) {
  for (const seg of def.segs) {
    assert.equal(seg.length, 14);
    assert(seg.every(row => row.length === seg[0].length), `fase ${i + 1}: linhas alinhadas`);
  }
  const rows = buildLevelRows(def), tiles = rows.join('');
  const count = ch => [...tiles].filter(tile => tile === ch).length;
  assert(rows[0].length >= (def.boss ? 424 : 680), 'mapa deve manter a nova extensão');
  assert.equal(count('L'), i === 2 || i === 3 ? 1 : 0, '1UP somente nas duas fases avançadas');
  assert.equal(count('P'), 1); assert.equal(count('C'), 1);
  assert.equal(count('G'), def.boss ? 0 : 1);
  assert.equal(count('A'), def.boss ? 1 : 0);
  assert.equal(count('W'), def.boss ? 1 : 0);
  assert(def.time >= 900);
  Game.reset(); Game.levelIdx = i;
  loadLevel(i, false);
  assert.equal(World.player.x, World.start.x);
  const cpX = World.cps[0].x;
  if (def.boss) assert(World.arena.x - cpX < 32 * TS, 'checkpoint deve continuar perto do chefe');
  else assert(cpX > World.w * TS * 0.4 && cpX < World.w * TS * 0.6, 'checkpoint deve ficar perto da metade');
  loadLevel(i, true);
  assert.equal(World.player.x, cpX + 2);
  assert(World.cps[0].on);
  assert(isSolid(tileAt(Math.floor(World.player.x / TS), 12)), 'retomada em piso seguro');
  console.log(`OK: fase ${i + 1}, ${rows[0].length} blocos, checkpoint e tempo.`);
}

Game.reset(); Game.levelIdx = 4; loadLevel(4, true); App.state = 'play';
World.player.x = World.arena.x + 24;
updateWorld();
assert(World.bossFight && World.arena.active);
assert.equal(World.cam.lock, World.arena.x);
const boss = World.boss;
assert.equal(boss.hp, 24); assert.equal(boss.maxHp, 24);
boss.state = 'walk';
hitBoss(boss, 4);
hitBoss(boss, 4);
assert.equal(boss.hp, 20, 'invulnerabilidade impede dano duplicado');
for (let stomp = 2; stomp <= 6; stomp++) {
  boss.inv = 0; hitBoss(boss, 4);
  assert.equal(boss.hp, 24 - stomp * 4);
  assert.equal(boss.phase, stomp < 3 ? 1 : 2, 'fúria começa em 50% da vida');
  assert.equal(boss.state === 'dead', stomp === 6, 'são necessários seis pisões');
}
for (let frame = 0; frame < 140; frame++) updateBoss(boss, World.player);
assert.equal(World.ents.filter(e => e.kind === 'item' && e.item === 'trophy').length, 1);
const trophy = World.ents.find(e => e.item === 'trophy');
World.player.x = trophy.x; World.player.y = 12 * TS - World.player.h;
for (let frame = 0; frame < 150 && trophy.alive; frame++) updateItem(trophy, World.player);
assert(!trophy.alive && World.clear && Game.completed, 'troféu atravessa a saída do teto e pode ser coletado no chão');
console.log(`OK${bundled ? ' (offline)' : ''}: arena, 24 HP, invulnerabilidade, fúria e troféu.`);

// Vidas extras exigem 200 moedas; o progresso de três dígitos sobrevive ao save.
Game.reset(); loadLevel(0, false);
for (let coin = 0; coin < 199; coin++) addCoin(40, 160);
assert.equal(Game.lives, 3); assert.equal(Game.coins, 199);
assert.equal(Game.hearts, 3);
App.saveProgress(false, true);
const saved = Save.fileText();
assert(Save.importText(saved).ok);
assert.equal(Save.data.run.coins, 199);
Game.coins = 0; App.continueRun();
assert.equal(Game.coins, 199);
addCoin(40, 160);
assert.equal(Game.lives, 4); assert.equal(Game.coins, 0);
assert.equal(Game.score, 20000);
assert.equal(Save.sanitize({ run: { coins: 75 } }).run.coins, 75, 'save antigo continua válido');
assert.equal(Save.sanitize({ run: { coins: 999 } }).run.coins, 199);
assert(97 + Font.width('×199') < 128, 'contador não deve invadir o placar');

// Combos longos continuam dando pontos, mas só concedem uma tentativa extra.
Game.reset(); loadLevel(0, false);
for (let stomp = 1; stomp <= 20; stomp++) {
  killEnemy(addEnt(makeEnemy('u', 100, 192)), 'stomp');
  assert.equal(Game.lives, stomp < 9 ? 3 : 4);
  assert(Number.isFinite(Game.score));
}
const comboScore = Game.score;
World.player.combo = 0;
for (let stomp = 0; stomp < 9; stomp++) killEnemy(addEnt(makeEnemy('u', 100, 192)), 'stomp');
assert.equal(Game.lives, 5, 'outro combo permite uma nova recompensa');
assert(Game.score > comboScore);
console.log(`OK${bundled ? ' (offline)' : ''}: 200 moedas por vida, save, HUD e uma vida por combo.`);
