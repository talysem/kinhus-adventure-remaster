'use strict';
// Exercita saves reais e o fluxo de campanha/replay com pulo duplo ativo.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { boot } = require('./softcanvas');
const root = path.join(__dirname, '..');
const bundled = process.argv.includes('--bundle');
const html = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
boot(root, bundled ? [] : [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
if (bundled) for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const pack = (save, format = 1) => JSON.stringify({ game: "Kinhu's Adventure", format, save, check: Save.hash(JSON.stringify(save)) });
const legacy = level => ({ unlocked: 5, completed: true, hiscore: 10000, plays: 7,
  run: { level, lives: 6, score: 4321, coins: 175, hearts: 2, power: 1, checkpoint: true, savedAt: 1234567890 } });
const ids = count => Progression.abilities.filter(a => a.after <= count).map(a => a.id);

// Perfil com todas as fases liberadas não concede poderes de fases futuras.
for (let level = 0; level < LEVELS.length; level++) {
  const old = legacy(level);
  assert(Save.importText(pack(old)).ok);
  assert.equal(Save.data.version, Save.FORMAT);
  assert.deepStrictEqual(Save.data.run, { ...old.run, difficulty: 'normal', collected: [], assist: false, stats: Exploration.blankStats(false) });
  assert.deepStrictEqual(Save.data.campaign.abilities, ids(level));
  assert(Object.values(Save.data.campaign.stories).every(v => v === 'legacy'));
  assert.deepStrictEqual(Save.data.campaign.pendingUnlocks, []);
  assert.equal(Save.data.unlocked, 5);
  assert.equal(Save.data.plays, 7);
  App.trans = null; App.continueRun(); App.go('play', null, true);
  assert(Object.values(Game.progress.stories).every(v => v === 'legacy'));
  assert.equal(Game.levelIdx, level); assert.equal(Game.coins, 175);
  assert.equal(World.player.x, World.cps[0].x + 2);
  assert(Save.importText(Save.fileText()).ok);
  assert.deepStrictEqual(Save.data.campaign.abilities, ids(level));
}
const noRun = legacy(4); noRun.run = null;
assert(Save.importText(pack(noRun)).ok);
assert.deepStrictEqual(Save.data.campaign.abilities, []);
assert.equal(Save.data.completed, true);

// Migra o armazenamento local sem envelope e persiste a versão nova.
localStorage.setItem(Save.KEY, JSON.stringify(legacy(2)));
Save.load();
assert.deepStrictEqual(Save.data.campaign.abilities, ids(2));
assert.equal(JSON.parse(localStorage.getItem(Save.KEY)).version, 6);
const snapshot = JSON.stringify(Save.data);
const corrupted = JSON.parse(pack(legacy(1))); corrupted.save.run.level = 4;
assert.equal(Save.importText(JSON.stringify(corrupted)).msg, 'ARQUIVO CORROMPIDO');
assert.equal(JSON.stringify(Save.data), snapshot);
assert(!Save.importText(pack(legacy(1), 3)).ok);
assert(!Save.importText(pack(legacy(1), '2')).ok);
assert(!Save.importText(pack(legacy(1), 2)).ok);
assert(!Save.importText(pack([])).ok);
assert(!Save.importText(pack('invalid')).ok);
assert(!Save.importText(pack({ ...legacy(1), version: 2 })).ok);
assert.equal(JSON.stringify(Save.data), snapshot);
const future = JSON.stringify({ version: Save.FORMAT + 1, run: { level: 4 } });
localStorage.setItem(Save.KEY, future); Save.load();
assert(!Save.persist()); assert.equal(localStorage.getItem(Save.KEY), future);
assert(Save.importText(pack(legacy(1))).ok);

// Validação remove habilidades futuras, IDs desconhecidos e estados incompatíveis.
const dirty = JSON.parse(JSON.stringify(Save.data));
dirty.campaign = { completedLevels: 5, abilities: ['unknown', 'steadyStep'], origin: 'wat',
  tutorials: ['doubleJump', 'unknown'], pendingUnlocks: ['doubleJump', 'steadyStep', 'unknown'] };
assert(Save.importText(pack(dirty, Save.FORMAT)).ok);
assert.deepStrictEqual(Save.data.campaign, { completedLevels: 1, abilities: ['doubleJump'], stories: { doubleJump: 'legacy' }, tutorials: ['doubleJump'], pendingUnlocks: [] });

// Novo jogo salva antes da abertura e reinicia somente o progresso da campanha.
App.trans = null; App.newGame();
assert.equal(Save.data.run.level, 0); assert.equal(Save.data.unlocked, 5);
assert.equal(Save.data.hiscore, 10000);
assert.deepStrictEqual(Save.data.campaign, Progression.blank());
App.trans = null; App.go('play', null, true);
for (let level = 0; level < 4; level++) {
  Game.levelIdx = level; Game.clearedLevel = null;
  App.saveProgress(true, true);
  assert.equal(Save.data.run.level, level + 1);
  assert.deepStrictEqual(Save.data.campaign.abilities, ids(level + 1));
  const first = Save.fileText();
  App.saveProgress(true, true);
  assert.equal(Save.data.campaign.pendingUnlocks.length, level + 1, 'sem avisos duplicados');
  App.saveProgress(false, true);
  assert.equal(Save.data.run.level, level + 1, 'exportação durante conclusão não retrocede');
  assert(Save.importText(first).ok);
  App.trans = null; App.continueRun();
  assert.equal(Game.levelIdx, level + 1);
  assert.deepStrictEqual(Game.progress.abilities, ids(level + 1));
  assert(Progression.usable(Game.progress, 'doubleJump'));
  for (const a of Progression.abilities) assert.equal(Progression.usable(Game.progress, a.id), a.after <= level + 1);
}
App.trans = null; App.go('play', null, true);
const earned = JSON.stringify(Game.progress);
Game.lives = 2; App.onDeath();
assert.equal(JSON.stringify(Game.progress), earned);
App.trans = null; App.continueRun(); assert.equal(JSON.stringify(Game.progress), earned);
App.trans = null; Game.lives = 1; App.onDeath();
assert.equal(Save.data.run, null);
assert.equal(JSON.stringify(Save.data.campaign), earned, 'game over conserva marcos');
App.trans = null; App.go('gameover', null, true); App.menu.items[0].fn();
App.trans = null; App.go('play', null, true);
assert.equal(JSON.stringify(Save.data.campaign), earned);

// Aquisições individuais: confirmação/pulo persistem e são idempotentes.
assert.equal(Progression.nextUnlock(Game.progress).id, 'doubleJump');
for (const a of Progression.abilities) {
  assert(App.acknowledgeUnlock(a.id, a.id === 'propulsion'));
  assert(!App.acknowledgeUnlock(a.id));
  assert.equal(Save.data.campaign.stories[a.id], a.id === 'propulsion' ? 'skipped' : 'seen');
}
assert.equal(Progression.nextUnlock(Game.progress), null);
App.trans = null; App.continueRun(); assert(Game.progress.tutorials.includes('doubleJump'));
// v2: remove a antiga origem global e preserva cenas de aquisição pendentes.
const v2 = { ...Save.data, version: 2, campaign: { completedLevels: 4, origin: 'seen', tutorials: ['doubleJump'], pendingUnlocks: ['propulsion', 'bellySlam', 'steadyStep'] } };
assert(Save.importText(pack(v2, 2)).ok);
assert.equal(Save.data.campaign.stories.doubleJump, 'legacy');
assert.deepStrictEqual(Save.data.campaign.pendingUnlocks, ['propulsion', 'bellySlam', 'steadyStep']);
assert(!('origin' in Save.data.campaign));
Game.progress = Progression.sanitize(Save.data.campaign);
for (const id of Game.progress.pendingUnlocks.slice()) App.acknowledgeUnlock(id);

// Seleção de fase, conclusão, exportação e game over preservam a campanha salva.
const campaignBefore = JSON.stringify(Save.data.campaign), runBefore = JSON.stringify(Save.data.run);
Game.reset(); App.startLevel(0); App.trans = null; App.go('play', null, true);
assert.equal(Game.mode, 'replay');
Game.score = 25000; App.saveProgress(true, true); App.saveProgress(false, true);
assert.equal(JSON.stringify(Save.data.run), runBefore);
assert.equal(JSON.stringify(Save.data.campaign), campaignBefore);
assert.equal(Save.data.hiscore, 25000);
Game.lives = 1; App.onDeath();
assert.equal(JSON.stringify(Save.data.run), runBefore);
App.trans = null; App.continueRun(); assert.equal(Game.mode, 'campaign');
assert.equal(JSON.stringify(Game.progress), campaignBefore);
Game.levelIdx = 4; App.saveProgress(true, true);
assert.equal(Save.data.run, null); assert.equal(Save.data.campaign.completedLevels, 5);
assert(Save.importText(Save.fileText()).ok);

// Entrada real: C, RB e toque compartilham a mesma ação; segurar não repete.
Input.cur = {}; Input.prev = {}; Input.keys = { KeyC: true }; Input.update();
assert(Input.pressed('propel')); Input.update(); assert(!Input.pressed('propel'));
Input.keys = {}; Input.update();
navigator.getGamepads = () => [{ axes: [0, 0], buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 5 })) }];
Input.update(); assert(Input.pressed('propel')); assert.equal(Input.device, 'gamepad');
navigator.getGamepads = () => []; Input.update(); Input.touch.propel = true; Input.device = 'touch';
Input.update(); assert(Input.pressed('propel'));
assert.equal(Progression.command('propulsion'), 'C: ARRANCADA');
assert.equal(Progression.command('propulsion', 'gamepad'), 'RB: ARRANCADA');
assert(Progression.command('doubleJump', 'keyboard').includes('Z / ESPAÇO'));
Input.touch = {}; Input.update();
for (const a of Progression.abilities) for (const line of [...a.story, ...a.tips]) assert(Font.width(line) <= 244, line);
for (const a of Progression.abilities) for (const device of ['keyboard', 'gamepad', 'touch'])
  for (const line of Progression.feedback(a.id, device)) assert(Font.width(line) <= 244, line);
console.log(`OK${bundled ? ' (offline)' : ''}: migração v1/v2/v3, checksum, campanha, marcos, retomada, novo jogo, replay, controles e roteiro.`);
