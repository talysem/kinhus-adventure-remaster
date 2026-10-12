'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
function setup(difficulty = 'normal', ch = 'k') {
  Difficulty.select(difficulty); Game.reset(); App.trans = null; Input.releaseAll();
  App.go('play', null, true); World.ents = []; World.plats = []; World.projs = [];
  World.map = World.map.map((row, y) => row.map(() => y >= 12 ? '#' : '.'));
  World.player = makePlayer(180, 12 * TS - 21);
  const e = addEnt(makeEnemy(ch, 100, 12 * TS)); e.dir = 1; e.onGround = true;
  return e;
}
const ticks = (e, n) => { for (let i = 0; i < n; i++) updateEnemy(e); };
const shot = name => { App.render(); fs.writeFileSync(path.join(out, name + '.png'), screen.toPNG()); };
for (const difficulty of ['easy', 'normal', 'hard']) {
  const e = setup(difficulty), p = World.player;
  updateEnemy(e); assert.equal(e.state, 'brake'); assert.equal(e.vx, 0);
  const start = e.x, facing = e.dir, delay = Difficulty.frames(30);
  p.x = e.x - 40;
  ticks(e, delay - 1); assert.equal(e.state, 'brake'); assert.equal(e.x, start);
  if (difficulty === 'normal') shot('skater-brake');
  updateEnemy(e); assert.equal(e.state, 'charge'); assert.equal(e.dir, facing, 'direção anunciada não persegue o jogador');
  updateEnemy(e); assert.equal(e.vx, 3 * Difficulty.current().speed); assert(e.x > start);
  if (difficulty === 'normal') shot('skater-charge');
  ticks(e, Difficulty.frames(42) - 1); assert.equal(e.state, 'recover');
  const stopped = e.x; ticks(e, Difficulty.frames(60) - 1);
  assert.equal(e.state, 'recover'); assert.equal(e.x, stopped);
  if (difficulty === 'normal') shot('skater-recover');
  updateEnemy(e); assert.equal(e.state, 'cruise'); assert(e.cool > 0);
  p.x = e.x - 40; updateEnemy(e); assert.equal(e.state, 'cruise', 'recarga evita investir novamente sem intervalo');
}
let e = setup(); setTile(9, 10, 'S'); setTile(9, 11, 'S');
ticks(e, 5); assert.equal(e.state, 'cruise', 'sem detecção através da parede');
e = setup(); World.player.y -= 48; ticks(e, 5); assert.equal(e.state, 'cruise', 'não investe em quem está em outro andar');
for (const dir of [-1, 1]) for (const obstacle of ['wall', 'ledge']) {
  e = setup('hard'); e.dir = dir; e.state = 'charge'; e.x = dir > 0 ? 147 : 161;
  if (obstacle === 'wall') setTile(dir > 0 ? 10 : 9, 11, 'S');
  else for (let x = 0; x < World.w; x++) if (dir > 0 ? x >= 10 : x <= 9) setTile(x, 12, '.');
  updateEnemy(e); assert.equal(e.state, 'recover', `${obstacle}: termina investida`);
  assert(e.onGround && e.y + e.h <= 192, 'para no piso antes de cair');
  ticks(e, 20); assert(e.alive && e.onGround);
}
e = setup(); updateEnemy(e);
const snapshot = () => JSON.stringify({ e, t: World.t, time: World.time });
App.openPause(); const frozen = snapshot(); for (let i = 0; i < 90; i++) App.update(); assert.equal(snapshot(), frozen);
App.closePause(); App.trans = null; App.state = 'play'; document.hidden = true;
for (let i = 0; i < 90; i++) App.update(); assert.equal(snapshot(), frozen); document.hidden = false;

// Latas pela frente são consumidas; pelas costas matam, em ambas as direções.
for (const ch of ['a', 'u']) for (const dir of [-1, 1]) for (const front of [true, false]) {
  e = setup('normal', ch); e.dir = dir;
  const sourceSide = (front ? 1 : -1) * dir, vx = -sourceSide * 2;
  World.projs = [{ type: 'can', x: e.x + e.w / 2 + sourceSide * 5 - 3 - vx, y: e.y, w: 6, h: 6, vx, vy: 0, life: 60, t: 0 }];
  updateProjs(); assert.equal(World.projs.length, 0);
  const blocked = ch === 'a' && front;
  assert.equal(e.dying, !blocked); assert.equal(Game.score, blocked ? 0 : 100);
  if (blocked) { assert(World.parts.some(q => q.text === 'POR CIMA!')); killEnemy(e, 'stomp'); }
  const score = Game.score; killEnemy(e, 'can'); assert.equal(Game.score, score, 'recompensa não duplicada');
}
for (const attack of ['stomp', 'slam', 'wild', 'side', 'propulsion']) {
  e = setup('normal', 'a'); const p = World.player;
  p.x = e.x; p.y = ['stomp', 'slam'].includes(attack) ? e.y - p.h + 2 : e.y;
  p.prevY = ['stomp', 'slam'].includes(attack) ? e.y - p.h - 3 : p.y;
  p.vy = ['stomp', 'slam'].includes(attack) ? 9 : 0;
  p.slam = attack === 'slam'; p.wild = attack === 'wild' ? 60 : 0;
  p.dashT = attack === 'propulsion' ? 4 : 0;
  playerVsEnemies();
  assert.equal(e.dying, !['side', 'propulsion'].includes(attack));
  assert.equal(Game.hearts, ['side', 'propulsion'].includes(attack) ? 2 : 3);
}
for (let level = 0; level < LEVELS.length; level++) {
  Game.reset(); Game.levelIdx = level; loadLevel(level, false);
  const guards = World.ents.filter(e => e.armored);
  assert.equal(guards.length, level >= 3 ? 1 : 0);
  for (const guard of guards) assert(guard.x > 32 * TS && isSolid(tileAt(Math.floor(guard.x / TS), 12)), 'introdução fora da prática em chão seguro');
  if (level >= 3) assert(World.ents.some(e => e.type === 'bug' && !e.armored), 'bugs comuns preservados');
}
Difficulty.select('kinhu'); Game.reset();
for (let level = 0; level < LEVELS.length; level++) { loadLevel(level, false); assert(!World.ents.some(e => e.enemy)); }
e = setup('normal', 'a'); e.dir = -1; shot('guard-bug-left'); e.dir = 1; shot('guard-bug-right');
App.openPause(); App.openGuide(); assert.equal(App.menu.items.length, 6);
App.menu.items.find(item => item.label === 'INIMIGOS / COMO ENFRENTAR').fn(); assert.equal(App.helpPage, 5);
const texts = [], draw = Font.draw; Font.draw = (text, ...args) => { texts.push(text); return draw.call(Font, text, ...args); };
shot('enemy-help'); Font.draw = draw; assert(texts.every(text => Font.width(text) <= 240));
App.saveProgress(false, true); assert(Save.importText(Save.fileText()).ok); assert.equal(Save.data.version, 6);
console.log(`OK${bundled ? ' (offline)' : ''}: freada/investida/recuperação, modos, parede/borda, pausa, escudo em duas direções, latas/pisão/barrigada/Kinhurine, Kinhu, mapas e guia.`);
