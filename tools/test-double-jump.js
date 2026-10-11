'use strict';
// Física e sequência reais nos três dispositivos, incluindo origem e retomada.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { boot, SoftCanvas } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
let device = 'keyboard', padButtons = [], padAxes = [0, 0];
navigator.getGamepads = () => device === 'gamepad' ? [{ axes: padAxes, buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: padButtons.includes(i) })) }] : [];
const controls = actions => {
  Input.keys = {}; Input.touch = {}; Input.device = device;
  padButtons = []; padAxes = [0, 0];
  for (const action of actions) {
    if (device === 'keyboard') Input.keys[{ jump: 'KeyZ', confirm: 'Enter', back: 'KeyX', start: 'Escape', right: 'ArrowRight', down: 'ArrowDown' }[action]] = true;
    else if (device === 'touch') { Input.touch[action] = true; if (action === 'jump') Input.touch.confirm = true; }
    else if (action === 'right') padAxes[0] = 1;
    else if (action === 'down') padAxes[1] = 1;
    else padButtons.push({ jump: 0, confirm: 0, back: 1, start: 9 }[action]);
  }
};
const step = (n, actions = []) => { controls(actions); for (let i = 0; i < n; i++) App.update(); };
const tap = action => { step(1, [action]); step(1); };
const settle = () => step(40);
const tick = (n, actions = []) => { controls(actions); for (let i = 0; i < n; i++) { Input.update(); World.t++; updatePlayer(World.player); } };
const atFloor = (level = 0, x = 40, earned = true) => {
  App.trans = null; Game.reset(); Game.progress = earned ? Progression.legacy(1) : Progression.blank();
  Game.levelIdx = level; loadLevel(level, false); App.state = 'play';
  World.ents = []; World.player = makePlayer(x, 12 * TS - 21); tick(1);
};
const stateOfWorld = () => JSON.stringify({ t: World.t, time: World.time, player: World.player, ents: World.ents, plats: World.plats });
async function run() {
  await Promise.all([Origin.preload(), IntroArt.preload(), Kinhurine.preload()]);
  for (const id of Object.keys(Origin.files)) { assert.equal(Origin.statuses[id], 'ready'); assert.equal(Origin.images[id].width, 384); }
  const events = []; Sound.fx = name => events.push(name);
  for (device of ['keyboard', 'gamepad', 'touch']) {
    App.trans = null; Save.data = Save.blank(); App.newGame(); settle();
    step(25); tap('back'); settle();
    assert.equal(App.state, 'play');
    assert.deepStrictEqual(Game.progress.abilities, []);
    App.render(); assert.equal(screen.width, 256);
    // Termina a primeira fase pelo gatilho real, grava antes da animação do ônibus.
    World.player.x = World.goal.x + 4; step(1);
    assert(World.clear); assert.equal(Save.data.run.level, 1);
    assert.deepStrictEqual(Save.data.campaign.abilities, ['doubleJump']);
    const afterClear = Save.fileText(); assert(Save.importText(afterClear).ok);
    App.trans = null; App.continueRun(); settle();
    assert.equal(App.state, 'origin'); assert.equal(Origin.id, 'doubleJump'); assert.equal(Game.levelIdx, 1);
    assert(Save.data.campaign.pendingUnlocks.includes('doubleJump'));
    // Interrupção do aviso reapresenta, sem conceder outra recompensa.
    App.trans = null; App.continueRun(); settle(); assert.equal(App.state, 'origin'); assert.equal(Origin.id, 'doubleJump');
    step(25); tap('confirm'); step(25); tap('confirm'); settle(); step(200);
    assert.equal(App.state, 'play'); assert.equal(Game.levelIdx, 1);
    assert.deepStrictEqual(Save.data.campaign.tutorials, ['doubleJump']);
    assert(!Save.data.campaign.pendingUnlocks.includes('doubleJump'));
    const earned = JSON.stringify(Game.progress);
    App.trans = null; App.onDeath(); settle(); step(200);
    assert.equal(App.state, 'play'); assert.equal(JSON.stringify(Game.progress), earned);
    App.trans = null; App.continueRun(); settle(); step(200);
    assert.equal(App.state, 'play'); assert.equal(JSON.stringify(Game.progress), earned);
    // Segurar mantém o pulo original. Soltar/apertar usa um único impulso extra.
    atFloor(); const p = World.player;
    tick(12, ['jump']); assert(p.airJumpReady, 'segurar não consome pulo extra');
    tick(1); tick(1, ['jump']);
    assert(!p.airJumpReady); assert(p.vy < -6);
    tick(1); tick(1, ['jump']); assert(p.vy > -6, 'terceiro toque não gera outro impulso');
    tick(100); assert(p.onGround && p.airJumpReady, 'pouso recarrega');
    tick(12, ['jump']); tick(1); tick(1, ['jump']); assert(!p.airJumpReady && p.vy < -6);
    atFloor(0, 40, false); tick(12, ['jump']); tick(1); tick(1, ['jump']);
    assert(World.player.vy > -6, 'primeira fase sem habilidade');
    // Rota alta real no ônibus: moedas do primeiro bagageiro por pulo duplo.
    atFloor(1, 14 * TS + 2); const coins = Game.coins;
    tick(22, ['jump']); tick(1); tick(25, ['jump']); tick(70);
    assert(Game.coins > coins, 'coleta as moedas da rota alta');
    assert(World.player.onGround && World.player.y + World.player.h === 5 * TS, 'pousa no bagageiro');
    // Descer não dispara o impulso extra no mesmo toque.
    tick(1); tick(1, ['down', 'jump']); assert(World.player.drop > 0 && World.player.vy >= 0);
    tick(50); assert(World.player.y + World.player.h === 12 * TS);
    // Longa permanência na área de prática não dispara freada.
    for (let i = 0; i < 900; i++) updateBrakes(World);
    assert.equal(World.brake.phase, 'idle'); assert.equal(World.push, 0);
    World.player.x = 33 * TS;
    for (let i = 0; i < 421; i++) updateBrakes(World);
    assert.equal(World.brake.phase, 'warn');
    console.log(`OK: ${device}, origem, conclusão, tutorial, morte/retomada, pulo duplo e prática.`);
  }
  device = 'keyboard';
  // Tetos não recarregam; trocar a tecla enquanto segura não dá outro impulso.
  atFloor(1, 14 * TS + 2); tick(12, ['jump']);
  Input.keys.Space = true; Input.hits.Space = true; Input.update(); updatePlayer(World.player);
  assert(World.player.airJumpReady, 'exige soltar o conjunto de botões de pulo');
  tick(1); tick(22, ['jump']);
  assert(!World.player.airJumpReady);
  for (let i = 0; i < 10; i++) { tick(1); tick(1, ['jump']); }
  assert(World.player.y >= 2 * TS, 'não atravessa teto do ônibus');
  // Pouso em plataforma móvel recarrega; simples pisão/salto no ar não recarrega.
  atFloor(); const p = World.player;
  p.airJumpReady = false; p.y = 80; p.vy = 1; p.onGround = false;
  World.plats = [{ kind: 'move', alive: true, x: p.x - 8, y: p.y + p.h + 1, prevY: p.y + p.h + 1, w: 48, dx: 0, dy: 0 }];
  tick(1); assert(p.ride && p.airJumpReady);
  World.plats = []; p.ride = null; p.onGround = false; p.airJumpReady = false; p.vy = -4;
  tick(1); tick(1, ['jump']); assert(!p.airJumpReady && p.vy > -6);
  // Ajuda na pausa preserva mundo e save e não oferece replay narrativo.
  atFloor(1, 40); World.player.wild = 200; App.saveProgress(false, true); App.openPause();
  const frozen = stateOfWorld(), saveBefore = JSON.stringify(Save.data);
  assert(!App.menu.items.some(i => String(i.label).includes('ORIGEM')));
  App.openGuide(); App.menu.items.find(i => i.label === 'HABILIDADES / COMO USAR').fn();
  step(90); assert.equal(stateOfWorld(), frozen); assert.equal(JSON.stringify(Save.data), saveBefore);
  tap('back'); App.closePause();
  // Cena interrompida reaparece; aba oculta congela; fim automático é persistido.
  Game.progress = Progression.complete(Progression.blank(), 0); Game.levelIdx = 1;
  App.saveProgress(false, true); App.trans = null; App.go('intro', null, true);
  assert.equal(App.state, 'origin');
  const pausedAt = Origin.t; document.hidden = true; step(90); document.hidden = false;
  assert.equal(Origin.t, pausedAt);
  const total = World.t; step(800); assert.equal(World.t, total);
  assert.equal(Save.data.campaign.stories.doubleJump, 'seen');
  settle(); step(200); assert.equal(App.state, 'play');
  App.trans = null; App.continueRun(); settle(); step(200); assert.equal(App.state, 'play');
  // Sem imagem, a cena ainda avança e pode ser pulada.
  Game.progress = Progression.complete(Progression.blank(), 0); Game.levelIdx = 1;
  App.saveProgress(false, true); App.trans = null; App.go('intro', null, true);
  const im = Origin.images.doubleJump; Origin.images.doubleJump = null; App.render();
  step(25); tap('back'); settle(); step(200);
  assert.equal(Save.data.campaign.stories.doubleJump, 'skipped');
  Origin.images.doubleJump = im;
  // Save v1 retoma diretamente e já pode usar o pulo duplo.
  Save.data = Save.sanitize({ unlocked: 5, run: { level: 1, lives: 3, hearts: 3, checkpoint: true } });
  App.trans = null; App.continueRun(); settle(); step(200);
  assert.equal(App.state, 'play'); assert.equal(Game.progress.stories.doubleJump, 'legacy');
  assert(Progression.usable(Game.progress, 'doubleJump'));
  assert.equal(World.player.x, World.cps[0].x + 2);
  // Prévia das quatro origens e da ajuda com o renderizador do jogo.
  const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
  const sheet = new SoftCanvas(1024, 896), c = sheet.getContext('2d');
  for (const [i, a] of Progression.abilities.entries()) {
    App.state = 'origin'; App.trans = null; Origin.id = a.id; Origin.beat = 0; Origin.t = 95; App.render();
    fs.writeFileSync(path.join(out, 'origin-' + a.id + '.png'), screen.toPNG());
    c.drawImage(screen, i % 2 * 512, Math.floor(i / 2) * 448, 512, 448);
  }
  fs.writeFileSync(path.join(out, 'origins-storyboard.png'), sheet.toPNG());
  atFloor(1, 14 * TS + 2); tick(22, ['jump']); tick(1); tick(40, ['jump']); App.render();
  fs.writeFileSync(path.join(out, 'doublejump-practice.png'), screen.toPNG());
  console.log(`OK${bundled ? ' (offline)' : ''}: teto, plataforma móvel, ajuda na pausa, cena automática, fallback, save antigo e prévias.`);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
