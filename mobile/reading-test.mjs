import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import './build.mjs';

const root = resolve('dist-mobile');
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = resolve(root, pathname === '/' ? 'index.html' : '.' + pathname);
  if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const transcript = [];
try {
  await mkdir('artifacts', { recursive: true });
  for (const viewport of [{ width: 640, height: 320 }, { width: 800, height: 400 }, { width: 960, height: 540 }, { width: 393, height: 786 }]) {
    for (const large of [false, true]) {
      const page = await browser.newPage({ viewport, hasTouch: true });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.route('**/game.js', async route => route.fulfill({ contentType: 'text/javascript', body: (await readFile('game.js', 'utf8')).replace('requestAnimationFrame(frame);window.addEventListener', 'window.__check={get state(){return state},move,interact,speak,get dialogue(){return conversation}};requestAnimationFrame(frame);window.addEventListener') }));
      await page.goto(url); await page.locator('#app-menu-open').waitFor(); await page.locator('#begin').click();
      const visit = async (room, x, y) => page.evaluate(({ room, x, y }) => { window.__check.move(room, x, y); window.__check.interact(); }, { room, x, y });
      let pages = 0, lastBox = null;
      async function checkReading() {
        const result = await page.evaluate(() => {
          const line = document.getElementById('line'), panel = document.getElementById('dialogue');
          const rect = panel.getBoundingClientRect();
          const text = line.innerText, d = window.__check.dialogue;
          return {
            text, speaker: document.getElementById('speaker').textContent,
            font: parseFloat(getComputedStyle(line).fontSize), overflow: line.scrollHeight - line.clientHeight,
            panelOverflow: panel.scrollHeight - panel.clientHeight,
            documentOverflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
            box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            speakers: [...new Set((d.pages[d.index].turns || []).filter(t => !t.narration).map(t => t.speaker))]
          };
        });
        const context = `${viewport.width}×${viewport.height}, ${large ? 'large' : 'normal'}: ${result.text}`;
        assert.equal(result.font, large ? 23 : 20, context);
        assert(result.overflow <= 1, `Chapter 1 text should fit without scrolling: ${context} (overflow ${result.overflow})`);
        assert(result.panelOverflow <= 1, `Chapter 1 choices should fit: ${context}`);
        assert(!result.documentOverflow, context);
        assert(result.box.width <= 680 && result.box.x >= 0 && result.box.y >= 0, context);
        const menuBox = await page.locator('#app-menu-open').boundingBox();
        assert(result.box.y >= menuBox.y + menuBox.height, 'Dialogue does not overlap the menu');
        assert.equal(await page.locator('#toast').evaluate(el => getComputedStyle(el).visibility), 'hidden', 'Movement tips do not cover the reading area');
        if (lastBox) assert.deepEqual(result.box, lastBox, 'Dialogue and next button stay in place between pages');
        lastBox = result.box;
        assert(result.speakers.length <= 1, 'One speaking character per page');
        assert(!result.speaker.includes('온'), 'Name reveal belongs to chapter 2');
        for (const button of await page.locator('#choices button, #next:not([hidden]), #app-text-size').all()) {
          const box = await button.boundingBox();
          assert(box.height >= 48 && box.y >= 0 && box.y + box.height <= viewport.height + 1, `Reachable touch target: ${context}`);
        }
        if (viewport.width === 800 && !large) transcript.push(`${result.speaker}: ${result.text}`);
        pages++;
        return result.text;
      }
      async function read() {
        for (let guard = 0; guard < 30 && await page.locator('#dialogue').isVisible(); guard++) {
          const text = await checkReading();
          if (text.includes('아직도 컵') && viewport.width === 800 && !large) await page.screenshot({ path: 'artifacts/reading-memory.png' });
          if (await page.locator('#choices button').count()) return;
          await page.locator('#next').click();
        }
      }
      assert(await page.locator('#dialogue').isVisible(), 'New game opens directly on the witnessed incident');
      assert.equal(await page.evaluate(() => window.__check.dialogue.pages.length), 2, 'First decision arrives on the second page');
      if (large) await page.locator('#app-text-size').click();
      await checkReading();
      await page.screenshot({ path: `artifacts/reading-${viewport.width}-${large ? 'large' : 'normal'}.png` });
      await read();
      await page.locator('#choices button').nth(large ? 1 : 0).click(); await read();
      assert(await page.evaluate(() => window.__check.state.met));
      assert.equal(await page.evaluate(() => window.__check.state.openingChoice), large ? 'pretend' : 'ask');
      await visit(1, 123, 210); await read();
      assert(await page.evaluate(() => window.__check.state.bell));
      assert.equal(await page.evaluate(() => window.__check.state.cat), false, 'The witnessed hiding place needs no cat errand');
      await visit(0, 348, 177); await read();
      await page.locator('#choices button').nth(large ? 1 : 0).click(); await read();
      assert(await page.locator('#ending').isVisible());
      assert.equal(await page.evaluate(() => window.__check.state.choice), large ? 'hang' : 'carry');
      await page.reload(); await page.locator('#app-menu-open').waitFor();
      assert.equal(await page.evaluate(() => document.body.classList.contains('reading-large')), large, 'Reading size persists independently of save');
      await page.locator('#continue').click();
      assert(await page.evaluate(() => window.__check.state.ended && window.__check.state.bell && window.__check.state.ticket), 'Completed first chapter reloads');
      // Existing restart backup remains available after replaying the revised chapter.
      await page.evaluate(() => document.getElementById('restart').click());
      assert(await page.evaluate(() => JSON.parse(localStorage.getItem('tomorrow-station-v1-before-restart')).ended), 'Replay keeps the old progress');
      await page.locator('#app-menu-open').click(); await page.locator('#load-button').click();
      await page.locator('#close-save-menu').click();
      // Long later-chapter prose remains scrollable, then resets at the next page.
      await page.evaluate(() => window.__check.speak('이야기', ['긴 대사를 읽을 때에도 문장이 잘려서 사라지면 안 된다.\n'.repeat(15), '다음 장면.']));
      await page.locator('#line').evaluate(el => { el.scrollTop = el.scrollHeight; });
      assert(await page.locator('#line').evaluate(el => el.scrollTop > 0));
      await page.locator('#next').click();
      assert.equal(await page.locator('#line').evaluate(el => el.scrollTop), 0);
      assert.deepEqual(errors, []);
      console.log(`PASS: ${viewport.width}×${viewport.height}, ${large ? '23px' : '20px'}; ${pages} readable story pages; choice/save/replay; stable panel; long prose scroll.`);
      await page.close();
    }
  }
  await writeFile('artifacts/chapter-one-reading.txt', transcript.join('\n\n'), 'utf8');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
