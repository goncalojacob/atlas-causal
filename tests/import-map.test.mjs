// data/imports/: the actor mapping of an import, as data. It is not a record,
// so it has no rules file and no rule number; the schema says the shape and
// checkImportMap says the rest.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createValidator } from '../src/validate/schema.js';
import { TOOL_SIDE } from '../src/validate/schemas.js';
import { checkImportMap, IMPORT_MAP_SCHEMA } from '../tools/validate.mjs';
import { readImportMaps, DEFAULT_IMPORT_KIND } from '../tools/lib/read.mjs';
import { schemas, ROOT } from './helpers.mjs';
import path from 'node:path';

const DATA = path.join(ROOT, 'data');

async function validator() {
  return createValidator(await schemas());
}

const map = (entries) => ({ schema: 1, source: 'cshapes-2-0', entries });

test('the import-map schema is tool-side and validates the repository map', async () => {
  assert.ok(TOOL_SIDE.includes(IMPORT_MAP_SCHEMA));
  const { maps, problems } = await readImportMaps(DATA);
  assert.deepEqual(problems, []);
  // The directory holds other kinds now; a map is the ones that say so, or
  // say nothing, and the seeds file is not one of them.
  const found = maps.filter((m) => m.kind === DEFAULT_IMPORT_KIND);
  assert.deepEqual(found.map((m) => m.file), ['imports/cshapes-actors.json']);
  const v = await validator();
  assert.deepEqual(v.validate(IMPORT_MAP_SCHEMA, found[0].map), []);
  assert.deepEqual(checkImportMap(found[0].file, found[0].map), []);
});

test('the repository map carries the two splits the milestone asked for', async () => {
  const { maps } = await readImportMaps(DATA);
  const { entries } = maps.find((m) => m.file === 'imports/cshapes-actors.json').map;
  assert.equal(entries['750'].actor, 'british-india');
  assert.deepEqual(entries['750'].splits.map((s) => [s.from, s.actor]), [['1947-08-15', 'republic-of-india']]);
  assert.equal(entries['850'].actor, 'dutch-east-indies');
  assert.deepEqual(entries['850'].splits.map((s) => [s.from, s.actor]), [['1945-08-17', 'indonesia']]);
});

test('the schema rejects a shape it does not know', async () => {
  const v = await validator();
  const bad = map({ 750: { actor: 'british-india', when: '1947' } });
  assert.match(v.validate(IMPORT_MAP_SCHEMA, bad)[0].message, /unexpected property "when"/);
  assert.match(v.validate(IMPORT_MAP_SCHEMA, map({ 750: {} }))[0].message, /missing required property "actor"/);
  assert.match(v.validate(IMPORT_MAP_SCHEMA, map({ 750: { actor: 'British India' } }))[0].message, /must match/);
  const badDate = map({ 750: { actor: 'a', splits: [{ from: '1947', actor: 'b' }] } });
  assert.match(v.validate(IMPORT_MAP_SCHEMA, badDate)[0].message, /must match/);
});

test('checkImportMap: split dates are real and strictly increasing', () => {
  const back = checkImportMap('f', map({ 750: { actor: 'a', splits: [{ from: '1947-08-15', actor: 'b' }, { from: '1930-01-01', actor: 'c' }] } }));
  assert.equal(back.length, 1);
  assert.match(back[0].message, /does not come after 1947-08-15/);
  const same = checkImportMap('f', map({ 750: { actor: 'a', splits: [{ from: '1947-08-15', actor: 'b' }, { from: '1947-08-15', actor: 'c' }] } }));
  assert.equal(same.length, 1);
  const notADay = checkImportMap('f', map({ 750: { actor: 'a', splits: [{ from: '1947-02-31', actor: 'b' }] } }));
  assert.equal(notADay.length, 1);
  assert.match(notADay[0].message, /not a real date/);
});

test("checkImportMap: a split's actor is not the entry's own, nor another split's", () => {
  const own = checkImportMap('f', map({ 750: { actor: 'a', splits: [{ from: '1947-08-15', actor: 'a' }] } }));
  assert.equal(own.length, 1);
  assert.match(own[0].message, /already the actor of the entry itself/);
  const twice = checkImportMap('f', map({ 750: { actor: 'a', splits: [{ from: '1947-08-15', actor: 'b' }, { from: '1950-01-01', actor: 'b' }] } }));
  assert.equal(twice.length, 1);
  assert.match(twice[0].message, /already the actor of split 0/);
});

test('checkImportMap: keys are entity codes and names do not repeat', () => {
  const key = checkImportMap('f', map({ india: { actor: 'a' } }));
  assert.equal(key.length, 1);
  assert.match(key[0].message, /is not an entity code/);
  const repeated = checkImportMap('f', map({ 750: { actor: 'a', names: ['British India', 'british india'] } }));
  assert.equal(repeated.length, 1);
  assert.match(repeated[0].message, /listed twice/);
  assert.equal(repeated[0].path, '/entries/750/names/1');
});
