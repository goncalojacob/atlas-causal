// The pure half of the composer: a draft a reader is building, the record it
// becomes, and the verdict the validator's own rules give on that record.
// No DOM and no network — `composer.js` is the other half, and everything
// here is under test.
//
// Why this file is small: almost nothing about writing a narrative record is
// new. `src/contribute/bundle.js` already turns plain field values into the
// record the Action writes to `data/narratives/<id>.json`, already runs
// `validate()` over the loaded topology, and `src/contribute/submit.js`
// already knows how a bundle reaches GitHub. A second record builder beside
// them would be a second answer to "what does a valid narrative look like",
// and the two would drift. So this file is the *draft* — what a reader has
// picked and written so far — and the three translations out of it: to a
// record, to a verdict, to a link.
//
// A draft is `{ title, summary, author, citations, steps }` and nothing else.
// It is what goes into localStorage, so it is plain data with no atlas in it:
// a reader who comes back tomorrow gets their draft back whatever the atlas
// has become since, and a step that names a record the atlas no longer has is
// reported by the rules rather than silently dropped on the way in.

import { buildRecord, canMove, moveItem, slugify, validateBundle } from '../contribute/bundle.js';
import { issueUrl, bundleText, defaultTitle } from '../contribute/submit.js';
import { extent, fromAstronomical } from '../util/dates.js';

// Its own key beside `atlas-causal.panes` and `atlas-causal.band`, for the
// reason those two are separate from each other: a draft and a dragged edge
// must not be able to write over each other's answer (panes.js).
export const STORAGE_KEY = 'atlas-causal.compose';

const trimmed = (value) => String(value ?? '').trim();

export function emptyDraft() {
  return { title: '', summary: '', author: '', citations: [], steps: [] };
}

// --- picking ---------------------------------------------------------------

// A step is an event the atlas has, and the composer offers nothing it cannot
// cite: `has` is the atlas's own answer, passed in so this file never holds
// one. The same event twice running is refused here rather than left for rule
// 20 to report — a reader clicking the mark they already picked has not asked
// for a second step, and a verdict is not the place to learn that.
//
// The same event *later* in the walk is allowed, because a narrative that
// comes back to where it started is an argument and not a mistake; rule 20
// forbids only the repeat.
export function pickStep(draft, ref, { has }) {
  const id = trimmed(ref);
  if (id === '' || !has(id)) return draft;
  const steps = draft?.steps ?? [];
  if (steps.length > 0 && steps[steps.length - 1].ref === id) return draft;
  return { ...draft, steps: [...steps, { ref: id, text: '' }] };
}

export function removeStep(draft, at) {
  const steps = draft?.steps ?? [];
  if (!Number.isInteger(at) || at < 0 || at >= steps.length) return draft;
  return { ...draft, steps: steps.filter((_, i) => i !== at) };
}

// The same two functions the contribution form's ordered lists use, so that a
// step moved in the composer and a step moved in the form move by one rule.
export function moveStep(draft, at, delta) {
  const steps = draft?.steps ?? [];
  if (!canMove(steps, at, delta)) return draft;
  return { ...draft, steps: moveItem(steps, at, delta) };
}

export function setStepText(draft, at, text) {
  const steps = draft?.steps ?? [];
  if (!Number.isInteger(at) || at < 0 || at >= steps.length) return draft;
  return { ...draft, steps: steps.map((s, i) => (i === at ? { ...s, text: String(text ?? '') } : s)) };
}

// --- the window ------------------------------------------------------------

// The span of the steps, in historians' years, and never typed: a reader who
// has picked 1961 and 1975 has already said which years this narrative is
// about, and a third field to disagree with them would only be a way of
// getting it wrong.
//
// `years(ref)` is the atlas's own interval for that record — `extent()` over
// its `when` — and null for a ref the atlas does not have or does not date.
// An open-ended event contributes its start and not an end nobody knows.
export function windowOf(draft, years) {
  const spans = (draft?.steps ?? []).map((s) => years(s.ref)).filter((x) => x && Number.isInteger(x.min));
  if (spans.length === 0) return null;
  const min = Math.min(...spans.map((x) => x.min));
  const max = Math.max(...spans.map((x) => (Number.isInteger(x.max) ? x.max : x.min)));
  return { from: fromAstronomical(min), to: fromAstronomical(max) };
}

// The universe the rules read, out of the atlas the page already loaded.
// The same list `contribute.html` builds, minus the two things a narrative
// cannot be checked against and this page has not fetched: the presences,
// which no step of a composed walk names because the composer picks events,
// and the closed vocabularies, which belong to an event's roles and
// categories and not to a walk.
export function topologyFor(atlas) {
  return {
    events: [...atlas.events.values()],
    edges: [...atlas.edges.values()],
    sources: [...atlas.sources.values()],
    actors: [...atlas.actors.values()],
    places: [...atlas.places.values()],
    offices: [...(atlas.offices?.values() ?? [])],
    tenures: [...(atlas.tenures?.values() ?? [])],
    narratives: [...(atlas.narratives?.values() ?? [])],
    presences: [...(atlas.presences?.values() ?? [])],
    regions: atlas.regions,
  };
}

// The atlas as this file wants it: two questions and no object. Passed in by
// `composer.js` so that nothing here imports `data.js`.
export function atlasReader(atlas) {
  return {
    has: (ref) => atlas.resolve(ref)?.kind === 'event',
    years: (ref) => {
      // `resolve` answers through the aliases and the merges, so a draft
      // written before a record was renamed still finds it (data.js).
      const found = atlas.resolve(ref);
      const when = found?.kind === 'event' ? found.record?.when : null;
      if (!when) return null;
      try {
        return extent(when);
      } catch {
        return null;
      }
    },
  };
}

// --- the record ------------------------------------------------------------

// What the validator will be asked about, and what the issue will carry.
// `buildRecord` writes the envelope every contributed record carries; the one
// thing added here is the standing, and it is added because it is true:
// nobody has read this. `tools/bundle-to-files.mjs` sets it again on the way
// in — with `contributed` and the issue number beside it — so the record the
// reader sees in the issue and the record that lands on the branch say the
// same thing about how far it has been read.
export function composeRecord(draft, { years, today = '1970-01-01' } = {}) {
  const d = draft ?? emptyDraft();
  const span = years ? windowOf(d, years) : null;
  const record = buildRecord('narrative', {
    id: slugify(d.title),
    title: d.title,
    summary: d.summary,
    citations: d.citations ?? [],
    steps: d.steps ?? [],
    windowFrom: span ? String(span.from) : '',
    windowTo: span ? String(span.to) : '',
  }, { author: d.author, today });
  record.review = { status: 'draft' };
  return record;
}

export const bundleOf = (record) => ({ schema: 1, records: [record] });

// The validator's own rules, imported and not copied: `validateBundle` is the
// function `contribute.html` runs on every keystroke, which is `validate()` in
// `src/validate/core.js`, which is what `node tools/validate.mjs` runs. A
// submission therefore never fails on shape, and when it does fail the reader
// reads the same sentence a maintainer would.
//
// The atlas page holds the core whole, which is every id, kind, status and
// interval there is. That is the whole of what the rules ask of the topology
// on behalf of a narrative — rule 2 asks whether the id is taken, rule 3
// whether each step names a record, rule 11 whether it is still active, rule 6
// whether it cites, rule 20 the shape of the walk — so unlike the two writer
// pages this one has no reason to wait for the attribute shards.
export function checkRecord(record, topology, schemas, prepared = null) {
  return validateBundle(bundleOf(record), topology, schemas, prepared);
}

// --- the link --------------------------------------------------------------

// A GitHub new-issue URL and nothing else. No token, no secret and no API
// call: the reader is signed in to GitHub in their own browser under their own
// account, the issue is theirs, and this page never speaks to anybody. Above
// the prefill cap the template opens empty and the record is on the clipboard
// instead, which is `submit.js`'s rule and not a second one.
export function submitUrl(record, options = {}) {
  const bundle = bundleOf(record);
  return issueUrl(bundle, { title: defaultTitle(bundle), ...options });
}

export const recordText = (record) => bundleText(bundleOf(record));

// --- the draft between visits ----------------------------------------------
//
// `panes.js`'s pattern exactly: per reader, per browser, never in the URL,
// and every read and write wrapped — a browser with storage turned off still
// composes, it just forgets. Anything that is not the shape this file writes
// is read as no draft at all, so a value from another version cannot stop the
// composer from opening.

function draftShape(parsed) {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
  const citations = Array.isArray(parsed.citations) ? parsed.citations : [];
  return {
    title: String(parsed.title ?? ''),
    summary: String(parsed.summary ?? ''),
    author: String(parsed.author ?? ''),
    citations: citations
      .filter((c) => c && typeof c === 'object' && typeof c.source === 'string')
      .map((c) => ({ source: c.source, locator: typeof c.locator === 'string' ? c.locator : '' })),
    steps: steps
      .filter((s) => s && typeof s === 'object' && typeof s.ref === 'string')
      .map((s) => ({ ref: s.ref, text: String(s.text ?? '') })),
  };
}

export function readDraft(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? draftShape(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeDraft(storage, draft) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(draftShape(draft) ?? emptyDraft()));
    return true;
  } catch {
    return false;
  }
}

// Submitting is what ends a draft: the argument has left the browser and is an
// issue with a number, and a composer that opened tomorrow on the narrative
// already sent would invite the reader to send it twice.
export function clearDraft(storage) {
  try {
    storage?.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
