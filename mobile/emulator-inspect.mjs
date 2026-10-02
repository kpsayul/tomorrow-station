import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { join } from 'node:path';

const adb = join(process.env.ANDROID_HOME || join(process.env.LOCALAPPDATA, 'Android/Sdk'), 'platform-tools/adb.exe');
const serial = process.env.ANDROID_SERIAL || 'emulator-5554';
const command = (...args) => execFileSync(adb, ['-s', serial, ...args], { encoding: 'utf8', windowsHide: true }).trim();
const pid = command('shell', 'pidof', 'io.github.kpsayul.tomorrowstation');
if (!/^\d+$/.test(pid)) throw new Error('Launch the debug game on the emulator first.');
const port = command('forward', 'tcp:0', `localabstract:webview_devtools_remote_${pid}`);
let browser;
try {
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { noDefaults: true });
  const page = browser.contexts().flatMap(context => context.pages()).find(page => page.url().startsWith('https://localhost'));
  if (!page) throw new Error('Game WebView not found.');
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/android-current.png', execFileSync(adb, ['-s', serial, 'exec-out', 'screencap', '-p'], { windowsHide: true, maxBuffer: 10000000 }));
  console.log(JSON.stringify(await page.evaluate(() => ({
    url: location.href, title: document.title, native: !!window.tomorrowNative,
    userAgent: navigator.userAgent, width: innerWidth, height: innerHeight,
    classes: document.body.className, overflow: document.documentElement.scrollWidth > innerWidth,
    text: document.body.innerText.slice(0, 3500),
    saves: Object.keys(localStorage).filter(key => key.startsWith('tomorrow-station'))
  })), null, 2));
} finally {
  await browser?.close();
  command('forward', '--remove', `tcp:${port}`);
}
