'use strict';
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
const freeze = () => JSON.stringify({ t: World.t, time: World.time, p: World.player, map: World.map });
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
async function run() {
  await Promise.all([IntroArt.preload(), Origin.preload(), Kinhurine.preload()]);
  assert.equal(Input.preset, 'classic');
  App.openTitleMenu(); App.openSettings(); const parent = App.menu;
  App.menu.items.find(i => i.label === 'CONTROLES').fn();
  assert.equal(App.sub, 'controls');
  tap('KeyS'); assert.equal(App.menu.i, 1);
  tap('Enter'); assert.equal(Input.preset, 'wasd');
  assert.equal(localStorage.getItem(Input.PRESET_KEY), 'wasd');
  tap('Escape'); assert.equal(App.sub, 'settings'); assert.equal(App.menu, parent);
  Input.setPreset('classic'); Input.loadPreset(); assert.equal(Input.preset, 'classic');
  localStorage.setItem(Input.PRESET_KEY, 'space'); Input.loadPreset(); assert.equal(Input.preset, 'space');
  for (const bad of ['unknown', '__proto__', 'constructor']) {
    assert(!Input.setPreset(bad)); assert.equal(Input.preset, 'space');
    localStorage.setItem(Input.PRESET_KEY, bad); Input.loadPreset(); assert.equal(Input.preset, 'classic');
    Input.setPreset('space');
  }
  const layouts = [
    ['classic', 'KeyZ', 'KeyX', 'KeyC', 'ArrowDown'],
    ['wasd', 'KeyJ', 'KeyK', 'KeyL', 'KeyS'],
    ['space', 'Space', 'ShiftLeft', 'KeyE', 'KeyS'],
  ];
  for (const [id, jump, run, propel, down] of layouts) {
    Input.setPreset(id); Game.reset(); Game.levelIdx = 2; Game.progress = Progression.legacy(4);
    App.trans = null; App.go('play', null, true); World.ents = []; World.plats = [];
    World.player = makePlayer(40, 12 * TS - 21); frames(1);
    const p = World.player;
    frames(1, [jump]); assert(p.vy < 0 && p.airJumpReady);
    frames(8, [jump]); frames(1); frames(1, [jump]); assert(p.vy < -6 && !p.airJumpReady);
    frames(1); frames(1, [propel]); assert(p.dashT > 0 && p.airPropulsionUsed);
    frames(1); frames(1, [down, jump]); assert(p.slam && !p.dashT);
    frames(60); assert(p.onGround && !p.slam);
    Game.power = 1; frames(1, [run]); assert(World.projs.some(q => q.type === 'can'));
    if (id !== 'classic') {
      frames(1); frames(1, ['KeyW']); assert.equal(p.vy, 0, 'W navega sem acionar pulo');
      frames(1); frames(1, ['KeyZ']); assert.equal(p.vy, 0, 'Z não é necessário no WASD');
    }
    frames(1); frames(1, ['ArrowRight']); assert(p.vx > 0, 'setas continuam disponíveis');
    App.openPause(); const frozen = freeze(), save = JSON.stringify(Save.data);
    App.openSettings(); App.menu.items.find(i => i.label === 'CONTROLES').fn();
    frames(50); assert.equal(freeze(), frozen); assert.equal(JSON.stringify(Save.data), save);
    const texts = [], original = Font.draw;
    Font.draw = function (text, ...args) { texts.push(text); return original.call(this, text, ...args); };
    App.render(); fs.writeFileSync(path.join(out, 'controls-' + id + '.png'), screen.toPNG());
    assert(texts.includes(Input.presets[id].jump + ': PULAR'));
    assert(texts.every(text => Font.width(text) <= 228), texts.filter(text => Font.width(text) > 228));
    App.sub = 'help'; App.drawHelp(); assert(texts.includes(Input.label('run') + ': CORRER'));
    Origin.id = 'propulsion'; Origin.beat = 1; Origin.draw(); assert(texts.includes(Input.label('propel') + ': ARRANCADA'));
    assert(Font.width(Input.sceneHint()) <= 244);
    for (const a of Progression.abilities) for (const line of Progression.feedback(a.id)) assert(Font.width(line) <= 244, line);
    Font.draw = original;
    // Importação e novo jogo não alteram preferência nem a gravam na campanha.
    const preference = Input.preset; assert(Save.importText(Save.fileText()).ok); App.newGame();
    assert.equal(Input.preset, preference); assert(!('controls' in Save.data.campaign));
  }
  // Troca elimina ações do layout anterior e mantém gamepad/toque operantes.
  Input.keys = { KeyZ: true }; Input.hits = { KeyZ: true }; Input.touch.jump = true;
  Input.setPreset('wasd'); Input.update(); assert(!Input.down('jump') && !Input.pressed('jump'));
  Input.hits['touch-propel'] = true; Input.device = 'touch'; Input.update(); assert(Input.pressed('propel'));
  Input.update(); assert(!Input.pressed('propel'));
  navigator.getGamepads = () => [{ axes: [0, 0], buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 5 })) }];
  Input.update(); assert(Input.pressed('propel')); assert.equal(Input.label('propel'), 'RB');
  navigator.getGamepads = () => [];
  const storage = localStorage.setItem; localStorage.setItem = () => { throw new Error('blocked'); };
  assert(Input.setPreset('space')); assert.equal(Input.preset, 'space'); localStorage.setItem = storage;
  console.log(`OK${bundled ? ' (offline)' : ''}: três conjuntos, menu/pausa, persistência, dicas, física, latas, gamepad/toque e save preservado.`);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
