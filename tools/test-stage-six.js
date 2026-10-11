'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
function frames(n, keys = []) { Input.keys = Object.fromEntries(keys.map(k => [k, true])); for (let i = 0; i < n; i++) App.update(); }
function tap(key) { frames(1, [key]); frames(1); }
function setup(level = 1, mode = 'normal') {
  Bonus.abort(); Difficulty.select(mode); Comfort.set('assist', false); Game.reset(); Game.levelIdx = level;
  Game.progress = Progression.legacy(level); App.trans = null; Input.touch = {}; Input.setPreset('classic', false); App.go('play', null, true);
  return World.player;
}
function enter(type = 'fiscal', mode = 'normal') {
  setup(type === 'fiscal' ? 1 : 3, mode); const door = World.ents.find(e => e.kind === 'duelDoor'); assert(door);
  World.player.x = door.x + 4; World.player.y = 171; World.cam.x = door.x - 112;
  assert(Bonus.enter(door)); return World.ents.find(e => e.kind === 'miniboss');
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
  // Kinhu continua sem inimigos; desafios são desvios optativos, fora da arena final.
  for (const level of [1, 3]) {
    setup(level, 'kinhu'); assert(!World.ents.some(e => e.kind === 'duelDoor' || e.kind === 'miniboss'));
    setup(level); const door = World.ents.find(e => e.kind === 'duelDoor');
    assert(isSolid(tileAt(Math.floor((door.x + 24) / TS), 12))); assert(!isSolid(tileAt(Math.floor(door.x / TS), 10)));
    World.cam.x = door.x - 112; World.player.x = door.x - 12; shot('duel-door-' + (level + 1));
    World.player.x = door.x + 4;
    tap('ArrowUp'); assert(Bonus.active, 'entrada real com cima'); Bonus.finish('leave'); assert(door.spent);
  }
  // Vida, ritmo e janela de dano dos dois comportamentos nos três modos.
  for (const type of ['fiscal', 'printer']) for (const mode of ['easy', 'normal', 'hard']) {
    let mini = enter(type, mode); const expected = (type === 'fiscal' ? 6 : 8) + (mode === 'easy' ? -2 : mode === 'hard' ? 2 : 0);
    assert.equal(mini.hp, expected); assert(!Minibosses.hit(mini));
    World.player.x = 35; const startX = mini.x;
    frames(Difficulty.frames(42) - 1); assert.equal(mini.state, 'warn'); assert.equal(World.projs.length, 0); shot(type + '-' + mode + '-warn');
    frames(1); assert.equal(mini.state, 'attack'); frames(1);
    if (type === 'fiscal') assert(mini.x < startX); else assert(World.projs.some(p => p.owner === 'miniboss'));
    frames(Difficulty.frames(32) - 1); assert.equal(mini.state, 'recover'); shot(type + '-' + mode + '-open');
    assert(Minibosses.hit(mini)); assert.equal(mini.hp, expected - 1); assert(!Minibosses.hit(mini, 2));
    frames(39); assert(!Minibosses.hit(mini)); frames(1); assert(Minibosses.hit(mini));
    assert.equal(mini.hp, expected - 2); Bonus.finish('leave');
  }
  // Latas têm o mesmo intervalo; barrigada aplica dois pontos em uma aterrissagem.
  let mini = enter('printer'); mini.state = 'recover';
  const can = () => World.projs.push({ type: 'can', x: mini.x + 2, y: mini.y + 4, w: 6, h: 6, vx: 0, vy: 0, life: 120, t: 0 });
  can(); updateProjs(); assert.equal(mini.hp, 7); can(); updateProjs(); assert.equal(mini.hp, 7);
  mini.inv = 0; const p = World.player; p.x = mini.x + 2; p.y = mini.y - p.h + 2; p.prevY = mini.y - p.h - 2; p.vy = 3; p.slam = true;
  Minibosses.update(mini); assert.equal(mini.hp, 5); assert(!p.slam); assert(p.vy < 0);
  // Vitória com comandos/física reais, sem Coca-Cola, Kinhurine ou invencibilidade.
  for (const type of ['fiscal', 'printer']) {
    mini = enter(type, 'normal'); let ending = false;
    for (let t = 0; t < 5300 && Bonus.active; t++) {
      const p = World.player, keys = [], open = mini.state === 'recover';
      const target = open || p.y + p.h < mini.y ? mini.x + mini.w / 2 - p.w / 2 : 3 * TS;
      if (p.x < target - 4) keys.push('ArrowRight'); else if (p.x > target + 4) keys.push('ArrowLeft');
      keys.push('ShiftLeft');
      if ((p.onGround || p.ride || p.coyote > 0) ? open && !Input.down('jump') : p.vy < 0) keys.push('KeyZ');
      frames(1, keys); if (mini.state === 'dead') ending = true;
    }
    assert(ending && !Bonus.active, `${type} vencível sem itens (hp=${mini.hp}, estado=${mini.state})`);
    assert(Save.data.profile.minibosses.includes(type)); assert(Game.score >= 3000); assert.equal(Game.stats.deaths, 0);
    assert(Game.collected.some(id => id.startsWith('duel:')));
  }
  // Dano reduz somente os três corações do desafio; saída/falha não penaliza campanha.
  setup(); Game.hearts = 1; Game.power = 1; Game.checkpoint = true; ItemEffects.acquire(World.player, 'backpack'); ItemEffects.acquire(World.player, 'coffee');
  const door = World.ents.find(e => e.kind === 'duelDoor'), parent = World; parent.player.x = door.x; assert(Bonus.enter(door));
  const stats = Game.stats.frames, time = parent.time; frames(10); assert.equal(Game.stats.frames, stats + 10); assert.equal(parent.time, time);
  assert.equal(parent.player.utilityT, 480); App.openPause(); const left = Bonus.active.left; frames(20); assert.equal(Bonus.active.left, left); App.closePause();
  document.hidden = true; frames(20); document.hidden = false; assert.equal(Bonus.active.left, left);
  for (let i = 0; i < 3; i++) { World.player.inv = 0; assert(hurtPlayer()); }
  assert(!Bonus.active); assert.equal(World, parent); assert.equal(Game.hearts, 1); assert.equal(Game.power, 1); assert(Game.checkpoint); assert.equal(Game.stats.deaths, 0);
  assert(parent.player.backpack); assert.equal(parent.player.utilityT, 480);
  mini = enter(); const exportedDuringFight = Save.fileText(); assert(Save.importText(exportedDuringFight).ok);
  App.trans = null; App.continueRun(); App.trans = null; App.go('play', null, true); assert(!Bonus.active); assert(World.ents.find(e => e.kind === 'duelDoor').spent);
  // Coleção, medalhas e vitórias liberam quatro opções; mudar modo não duplica medalhas.
  Save.data = Save.blank(); assert(!Cosmetics.select('blue')); assert(Cosmetics.select('original'));
  Save.data.profile.memories = Exploration.validIds().slice(0, 3); assert(Cosmetics.select('blue')); assert(!Cosmetics.select('green'));
  Save.data.profile.memories = Exploration.validIds(); assert(Cosmetics.select('green'));
  const record = { clear: true, noDeaths: true, secrets: false, time: false, bestFrames: 1000 };
  Save.data.profile.records = { '0:normal:standard': record, '0:easy:assist': record }; assert.equal(Cosmetics.medals(Save.data.profile), 1);
  Save.data.profile.records['0:normal:standard'] = { ...record, secrets: true, time: true }; assert(Cosmetics.select('purple'));
  Save.data.profile.minibosses = ['fiscal', 'printer']; assert(Cosmetics.select('gold'));
  for (const bad of ['__proto__', 'wat', 'constructor']) assert(!Cosmetics.select(bad));
  Cosmetics.load(); assert.equal(Cosmetics.current(), 'gold');
  setup(); const state = JSON.stringify({ player: World.player, hearts: Game.hearts, progress: Game.progress });
  for (const id of Object.keys(Cosmetics.styles)) { assert(Cosmetics.select(id)); assert.equal(JSON.stringify({ player: World.player, hearts: Game.hearts, progress: Game.progress }), state); }
  // Desenho respeita Coca/Kinhurine; só a roupa normal muda, colisão permanece 12x21.
  World.player.onGround = true; World.player.blink = 12; Cosmetics.select('blue');
  const calls = [], drawImage = ctx.drawImage; ctx.drawImage = function(img, ...args) { calls.push(img); return drawImage.call(this, img, ...args); };
  drawPlayer(World.player); assert(calls.includes(SPR.costumes.blue.idle.r)); calls.length = 0; Game.power = 1;
  drawPlayer(World.player); assert(calls.includes(SPR.kinhuCoca.idle.r)); calls.length = 0; World.player.wild = 300;
  drawPlayer(World.player); assert(calls.includes(SPR.kinhuWild[Math.floor(World.t / 3) % 3].idle.r)); ctx.drawImage = drawImage;
  assert.equal(World.player.w, 12); assert.equal(World.player.h, 21);
  Game.power = 0; World.player.wild = 0; App.openPause(); App.openSettings(); App.openCosmetics();
  for (let i = 0; i < App.menu.items.length; i++) { App.menu.i = i; shot('cosmetic-' + i); }
  tap('Escape'); assert.equal(App.sub, 'settings'); App.closePause();
  // Migração v5/v1–4 não inventa vitórias; versão 6 conserva/une IDs válidos.
  const v5 = JSON.parse(Save.fileText()); v5.format = v5.save.version = 5; v5.save.profile.minibosses = ['fiscal'];
  v5.check = Save.hash(JSON.stringify(v5.save)); Save.data = Save.blank(); assert(Save.importText(JSON.stringify(v5)).ok);
  assert.equal(Save.data.version, 6); assert.equal(Save.data.profile.memories.length, 15); assert.deepStrictEqual(Save.data.profile.minibosses, []);
  localStorage.setItem(Save.KEY, JSON.stringify(v5.save)); Save.load(); assert.equal(Save.data.version, 6); assert.deepStrictEqual(Save.data.profile.minibosses, []);
  Save.data.profile.minibosses = ['fiscal']; const v6 = JSON.parse(Save.fileText()); v6.save.profile.minibosses = ['printer', 'printer', 'unknown']; v6.check = Save.hash(JSON.stringify(v6.save));
  assert(Save.importText(JSON.stringify(v6)).ok); assert.deepStrictEqual(Save.data.profile.minibosses.sort(), ['fiscal', 'printer']); assert(Cosmetics.unlocked('gold'));
  const victories = Save.data.profile.minibosses.slice(); App.newGame(); assert.deepStrictEqual(Save.data.profile.minibosses, victories);
  // Replay pode conquistar vitória no perfil, preservando a campanha em andamento.
  App.trans = null; App.go('play', null, true); const campaign = JSON.stringify(Save.data.run); App.startLevel(3); App.trans = null; App.go('play', null, true);
  const replayDoor = World.ents.find(e => e.kind === 'duelDoor'); assert(Bonus.enter(replayDoor)); mini = World.ents.find(e => e.kind === 'miniboss'); mini.state = 'recover';
  Minibosses.hit(mini, mini.hp); frames(60); assert(!Bonus.active); assert.equal(JSON.stringify(Save.data.run), campaign);
  App.openPause(); App.openGuide(); App.openInfo('help', 4); shot('stage-six-help'); tap('Escape'); assert.equal(App.sub, 'guide');
  Cosmetics.select('original'); Difficulty.select('normal'); console.log(`OK${bundled ? ' (offline)' : ''}: dois minichefes, janelas/intervalos, vitória por física, modos, proteção da campanha, quatro cosméticos, save v1–6 e menus.`);
}
run().catch(e => { console.error(e.stack); process.exitCode = 1; });
