'use strict';
// Usa entrada e colisões reais; nenhum item temporário é necessário.
const assert = require('assert');
const fs = require('fs'), path = require('path'), vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
let device = 'keyboard', buttons = [], axes = [0, 0];
navigator.getGamepads = () => device === 'gamepad' ? [{ axes, buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: buttons.includes(i) })) }] : [];
function controls(actions) {
  Input.keys = {}; Input.touch = {}; Input.device = device; buttons = []; axes = [0, 0];
  for (const a of actions) {
    if (device === 'keyboard') Input.keys[{ jump: 'KeyZ', propel: 'KeyC', down: 'ArrowDown', right: 'ArrowRight', left: 'ArrowLeft', back: 'KeyX', confirm: 'Enter' }[a]] = true;
    else if (device === 'touch') Input.touch[a] = true;
    else if (a === 'right') axes[0] = 1;
    else if (a === 'left') axes[0] = -1;
    else if (a === 'down') axes[1] = 1;
    else buttons.push({ jump: 0, propel: 5, back: 1, confirm: 0 }[a]);
  }
}
function tick(n = 1, actions = []) {
  controls(actions); for (let i = 0; i < n; i++) { Input.update(); World.t++; updatePlayer(World.player); }
}
function step(n = 1, actions = []) { controls(actions); for (let i = 0; i < n; i++) App.update(); }
function setup(level = 2, earned = 4, x = 40) {
  App.trans = null; Game.reset(); Game.progress = Progression.legacy(earned); Game.levelIdx = level;
  loadLevel(level, false); App.state = 'play'; World.ents = []; World.plats = [];
  World.player = makePlayer(x, 12 * TS - 21); tick(); return World.player;
}
const close = (a, b) => assert(Math.abs(a - b) < 0.001, `${a} != ${b}`);
const snapshot = () => JSON.stringify({ t: World.t, time: World.time, timeT: World.timeT, p: World.player, map: World.map, brake: World.brake, parts: World.parts, projs: World.projs, switches: World.switches });
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
async function run() {
  await Origin.preload();
  for (device of ['keyboard', 'gamepad', 'touch']) {
    let p = setup(), start = p.x;
    tick(12, ['propel']); close(p.x - start, TS * 3); assert.equal(p.dashT, 0);
    assert.equal(p.vx, 0); assert.equal(p.inv, 0); assert.equal(Game.power, 0);
    const atEnd = p.x; tick(65, ['propel']); close(p.x, atEnd);
    tick(); tick(1, ['propel']); assert(p.dashT > 0, 'novo toque após recarga');
    p = setup(); p.y = 40; p.onGround = false; p.vy = 0;
    tick(12, ['propel']); assert(p.airPropulsionUsed);
    // O contador é independente do limite aéreo; teto e tempo não recarregam uso.
    p.y = 40; p.vy = -2; tick(1); p.dashCooldown = 0;
    tick(1, ['propel']); assert.equal(p.dashT, 0);
    p.y = 12 * TS - p.h; p.vy = 1; tick(); assert(!p.airPropulsionUsed);
    tick(1, ['propel']); assert(p.dashT > 0);
    p = setup(); setTile(5, 10, 'S'); setTile(5, 11, 'S');
    tick(12, ['propel']); assert(p.x + p.w <= 5 * TS); assert.equal(p.dashT, 0);
    p = setup(2, 4, 100); tick(1, ['left']); p.vx = 0; start = p.x;
    tick(); tick(12, ['propel']); close(start - p.x, TS * 3);
    p = setup(); tick(1, ['propel']); hurtPlayer();
    assert.equal(p.dashT, 0); assert.equal(Game.hearts, 2);
    p = setup(2, 1); tick(12, ['propel']); assert.equal(p.dashT, 0); close(p.x, 40);
    // Barrigada cancela arrancada; não consome o pulo extra; bloqueia novo pum.
    p = setup(); p.y = 80; p.onGround = false; p.airJumpReady = true;
    tick(1, ['propel']); tick(); tick(1, ['down', 'jump']);
    assert(p.slam); assert.equal(p.dashT, 0); assert(p.airJumpReady);
    tick(); tick(1, ['propel']); assert(p.slam && !p.dashT);
    tick(30); assert(!p.slam && p.onGround);
    p = setup(3, 3, 8 * TS + 2); p.y = 110; p.onGround = false;
    tick(1, ['down', 'jump']); tick(30);
    assert.equal(tileAt(8, 11), '.'); assert.equal(tileAt(8, 12), '#');
    assert(p.onGround && !p.slam); assert.equal(Game.power, 0);
    p = setup(3, 3, 20 * TS + 2); p.y = 115; p.onGround = false;
    tick(1, ['down', 'jump']); tick(30);
    assert(World.switches[0].pressed); assert.equal(tileAt(20, 12), 'R');
    for (const [x, y] of World.def.switchGates[0].blocks) assert.equal(tileAt(x, y), '.');
    const score = Game.score; p.y = 115; p.onGround = false;
    tick(); tick(1, ['down', 'jump']); tick(30); assert.equal(Game.score, score);
    p = setup(3, 3, 20 * TS + 2); p.y = 115; p.onGround = false; tick(30);
    assert(!World.switches[0].pressed, 'pouso comum não aciona botão');
    // Baixo+pulo em plataforma atravessável continua sendo descida.
    p = setup(); setTile(4, 8, '='); p.x = 4 * TS + 2; p.y = 8 * TS - p.h; p.vy = 0.5;
    tick(); tick(1, ['down', 'jump']); assert(p.drop > 0 && !p.slam);
    // Sem barrigada conquistada, baixo+pulo aéreo ainda usa o pulo duplo.
    p = setup(2, 2); p.y = 80; p.onGround = false; p.airJumpReady = true; p.coyote = 0;
    tick(1, ['down', 'jump']); assert(!p.slam && p.vy < 0);
    // Aquisições em ordem: só uma imagem e um poder por conclusão.
    Save.data = Save.blank(); Game.reset();
    for (let level = 0; level < 4; level++) {
      Game.levelIdx = level; Game.clearedLevel = null; loadLevel(level, false); App.state = 'play';
      startClear(); assert.equal(Save.data.run.level, level + 1);
      App.trans = null; App.continueRun(); step(40);
      const a = Progression.abilities[level]; assert.equal(App.state, 'origin'); assert.equal(Origin.id, a.id);
      assert.equal(Game.progress.abilities.length, level + 1); assert(Origin.images[a.id]);
      const before = snapshot(), cooldown = World.player.dashCooldown;
      step(25); assert.equal(snapshot(), before); assert.equal(World.player.dashCooldown, cooldown);
      const interrupted = Save.fileText(); assert(Save.importText(interrupted).ok);
      App.trans = null; App.continueRun(); step(40); assert.equal(Origin.id, a.id); assert.equal(Origin.beat, 0);
      if (level % 2) { step(25); step(1, ['back']); step(1); }
      else { step(25); step(1, ['confirm']); step(1); step(25); step(1, ['confirm']); step(1); }
      step(240); assert.equal(App.state, 'play'); assert.equal(Game.levelIdx, level + 1);
      assert.equal(Save.data.campaign.stories[a.id], level % 2 ? 'skipped' : 'seen');
      assert.equal(Game.progress.pendingUnlocks.length, 0);
      App.trans = null; App.continueRun(); step(240); assert.equal(App.state, 'play');
    }
    console.log(`OK: ${device}, aquisição individual, pum, limites, barrigada, caixas, botão e descida.`);
  }
  device = 'keyboard';
  // Física do passo firme: dano igual, 30% menos recuo e distância de deslizamento.
  const measure = earned => {
    const p = setup(4, earned, 11 * TS + 2); p.vx = 1.9;
    const start = p.x; tick(20); const slide = p.x - start;
    p.vx = p.vy = 0; p.inv = 0; hurtPlayer();
    return { slide, vx: p.vx, vy: p.vy, hp: Game.hearts };
  };
  const base = measure(3), firm = measure(4);
  close(firm.vx, base.vx * 0.7); close(firm.vy, base.vy * 0.7); assert.equal(firm.hp, base.hp);
  // No mesmo piso por todo o percurso, distância acumulada é ~70% da original.
  const slideOnLongFloor = earned => {
    const p = setup(2, earned, 40);
    for (let x = 0; x < World.w; x++) { setTile(x, 11, '.'); setTile(x, 12, 'I'); }
    p.vx = 1.9; const start = p.x; tick(600); return p.x - start;
  };
  const ratio = slideOnLongFloor(4) / slideOnLongFloor(3); assert(ratio > 0.68 && ratio < 0.72, ratio);
  let p = setup(); setTile(3, 12, '~'); p.x = 3 * TS; p.y = 12 * TS - 14; hazards(p);
  assert(p.dead && p.how === 'liquid', 'passo firme não protege de perigo fatal');
  // Só inimigos elegíveis por cima; lado machuca e a passageira continua resistente.
  const enemyHit = (kind, above) => {
    const p = setup(), e = makeEnemy(kind, 100, 12 * TS); World.ents = [e]; e.alive = true;
    p.x = e.x; p.y = above ? e.y - p.h + 2 : e.y; p.prevY = above ? e.y - p.h - 3 : p.y;
    p.vy = 9; p.slam = true; playerVsEnemies(); return { p, e };
  };
  assert(enemyHit('u', true).e.dying); assert(!enemyHit('l', true).e.dying);
  const side = enemyHit('u', false); assert(!side.e.dying); assert.equal(Game.hearts, 2); assert(!side.p.slam);
  const dashEnemy = enemyHit('u', false); assert(!dashEnemy.e.dying, 'sem dano por toque');
  // Chefe tem duas etapas, 24 HP e intervalo de barrigada resistente a outros ataques.
  setup(4); const b = World.boss; b.state = 'walk'; hitBoss(b, 4, true);
  assert.equal(b.hp, 20); b.inv = 0; hitBoss(b, 4, true); assert.equal(b.hp, 20);
  b.slamInv = 0; hitBoss(b, 4, true); assert.equal(b.hp, 16);
  b.inv = b.slamInv = 0; hitBoss(b, 4, true); assert.equal(b.hp, 12); assert.equal(b.phase, 2);
  for (let i = 0; i < 3; i++) { b.inv = b.slamInv = 0; hitBoss(b, 4, true); }
  assert.equal(b.state, 'dead');
  // Pausa, aba oculta e transformação não consomem recarga nem tempo da tentativa.
  p = setup(); tick(1, ['propel']); const frozen = snapshot();
  App.openPause(); step(120); assert.equal(snapshot(), frozen);
  App.closePause(); document.hidden = true; step(120); document.hidden = false; assert.equal(snapshot(), frozen);
  App.openPause(); App.openGuide(); App.menu.items.find(i => i.label === 'HABILIDADES / COMO USAR').fn();
  for (let i = 0; i < 4; i++) { App.abilityPage = i; App.t = 69; App.render(); fs.writeFileSync(path.join(out, 'ability-' + Progression.abilities[i].id + '.png'), screen.toPNG()); }
  setup(3, 3, 8 * TS + 2); p = World.player; p.y = 135; p.onGround = false; tick(1, ['down', 'jump']); App.render(); fs.writeFileSync(path.join(out, 'belly-practice.png'), screen.toPNG());
  setup(); tick(5, ['propel']); App.render(); fs.writeFileSync(path.join(out, 'propulsion-practice.png'), screen.toPNG());
  console.log(`OK${bundled ? ' (offline)' : ''}: passo firme, perigos fatais, inimigos, chefe, pausa, aba oculta e prévias.`);
}
run().catch(e => { console.error(e); process.exitCode = 1; });
