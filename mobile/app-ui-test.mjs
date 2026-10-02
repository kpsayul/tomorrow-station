import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import './build.mjs';

const root = resolve('dist-mobile');
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = resolve(root, pathname === '/' ? 'index.html' : '.' + pathname);
  if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try { response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 400 }, hasTouch: true });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/game.js', async route => route.fulfill({ contentType: 'text/javascript', body: (await readFile('game.js', 'utf8')).replace('requestAnimationFrame(frame);window.addEventListener', 'window.__check={get state(){return state},speak,showEnding};requestAnimationFrame(frame);window.addEventListener') }));
  await mkdir('artifacts', { recursive: true });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator('#app-menu-open').waitFor();
  // Exercise the old-save UI path as well as the new opening covered by reading-test.
  await page.evaluate(() => localStorage.setItem('tomorrow-station-v1', JSON.stringify({ x:240,y:224,room:0 })));
  await page.reload(); await page.locator('#app-menu-open').waitFor(); await page.locator('#continue').click();
  await page.waitForFunction(() => document.body.classList.contains('native-playing'));
  const position = () => page.evaluate(() => ({ x: window.__check.state.x, y: window.__check.state.y }));
  const resetPosition = () => page.evaluate(() => { window.__check.state.x = 240; window.__check.state.y = 240; });
  const stick = await page.locator('#app-stick').boundingBox();
  async function drag(distance) {
    await resetPosition();
    const x = stick.x + stick.width / 2, y = stick.y + stick.height / 2;
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + distance, y);
    await page.waitForTimeout(400); await page.mouse.up();
    const moved = (await position()).x - 240;
    await page.waitForTimeout(100); assert(Math.abs((await position()).x - 240 - moved) < .01, 'Release stops movement');
    return moved;
  }
  const walk = await drag(28), run = await drag(48);
  assert(walk > 10 && run > walk * 1.5, `Analog walking ${walk}, running ${run}`);
  await resetPosition();
  await page.mouse.move(stick.x + stick.width / 2, stick.y + stick.height / 2); await page.mouse.down(); await page.mouse.move(stick.x + stick.width - 4, stick.y + stick.height / 2);
  await page.evaluate(() => document.getElementById('app-menu-open').click());
  const paused = await position(); await page.waitForTimeout(200); assert.deepEqual(await position(), paused, 'Opening menu stops held joystick');
  assert(!(await page.locator('#app-stick').isVisible()));
  await page.mouse.up(); await page.locator('#app-menu-close').click(); await page.waitForTimeout(150); assert.deepEqual(await position(), paused, 'Closing menu does not resume a released stick');
  await page.locator('#app-menu-open').click(); await page.locator('#save-button').click();
  assert(!(await page.locator('#app-menu').isVisible()));
  await page.locator('#save-slots .save-slot button').first().click();
  await page.locator('#app-menu-open').click(); await page.locator('#journal-button').click();
  assert(await page.locator('#journal').isVisible()); await page.locator('#close-journal').click();
  await page.evaluate(() => { window.__check.state.x = 348; window.__check.state.y = 178; });
  await page.locator('#touch-action:enabled').waitFor();
  assert((await page.locator('#app-action-label').textContent()).includes('역무원'));
  await page.screenshot({ path: 'artifacts/app-landscape.png' });
  await page.locator('#touch-action').click();
  assert(!(await page.locator('#app-stick').isVisible()));
  for (let i = 0; i < 5 && !(await page.locator('#choices button').count()); i++) await page.locator('#next').click();
  for (const button of await page.locator('#choices button').all()) assert((await button.boundingBox()).height >= 48);
  await page.screenshot({ path: 'artifacts/app-dialogue.png' });
  await page.locator('#choices button').filter({ hasText: '제 이름도 찾을' }).click();
  for (let i = 0; i < 10 && await page.locator('#dialogue').isVisible(); i++) await page.locator('#next').click();
  assert.equal(await page.evaluate(() => window.__check.state.firstQuestion), 'name');
  for (const size of [{ width: 640, height: 320 }, { width: 960, height: 540 }, { width: 393, height: 786 }]) {
    await page.setViewportSize(size);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight), false, 'No page scrolling');
    for (const selector of ['#app-stick', '#touch-action', '#app-menu-open']) {
      const box = await page.locator(selector).boundingBox();
      assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= size.width + 1 && box.y + box.height <= size.height + 1, `${selector} inside viewport`);
      assert(box.width >= 48 && box.height >= 48);
    }
    await page.evaluate(() => window.__check.speak('여울', ['여울: 오래된 약속을 다시 꺼냈어요.\n이야기: 아직 전하지 못한 편지가 한 장 남아 있었다.'], null, Array.from({ length: 4 }, (_, i) => ({ text: `네 갈래 선택 ${i + 1}: 함께 기억을 더듬어 본다`, action() {} }))));
    const last = page.locator('#choices button').last(); await last.scrollIntoViewIfNeeded();
    const choiceBox = await last.boundingBox(); assert(choiceBox.height >= 48 && choiceBox.y >= 0 && choiceBox.y + choiceBox.height <= size.height + 1, 'Long choice lists remain reachable');
    await page.evaluate(() => window.dispatchEvent(new Event('tomorrow-back', { cancelable: true })));
  }
  await page.setViewportSize({ width: 800, height: 400 });
  const scene = await page.locator('.scene-stage').boundingBox();
  assert(scene.width * scene.height > 800 * 400 * .8, 'Scenery occupies most of the screen');
  assert.deepEqual(errors, []);
  console.log(`PASS: immersive app layout; joystick walk ${walk.toFixed(1)} / run ${run.toFixed(1)}; release and modal cancellation; contextual action; large choices; save and journal access; 3 screen sizes; no document scrolling or JS errors.`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
