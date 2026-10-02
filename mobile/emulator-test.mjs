// Debug APK integration test. ADB/CDP only: never focuses a desktop window.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const adb = join(process.env.ANDROID_HOME || join(process.env.LOCALAPPDATA, 'Android/Sdk'), 'platform-tools/adb.exe');
const serial = process.env.ANDROID_SERIAL || 'emulator-5554';
const app = 'io.github.kpsayul.tomorrowstation';
const save = 'tomorrow-station-v1';
const command = (...args) => execFileSync(adb, ['-s', serial, ...args], { encoding: 'utf8', windowsHide: true }).trim();
let browser, port, page, originalSaves;
const errors = [], external = [];
const capture = name => writeFile(`artifacts/${name}.png`, execFileSync(adb, ['-s', serial, 'exec-out', 'screencap', '-p'], { windowsHide: true, maxBuffer: 10000000 }));
async function disconnect() {
  await browser?.close(); browser = null;
  if (port) command('forward', '--remove', `tcp:${port}`);
  port = null;
}
async function connect() {
  const pid = command('shell', 'pidof', app);
  assert(/^\d+$/.test(pid), 'Run the debug APK first');
  port = command('forward', 'tcp:0', `localabstract:webview_devtools_remote_${pid}`);
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { noDefaults: true, timeout: 5000 });
  page = browser.contexts().flatMap(context => context.pages()).find(page => page.url().startsWith('https://localhost'));
  assert(page, 'Game WebView found');
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('https://localhost/')) external.push(request.url()); });
  await page.waitForFunction(() => !!window.tomorrowNative);
}
async function connectWhenReady() {
  for (let i = 0; i < 30; i++) {
    try { await connect(); return; }
    catch (error) { await disconnect(); if (i === 29) throw error; await delay(300); }
  }
}
async function menuAction(id) {
  await page.locator('#app-menu-open').click();
  await page.locator('#' + id).click();
}
const snapshot = () => page.evaluate(key => {
  window.dispatchEvent(new CustomEvent('tomorrow-app-state', { detail: { isActive: false } }));
  return JSON.parse(localStorage.getItem(key));
}, save);
async function walk(axis, target) {
  for (let attempt = 0; attempt < 15; attempt++) {
    const current = (await snapshot())[axis], distance = target - current;
    if (Math.abs(distance) < 2) return;
    const key = axis === 'x' ? (distance > 0 ? 'ArrowRight' : 'ArrowLeft') : (distance > 0 ? 'ArrowDown' : 'ArrowUp');
    await page.keyboard.down(key);
    try { await delay(Math.min(550, Math.max(15, Math.abs(distance) / 96 * 1000))); }
    finally { await page.keyboard.up(key); }
  }
  throw new Error(`Could not walk to ${axis}=${target}: ${JSON.stringify(await snapshot())}`);
}
try {
  await mkdir('artifacts', { recursive: true });
  await connectWhenReady();
  originalSaves = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(key => key.startsWith('tomorrow-station')).map(key => [key, localStorage.getItem(key)])));
  await writeFile(`artifacts/emulator-save-backup-${Date.now()}.json`, JSON.stringify(originalSaves, null, 2));
  // Browser networking is disabled while local Android assets must keep loading.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await page.reload();
  await page.waitForFunction(() => !!window.tomorrowNative);
  await page.locator('#app-menu-open').waitFor();
  assert(await page.evaluate(() => innerWidth > innerHeight), 'Phone app uses landscape');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await capture('android-title');
  console.log('APK ready: landscape layout and offline assets.');
  const resume = await page.locator('#continue').isVisible();
  await page.locator(resume ? '#continue' : '#begin').click();
  if (await page.locator('#dialogue').isVisible() && (await snapshot()).opening === 'witness' && !(await snapshot()).met) {
    await page.locator('#next').click();
    await page.locator('#choices button').filter({ hasText: '방금 숨기신 거요?' }).click();
    for (let i = 0; i < 10 && await page.locator('#dialogue').isVisible(); i++) await page.locator('#next').click();
    assert.equal((await snapshot()).openingChoice, 'ask');
  }
  await page.waitForFunction(() => document.body.classList.contains('native-playing'));
  const beforeTouch = await snapshot();
  const control = await page.locator('#app-stick').boundingBox();
  assert(control && control.y + control.height <= await page.evaluate(() => innerHeight));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: control.x + control.width / 2, y: control.y + control.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: control.x + control.width / 2 + 30, y: control.y + control.height / 2 }] });
  await delay(250);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert((await snapshot()).x > beforeTouch.x + 5, 'Touch pad moves the character');
  if (!(await snapshot()).met) {
    await walk('x', 240); await walk('y', 178); await walk('x', 348);
    await page.locator('#touch-action').click();
    assert((await page.locator('#speaker').textContent()).includes('여울'));
    await capture('android-dialogue');
    for (let i = 0; i < 6 && !(await page.locator('#choices button').count()); i++) await page.locator('#next').click();
    await page.locator('#choices button').filter({ hasText: '제 이름도 찾을' }).click();
    assert((await page.locator('#speaker').textContent()).includes('주인공'));
    for (let i = 0; i < 10 && await page.locator('#dialogue').isVisible(); i++) await page.locator('#next').click();
    assert.equal((await snapshot()).firstQuestion, 'name');
  }
  console.log('Joystick input verified; checking save menus.');
  await menuAction('save-button');
  await page.locator('#save-slots .save-slot button').first().click();
  const manual = await page.evaluate(key => localStorage.getItem(key + '-slot-1'), save);
  assert(manual);
  await menuAction('load-button');
  command('shell', 'input', '-d', '0', 'keyevent', 'KEYCODE_BACK');
  await page.waitForFunction(() => !document.querySelector('#save-menu').open);
  console.log('Android back closes the save menu.');
  await menuAction('save-button');
  await page.locator('#export-save').click();
  await delay(500);
  const activities = command('shell', 'dumpsys', 'activity', 'activities');
  assert(activities.includes('android.intent.action.CREATE_DOCUMENT') && activities.includes('documentsui'), 'Android document picker opens');
  command('shell', 'input', '-d', '0', 'keyevent', 'KEYCODE_BACK');
  await page.waitForFunction(() => document.getElementById('import-status').textContent.includes('취소'));
  assert(await page.locator('#export-save').isEnabled());
  await page.locator('#close-save-menu').click();
  await capture('android-playing');
  // Real Android background lifecycle, then process death: storage must survive.
  command('shell', 'input', '-d', '0', 'keyevent', 'KEYCODE_HOME');
  await delay(400);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), save);
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await disconnect();
  command('shell', 'am', 'force-stop', app);
  command('shell', 'am', 'start', '-n', `${app}/.MainActivity`);
  await connectWhenReady();
  await page.locator('#continue').waitFor({ state: 'visible' });
  const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), save);
  assert.deepEqual(restored, saved, 'Autosave survives real process restart');
  assert.equal(await page.evaluate(key => localStorage.getItem(key + '-slot-1'), save), manual);
  await page.locator('#app-menu-open').click();
  await page.locator('a[href="privacy.html"]').click();
  await page.waitForURL('**/privacy.html');
  await page.waitForFunction(() => !!window.tomorrowNative);
  command('shell', 'input', '-d', '0', 'keyevent', 'KEYCODE_BACK');
  await page.waitForURL('https://localhost/');
  await menuAction('load-button');
  await page.locator('#save-slots .save-slot button').first().click();
  assert.equal((await snapshot()).firstQuestion, JSON.parse(manual).state.firstQuestion);
  await capture('android-playing');
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log('PASS: actual Android 13 / WebView 103 APK; landscape immersive layout; offline reload; touch joystick; speaker/choice progression; pause menu; manual save/load; Android back including privacy page; real document picker and cancellation; background autosave; process restart persistence; no external requests or JS errors.');
} finally {
  try {
    if (originalSaves) {
      if (!browser) await connectWhenReady();
      // Leave the game before restoring, so beforeunload cannot overwrite the backup.
      await page.goto('https://localhost/privacy.html');
      await page.evaluate(saves => {
        for (const key of Object.keys(localStorage).filter(key => key.startsWith('tomorrow-station'))) localStorage.removeItem(key);
        for (const [key, value] of Object.entries(saves)) localStorage.setItem(key, value);
      }, originalSaves);
      await page.goto('https://localhost/');
      if (originalSaves[save]) await page.locator('#continue').click();
      await capture('android-playing');
      console.log('Original game saves restored after emulator testing.');
    }
  } finally { await disconnect(); }
}
