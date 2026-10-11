'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { boot, SoftCanvas } = require('./softcanvas');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
const source = fs.readFileSync(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html'), 'utf8');
const scripts = bundled ? [] : [...source.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const { screen } = boot(root, scripts);
if (bundled) for (const m of source.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInThisContext(m[1]);
const press = {}, fx = [];
Sound.fx = name => fx.push(name);
Input.update = function () { this.prev = this.cur; this.cur = {}; for (const a in this.map) this.cur[a] = !!press[a]; };
const step = n => { for (let i = 0; i < n; i++) App.update(); };
const start = () => { App.trans = null; Game.reset(); App.go('play', null, true); };
const pickup = () => {
  const p = World.player;
  return addEnt({ kind: 'item', item: 'claws', x: p.x, y: p.y + 2, w: 12, h: 12, vx: 0, vy: 0, dir: 1, emerge: 0 });
};
const snapshot = () => JSON.stringify({
  t: World.t, time: World.time, timeT: World.timeT, bus: World.busX,
  p: { x: World.player.x, y: World.player.y, vx: World.player.vx, vy: World.player.vy, wild: World.player.wild, inv: World.player.inv },
  entities: World.ents.map(e => [e.x, e.y, e.t, e.alive]),
  plats: World.plats.map(p => [p.x, p.y, p.t]),
  parts: World.parts.map(p => [p.x, p.y, p.t]),
  projs: World.projs.map(p => [p.x, p.y, p.t]),
});
async function run() {
  await Promise.all([Kinhurine.preload(), IntroArt.preload()]);
  assert.equal(Object.keys(Kinhurine.images).length, 3);
  assert.equal(Kinhurine.duration, 240);
  start(); const world = World, p = World.player, item = pickup();
  step(1);
  assert.equal(App.state, 'transform'); assert.equal(item.alive, false);
  assert.equal(Sound.pending, 'kinhurineTransform', 'a cena troca a música imediatamente');
  assert.equal(fx.filter(name => name === 'wildcharge').length, 1);
  assert.equal(Game.score, 1000); assert.equal(p.wild, 600);
  updateItem(item, p); assert.equal(Game.score, 1000, 'item não pode ser coletado duas vezes');
  const frozen = snapshot();
  App.render(); assert.equal(screen.width, 768);
  step(Kinhurine.clawsAt - 1); assert(!fx.includes('clawmetal'));
  step(1); assert.equal(fx.filter(name => name === 'clawmetal').length, 1);
  step(Kinhurine.roarAt - Kinhurine.t - 1); assert(!fx.includes('wildroar'));
  step(1); assert.equal(fx.filter(name => name === 'wildroar').length, 1, 'grito sincronizado com a pose final');
  step(120 - Kinhurine.t); assert.equal(snapshot(), frozen, 'mundo, inimigos, projéteis, plataformas e poder congelados');
  document.hidden = true; const at = Kinhurine.t; step(120); assert.equal(Kinhurine.t, at); document.hidden = false;
  step(Kinhurine.duration - Kinhurine.t);
  assert.equal(App.state, 'play'); assert.strictEqual(World, world); assert.strictEqual(World.player, p);
  assert.equal(snapshot(), frozen, 'retorno não altera nem recarrega a fase');
  assert.equal(Sound.pending, 'kinhurine'); App.render(); assert.equal(screen.width, 256);
  assert.equal(fx.filter(name => name === 'wildroar').length, 1, 'grito não repete durante a pose');
  step(1); assert.equal(p.wild, 599, 'tempo de poder começa a contar no gameplay');
  // Coleta adicional renova o poder e pode ser pulada sem perder segundos.
  pickup(); step(1); assert.equal(App.state, 'transform'); assert.equal(p.wild, 600);
  step(25); press.confirm = true; step(1); press.confirm = false;
  assert.equal(App.state, 'play'); assert.equal(p.wild, 600);
  assert.equal(Sound.pending, 'kinhurine');
  assert.equal(fx.filter(name => name === 'wildroar').length, 1, 'pular antes da pose não dispara grito atrasado');
  const savedExport = Save.exportFile; Save.exportFile = () => true;
  pickup(); step(1); App.exportSave(); assert.equal(Save.data.run.score, Game.score); Save.exportFile = savedExport;
  // Uma transição externa (por exemplo importar save) cancela a cena antiga.
  Save.data.run.level = 1; Save.data.campaign.origin = 'seen'; App.continueRun(); assert.equal(Kinhurine.active, false);
  step(240); assert.equal(App.state, 'play'); assert.equal(Game.levelIdx, 1); assert.notStrictEqual(World, world);
  // Sem arquivos de arte, a cena ainda termina no prazo e preserva o poder.
  const art = Kinhurine.images; Kinhurine.images = {};
  start(); pickup(); step(1); App.render(); step(Kinhurine.duration);
  assert.equal(App.state, 'play'); assert.equal(World.player.wild, 600); Kinhurine.images = art;
  start(); World.player.dead = true; const deadItem = pickup(); updateItem(deadItem, World.player);
  assert.equal(App.state, 'play'); assert.equal(World.player.wild, 0);
  // Storyboard com carga, garras curtas e grito final.
  start(); pickup(); step(1);
  const sheet = new SoftCanvas(1536, 448), c = sheet.getContext('2d');
  const out = path.join(root, 'tools/out'); fs.mkdirSync(out, { recursive: true });
  [30, 84, 160].forEach((t, i) => {
    Kinhurine.t = t; App.render();
    fs.writeFileSync(path.join(out, 'kinhurine-' + i + '.png'), screen.toPNG());
    c.drawImage(screen, i * 512, 0, 512, 448);
  });
  fs.writeFileSync(path.join(out, 'kinhurine-storyboard.png'), sheet.toPNG());
  console.log('OK' + (bundled ? ' (offline)' : '') + ': coleta real, 4 segundos, congelamento do mundo/poder, retorno sem recarga, skip, recoleta, aba oculta, save e fallback.');
}
run().catch(e => { console.error(e); process.exitCode = 1; });
