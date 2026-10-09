'use strict';
// Prepara os PNGs de distribuição a partir das ilustrações originais.
// A mesma amostragem nearest-neighbor usada pelo jogo, sem dependências.
const fs = require('fs');
const path = require('path');
const { decodePNG, SoftCanvas } = require('./softcanvas');
const dir = path.join(__dirname, '../assets/cutscenes');
const out = path.join(dir, 'runtime');
fs.mkdirSync(out, { recursive: true });
for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.png'))) {
  const im = decodePNG(fs.readFileSync(path.join(dir, name)));
  const c = new SoftCanvas(384, 256);
  c.getContext('2d').drawImage(im, 0, 0, 384, 256);
  const png = c.toPNG();
  fs.writeFileSync(path.join(out, name), png);
  console.log(name, Math.round(png.length / 1024) + ' KB');
}
