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
const label = item => typeof item.label === 'function' ? item.label() : item.label;
function choose(prefix) { const i = App.menu.items.findIndex(item => label(item).startsWith(prefix)); assert(i >= 0, prefix); App.menu.i = i; tap('Enter'); }
function render(name) {
  const texts = [], draw = Font.draw;
  Font.draw = function(line, ...args) { texts.push(line); return draw.call(this, line, ...args); };
  App.render(); Font.draw = draw;
  assert(texts.every(t => Font.width(t) <= 228), texts.filter(t => Font.width(t) > 228).join('\n'));
  for (const r of App.menuRegions) assert(r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H);
  if (name) fs.writeFileSync(path.join(out, name + '.png'), screen.toPNG());
}
const frozen = () => JSON.stringify({ t: World.t, player: World.player, time: World.time, stats: Game.stats, map: World.map, save: Save.data });
async function run() {
  await Promise.all([IntroArt.preload(), Origin.preload(), Kinhurine.preload()]);
  Game.reset(); Save.data = Save.blank(); Save.data.unlocked = 5; App.saveProgress(false, true);
  App.go('title', null, true); App.openTitleMenu(); const title = App.menu;
  assert.equal(title.items.length, 6); assert(!title.items.some(i => ['DIFICULDADE', 'CONFIGURAR CONTROLES', 'CONFORTO E ÁUDIO'].includes(label(i))));
  render('gui-main'); choose('CONFIGURAÇÕES'); const settings = App.menu; render('gui-settings');
  choose('CONTROLES'); render('gui-controls'); tap('Escape'); assert.equal(App.menu, settings); assert.equal(App.sub, 'settings'); assert.equal(App.menu.i, 0);
  choose('JOGABILIDADE'); const gameplay = App.menu; render('gui-gameplay'); choose('DIFICULDADE'); render('gui-difficulty');
  tap('Escape'); assert.equal(App.menu, gameplay); assert.equal(App.sub, 'gameplay');
  tap('Escape'); assert.equal(App.menu, settings); assert.equal(App.menu.i, 1);
  choose('ÁUDIO'); const audio = App.menu; render('gui-audio'); tap('ArrowLeft'); assert.equal(Comfort.music, 75); assert.equal(Comfort.effects, 100);
  render(); const r = App.menuRegions.find(r => r.i === 1); assert(App.menuPointer(r.x + 10, r.y + 7)); assert.equal(Comfort.effects, 0);
  assert.equal(App.menu, audio); assert(!App.menuPointer(1, 1));
  tap('Escape'); assert.equal(App.menu, settings); choose('ACESSIBILIDADE'); render('gui-accessibility');
  choose('REDUZIR TREMOR'); assert(Comfort.reducedShake); choose('REDUZIR FLASHES'); assert(Comfort.reducedFlash);
  tap('Escape'); tap('Escape'); assert.equal(App.menu, title); assert.equal(App.sub, null); assert.equal(App.menu.i, 3);
  choose('ARQUIVOS DE SAVE'); render('gui-saves');
  // Fluxos de arquivo continuam alcançáveis sem navegar para fora dos menus.
  const originalExport = App.exportSave, originalLoad = App.openFile; let exports = 0, loads = 0;
  App.exportSave = () => exports++; App.openFile = () => loads++;
  choose('BAIXAR'); choose('CARREGAR'); assert.equal(exports, 1); assert.equal(loads, 1);
  App.exportSave = originalExport; App.openFile = originalLoad; tap('Escape');
  choose('GUIA DO JOGO'); const guide = App.menu; render('gui-guide');
  for (const item of ['COMANDOS', 'ITENS', 'HABILIDADES']) { choose(item); frames(10); render(); tap('Escape'); assert.equal(App.menu, guide); assert.equal(App.sub, 'guide'); }
  choose('EXPLORAÇÃO'); assert.equal(App.sub, 'select'); tap('Escape'); assert.equal(App.menu, guide); assert.equal(App.sub, 'guide');
  tap('Escape'); assert.equal(App.menu, title);
  // Hover só seleciona; clique em linha ativa e não usa áreas de telas anteriores.
  render(); const rootSettings = App.menuRegions.find(r => label(App.menu.items[r.i]) === 'CONFIGURAÇÕES');
  assert(App.menuPointer(rootSettings.x + 10, rootSettings.y + 5, false)); assert.equal(App.menu, title);
  assert(App.menuPointer(rootSettings.x + 10, rootSettings.y + 5)); assert.equal(App.sub, 'settings');
  assert(!App.menuPointer(rootSettings.x + 10, rootSettings.y + 5), 'aguarda redesenho do submenu');
  render(); tap('Escape');
  // Abrir configurações durante gameplay pausa; submenus não alteram mundo/save.
  Game.reset(); Game.progress = Progression.legacy(4); Game.levelIdx = 4; App.trans = null; App.go('play', null, true);
  App.openOptions(); assert.equal(App.state, 'pause'); assert.equal(App.sub, 'settings'); const pauseSettings = App.menu;
  const before = frozen(); frames(30); assert.equal(frozen(), before);
  choose('CONTROLES'); frames(30); tap('Escape'); assert.equal(App.menu, pauseSettings); assert.equal(frozen(), before);
  choose('JOGABILIDADE'); choose('DIFICULDADE'); frames(30); tap('Escape'); tap('Escape');
  assert.equal(App.menu, pauseSettings); assert.equal(frozen(), before);
  choose('ÁUDIO'); frames(30); tap('Escape'); choose('ACESSIBILIDADE'); frames(30); tap('Escape'); tap('Escape');
  assert.equal(App.sub, null); assert.equal(App.state, 'pause'); assert.equal(App.menu.items.length, 6); render('gui-pause');
  choose('GUIA'); choose('HABILIDADES'); frames(30); tap('Escape'); assert.equal(App.sub, 'guide'); assert.equal(frozen(), before);
  tap('Escape'); tap('Escape'); assert.equal(App.state, 'play'); assert.equal(App.sub, null);
  // Dicas acompanham gamepad/toque, e atalhos não interrompem cutscenes.
  for (const device of ['gamepad', 'touch']) { App.openPause(); Input.device = device; render(); App.openSettings(); render(); App.menu.back(); App.closePause(); }
  App.trans = null; App.go('story', null, true); App.openOptions(); assert.equal(App.state, 'story');
  Comfort.set('music', 100); Comfort.set('effects', 100); Comfort.set('reducedShake', false); Comfort.set('reducedFlash', false);
  console.log(`OK${bundled ? ' (offline)' : ''}: menus curtos, categorias, retorno/seleção, teclado/mouse/toque/gamepad, arquivos, prévias e pausa preservada.`);
}
run().catch(e => { console.error(e.stack); process.exitCode = 1; });
