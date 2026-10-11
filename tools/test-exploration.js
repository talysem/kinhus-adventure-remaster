'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
function setup(level = 0, mode = 'normal', assist = false) {
  Comfort.set('assist', assist); Difficulty.select(mode); Game.reset(); Game.levelIdx = level;
  Game.progress = Progression.legacy(level); Input.clear(); App.trans = null; App.go('play', null, true);
  return World.player;
}
function frames(n, keys = []) { Input.keys = Object.fromEntries(keys.map(k => [k, true])); for (let i = 0; i < n; i++) App.update(); }
function tap(key) { frames(1, [key]); frames(1); }
function shot(name) {
  const text = [], draw = Font.draw;
  Font.draw = function(line, ...args) { text.push(line); return draw.call(this, line, ...args); };
  App.render(); Font.draw = draw;
  assert(text.every(line => Font.width(line) <= 244), text.filter(line => Font.width(line) > 244).join('\n'));
  fs.writeFileSync(path.join(out, name + '.png'), screen.toPNG());
}
function collect(slot) {
  const e = World.ents.find(e => e.kind === 'memory' && e.slot === slot);
  assert(e); World.player.x = e.x; World.player.y = e.y; updateEnt(e); PickupLedger.flush(); return e;
}
async function run() {
  await Promise.all([IntroArt.preload(), Origin.preload(), Kinhurine.preload()]);
  // As 15 posições são fixas, fora de estruturas e alcançáveis por saltos reais.
  for (let level = 0; level < LEVELS.length; level++) {
    setup(level, 'kinhu'); const memories = World.ents.filter(e => e.kind === 'memory'); assert.equal(memories.length, 3);
    for (const e of memories) {
      assert(!isSolid(tileAt(Math.floor(e.x / TS), Math.floor(e.y / TS))));
      // Parte de um apoio real nas proximidades e usa entrada/colisão do jogador.
      const candidates = [];
      for (let dx = -3; dx <= 3; dx++) for (let row = Math.floor(e.y / TS) + 1; row <= 12; row++) {
        const tx = Math.floor(e.x / TS) + dx, tile = tileAt(tx, row);
        if (isSolid(tile) && tile !== '^' || ONEWAY.has(tile)) {
          const x = tx * TS + 2, y = row * TS - 21;
          if (!isSolid(tileAt(tx, Math.floor(y / TS))) && !isSolid(tileAt(tx, row - 1))) candidates.push({ x, y });
        }
      }
      let reached = false;
      for (const start of candidates) {
        World.player = makePlayer(start.x, start.y); Input.clear(); Input.keys = {}; Input.update(); updatePlayer(World.player);
        const p = World.player;
        for (let t = 0; t < 90; t++) {
          Input.keys = {}; if (t < 20 || t >= 24 && t < 42) Input.keys.KeyZ = true;
          if (p.x < e.x - 3) Input.keys.ArrowRight = true; else if (p.x > e.x + 3) Input.keys.ArrowLeft = true;
          Input.update(); updatePlayer(p);
          if (!p.dead && U.overlap(e, p)) { reached = true; break; }
          if (p.dead) break;
        }
        if (reached) break;
      }
      assert(reached, `fase ${level + 1}: lembrança ${e.slot + 1} acessível`);
    }
    console.log(`OK: três lembranças alcançáveis na fase ${level + 1}.`);
  }
  Save.data = Save.blank(); let p = setup(); const first = collect(0);
  assert.equal(Exploration.count(0), 1); assert.equal(Game.score, 500); assert.deepStrictEqual(Game.stats.found, [first.id]);
  const saved = Save.fileText(); App.trans = null; App.continueRun(); App.trans = null; App.go('play', null, true);
  assert.equal(Exploration.count(0), 1); assert(!World.ents.some(e => e.id === first.id));
  killPlayer('fall'); PickupLedger.flush(); assert.equal(Save.data.run.stats.deaths, 1);
  App.trans = null; App.onDeath(); App.trans = null; App.go('play', null, true);
  assert.equal(Exploration.count(0), 1); assert(!World.ents.some(e => e.id === first.id));
  const campaign = JSON.stringify(Save.data.campaign), runSave = JSON.stringify(Save.data.run);
  App.startLevel(0); App.trans = null; App.go('play', null, true);
  const duplicate = World.ents.find(e => e.id === first.id); assert(duplicate.owned);
  const scoreBefore = Game.score; collect(0); assert.equal(Game.score, scoreBefore);
  collect(1); collect(2); assert.equal(Exploration.count(0), 3);
  Game.stats.frames = 6000; startClear();
  const key = Exploration.key(); assert.deepStrictEqual(Save.data.profile.records[key], { clear: true, noDeaths: true, secrets: true, time: true, bestFrames: 6000 });
  assert.equal(JSON.stringify(Save.data.campaign), campaign); assert.equal(JSON.stringify(Save.data.run), runSave);
  const record = JSON.stringify(Save.data.profile.records); App.saveProgress(true, true); assert.equal(JSON.stringify(Save.data.profile.records), record);
  App.trans = null; App.newGame(); assert.equal(Exploration.count(0), 3); assert.equal(Save.data.campaign.abilities.length, 0);
  // Importação une coleção/recordes; v4 conserva campanha e não inventa desafios.
  assert(Save.importText(saved).ok); assert.equal(Exploration.count(0), 3); assert.equal(Save.data.profile.records[key].bestFrames, 6000);
  const corrupt = JSON.parse(saved); corrupt.save.profile.memories.push('memory:4:2');
  assert.equal(Save.importText(JSON.stringify(corrupt)).msg, 'ARQUIVO CORROMPIDO');
  const dirty = JSON.parse(saved); dirty.save.profile.memories = ['memory:0:0', 'memory:0:0', 'memory:99:3'];
  dirty.save.profile.records = { 'wat': { noDeaths: true }, '0:normal:standard': { bestFrames: -2, noDeaths: 'yes' } };
  dirty.save.run.stats = { frames: -2, deaths: Infinity, eligible: 'yes', found: ['memory:4:2', 'memory:0:0', 'memory:0:0'] };
  dirty.check = Save.hash(JSON.stringify(dirty.save)); Save.data = Save.blank(); assert(Save.importText(JSON.stringify(dirty)).ok);
  assert.deepStrictEqual(Save.data.profile.memories, ['memory:0:0']); assert.equal(Save.data.profile.records[key].noDeaths, false);
  assert.equal(Save.data.run.stats.eligible, false); assert.deepStrictEqual(Save.data.run.stats.found, ['memory:0:0']);
  const old = JSON.parse(saved); old.format = old.save.version = 4; delete old.save.profile;
  old.check = Save.hash(JSON.stringify(old.save)); Save.data = Save.blank(); assert(Save.importText(JSON.stringify(old)).ok);
  assert.equal(Save.data.version, 5); assert.deepStrictEqual(Save.data.profile, Exploration.blank()); assert(!Save.data.run.stats.eligible);
  App.trans = null; App.continueRun(); App.trans = null; App.go('play', null, true); Game.stats.frames = 200;
  startClear(); assert.equal(Save.data.profile.records[Exploration.key()].noDeaths, false);
  assert.equal(Save.data.profile.records[Exploration.key()].bestFrames, null);
  // Mortes e metas são independentes, separados por modo e assistência.
  Save.data = Save.blank(); setup(); Game.stats.frames = 18001; Game.stats.deaths = 1; Game.stats.found = Exploration.ids(0); startClear();
  assert.deepStrictEqual(Save.data.profile.records[Exploration.key()], { clear: true, noDeaths: false, secrets: true, time: false, bestFrames: 18001 });
  setup(0, 'easy', true); Game.stats.frames = 500; startClear();
  assert(Save.data.profile.records['0:easy:assist'].noDeaths); assert(!Save.data.profile.records['0:easy:standard']);
  assert(!Save.data.profile.records['0:normal:standard'].noDeaths);
  // Pausa/cenas/aba oculta não gastam o tempo do desafio.
  p = setup(); World.ents = []; frames(10); const active = Game.stats.frames; App.openPause(); frames(30); assert.equal(Game.stats.frames, active);
  App.closePause(); document.hidden = true; frames(30); document.hidden = false; assert.equal(Game.stats.frames, active);
  Origin.begin('doubleJump'); App.state = 'origin'; frames(30); assert.equal(Game.stats.frames, active);
  App.state = 'play'; Kinhurine.begin(); frames(30); assert.equal(Game.stats.frames, active);
  // Assistência: tempo maior, tentativas no checkpoint; nunca libera poderes.
  p = setup(0, 'normal', true); assert.equal(World.time, 1350); assert.deepStrictEqual(Game.progress.abilities, []);
  Game.checkpoint = true; const lives = Game.lives; killPlayer('fall'); App.trans = null; App.onDeath(); assert.equal(Game.lives, lives);
  App.trans = null; App.go('play', null, true); assert.equal(World.player.x, World.cps[0].x + 2);
  const assisted = Save.fileText(); Comfort.set('assist', false); assert(Save.importText(assisted).ok);
  App.trans = null; App.continueRun(); App.trans = null; App.go('play', null, true); assert(Game.assist); assert.equal(World.time, 1350);
  Game.checkpoint = false; killPlayer('fall'); App.trans = null; App.onDeath(); assert.equal(Game.lives, lives - 1);
  // Conforto: estado salvo, volume independente e mesma física/proteção.
  setup(); Comfort.set('reducedShake', true); shake(12); assert.equal(World.cam.shake, 0);
  Comfort.set('reducedFlash', true); World.player.inv = 121;
  const images = [], drawImage = ctx.drawImage; ctx.drawImage = function(...args) { images.push(args[0]); drawImage.apply(this, args); };
  drawPlayer(World.player); assert(images.length > 0); ctx.drawImage = drawImage;
  assert(!hurtPlayer()); assert.equal(Game.hearts, 3);
  const graph = [], originalCtx = Sound.ctx, originalMusic = Sound.music, originalSfx = Sound.sfx;
  Sound.ctx = { currentTime: 0 }; Sound.music = { gain: { setTargetAtTime: value => graph.push(['music', value]) } }; Sound.sfx = { gain: { setTargetAtTime: value => graph.push(['effects', value]) } };
  Comfort.set('music', 0); Comfort.set('effects', 50); assert.deepStrictEqual(graph.slice(-2), [['music', 0], ['effects', 0.85]]);
  Sound.ctx = originalCtx; Sound.music = originalMusic; Sound.sfx = originalSfx;
  Comfort.music = 100; Comfort.effects = 100; Comfort.load(); assert.equal(Comfort.music, 0); assert.equal(Comfort.effects, 50); assert(Comfort.reducedFlash && Comfort.reducedShake);
  // Navegação real e prévias legíveis em 256×224.
  App.go('title', null, true); App.openTitleMenu(); App.openSettings(); App.openAudio(); shot('step5-comfort');
  App.menu.i = 0; tap('ArrowRight'); assert.equal(Comfort.music, 25); tap('ArrowLeft'); assert.equal(Comfort.music, 0);
  tap('Escape'); App.openGameplay(); App.menu.i = 1; shot('step5-assist'); tap('Escape');
  Save.data.unlocked = 5; Save.data.campaign = Progression.legacy(4); App.openSelect(); App.menu.i = 4; shot('step5-select');
  tap('Escape'); assert.equal(App.sub, 'settings'); setup(4); App.openPause(); shot('step5-pause');
  App.openGuide(); App.menu.items.find(i => i.label === 'EXPLORAÇÃO / DESAFIOS').fn(); const before = Game.stats.frames; frames(30); assert.equal(Game.stats.frames, before); shot('step5-challenges');
  tap('Escape'); assert.equal(App.sub, 'guide');
  App.openGameplay(); App.menu.i = 1; tap('Enter'); frames(40); assert(Game.assist); assert(!Game.stats.eligible);
  setup(4, 'normal', false); World.player = makePlayer(24 * TS, 171); World.cam.x = 24 * TS - 80; shot('step5-memory');
  Comfort.set('music', 100); Comfort.set('effects', 100); Comfort.set('reducedShake', false); Comfort.set('reducedFlash', false);
  localStorage.setItem(Comfort.KEY, '{invalid'); Comfort.load(); assert.equal(Comfort.music, 100); assert(!Comfort.assist);
  console.log(`OK${bundled ? ' (offline)' : ''}: coleção permanente, recompensas únicas, replay, desafios, categorias, tempo ativo, save v1–v5, menus e conforto.`);
}
run().catch(e => { console.error(e.stack); process.exitCode = 1; });
