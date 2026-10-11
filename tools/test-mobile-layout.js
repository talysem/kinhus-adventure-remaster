'use strict';
// QA real em Chromium. PLAYWRIGHT_PACKAGE aponta para o pacote disponível;
// CHROMIUM_PATH pode indicar Chrome/Edge local, sem usar o perfil do usuário.
const assert = require('assert'), fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle'), out = path.join(root, 'tools/out');
fs.mkdirSync(out, { recursive: true });
const overlap = (a, b) => a.x < b.x + b.width - 0.5 && a.x + a.width > b.x + 0.5 && a.y < b.y + b.height - 0.5 && a.y + a.height > b.y + 0.5;
async function run() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--mute-audio'] });
  try {
    for (const [width, height] of [[320, 568], [360, 800], [390, 844], [768, 1024], [568, 320], [667, 375], [844, 390], [932, 430], [1280, 800], [568, 240]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
      await context.addInitScript(() => { window.requestAnimationFrame = () => 0; });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', err => errors.push(String(err)));
      await page.goto(pathToFileURL(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html')).href);
      await page.evaluate(async () => {
        await Promise.all([IntroArt.preload(), Origin.preload(), Kinhurine.preload()]);
        Game.reset(); Game.progress = Progression.legacy(2); App.go('play', null, true); fitScreen(); App.render();
      });
      const layout = await page.evaluate(() => {
        const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
        return { game: rect(cv), pad: rect(TouchControls.pad), actions: rect(TouchControls.actions), buttons: TouchControls.buttons.filter(b => !b.hidden).map(b => ({ act: b.dataset.act, circle: b.parentElement === TouchControls.actions, ...rect(b) })) };
      });
      for (const b of layout.buttons) {
        assert(b.x >= 0 && b.y >= 0 && b.x + b.width <= width + 0.5 && b.y + b.height <= height + 0.5, `${width}x${height}: ${b.act} na tela`);
        assert(b.width >= 48 && b.height >= 48, `${b.act}: alvo grande`);
        assert(!overlap(b, layout.game), `${width}x${height}: ${b.act} não cobre o jogo`);
      }
      for (let i = 0; i < layout.buttons.length; i++) for (let j = i + 1; j < layout.buttons.length; j++) {
        const a = layout.buttons[i], b = layout.buttons[j];
        const intersect = a.circle && b.circle ? Math.hypot(a.x + a.width / 2 - b.x - b.width / 2, a.y + a.height / 2 - b.y - b.height / 2) < (a.width + b.width) / 2 - 0.5 : overlap(a, b);
        assert(!intersect, `${width}x${height}: ${a.act}/${b.act} sem sobreposição`);
      }
      assert(layout.game.width > 0 && layout.game.height > 0);
      if (width === 844) { assert(layout.pad.x > 24); assert(layout.actions.x + layout.actions.width < width - 24); }
      if (width === 1280) {
        assert(layout.pad.x > 24); assert(layout.actions.x + layout.actions.width < width - 24);
        assert(layout.game.x - layout.pad.x - layout.pad.width <= 24);
        assert(layout.actions.x - layout.game.x - layout.game.width <= 24);
      }
      await page.screenshot({ path: path.join(out, `mobile-${width}x${height}.png`) });
      // Um toque no rótulo também chega ao botão, e não duplica pela propagação.
      const a = layout.buttons.find(b => b.act === 'jump,confirm');
      await page.touchscreen.tap(a.x + a.width / 2, a.y + a.height * 0.68);
      assert(await page.evaluate(() => { Input.update(); return Input.pressed('jump') && TouchControls.pointers.size === 0; }));
      // Multi-toque nativo por CDP: direção + correr + pular e retocar entre quadros.
      const cdp = await context.newCDPSession(page), right = layout.buttons.find(b => b.act === 'right'), b = layout.buttons.find(b => b.act === 'run,back');
      const point = (r, id) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2, id });
      const points = [point(right, 1), point(b, 2), point(a, 3)];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
      assert(await page.evaluate(() => { Input.update(); return Input.down('right') && Input.down('run') && Input.pressed('jump'); }));
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: points.slice(2) });
      const ended = await page.evaluate(() => ({ touch: Input.touch, releases: Input.touchReleased, pointers: [...TouchControls.pointers].map(([id, p]) => [id, p.buttons.map(b => b.dataset.act)]) }));
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
      assert(await page.evaluate(() => { Input.update(); return Input.pressed('jump') && !Input.prev.jump; }), JSON.stringify(ended));
      // Soltar A mantém os outros dedos pressionados.
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: points.slice(2) });
      assert(await page.evaluate(() => { Input.update(); return !Input.down('jump') && Input.down('right') && Input.down('run'); }));
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert(await page.evaluate(() => { Input.update(); return !Input.down('right') && !Input.down('run') && TouchControls.pointers.size === 0; }));
      // Dedo na antiga área vazia da cruz aciona uma diagonal.
      const p = layout.pad; await page.touchscreen.tap(p.x + p.width * 0.72, p.y + p.height * 0.72);
      assert(await page.evaluate(() => { Input.update(); return Input.pressed('right') && Input.pressed('down'); }));
      assert.deepStrictEqual(errors, []); await context.close(); console.log(`OK${bundled ? ' (offline)' : ''}: ${width}x${height}, layout e toque nativo.`);
    }
    // Arte do ladrão nas duas direções e em todos os quadros de caminhada.
    const context = await browser.newContext(), page = await context.newPage();
    await page.goto(pathToFileURL(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html')).href);
    const image = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 384; c.height = 160; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.fillStyle = '#00153b'; g.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < 4; i++) { g.drawImage(SPR.thief.walk[i].r, 8 + i * 48, 4, 48, 72); g.drawImage(SPR.thief.walk[i].l, 8 + i * 48, 76, 48, 72); }
      g.drawImage(SPR.thief.act.r, 220, 4, 64, 96); g.drawImage(SPR.thief.dizzy.r, 300, 4, 64, 96);
      return c.toDataURL('image/png').split(',')[1];
    });
    fs.writeFileSync(path.join(out, 'thief-elderly.png'), Buffer.from(image, 'base64')); await context.close();
  } finally { await browser.close(); }
}
run().catch(err => { console.error(err.stack); process.exitCode = 1; });
