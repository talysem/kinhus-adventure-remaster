'use strict';
// Exercita a física real: bater em cada bloco H e coletar a lata com outro pulo.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { boot, SoftCanvas } = require('./softcanvas');
const root = path.join(__dirname, '..');
const bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const tick = (keys = {}) => {
  Input.prev = Input.cur; Input.cur = keys;
  World.t++;
  updatePlayer(World.player);
  for (const e of World.ents) if (e.kind === 'item') updateItem(e, World.player);
};
const start = (level, x) => {
  Game.reset(); Game.levelIdx = level; loadLevel(level, false);
  // Inimigos não participam da medição de alcance; blocos e colisões são os reais.
  World.ents = []; World.player = makePlayer(x, 12 * TS - 21);
  Input.cur = {}; Input.prev = {}; tick();
};
function jumpHeight(holdFrames) {
  start(0, 40);
  const y = World.player.y;
  let peak = y;
  for (let t = 0; t < 100; t++) { tick({ jump: t < holdFrames }); peak = Math.min(peak, World.player.y); }
  assert(World.player.onGround);
  return y - peak;
}
const short = jumpHeight(1), high = jumpHeight(100);
assert(high >= 88 && high <= 96, `pulo longo: ${high}`);
assert(short < high - 25, 'soltar o botão ainda deve produzir pulo curto');
const targets = [];
LEVELS.forEach((def, level) => buildLevelRows(def).forEach((row, y) => {
  [...row].forEach((tile, x) => { if (tile === 'H') targets.push({ level, x, y }); });
}));
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
for (const target of targets) {
  const { level, x, y } = target;
  start(level, x * TS + 2);
  for (let t = 0; t < 90; t++) tick({ jump: t < 35 });
  const item = World.ents.find(e => e.item === 'coca');
  assert(item && item.alive, `fase ${level + 1}, bloco ${x},${y}: deve liberar Coca-Cola`);
  assert.equal(tileAt(x, y), 'U');
  let edge = x;
  while (isSolid(tileAt(edge, y))) edge++;
  for (let t = 0; t < 100 && World.player.x < edge * TS + 3; t++) tick({ right: true });
  assert(World.player.x >= edge * TS, 'deve alcançar o lado dos blocos pelo chão');
  for (let t = 0; t < 20; t++) tick();
  // Sobe ao lado da fileira e vira para a lata quando os pés passam do topo.
  for (let t = 0; t < 90 && Game.power === 0; t++) tick({ jump: true, left: t >= 12 });
  assert.equal(Game.power, 1, `fase ${level + 1}, bloco ${x},${y}: lata deve ser coletável`);
  assert.equal(item.alive, false);
  assert.equal(Game.score, 1000);
  const p = World.player;
  tick({ run: true });
  assert(World.projs.some(b => b.type === 'can'), 'poder deve arremessar latas');
  updateProjs();
  World.cam.x = Math.max(0, p.x - 120);
  drawWorld(); App.drawHUD();
  if (level === 0) fs.writeFileSync(path.join(out, 'coca-pickup.png'), screen.toPNG());
  p.inv = 0; hurtPlayer();
  assert.equal(Game.power, 0); assert.equal(Game.hearts, 3);
  console.log(`OK: fase ${level + 1}, bloco (${x}, ${y}), coleta por pulo e poder.`);
}
// O bloco de comida continua recuperando vida quando faltam corações.
start(targets[0].level, targets[0].x * TS + 2); Game.hearts = 2;
for (let t = 0; t < 40; t++) tick({ jump: true });
assert(World.ents.some(e => e.item === 'hotdog'));
const preview = new SoftCanvas(160, 160);
preview.getContext('2d').drawImage(SPR.coca.r, 0, 0, 160, 160);
fs.writeFileSync(path.join(out, 'coca-sprite.png'), preview.toPNG());
console.log(`OK${bundled ? ' (offline)' : ''}: ${targets.length} blocos, pulo curto ${short.toFixed(1)} px, longo ${high.toFixed(1)} px.`);
