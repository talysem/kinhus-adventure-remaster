'use strict';
// Exercita atualização E desenho: um erro no fade pode parar o RAF do navegador.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const { screen } = boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const frame = () => { App.update(); App.render(); };
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
const originalPlaying = Sound.isPlaying;

for (const mode of ['campaign', 'replay']) for (const difficulty of Object.keys(Difficulty.modes)) {
  Save.data = Save.blank();
  Difficulty.select(difficulty); Game.reset(); Game.hiscore = Save.data.hiscore; App.trans = null; Input.releaseAll();
  if (mode === 'replay') { Game.checkpoint = true; App.saveProgress(false, true); }
  const savedCampaign = JSON.stringify({ run: Save.data.run, campaign: Save.data.campaign, completed: Save.data.completed });
  Game.mode = mode; Game.levelIdx = 4; Game.progress = Progression.legacy(4);
  App.go('play', null, true);
  const p = World.player;
  p.x = World.arena.x + 124; p.y = 12 * TS - p.h;
  World.cam.x = World.arena.x;
  frame();
  if (World.boss) {
    while (World.boss.hp > 0) { World.boss.inv = 0; hitBoss(World.boss, 4); }
    for (let i = 0; i < 140; i++) frame();
  }
  assert.equal(World.ents.filter(e => e.item === 'trophy').length, 1);
  for (let i = 0; i < 150 && !World.clear; i++) frame();
  assert(World.clear && Game.completed, 'queda e coleta reais do troféu');
  assert(Save.data.profile.records[Exploration.key(4)].clear, 'vitória registrada');
  if (mode === 'campaign') { assert(Save.data.completed); assert.equal(Save.data.run, null); }
  else assert.equal(JSON.stringify({ run: Save.data.run, campaign: Save.data.campaign, completed: Save.data.completed }), savedCampaign);
  const score = Game.score, time = World.time;
  // Inclui contagem longa e proteção contra áudio que não termina.
  Sound.isPlaying = () => difficulty === 'hard';
  for (let i = 0; i < 1100 && App.state !== 'ending'; i++) {
    frame();
    assert(Game.levelIdx >= 0 && Game.levelIdx < LEVELS.length, 'índice válido durante todo o fade');
  }
  assert.equal(App.state, 'ending');
  assert.equal(World.time, 0); assert.equal(Game.score, score + time * 50, 'tempo convertido uma única vez');
  assert.equal(Save.data.hiscore, Game.score, 'recorde inclui toda a pontuação do tempo restante');
  for (let i = 0; i < 650; i++) frame();
  if (mode === 'campaign' && difficulty === 'normal') fs.writeFileSync(path.join(out, 'ending-credits.png'), screen.toPNG());
  Input.releaseAll();
  if (difficulty === 'kinhu') Input.hits['touch-confirm'] = true;
  else if (difficulty === 'easy') navigator.getGamepads = () => [{ axes: [0, 0], buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 0 })) }];
  else Input.keys.Enter = true;
  frame(); assert(App.trans, 'teclado/toque/gamepad permitem sair dos créditos');
  Input.releaseAll(); navigator.getGamepads = () => [];
  for (let i = 0; i < 40; i++) frame();
  assert.equal(App.state, 'title'); assert(!App.trans);
  Input.keys.Enter = true; frame(); Input.releaseAll();
  assert(App.menu, 'menu continua respondendo');
  const persisted = JSON.parse(localStorage.getItem(Save.KEY));
  if (mode === 'campaign') { assert(persisted.completed); assert.equal(persisted.run, null); }
  console.log(`OK${bundled ? ' (offline)' : ''}: troféu → pontuação → créditos → menu (${mode}/${difficulty}).`);
}
Sound.isPlaying = originalPlaying;

// A troca entre fases mantém o HUD vinculado ao mundo visível até aplicar o fade.
Game.reset(); App.trans = null; App.go('play', null, true);
Save.data.profile.memories = Exploration.ids(0);
const texts = [], draw = Font.draw;
Font.draw = (text, ...args) => { texts.push(text); return draw.call(Font, text, ...args); };
App.levelDone(); App.render();
assert.equal(Game.levelIdx, 1); assert.equal(World.idx, 0);
assert(texts.includes('★3/3'), 'HUD conserva lembranças da fase visível');
Font.draw = draw;
