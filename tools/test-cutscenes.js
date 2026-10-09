'use strict';
// Testa o fluxo real de abertura, controles, saves e eventos. Exporta storyboard.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { boot, SoftCanvas } = require('./softcanvas');
const root = path.join(__dirname, '..');
const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const bundled = process.argv.includes('--bundle');
const { screen } = boot(root, bundled ? [] : scripts);
if (bundled) {
  const vm = require('vm');
  const html = fs.readFileSync(path.join(root, 'dist/kinhus-adventure.html'), 'utf8');
  assert(!/<script src=/.test(html));
  assert(!/['"]assets\/cutscenes\/runtime\//.test(html), 'bundle deve embutir a arte');
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
}
const press = {};
Input.update = function () {
  this.prev = this.cur; this.cur = {};
  for (const a in this.map) this.cur[a] = !!press[a];
};
const step = n => { for (let i = 0; i < n; i++) App.update(); };
const tap = a => { press[a] = true; step(1); press[a] = false; step(1); };
const start = () => { App.trans = null; App.newGame(); step(40); assert.equal(App.state, 'story'); };
const events = [];
Sound.fx = name => events.push([Cutscenes.scene, name]);
async function run() {
await IntroArt.preload();
assert.equal(IntroArt.status, 'ready'); assert.equal(IntroArt.loaded, 8);
for (const im of Object.values(IntroArt.images)) assert.equal(im.width, 384);
start(); App.render(); assert.equal(screen.width, 768, 'abertura em resolução maior');
const seen = new Set();
for (let i = 0; i < 2800; i++) { if (App.state === 'story') seen.add(Cutscenes.scene); step(1); if (App.state === 'play') break; }
assert.deepEqual([...seen], [0, 1, 2, 3, 4]);
assert.equal(App.state, 'play', 'abertura deve chegar ao gameplay automaticamente');
App.render(); assert.equal(screen.width, 256, 'gameplay deve restaurar a resolução original');
assert.equal(Game.levelIdx, 0);
assert.equal(Save.data.run.level, 0);
assert.equal(events.filter(e => e[1] === 'notification').length, 1);
assert.equal(events.filter(e => e[1] === 'thud').length, 1);
assert(events.some(e => e[1] === 'alarm'));
for (let scene = 0; scene < 5; scene++) {
  start(); Cutscenes.scene = scene; Cutscenes.t = 30;
  tap('back'); step(40);
  assert.equal(App.state, 'play', 'pular cena ' + scene);
}
start(); step(25); tap('confirm');
assert.equal(Cutscenes.scene, 1, 'confirm avança só uma cena');
press.confirm = true; step(100); press.confirm = false;
assert.equal(Cutscenes.scene, 1, 'segurar botão não avança várias cenas');
step(1); tap('start'); step(40); assert.equal(App.state, 'play');
start(); const before = Cutscenes.t; document.hidden = true; step(180);
assert.equal(Cutscenes.t, before, 'aba oculta congela a abertura'); document.hidden = false;
// Continuar preserva fase/checkpoint e ignora a abertura, inclusive transição automática.
Save.data.run = { level: 1, lives: 4, score: 200, coins: 7, hearts: 2, power: 0, checkpoint: false };
App.trans = null; App.continueRun(); step(240);
assert.equal(App.state, 'play'); assert.equal(Game.levelIdx, 1); assert.equal(Game.lives, 4);
start(); assert.equal(Cutscenes.scene, 0);
IntroArt.status = 'loading'; const loadingT = Cutscenes.t;
step(120); assert.equal(Cutscenes.t, loadingT, 'carregamento não consome cenas'); App.render();
tap('back'); step(40); assert.equal(App.state, 'play', 'pular funciona durante carregamento');
IntroArt.status = 'fallback'; start(); App.render();
step(25); tap('back'); step(40); assert.equal(App.state, 'play', 'falha de imagem mantém jogo acessível');
IntroArt.status = 'ready'; start();
// Nenhum texto deve ultrapassar a tela.
for (const scene of Cutscenes.captions) for (const beat of scene) for (const line of beat) assert(Font.width(line) <= 244, line);
const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
const sheet = new SoftCanvas(1536, 1344), c = sheet.getContext('2d');
const shots = [[0, 180], [1, 85], [1, 180], [1, 410], [2, 250], [2, 455], [3, 160], [3, 400], [4, 115]];
for (let i = 0; i < shots.length; i++) {
  [Cutscenes.scene, Cutscenes.t] = shots[i]; App.trans = null; App.state = 'story'; App.render();
  fs.writeFileSync(path.join(out, 'cutscene-' + i + '.png'), screen.toPNG());
  c.drawImage(screen, i % 3 * 512, Math.floor(i / 3) * 448, 512, 448);
}
fs.writeFileSync(path.join(out, 'cutscenes-storyboard.png'), sheet.toPNG());
console.log('OK' + (bundled ? ' (HTML offline)' : '') + ': oito ilustrações, resolução, carregamento, fallback, cinco cenas, avanço, skip, replay, aba oculta, áudio e saves.');
}
run().catch(e => { console.error(e); process.exitCode = 1; });
