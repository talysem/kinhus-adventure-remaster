'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const { boot, SoftCanvas } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
const expansion = e => ['lunch', 'extraTime'].includes(e.item);
function setup(level = 3, mode = 'normal', assist = false) {
  Difficulty.select(mode); Comfort.set('assist', assist); Game.reset(); Game.levelIdx = level;
  Game.progress = Progression.legacy(level); Input.clear(); App.trans = null; App.go('play', null, true);
  return World.player;
}
function take(item, p = World.player) {
  const e = addEnt({ kind: 'item', item, x: p.x, y: p.y, w: 12, h: 12, emerge: 0, vx: 0, vy: 0, dir: 1 });
  updateItem(e, p); return e;
}
function shot(name) {
  const text = [], draw = Font.draw;
  Font.draw = function(line, ...args) { text.push(line); return draw.call(this, line, ...args); };
  App.render(); Font.draw = draw;
  assert(text.every(t => Font.width(t) <= 244), text.filter(t => Font.width(t) > 244).join('\n'));
  fs.writeFileSync(path.join(out, name + '.png'), screen.toPNG());
}
async function run() {
  await Promise.all([IntroArt.preload(), Origin.preload(), Kinhurine.preload()]);
  // Cura limitada; pontos somente quando já tinha vida cheia; consumo único.
  for (const [hearts, expected, score] of [[1, 3, 0], [2, 3, 0], [3, 3, 1000]]) {
    const p = setup(); Game.hearts = hearts; Game.power = 1;
    ItemEffects.acquire(p, 'backpack'); ItemEffects.acquire(p, 'coffee'); p.wild = 300; p.inv = 47;
    const before = { utility: p.utility, t: p.utilityT, wild: p.wild, inv: p.inv, time: World.time, frames: Game.stats.frames };
    const e = take('lunch'); assert(!e.alive); assert.equal(Game.hearts, expected); assert.equal(Game.score, score);
    assert(p.backpack); assert.equal(Game.power, 1);
    assert.deepStrictEqual({ utility: p.utility, t: p.utilityT, wild: p.wild, inv: p.inv, time: World.time, frames: Game.stats.frames }, before);
    updateItem(e, p); assert.equal(Game.score, score);
  }
  // Cronômetro próprio da fase: teto por dificuldade e assistência; fração preservada.
  for (const mode of Object.keys(Difficulty.modes)) for (const assist of [false, true]) {
    setup(2, mode, assist); const limit = Comfort.initialTime(); assert.equal(World.timeLimit, limit);
    for (const remaining of [limit, limit - 10, limit - 60, 1]) {
      World.time = remaining; World.timeT = 23; Game.stats.frames = 900;
      const e = take('extraTime'); assert(!e.alive); assert.equal(World.time, Math.min(limit, remaining + 30));
      assert.equal(World.timeT, 23); assert.equal(Game.stats.frames, 900); assert.equal(Game.score, 0);
    }
  }
  let p = setup(); ItemEffects.acquire(p, 'magnet'); ItemEffects.acquire(p, 'backpack'); Game.power = 1; p.wild = 100;
  World.time = 90; World.hurry = true; Sound.tempo = 1.25; take('extraTime');
  assert.equal(World.time, 120); assert(!World.hurry); assert.equal(Sound.tempo, 1);
  assert.equal(p.utility, 'magnet'); assert.equal(p.utilityT, 720); assert(p.backpack); assert.equal(p.wild, 100); assert.equal(Game.power, 1);
  p.wild = 0; World.time = 101; World.timeT = 47; App.update(); assert.equal(World.time, 100); assert(World.hurry); assert.equal(Sound.tempo, 1.25);
  World.time = 60; World.hurry = true; Sound.tempo = 1.25; take('extraTime'); assert(World.hurry); assert.equal(Sound.tempo, 1.25);
  // Não ressuscita após tempo esgotado, nem consome com jogador morto.
  p = setup(); World.time = 1; World.timeT = 47; App.update(); assert(p.dead); assert.equal(World.time, 0);
  assert(take('extraTime').alive); assert(take('lunch').alive); assert.equal(World.time, 0);
  // Geometria real: todos os cinco novos itens alcançáveis, apoio e retorno ao chão.
  let count = 0;
  for (let level = 0; level < LEVELS.length; level++) {
    setup(level, 'kinhu');
    const items = World.ents.filter(e => e.kind === 'item' && expansion(e));
    for (const e of items) {
      count++; assert(e.sourceId); assert(!isSolid(tileAt(Math.floor(e.x / TS), Math.floor(e.y / TS))));
      assert(!World.arena || e.x < World.arena.x, 'item fora da arena');
      const candidates = [];
      for (let dx = -3; dx <= 3; dx++) for (let row = Math.floor(e.y / TS) + 1; row <= 12; row++) {
        const tx = Math.floor(e.x / TS) + dx, t = tileAt(tx, row), y = row * TS - 21;
        if ((isSolid(t) && t !== '^' || ONEWAY.has(t)) && !isSolid(tileAt(tx, Math.floor(y / TS))) && !isSolid(tileAt(tx, row - 1))) candidates.push({ x: tx * TS + 2, y });
      }
      let reached = false;
      for (const start of candidates) {
        World.player = makePlayer(start.x, start.y); Input.clear(); Input.keys = {}; Input.update(); updatePlayer(World.player);
        p = World.player;
        for (let t = 0; t < 90; t++) {
          Input.keys = {}; if (t < 20 || t >= 24 && t < 42) Input.keys.KeyZ = true;
          if (p.x < e.x - 3) Input.keys.ArrowRight = true; else if (p.x > e.x + 3) Input.keys.ArrowLeft = true;
          Input.update(); updatePlayer(p);
          if (!p.dead && U.overlap(e, p)) { reached = true; break; }
          if (p.dead) break;
        }
        if (reached) break;
      }
      assert(reached, `fase ${level + 1}: ${e.item} alcançável`);
      World.cam.x = U.clamp(e.x - 128, 0, World.w * TS - W); World.bannerT = 0; shot(`expansion-${level + 1}-${e.item}`);
      Game.hearts = 1; World.time -= 60; updateItem(e, p); assert(!e.alive); assert(Game.collected.includes(e.sourceId));
      Input.keys = {}; for (let t = 0; t < 90 && !p.onGround && !p.dead; t++) { Input.update(); updatePlayer(p); }
      assert(!p.dead && p.onGround, 'retorno da rota opcional');
    }
  }
  assert.equal(count, 5);
  // IDs existentes continuam válidos; saves v5 guardam consumo sem reaparecimento.
  setup(); const fixed = World.ents.filter(e => e.kind === 'item' && expansion(e));
  Game.hearts = 1; World.time = 300;
  for (const e of fixed) { p = World.player; p.x = e.x; p.y = e.y; updateItem(e, p); }
  Game.checkpoint = true; PickupLedger.flush(); const ids = fixed.map(e => e.sourceId), score = Game.score, saved = Save.fileText();
  assert.equal(Save.FORMAT, 6); assert(ids.every(id => Save.data.run.collected.includes(id)));
  assert(Save.importText(saved).ok); App.trans = null; App.continueRun(); App.trans = null; App.go('play', null, true);
  assert(!World.ents.some(expansion)); assert.equal(Game.score, score); assert.equal(Game.hearts, 3);
  assert(Game.checkpoint); assert.equal(World.player.x, World.cps[0].x + 2);
  const duplicate = addEnt({ ...fixed[0], alive: true, x: World.player.x, y: World.player.y });
  updateItem(duplicate, World.player); assert(!duplicate.alive); assert.equal(Game.score, score);
  killPlayer('fall'); App.trans = null; App.onDeath(); App.trans = null; App.go('play', null, true);
  assert(!World.ents.some(expansion)); assert(ids.every(id => Game.collected.includes(id))); assert.equal(Game.score, score);
  const campaign = JSON.stringify(Save.data.run);
  App.startLevel(3); App.trans = null; App.go('play', null, true); assert.equal(World.ents.filter(expansion).length, 2);
  p = World.player; p.x = fixed[0].x; p.y = fixed[0].y; updateItem(World.ents.find(e => e.item === 'lunch'), p); PickupLedger.flush();
  assert.equal(JSON.stringify(Save.data.run), campaign, 'replay preserva campanha');
  // Página adicional legível, navegação circular e retorno para o guia.
  App.openPause(); App.openGuide(); App.openInfo('help', 1); Input.keys = { ArrowRight: true }; App.update();
  assert.equal(App.helpPage, 2); shot('expansion-help'); Input.keys = {}; App.update(); Input.keys = { ArrowRight: true }; App.update(); assert.equal(App.helpPage, 3);
  Input.keys = {}; App.update(); Input.keys = { ArrowRight: true }; App.update(); assert.equal(App.helpPage, 4);
  Input.keys = {}; App.update(); Input.keys = { ArrowRight: true }; App.update(); assert.equal(App.helpPage, 0);
  Input.keys = {}; App.update(); Input.keys = { ArrowLeft: true }; App.update(); assert.equal(App.helpPage, 4);
  Input.keys = {}; App.update(); Input.keys = { Escape: true }; App.update(); assert.equal(App.sub, 'guide');
  const preview = new SoftCanvas(192, 96), ctx = preview.getContext('2d');
  ctx.fillStyle = '#00153b'; ctx.fillRect(0, 0, 192, 96);
  ctx.drawImage(SPR.lunch.r, 16, 16, 64, 64); ctx.drawImage(SPR.extraTime.r, 112, 16, 64, 64);
  fs.writeFileSync(path.join(out, 'expansion-sprites.png'), preview.toPNG());
  Comfort.set('assist', false); Difficulty.select('normal');
  console.log(`OK${bundled ? ' (offline)' : ''}: marmita, hora extra nos quatro modos/assistência, limites, alertas, coleta real, retorno, save v5, replay e ajuda.`);
}
run().catch(e => { console.error(e.stack); process.exitCode = 1; });
