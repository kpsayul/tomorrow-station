import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
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
const source = (await readFile('game.js', 'utf8')).replace('requestAnimationFrame(frame);window.addEventListener', `
  let testClock=1000;
  window.__motion={
    get state(){return state},keys,speak,closeDialogue,move,
    prepare(room,chapter){state=fresh();state.room=room;state.chapter=chapter;state.x=240;state.y=240;active=true;$('start').hidden=true;$('ending').hidden=true;closeDialogue();clearInput();objective();},
    tick(count=1){for(let i=0;i<count;i++){testClock+=1000/60;frame(testClock);}}
  };window.addEventListener`).replaceAll('requestAnimationFrame(frame);', '');

async function open(native = true) {
  const page = await browser.newPage({ viewport: { width: 800, height: 400 }, hasTouch: true });
  await page.route('**/game.js', route => route.fulfill({ contentType: 'text/javascript', body: source }));
  if (!native) await page.route(url, async route => route.fulfill({ contentType: 'text/html', body: (await readFile('dist-mobile/index.html', 'utf8')).replace('class="native-app"', '') }));
  await page.goto(url);
  await page.waitForFunction(() => !!window.__motion);
  return page;
}
async function picture(page, frames = 1) {
  return page.evaluate(frames => { window.__motion.tick(frames); return document.getElementById('game').toDataURL(); }, frames);
}
try {
  const page = await open();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const chapters = [1,1,2,2,3,3,4,4,4,5,5,6,6,7,7,8,8];
  for (let room = 0; room < chapters.length; room++) {
    await page.evaluate(({room,chapter}) => window.__motion.prepare(room,chapter), {room,chapter:chapters[room]});
    const before = await picture(page);
    assert.equal(await picture(page, 60), before, `Room ${room}: idle background stays pixel-identical for one second`);
    await page.evaluate(() => window.__motion.speak('여울', ['여울: 여기에 잠깐 앉아도 괜찮아요.', '여울: 천천히 읽어요.']));
    const reading = await picture(page);
    assert.equal(await picture(page, 60), reading, `Room ${room}: no ambient movement behind dialogue`);
    await page.locator('#next').click();
    assert.equal(await picture(page), reading, 'Turning a dialogue page does not change the backdrop');
  }
  await page.evaluate(() => { window.__motion.prepare(0,1);window.__motion.move(1);window.__motion.tick(); });
  assert.equal(await page.locator('#scene-stage').evaluate(el => el.getAnimations().length), 0, 'Room change has no full-scene brightness animation');
  await page.evaluate(() => { window.__motion.prepare(0,1);window.__motion.tick(); });
  assert.equal(await page.locator('#target-marker').evaluate(el => getComputedStyle(el).animationName), 'none');
  const scene = await page.locator('#scene-stage').boundingBox();
  const stick = await page.locator('#app-stick').boundingBox();
  const cx = stick.x + stick.width / 2, cy = stick.y + stick.height / 2, radius = (stick.width - 52) / 2;
  await page.mouse.move(cx, cy); await page.mouse.down();
  async function speed(magnitude) {
    await page.mouse.move(cx + radius * magnitude, cy);
    return page.evaluate(() => { const test=window.__motion;test.state.x=240;test.state.y=240;test.tick();return (test.state.x-240)*60; });
  }
  assert.equal(await speed(.1), 0, 'Joystick dead zone remains still');
  const values=[];
  for (const magnitude of [.4,.65,.75,.849,.851,.95,1,1.3]) values.push(await speed(magnitude));
  assert(values.every((value,i) => !i || value >= values[i-1] - .0001), 'Joystick speed increases continuously');
  assert(values[4]-values[3] < 2, 'Crossing the old run threshold no longer causes a speed jump');
  assert(Math.abs(values[6]-180)<.001 && Math.abs(values[7]-180)<.001, 'Full running speed and outer clamping are preserved');
  await page.mouse.up();
  const stopped = await page.evaluate(() => window.__motion.state.x);
  await picture(page,60);
  assert.equal(await page.evaluate(() => window.__motion.state.x), stopped, 'Release stops immediately without coasting');
  assert.deepEqual(await page.locator('#scene-stage').boundingBox(),scene,'Movement never pans or resizes the scene');
  for (const run of [false,true]) {
    const distance = await page.evaluate(run => {
      const test=window.__motion;test.prepare(0,1);test.keys.add('d');if(run)test.keys.add('shift');test.tick(30);test.keys.clear();return test.state.x-240;
    },run);
    assert(Math.abs(distance-(run?90:48))<.001,'Keyboard walking and running speeds are unchanged');
  }
  assert.deepEqual(errors,[]);
  await page.close();

  // The shared renderer must also honor reduced motion in a browser and pause
  // while reading, without disabling normal web scenery between conversations.
  const web = await open(false);
  await web.evaluate(() => window.__motion.prepare(3,2));
  const animated = await picture(web);
  assert.notEqual(await picture(web,60),animated,'Normal web rain still animates while exploring');
  await web.evaluate(() => window.__motion.speak('이야기',['이야기: 빗소리가 들렸다.']));
  const reading = await picture(web);
  assert.equal(await picture(web,60),reading,'Web scenery pauses during reading');
  await web.evaluate(() => window.__motion.closeDialogue());
  assert.notEqual(await picture(web,60),reading,'Web scenery resumes after reading');
  await web.emulateMedia({reducedMotion:'reduce'});
  const reduced = await picture(web);
  assert.equal(await picture(web,60),reduced,'System reduced-motion preference freezes canvas effects');
  await web.close();
  console.log(`PASS: 17 still app scenes; still dialogue backgrounds; no room fade or marker bob; continuous joystick speeds ${values.map(v=>v.toFixed(1)).join(', ')}; immediate stop; fixed camera; keyboard speeds; web reading pause and reduced motion.`);
} finally { await browser.close();await new Promise(resolve=>server.close(resolve)); }
