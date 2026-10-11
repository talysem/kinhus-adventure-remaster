'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
const frames = (n, keys = []) => { Input.keys = Object.fromEntries(keys.map(k => [k, true])); for (let i = 0; i < n; i++) App.update(); };
const tap = key => { frames(1, [key]); frames(1); };
function setup(level = 3, mode = 'normal') {
  Bonus.abort(); Comfort.set('assist', false); Difficulty.select(mode); Game.reset(); Game.levelIdx = level;
  Game.progress = Progression.legacy(level); Input.clear(); Input.touch = {}; App.trans = null; App.go('play', null, true);
  return World.player;
}
function unlock() {
  const p = World.player, e = World.ents.find(e => e.kind === 'maintenanceKey'); assert(e);
  p.x = e.x; p.y = e.y; Bonus.update(e); assert(!e.alive); assert.equal(p.maintenanceKey, e.id);
  const door = World.ents.find(e => e.kind === 'bonusDoor'); p.x = door.x + 4; p.y = door.y + 32 - p.h; p.vx = p.vy = 0;
  World.cam.x = door.x - 112;
  return door;
}
function enter(level = 3, mode = 'normal') { setup(level, mode); const door = unlock(); assert(Bonus.enter(door)); return Bonus.active; }
function shot(name) {
  const text = [], draw = Font.draw;
  Font.draw = function(line, ...args) { text.push(line); return draw.call(this, line, ...args); };
  App.render(); Font.draw = draw;
  assert(text.every(t => Font.width(t) <= 244), text.filter(t => Font.width(t) > 244).join('\n'));
  fs.writeFileSync(path.join(out, name + '.png'), screen.toPNG());
}
const phaseState = parent => JSON.stringify({ map: parent.map, plats: parent.plats, ents: parent.ents, projs: parent.projs, t: parent.t, time: parent.time, timeT: parent.timeT });
async function run() {
  await Promise.all([IntroArt.preload(), Origin.preload(), Kinhurine.preload()]);
  // Chaves em ar livre, alcançáveis a partir do chão da própria fase.
  for (const level of [3, 4]) {
    setup(level, 'kinhu'); const key = World.ents.find(e => e.kind === 'maintenanceKey'), door = World.ents.find(e => e.kind === 'bonusDoor');
    assert.equal(World.ents.filter(e => e.kind === 'bonusDoor').length, 1);
    assert(!isSolid(tileAt(Math.floor(key.x / TS), Math.floor(key.y / TS))));
    World.player = makePlayer(key.x, 12 * TS - 21); frames(1); let reached = false;
    for (let t = 0; t < 60; t++) { frames(1, t < 24 ? ['KeyZ'] : []); if (!key.alive) { reached = true; break; } }
    assert(reached, `cráchá alcançável na fase ${level + 1}`);
    assert(!World.arena || door.x < World.arena.x); assert(isSolid(tileAt(Math.floor((door.x + 24) / TS), 12)), 'retorno em chão seguro');
    World.cam.x = door.x - 112; World.bannerT = 0; World.player.x = door.x - 12; World.player.y = 171; shot(`bonus-door-${level + 1}`);
  }
  // Direcional para cima abre nos três dispositivos; sem crachá não abre.
  for (const device of ['keyboard', 'gamepad', 'touch']) {
    setup(); const locked = World.ents.find(e => e.kind === 'bonusDoor'); World.player.x = locked.x + 4; World.player.y = 171;
    World.cam.x = locked.x - 112;
    tap('ArrowUp'); assert(!Bonus.active);
    const door = unlock(), parent = World; Input.device = device;
    const pads = navigator.getGamepads;
    if (device === 'keyboard') tap('ArrowUp');
    if (device === 'gamepad') { navigator.getGamepads = () => [{ axes: [0, 0], buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 12 })) }]; frames(1); navigator.getGamepads = pads; frames(1); }
    if (device === 'touch') { Input.touch.up = true; frames(1); Input.touch.up = false; frames(1); }
    assert(Bonus.active, device); assert.equal(Bonus.active.parent, parent); assert(Game.collected.includes(door.id)); assert.equal(parent.player.maintenanceKey, null);
    assert(Save.data.run.collected.includes(door.id)); Bonus.finish('leave'); assert.equal(World, parent); assert(!Bonus.enter(door));
  }
  // Mundo, inventário e cronômetro principal congelados; recorde mede o desvio.
  setup(); ItemEffects.acquire(World.player, 'backpack'); ItemEffects.acquire(World.player, 'coffee'); World.player.wild = 250; World.player.inv = 40;
  Game.hearts = 2; Game.power = 1; World.time = 333; World.timeT = 17; Sound.tempo = 1.25;
  const door = unlock(); assert(Bonus.enter(door)); let session = Bonus.active, parent = session.parent;
  const before = phaseState(parent), stats = Game.stats.frames; frames(30); assert.equal(phaseState(parent), before);
  assert.equal(Game.stats.frames, stats + 30); assert.equal(parent.player.utilityT, 480); assert.equal(parent.player.wild, 250); assert(parent.player.backpack);
  assert.equal(Game.hearts, 2); assert.equal(Game.power, 1); assert.equal(Bonus.active.left, 2670);
  App.openPause(); const left = session.left; frames(40); assert.equal(session.left, left); assert.equal(Game.stats.frames, stats + 30); shot('bonus-pause'); App.closePause();
  document.hidden = true; frames(40); document.hidden = false; assert.equal(session.left, left);
  // Falha não altera vidas/corações/checkpoint/mortes. Moedas recolhidas continuam.
  const coin = World.ents.find(e => e.kind === 'bonusCoin'); World.player.x = coin.x; World.player.y = coin.y; Bonus.update(coin);
  const lives = Game.lives, deaths = Game.stats.deaths; World.player.y = H + 25; frames(1);
  assert(!Bonus.active); assert.equal(World, parent); assert.equal(Game.lives, lives); assert.equal(Game.hearts, 2); assert.equal(Game.stats.deaths, deaths);
  assert.equal(Game.coins, 1); assert.equal(Game.score, 100); assert.equal(World.time, 333); assert.equal(World.timeT, 17); assert.equal(Sound.tempo, 1.25);
  assert.equal(World.player.utilityT, 480); assert(World.player.backpack); assert.equal(World.player.wild, 250);
  for (const reason of ['timeout', 'hit']) {
    session = enter(); parent = session.parent; const lives = Game.lives, deaths = Game.stats.deaths;
    if (reason === 'timeout') { session.left = 1; frames(1); } else hurtPlayer();
    assert(!Bonus.active); assert.equal(World, parent); assert.equal(Game.lives, lives); assert.equal(Game.hearts, 3); assert.equal(Game.stats.deaths, deaths);
  }
  // As 10 moedas são alcançáveis com a física real, nos dois desenhos de sala.
  for (const level of [3, 4]) {
    enter(level, 'kinhu'); shot(`bonus-room-${level + 1}`);
    for (const coin of World.ents.filter(e => e.kind === 'bonusCoin')) {
      let reached = false;
      for (let dx = -2; dx <= 2 && !reached; dx++) for (let row = Math.floor(coin.y / TS) + 1; row <= 12 && !reached; row++) {
        const tx = Math.floor(coin.x / TS) + dx, tile = tileAt(tx, row);
        if (!(isSolid(tile) || ONEWAY.has(tile))) continue;
        World.player = makePlayer(tx * TS + 2, row * TS - 21); Input.clear(); frames(1);
        for (let t = 0; t < 75 && Bonus.active; t++) {
          const p = World.player, keys = t < 24 ? ['KeyZ'] : [];
          if (p.x < coin.x - 2) keys.push('ArrowRight'); else if (p.x > coin.x + 2) keys.push('ArrowLeft');
          frames(1, keys); if (!coin.alive) { reached = true; break; }
        }
      }
      assert(reached, `moeda acessível na sala ${level + 1}`);
    }
    assert.equal(Game.coins, 10); assert.equal(Game.score, 1000); const exit = World.ents.find(e => e.kind === 'bonusExit' && e.complete);
    World.player.x = exit.x + 4; World.player.y = 171; tap('ArrowUp'); assert(!Bonus.active); assert.equal(Game.score, 2000);
    assert(!Bonus.enter(World.ents.find(e => e.kind === 'bonusDoor')));
    // Travessia contínua sem teleportes, sem poderes temporários e dentro de 45s.
    session = enter(level, 'kinhu');
    for (let t = 0; t < 900 && Bonus.active; t++) {
      const p = World.player, keys = [];
      if (p.x < 36 * TS) { keys.push('ArrowRight', 'ShiftLeft'); if ((p.onGround || p.coyote > 0) ? !Input.down('jump') : p.vy < 0) keys.push('KeyZ'); }
      else if (p.x < 37 * TS) keys.push('ArrowRight');
      else if (p.x > 37 * TS + 6) keys.push('ArrowLeft');
      else if (p.onGround) keys.push('ArrowUp');
      frames(1, keys);
    }
    assert(!Bonus.active, `sala ${level + 1} terminável: x=${World.player.x}, y=${World.player.y}, chão=${World.player.onGround}`); assert(World.banner.includes('CONCLUÍDO'), 'saída final alcançada, sem queda');
  }
  // Uso da sala e recompensas preservados no save; crachá da tentativa não é salvo.
  session = enter(); const saved = Save.fileText(), roomId = session.door.id;
  assert.equal(Save.FORMAT, 6); assert(Save.data.run.collected.includes(roomId)); assert(!('maintenanceKey' in Save.data.run));
  assert(Save.importText(saved).ok); App.trans = null; App.continueRun(); App.trans = null; App.go('play', null, true);
  assert(!Bonus.active); assert(Game.collected.includes(roomId)); assert(!World.ents.some(e => e.kind === 'maintenanceKey')); assert(World.ents.find(e => e.kind === 'bonusDoor').spent);
  // Crachá não usado reaparece na retomada; replay renova sala sem mudar campanha.
  setup(); unlock(); App.saveProgress(false, true); App.trans = null; App.continueRun(); App.trans = null; App.go('play', null, true);
  assert(!World.player.maintenanceKey); assert(World.ents.some(e => e.kind === 'maintenanceKey'));
  const campaign = JSON.stringify(Save.data.run); App.startLevel(3); App.trans = null; App.go('play', null, true); const replayDoor = unlock(); assert(Bonus.enter(replayDoor));
  Bonus.finish('complete'); assert.equal(JSON.stringify(Save.data.run), campaign);
  // Pausa, ajuda e configuração de dificuldade não deixam sessão pendurada.
  enter(); App.openPause(); App.openGuide(); App.openInfo('help', 3); shot('bonus-help'); tap('Escape'); tap('Escape');
  const leave = App.menu.items.find(i => i.label === 'SAIR DA SALA BÔNUS'); assert(leave); leave.fn(); assert(!Bonus.active); assert.equal(App.state, 'play');
  enter(); App.openPause(); App.openDifficulty(); App.menu.i = 3; tap('Enter'); frames(40); assert(!Bonus.active); assert.equal(Game.difficulty, 'hard'); assert(!World.def.bonusRoom);
  enter(); App.newGame(); assert(!Bonus.active); assert.equal(Game.collected.length, 0);
  Difficulty.select('normal'); console.log(`OK${bundled ? ' (offline)' : ''}: crachás, duas salas, teclado/gamepad/toque, física, congelamento, saída/falha, recompensas, save v5, replay e menus.`);
}
run().catch(e => { console.error(e.stack); process.exitCode = 1; });
