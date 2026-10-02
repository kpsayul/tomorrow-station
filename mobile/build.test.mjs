import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assets } from './build.mjs';

test('packaged game is self-contained and excludes web analytics and development files', async () => {
  const dir = new URL('../dist-mobile/', import.meta.url);
  const expected = [...assets, 'index.html', 'native.js', 'native.css', 'style.css', 'privacy.html'];
  assert.deepEqual((await readdir(dir)).sort(), expected.sort());
  const html = await readFile(new URL('index.html', dir), 'utf8');
  for (const match of html.matchAll(/<script[^>]*src="([^"]+)"/g)) {
    assert(!match[1].includes('://'), 'App scripts must load offline');
    await readFile(new URL(match[1], dir));
  }
  assert(!html.includes('analytics.js'));
  const css = await readFile(new URL('style.css', dir), 'utf8');
  assert(!css.includes('@import'));
  assert(!css.includes('fonts.googleapis.com'));
  assert(!html.includes('설치·가입 없이 플레이'));
  for (const name of assets.filter(name => name.endsWith('.js'))) {
    assert.equal(await readFile(new URL(name, dir), 'utf8'), await readFile(resolve(name), 'utf8'));
    assert(!(await readFile(new URL(name, dir), 'utf8')).includes('window.__check'));
  }
});
