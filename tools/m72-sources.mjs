// The measurement docs/m72-sources.md carries, read off data/ rather than
// typed: how many sources each active edge names, how many distinct authors
// those sources have, and how many citations carry a locator. Run before the
// run touched a record and again at its end, so the two tables are the same
// question asked twice. --json for a test or a script.
import { readdirSync, readFileSync } from 'node:fs';
const root = new URL("..", import.meta.url).pathname;
const read = (d) => readdirSync(`${root}/data/${d}`).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`${root}/data/${d}/${f}`, 'utf8')));
const sources = new Map(read('sources').map((s) => [s.id, s]));
const edges = read('edges').filter((e) => e.status === 'active');
const nameKey = (n) => String(n).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const creators = (id) => new Set((sources.get(id)?.creators ?? []).map(nameKey).filter(Boolean));
const independent = (cs) => {
  const sets = cs.map((c) => creators(c.source));
  for (let i = 0; i < sets.length; i += 1) {
    for (let j = i + 1; j < sets.length; j += 1) {
      if (sets[i].size && sets[j].size && [...sets[i]].every((k) => !sets[j].has(k))) return true;
    }
  }
  return false;
};
const counts = {}, conf = {}, authors = {};
let loc = 0, total = 0, indep = 0;
const singles = [], noIndep = [];
for (const e of edges) {
  const cs = e.sources ?? [];
  counts[cs.length] = (counts[cs.length] ?? 0) + 1;
  conf[e.confidence] = (conf[e.confidence] ?? 0) + 1;
  total += cs.length;
  loc += cs.filter((c) => c.locator != null).length;
  const set = new Set(); for (const c of cs) for (const k of creators(c.source)) set.add(k);
  authors[set.size] = (authors[set.size] ?? 0) + 1;
  if (independent(cs)) indep += 1; else if (cs.length === 1) singles.push(e.id); else noIndep.push(e.id);
}
const out = {
  edges: edges.length, counts, conf, authors,
  citations: total, withLocator: loc, withoutLocator: total - loc,
  independent: indep, singles: singles.length, multiOneAuthor: noIndep.length,
  sources: sources.size,
};
if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
const row = (o, k) => Object.keys(o).sort((a, b) => Number(a) - Number(b)).map((n) => `| ${k(n)} | ${o[n]} |`).join('\n');
console.log(`Active edges: **${out.edges}**. Citations on them: **${out.citations}**. Source records: **${out.sources}**.

| sources on the edge | edges |
| --- | --- |
${row(counts, (n) => n)}

| distinct authors across those sources | edges |
| --- | --- |
${row(authors, (n) => n)}

| | citations |
| --- | --- |
| with a locator | ${out.withLocator} |
| without a locator | ${out.withoutLocator} |

| confidence | edges |
| --- | --- |
${['consensus', 'probable', 'disputed'].map((c) => `| \`${c}\` | ${conf[c] ?? 0} |`).join('\n')}

Edges satisfying rule 9 (two cited sources by different authors): **${out.independent}**.
Edges resting on one source: **${out.singles}**. Edges with more than one source but
all by one author: **${out.multiOneAuthor}**.`);
