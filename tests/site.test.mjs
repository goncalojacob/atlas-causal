// The site has no build step and no browser in CI, so this is the cheapest
// guard against a broken page: every module under src/ (except the
// bootstrap, which touches window at top level) imports cleanly in Node,
// every relative import resolves to a file, and geometry becomes path data.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './helpers.mjs';
import { geometryPath } from '../src/map/layers/land.js';
import { createProjection } from '../src/map/projection.js';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

test('every relative import under src/ resolves to a file', async () => {
  const files = await walk(path.join(ROOT, 'src'));
  assert.ok(files.length >= 15);
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    for (const m of text.matchAll(/from\s+'(\.[^']+)'/g)) {
      const target = path.resolve(path.dirname(file), m[1]);
      await assert.doesNotReject(stat(target), `${path.relative(ROOT, file)} imports missing ${m[1]}`);
    }
    assert.doesNotMatch(text, /https?:\/\/cdn|unpkg|jsdelivr|node_modules/, `${file} must not load external code`);
  }
});

test('modules import without a DOM (main.js excepted)', async () => {
  const files = (await walk(path.join(ROOT, 'src'))).filter((f) => !f.endsWith('main.js'));
  for (const file of files) {
    await assert.doesNotReject(import(pathToFileURL(file).href), file);
  }
});

test('index.html loads only local modules and the stylesheet', async () => {
  const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /<script type="module" src="src\/main\.js">/);
  assert.match(html, /href="src\/style\.css"/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test('no hex colour outside the tokens in style.css', async () => {
  const css = await readFile(path.join(ROOT, 'src', 'style.css'), 'utf8');
  const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
  const rest = css.replace(root, '');
  assert.doesNotMatch(rest, /#[0-9a-f]{3,8}\b/i);
  const js = await Promise.all((await walk(path.join(ROOT, 'src'))).map((f) => readFile(f, 'utf8')));
  for (const text of js) assert.doesNotMatch(text, /['"]#[0-9a-f]{6}['"]/i);
});

test('geometryPath turns rings into closed subpaths', () => {
  const p = createProjection({ width: 360, height: 180, scale: 1 });
  const d = geometryPath({ type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 0]]] }, p.project);
  assert.equal(d, 'M180.00 90.00L190.00 90.00L190.00 80.00L180.00 90.00Z');
  const multi = geometryPath({ type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [0, 1], [0, 0]]], [[[5, 5], [6, 5], [5, 6], [5, 5]]]] }, p.project);
  assert.equal((multi.match(/Z/g) ?? []).length, 2);
  assert.equal(geometryPath({ type: 'Point', coordinates: [0, 0] }, p.project), '');
});
