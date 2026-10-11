'use strict';
// Integra física, dano, coleta, save e menus no fonte e no HTML offline.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const frames = (n, codes = []) => {
  Input.keys = Object.fromEntries(codes.map(code => [code, true]));
  for (let i = 0; i < n; i++) App.update();
};
const tap = code => { frames(1, [code]); frames(1); };
const close = (a, b) => assert(Math.abs(a - b) < 0.001, `${a} != ${b}`);
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
const shot = name => { App.render(); fs.writeFileSync(path.join(out, name + '.png'), screen.toPNG()); };
function setup(mode = 'normal', level = 0, floor = true) {
  Difficulty.select(mode); Game.reset(); Game.levelIdx = level;
  App.trans = null; Input.clear(); App.go('play', null, true);
  if (floor) {
    World.ents = []; World.plats = [];
    for (let x = 0; x < 120; x++) {
      for (let y = 0; y < 12; y++) setTile(x, y, '.');
      setTile(x, 12, '#');
    }
    World.player = makePlayer(40, 12 * TS - 21); frames(1);
  }
  return World.player;
}
async function run() {
  await Promise.all([IntroArt.preload(), Origin.preload(), Kinhurine.preload()]);
  // Duração exata, renovação, substituição e coexistência com Coca/mochila.
  let p = setup(); Game.power = 1;
  ItemEffects.acquire(p, 'backpack'); ItemEffects.acquire(p, 'coffee');
  frames(100); assert.equal(p.utilityT, 380);
  ItemEffects.acquire(p, 'coffee'); assert.equal(p.utilityT, 480);
  ItemEffects.acquire(p, 'magnet'); assert.equal(p.utility, 'magnet'); assert.equal(p.utilityT, 720);
  assert(p.backpack); assert.equal(Game.power, 1);
  frames(719); assert.equal(p.utilityT, 1); frames(1); assert.equal(p.utility, null);
  ItemEffects.acquire(p, 'coffee'); frames(479); assert.equal(p.utilityT, 1); frames(1); assert.equal(p.utility, null);
  // Mesmo golpe não consome mochila e Coca. Perigos fatais ignoram proteção.
  assert(hurtPlayer()); assert(!p.backpack); assert.equal(Game.power, 1); assert.equal(Game.hearts, 3);
  assert(!hurtPlayer()); assert.equal(Game.power, 1);
  p.inv = 0; hurtPlayer(); assert.equal(Game.power, 0); assert.equal(Game.hearts, 3);
  p.inv = 0; hurtPlayer(); assert.equal(Game.hearts, 2);
  ItemEffects.acquire(p, 'backpack'); ItemEffects.acquire(p, 'coffee'); p.wild = 100; p.inv = 0;
  assert(!hurtPlayer()); assert(p.backpack); frames(50); assert.equal(p.utilityT, 480);
  p.wild = 0; frames(1); assert.equal(p.utilityT, 479);
  for (const danger of ['liquid', 'fall', 'crush']) {
    p = setup(); ItemEffects.acquire(p, 'backpack'); ItemEffects.acquire(p, 'coffee'); p.wild = 600;
    if (danger === 'liquid') { setTile(2, 11, '~'); hazards(p); }
    if (danger === 'fall') { p.y = World.h * TS + 25; hazards(p); }
    if (danger === 'crush') updateCrusher({ x: p.x - 2, y: p.y - 18, w: 32, h: 32, state: 'fall', t: 0, vy: 0 }, p);
    assert(p.dead, danger); assert.equal(p.utility, null); assert(!p.backpack);
  }
  // Café altera aceleração/velocidade, mantendo impulso e altura do pulo.
  const measure = coffee => {
    const q = setup(); if (coffee) ItemEffects.acquire(q, 'coffee');
    frames(1, ['ArrowRight', 'ShiftLeft']); const acc = q.vx;
    frames(39, ['ArrowRight', 'ShiftLeft']); const speed = q.vx;
    frames(1, ['ArrowRight', 'ShiftLeft', 'KeyZ']); const vy = q.vy;
    let apex = q.y; for (let i = 0; i < 23; i++) { frames(1, ['KeyZ']); apex = Math.min(apex, q.y); }
    return { acc, speed, vy, apex };
  };
  const regular = measure(false), coffee = measure(true);
  close(coffee.acc / regular.acc, 1.15); close(coffee.speed / regular.speed, 1.15);
  close(coffee.vy, regular.vy); close(coffee.apex, regular.apex);
  // Ímã: raio de 48px, paredes, moedas soltas; nunca atrai outros itens.
  p = setup(); ItemEffects.acquire(p, 'magnet'); setTile(5, 11, 'c'); setTile(6, 11, 'c'); setTile(4, 11, 'S');
  const stationary = addEnt({ kind: 'item', item: 'backpack', x: 80, y: 176, w: 12, h: 12, emerge: 0, t: 0, vx: 0, vy: 0, dir: 1 });
  ItemEffects.magnet(p); assert.equal(Game.coins, 0); assert.equal(tileAt(5, 11), 'c');
  setTile(4, 11, '.'); ItemEffects.magnet(p); assert.equal(Game.coins, 1); assert.equal(tileAt(5, 11), '.'); assert.equal(tileAt(6, 11), 'c');
  assert.equal(stationary.x, 80); ItemEffects.magnet(p); assert.equal(Game.coins, 1);
  const loose = addEnt({ kind: 'coin', x: 70, y: 176, w: 10, h: 10, vx: 0, vy: 0, t: 21 });
  ItemEffects.magnet(p); assert(loose.attracted); assert.equal(Game.coins, 2);
  for (let i = 0; i < 100 && loose.alive; i++) updateEnt(loose);
  assert.equal(Game.coins, 2); assert(!loose.alive);
  // Pausa, aba oculta, origem e transformação congelam os bônus.
  p = setup(); ItemEffects.acquire(p, 'coffee'); ItemEffects.acquire(p, 'backpack');
  App.openPause(); frames(40); assert.equal(p.utilityT, 480);
  App.closePause(); document.hidden = true; frames(40); document.hidden = false; assert.equal(p.utilityT, 480);
  Origin.begin('doubleJump'); App.state = 'origin'; frames(40); assert.equal(p.utilityT, 480);
  App.state = 'play'; Kinhurine.begin(); frames(40); assert.equal(p.utilityT, 480);
  App.trans = null; App.state = 'play'; p.wild = 300; Game.progress = Progression.legacy(4);
  shot('items-hud-suspended'); p.wild = 0; p.utilityT = 85; shot('items-hud-expiring');
  App.openPause(); App.sub = 'help'; App.helpPage = 1; shot('items-help');
  // Itens fixos acessíveis e esparsos, com IDs estáveis.
  for (let i = 0; i < LEVELS.length; i++) {
    setup('normal', i, false);
    const items = World.ents.filter(e => e.kind === 'item' && e.sourceId);
    assert.equal(items.length, LEVELS[i].items.length); assert(items.filter(e => ['coffee', 'magnet', 'backpack'].includes(e.item)).length <= 3);
    for (const e of items) {
      assert(!isSolid(tileAt(Math.floor(e.x / TS), Math.floor(e.y / TS))), 'item fora das estruturas');
      World.player.x = e.x; World.player.y = e.y; updateItem(e, World.player); assert(!e.alive); assert(Game.collected.includes(e.sourceId));
    }
    loadLevel(i, false); assert(!World.player.backpack); assert.equal(World.player.utility, null);
    assert(!World.ents.some(e => e.kind === 'item' && e.sourceId), 'não reaparece ao reiniciar');
  }
  // Save conserva consumo e recompensa, mas não restaura os bônus temporários.
  p = setup('normal', 0, false);
  const fixed = World.ents.find(e => e.item === 'magnet'); p.x = fixed.x; p.y = fixed.y; updateItem(fixed, p);
  const coin = buildLevelRows(LEVELS[0]).flatMap((row, y) => [...row].map((c, x) => ({ c, x, y }))).find(c => c.c === 'c');
  p.x = coin.x * TS; p.y = coin.y * TS; collectTiles(p); PickupLedger.flush();
  const coinCount = Game.coins, ids = Game.collected.slice(), exported = Save.fileText();
  assert.equal(Save.data.run.difficulty, 'normal'); assert(!('utility' in Save.data.run));
  assert(Save.importText(exported).ok); App.trans = null; App.continueRun(); App.go('play', null, true);
  assert.deepStrictEqual(Game.collected, ids); assert.equal(Game.coins, coinCount);
  assert.equal(World.player.utility, null); assert.equal(tileAt(coin.x, coin.y), '.');
  assert(!World.ents.some(e => e.item === 'magnet'));
  loadLevel(0, true); assert.equal(tileAt(coin.x, coin.y), '.');
  Game.lives = 2; App.trans = null; App.onDeath(); App.go('play', null, true);
  assert.equal(tileAt(coin.x, coin.y), '.');
  // Blocos de moedas e itens também não renovam recompensa por retomada.
  p = setup('normal', 0, false);
  const rows = buildLevelRows(LEVELS[0]);
  const blocks = rows.flatMap((row, y) => [...row].map((c, x) => ({ c, x, y })));
  const moneyBlock = blocks.find(b => b.c === '?'), drinkBlock = blocks.find(b => b.c === 'H');
  bumpBlock(moneyBlock.x, moneyBlock.y); const afterBlock = Game.coins;
  bumpBlock(drinkBlock.x, drinkBlock.y);
  const drink = World.ents.find(e => e.kind === 'item' && e.sourceId === PickupLedger.key('block', drinkBlock.x, drinkBlock.y));
  drink.emerge = 0; p.x = drink.x; p.y = drink.y; updateItem(drink, p); assert.equal(Game.power, 1);
  PickupLedger.flush(); App.trans = null; App.continueRun(); App.trans = null; App.go('play', null, true);
  assert.equal(tileAt(moneyBlock.x, moneyBlock.y), 'U'); assert.equal(tileAt(drinkBlock.x, drinkBlock.y), 'U');
  bumpBlock(moneyBlock.x, moneyBlock.y); assert.equal(Game.coins, afterBlock);
  assert(!World.ents.some(e => e.sourceId === drink.sourceId));
  const fake = JSON.parse(exported); fake.save.run.collected.push('item:0:999:999', 'block:4:1:1', ids[0]);
  fake.save.run.difficulty = '__proto__'; fake.save.run.backpack = true; fake.check = Save.hash(JSON.stringify(fake.save));
  assert(Save.importText(JSON.stringify(fake)).ok); assert.deepStrictEqual(Save.data.run.collected, ids); assert.equal(Save.data.run.difficulty, 'normal');
  const v3 = { ...Save.data, version: 3 }; const legacy = JSON.stringify({ game: "Kinhu's Adventure", format: 3, save: v3, check: Save.hash(JSON.stringify(v3)) });
  assert(Save.importText(legacy).ok); assert.equal(Save.data.version, 6); assert.deepStrictEqual(Save.data.run.collected, []);
  // Dificuldades: parâmetros aplicados, preferências, save e menu sem alterar campanha.
  const speeds = {}, cooldowns = {};
  for (const mode of ['kinhu', 'easy', 'normal', 'hard']) {
    p = setup(mode, 4, false); const cfg = Difficulty.modes[mode];
    assert.equal(Game.lives, cfg.lives); assert.equal(World.time, cfg.time);
    if (mode === 'kinhu') {
      for (let i = 0; i < LEVELS.length; i++) {
        Game.levelIdx = i; loadLevel(i, false);
        assert(!World.ents.some(e => e.enemy || e.kind === 'boss' || e.kind === 'shooter'));
        assert(!World.boss); assert(!World.projs.some(q => q.hostile));
        assert(World.map.some(row => row.includes('~') || row.includes('^')), 'perigos ambientais preservados');
      }
      p = World.player; p.x = World.arena.x + 40; p.y = 171; updateWorld();
      assert(!World.bossFight); assert.equal(World.cam.lock, null);
      const trophy = World.ents.find(e => e.item === 'trophy'); assert(trophy);
      p.x = trophy.x; p.y = trophy.y; updateItem(trophy, p);
      assert(Save.data.completed); assert.equal(Save.data.run, null); assert(Game.completed);
    } else {
      assert.equal(World.boss.hp, cfg.bossHP); assert.equal(World.boss.maxHp, cfg.bossHP);
      p = setup(mode); const dog = makeEnemy('d', 120, 192); dog.dir = -1; updateEnemy(dog); speeds[mode] = Math.abs(dog.vx);
      const co = makeEnemy('w', 100, 192); co.cool = 1; updateEnemy(co); cooldowns[mode] = co.cool;
      p.inv = 0; hurtPlayer(); assert.equal(p.inv, cfg.inv);
    }
    assert.equal(localStorage.getItem(Difficulty.KEY), mode); Difficulty.selected = 'normal'; Difficulty.load(); assert.equal(Difficulty.selected, mode);
  }
  assert(speeds.easy < speeds.normal && speeds.normal < speeds.hard);
  assert(cooldowns.easy > cooldowns.normal && cooldowns.normal > cooldowns.hard);
  for (const bad of ['wat', '__proto__', 'constructor']) { assert(!Difficulty.select(bad)); localStorage.setItem(Difficulty.KEY, bad); Difficulty.load(); assert.equal(Difficulty.selected, 'normal'); }
  p = setup('easy'); Game.checkpoint = true; App.saveProgress(false, true); const saved = JSON.stringify(Save.data);
  App.go('title', null, true); App.openTitleMenu(); App.openSettings(); App.openGameplay(); App.menu.items[0].fn();
  for (let i = 0; i < 4; i++) { App.menu.i = i; shot('difficulty-' + Object.keys(Difficulty.modes)[i]); }
  App.menu.i = 3; tap('Enter'); assert.equal(Difficulty.selected, 'hard'); assert.equal(JSON.stringify(Save.data), saved);
  tap('Escape'); App.trans = null; App.continueRun(); App.trans = null; App.go('play', null, true);
  assert.equal(Game.difficulty, 'easy'); assert.equal(World.time, 1200); assert.equal(World.player.x, World.cps[0].x + 2);
  ItemEffects.acquire(World.player, 'coffee'); App.openPause(); const oldT = World.t; App.openDifficulty();
  frames(30); assert.equal(World.t, oldT); shot('difficulty-pause'); App.menu.i = 3; tap('Enter'); frames(40);
  assert.equal(Game.difficulty, 'hard'); assert.equal(Game.lives, 2); assert.equal(World.time, 750);
  assert(Game.checkpoint); assert.equal(World.player.utility, null); assert.equal(Save.data.run.difficulty, 'hard');
  App.trans = null; App.newGame(); assert.equal(Game.difficulty, 'hard'); assert.equal(Game.lives, 2);
  const campaign = JSON.stringify(Save.data); Difficulty.select('kinhu'); App.startLevel(4); App.go('play', null, true);
  assert.equal(Game.difficulty, 'kinhu'); assert(!World.boss); assert.equal(JSON.stringify(Save.data), campaign);
  console.log('OK: café/mochila/ímã, duração, dano, fatalidade, física, paredes, congelamento, consumo e migração v3.');
  console.log('OK: quatro dificuldades, inimigos/ataques/chefe, troféu e conclusão Kinhu, menus, persistência, retomada e replay.');
}
run().catch(e => { console.error(e.stack); process.exitCode = 1; });
