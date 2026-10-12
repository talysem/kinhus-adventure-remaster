'use strict';
// Compara o visual integrado com o atlas histórico do sprite original.
const fs = require('fs'), path = require('path'), assert = require('assert');
const { boot, SoftCanvas, decodePNG } = require('./softcanvas');
const root = path.join(__dirname, '..'), out = path.join(root, 'assets/proposals/kinhu-v2');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const { screen } = boot(root, [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
const names = ['idle', 'blink', 'run0', 'run1', 'run2', 'run3', 'jump', 'fall', 'hurt', 'win', 'skid', 'propel', 'slam'];
const historicalAtlas = decodePNG(fs.readFileSync(path.join(out, 'original.png')));
const original = { run: [] }, proposal = SPR.kinhu;
for (const [i, name] of names.entries()) {
  const sprite = {};
  for (const [row, side] of ['r', 'l'].entries()) {
    const canvas = new SoftCanvas(20, 24);
    canvas.getContext('2d').drawImage(historicalAtlas, i * 20, row * 24, 20, 24, 0, 0, 20, 24);
    sprite[side] = canvas;
  }
  if (name.startsWith('run')) original.run[+name.slice(3)] = sprite; else original[name] = sprite;
}
assert.deepStrictEqual(proposal.idle.r.data.slice(0, 8 * 20 * 4), original.idle.r.data.slice(0, 8 * 20 * 4), 'cabelo, óculos e rosto acima da boca preservados');
const get = (set, name) => name.startsWith('run') ? set.run[+name.slice(3)] : set[name];
function atlas(set, name) {
  const canvas = new SoftCanvas(names.length * 20, 48), x = canvas.getContext('2d');
  for (const [i, key] of names.entries()) {
    const sprite = get(set, key);
    assert.equal(sprite.r.width, 20); assert.equal(sprite.r.height, 24);
    for (const [j, side] of ['r', 'l'].entries()) x.drawImage(sprite[side], i * 20, j * 24);
  }
  fs.writeFileSync(path.join(out, name + '.png'), canvas.toPNG());
}
atlas(proposal, 'proposta');
Game.reset(); App.go('play', null, true); World.ents = World.ents.filter(e => !e.enemy);
World.player.x = 70; World.player.y = 171; World.player.onGround = true; World.player.hidden = true;
World.cam.x = 0; App.render();
fs.writeFileSync(path.join(out, 'cenario.png'), screen.toPNG());
World.player.hidden = false; World.player.blink = 60;
SPR.kinhu = original;
App.render(); fs.writeFileSync(path.join(out, 'original-no-jogo.png'), screen.toPNG());
SPR.kinhu = proposal; App.render(); fs.writeFileSync(path.join(out, 'proposta-no-jogo.png'), screen.toPNG());
// Comparação ampliada: parado, corrida e salto nas mesmas escalas.
const comparison = new SoftCanvas(600, 360), x = comparison.getContext('2d');
x.fillStyle = '#111c30'; x.fillRect(0, 0, 600, 360);
for (const [row, set] of [original, proposal].entries()) for (const [col, name] of ['idle', 'run0', 'jump'].entries()) {
  x.fillStyle = row ? '#1d3940' : '#26334a'; x.fillRect(col * 200 + 4, row * 180 + 4, 192, 172);
  x.drawImage(get(set, name).r, col * 200 + 30, row * 180 + 4, 140, 168);
}
fs.writeFileSync(path.join(out, 'comparacao.png'), comparison.toPNG());
console.log('OK: visual integrado, comparação histórica, 13 poses nas duas direções, 20×24 pixels e cenário real.');
