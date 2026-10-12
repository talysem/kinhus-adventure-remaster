'use strict';
// Usa o RAF e o áudio reais em um perfil isolado; não toca na partida do usuário.
const assert = require('assert'), path = require('path'), { pathToFileURL } = require('url');
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const root = path.join(__dirname, '..'), bundled = process.argv.includes('--bundle');
async function run() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--mute-audio'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } }), errors = [];
    page.on('pageerror', err => errors.push(String(err)));
    await page.goto(pathToFileURL(path.join(root, bundled ? 'dist/kinhus-adventure.html' : 'index.html')).href);
    await page.locator('#screen').click();
    await page.evaluate(() => {
      Difficulty.select('normal'); Game.reset(); Game.levelIdx = 4; Game.progress = Progression.legacy(4);
      App.trans = null; App.go('play', null, true);
      World.time = 30; World.player.x = World.arena.x + 124;
      World.player.y = 12 * TS - World.player.h; World.cam.x = World.arena.x;
      updateWorld();
      while (World.boss.hp > 0) { World.boss.inv = 0; hitBoss(World.boss, 4); }
    });
    await page.waitForFunction(() => App.state === 'ending', null, { timeout: 12000 });
    assert.deepStrictEqual(errors, []);
    const result = await page.evaluate(() => ({ time: World.time, completed: Save.data.completed, run: Save.data.run, level: Game.levelIdx, t: App.t }));
    assert(result.completed); assert.equal(result.run, null); assert.equal(result.level, 4); assert.equal(result.time, 0);
    await page.waitForFunction(t => App.t > t + 20, result.t);
    await page.evaluate(() => { App.t = 240; });
    await page.waitForFunction(() => App.t > 260);
    await page.screenshot({ path: path.join(root, 'tools/out/ending-browser.png') });
    await page.evaluate(() => { App.t = 601; });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => App.state === 'title' && !App.trans);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !!App.menu);
    assert.deepStrictEqual(errors, []);
    await page.reload();
    assert(await page.evaluate(() => Save.data.completed && Save.data.run === null));
    console.log(`OK${bundled ? ' (offline)' : ''}: Chromium/RAF/áudio, troféu, créditos animados, teclado, menu e vitória após recarregar.`);
  } finally { await browser.close(); }
}
run().catch(e => { console.error(e.stack); process.exitCode = 1; });
