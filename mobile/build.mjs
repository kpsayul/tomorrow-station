import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { build } from 'esbuild';
import '../story/build-homecoming.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist-mobile');
// Only ship runtime files. Tests, accounts, marketing archives and signing keys
// are never part of the app's web directory.
export const assets = ['favicon.svg', 'share.js', 'game-ui.js', 'game.js',
  'homecoming-text.js', 'homecoming.js', 'chapter-two.js', 'chapter-three.js', 'chapter-four.js', 'chapter-five.js', 'second-journey.js'];
await mkdir(output, { recursive: true });
for (const name of assets) await copyFile(resolve(root, name), resolve(output, name));
let html = await readFile(resolve(root, 'index.html'), 'utf8');
html = html.replace('initial-scale=1.0', 'initial-scale=1.0, viewport-fit=cover')
  .replace('<body>', '<body class="native-app">')
  .replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="native.css">')
  .replace('<script src="analytics-config.js"></script>', '<script src="native.js"></script>')
  .replace('<script src="analytics.js"></script>', '')
  .replace('무료 · 설치·가입 없이 플레이', '무료 · 오프라인 플레이')
  .replace('— 무료 한국어 스토리 게임</title>', '— 한국어 이야기 게임</title>')
  .replace('저장은 이 브라우저에 남아요.', '저장은 이 앱에 남아요. 앱을 삭제하기 전에는 저장 파일을 내보내 주세요.')
  .replace('href="promo/"', 'href="https://kpsayul.github.io/tomorrow-station/promo/"')
  .replace('닫기 · Esc', '닫기');
await writeFile(resolve(output, 'index.html'), html);
// Android ships Korean system fonts, so text remains readable on first launch
// with no network. No remote fonts, analytics or runtime code are requested.
const css = (await readFile(resolve(root, 'style.css'), 'utf8')).replace(/^\uFEFF?@import[^\r\n]+(?:\r?\n|$)/, '');
await writeFile(resolve(output, 'style.css'), css);
await copyFile(resolve(root, 'mobile/native.css'), resolve(output, 'native.css'));
await copyFile(resolve(root, 'mobile/privacy.html'), resolve(output, 'privacy.html'));
await build({ entryPoints: [resolve(root, 'mobile/native.mjs')], outfile: resolve(output, 'native.js'),
  bundle: true, format: 'iife', platform: 'browser', target: 'chrome103', sourcemap: false, minify: true });
console.log('Mobile web assets built: dist-mobile (bundled game, no remote runtime dependencies).');
