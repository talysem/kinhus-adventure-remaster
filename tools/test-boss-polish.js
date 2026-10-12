'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
function setup(mode = 'normal') {
  Difficulty.select(mode); Game.reset(); Game.levelIdx = 4; Game.progress = Progression.legacy(4);
  Input.releaseAll(); App.trans = null; App.go('play', null, true);
  World.player.x = World.arena.x + 40; World.player.y = 171; World.cam.x = World.arena.x;
  updateWorld(); World.ents = World.ents.filter(e => e.kind === 'boss');
  World.bannerT = 0; World.boss.state = 'walk'; World.boss.t = 0;
  World.boss.y = 162; World.boss.onGround = true;
  return World.boss;
}
function attack(b, state) { b.state = state; b.t = 0; aimBossAttack(b, World.player); World.projs = []; }
const steps = n => { for (let i = 0; i < n; i++) App.update(); };
const shot = name => { App.render(); fs.writeFileSync(path.join(out, name + '.png'), screen.toPNG()); };

for (const mode of ['easy', 'normal', 'hard']) for (const phase of [1, 2]) {
  for (const state of ['jump', 'spit', 'summon']) {
    const b = setup(mode), p = World.player; b.phase = phase; attack(b, state);
    const target = [b.aimX, b.aimY], direction = b.dir;
    p.x += 48; p.y -= 20;
    for (let i = 1; i < bossWarningFrames(state); i++) {
      updateBoss(b, p);
      assert.equal(b.state, state); assert.equal(b.vx, 0); assert(b.onGround);
      assert.equal(World.projs.length, 0); assert(!World.ents.some(e => e.enemy));
      assert.deepStrictEqual([b.aimX, b.aimY], target); assert.equal(b.dir, direction);
    }
    if (phase === 1) shot('boss-' + mode + '-' + state + '-warning');
    updateBoss(b, p);
    if (state === 'jump') { assert(b.vy < 0); assert.equal(b.vx, b.attackVX); assert(!b.onGround); }
    else if (state === 'spit') {
      assert.equal(World.projs.length, phase === 2 ? 3 : 1);
      for (const q of World.projs) assert(Math.abs(Math.hypot(q.vx, q.vy) - 2.1 * Difficulty.current().speed) < 1e-9);
    } else assert.equal(World.ents.filter(e => e.enemy).length, 2);
    for (let i = 0; i < 100 && b.state !== 'recover'; i++) updateBoss(b, p);
    assert.equal(b.state, 'recover');
    const stop = b.x;
    if (state === 'jump') assert.equal(World.projs.filter(q => q.type === 'wave').length, 2);
    for (let i = 1; i < Difficulty.frames(phase === 2 ? 48 : 60); i++) { updateBoss(b, p); assert.equal(b.state, 'recover'); assert.equal(b.x, stop); }
    updateBoss(b, p); assert.equal(b.state, 'walk');
  }
}
// Cap exato de três bugs, inclusive se já houver dois na arena.
let b = setup(); attack(b, 'summon');
addEnt(makeEnemy('u', b.x - 80, 192)); addEnt(makeEnemy('u', b.x - 100, 192));
for (let i = 0; i < bossWarningFrames('summon'); i++) updateBoss(b, World.player);
assert.equal(World.ents.filter(e => e.enemy).length, 3);

// Barrigada aproveita a recuperação, sem dano duplicado nem invencibilidade do pum.
for (const slam of [false, true]) for (const state of ['walk', 'recover']) {
  b = setup(); b.state = state; b.t = 0;
  const p = World.player; p.x = b.x + 12; p.y = b.y - p.h + 2; p.prevY = b.y - p.h - 2; p.vy = 9; p.slam = slam;
  updateBoss(b, p); assert.equal(b.hp, 24 - (slam && state === 'recover' ? 6 : 4));
  const hp = b.hp; hitBoss(b, 6, true); assert.equal(b.hp, hp);
}
// Esquiva real: sair da posição anunciada com C evita o salto; ficar parado é atingido.
for (const dodge of [false, true]) {
  b = setup(); const p = World.player; p.x = b.x - 64; p.facing = -1; p.onGround = true;
  attack(b, 'jump');
  if (dodge) Input.keys.KeyC = true;
  steps(1); Input.keys = {};
  for (let i = 0; i < 100 && b.state !== 'recover'; i++) steps(1);
  assert.equal(Game.hearts, dodge ? 3 : 2, 'pum esquiva pela posição, sem conceder proteção');
  assert(!p.dead); assert.equal(b.state, 'recover');
}
b = setup(); const p = World.player; p.x = b.x; p.y = b.y; p.onGround = true; p.dashT = 4;
updateBoss(b, p); assert.equal(Game.hearts, 2); assert.equal(b.hp, 24);

// Pausa e aba oculta não gastam aviso/recuperação nem contam tempo ativo.
b = setup(); attack(b, 'spit'); App.openPause();
const snapshot = () => JSON.stringify({ b, time: World.time, frames: Game.stats.frames, projs: World.projs });
const frozen = snapshot(); steps(90); assert.equal(snapshot(), frozen);
App.closePause(); document.hidden = true; steps(90); document.hidden = false; assert.equal(snapshot(), frozen);

// Vitória com um único tick restante: cinematografia/troféu não podem causar timeout.
b = setup(); World.time = 1; World.timeT = 47; World.player.x = World.arena.x + 124;
while (b.hp > 0) { b.inv = 0; hitBoss(b, 4); }
steps(250); assert(World.clear && Game.completed && !World.player.dead);
assert(Save.data.completed && Save.data.run === null);
steps(120); assert.equal(App.state, 'ending');

// Checkpoint recupera só um coração, uma vez; retomada/importação não repete.
for (const hearts of [1, 2, 3]) {
  Difficulty.select('normal'); Game.reset(); App.trans = null; App.go('play', null, true);
  const cp = World.cps[0]; Game.hearts = hearts; World.player.x = cp.x + 10;
  updateEnt(cp); assert.equal(Game.hearts, Math.min(3, hearts + 1)); assert(Game.checkpoint);
  Game.hearts = 1; updateEnt(cp); assert.equal(Game.hearts, 1);
  App.saveProgress(false, true); const save = Save.fileText(); assert(Save.importText(save).ok);
  App.trans = null; App.continueRun(); App.trans = null; App.go('play', null, true);
  updateEnt(World.cps[0]); assert.equal(Game.hearts, 1); assert(World.cps[0].on);
}
// Ajuda e sinais estáveis mesmo durante o flash de dano.
b = setup(); attack(b, 'spit'); b.inv = 12; b.t = 3;
const texts = [], draw = Font.draw; Font.draw = (text, ...args) => { texts.push({ text, y: args[1] }); return draw.call(Font, text, ...args); };
shot('boss-aim'); assert(texts.some(t => t.text === '! DISPARO')); texts.length = 0;
b.state = 'recover'; shot('boss-open'); assert(texts.some(t => t.text === '▼')); texts.length = 0;
App.openPause(); App.openGuide(); App.openInfo('help', 5); shot('boss-help');
texts.length = 0; App.drawHelp();
assert(texts.every(t => Font.width(t.text) <= 240));
assert(texts.filter(t => t.y >= 28 && t.y < 204).every(t => t.y <= 188));
Font.draw = draw;
console.log(`OK${bundled ? ' (offline)' : ''}: avisos/mira/recuperação nos três modos e duas etapas, ataques/limite, barrigada/esquiva reais, pausa, vitória sem timeout e checkpoint idempotente.`);
