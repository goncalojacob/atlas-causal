// Two ways out of what is on screen: the record's own discussion, and the
// picture as a file somebody can keep.
//
// Both are pure here — a URL, and the text of an SVG document — and the DOM
// half is one small function at the end that fetches the stylesheet, reads
// the computed tokens and hands the browser a download. Neither of them is
// an export of the *data*: `data/` is the export of the data, and it is in
// the repository. This is the drawing, at the moment it was looked at.

import { REPOSITORY, CORRECTION_TEMPLATE } from './contribute/submit.js';
import { CONTRIBUTED_KINDS } from './kinds.js';
import { SLUG, EDGE_ID, RELATION_ID } from './validate/rules.js';

// A correction issue about one record, opened on the template that carries
// the licence grant — blank issues are off, and a grant is what makes a
// correction usable at all.
//
// GitHub ignores `body` on a template that has fields, so what would have
// been the body goes into `notes`, which is the field that asks what is
// wrong. The URL carried is the record's own address — `recordUrl` below —
// and not the reader's.
export function discussUrl(kind, id, {
  repository = REPOSITORY, template = CORRECTION_TEMPLATE, url = null,
} = {}) {
  const params = new URLSearchParams({ template, title: `Correction: ${id}` });
  const lines = [`Record: \`${kind}/${id}\``];
  if (url) lines.push(`Seen at: ${url}`);
  lines.push('', 'What is wrong with it, and which source says otherwise?');
  params.set('notes', lines.join('\n'));
  return `${repository}/issues/new?${params.toString()}`;
}

// The other way to disagree with a record: not an issue about it, but the
// record as it should read. The contribution form opens on this one's fields
// — the same form a new record is written in, and the same bundle, because a
// correction is a whole record with the id it already has (principle 5).
//
// Until H6a a correction had no form at all: `?correction=1` switched the
// issue template and nothing loaded the record, so the one thing a reader
// most often wants to fix — a date, a confidence, a sentence — meant opening
// `data/<kind>s/<id>.json` by hand and pasting it (health review B, finding
// 26). `kind/id` is the address, the same one the discussion issue carries.
export function editUrl(kind, id, { base = 'contribute.html', fixtures = false } = {}) {
  const params = new URLSearchParams({ correction: '1', edit: `${kind}/${id}` });
  if (fixtures) params.set('fixtures', '1');
  return `${base}?${params.toString()}`;
}

// The other end of editUrl: `<kind>/<id>`, and nothing else. The kind has to
// be one the form writes and the id has to be an id of that kind, under the
// validator's own patterns — the same three tools/bundle-to-files.mjs checks
// an incoming id against, and for the same reason: what comes out of this
// becomes a path in a fetch, so it is checked before it is one.
export function parseEdit(text) {
  const at = String(text ?? '').indexOf('/');
  if (at < 0) return null;
  const kind = text.slice(0, at);
  const id = text.slice(at + 1);
  if (!CONTRIBUTED_KINDS.includes(kind)) return null;
  const pattern = kind === 'edge' ? EDGE_ID : kind === 'relation' ? RELATION_ID : SLUG;
  return pattern.test(id) ? { kind, id } : null;
}

// Which state field opens a record of each kind. An edge has no card of its
// own — it is walked, not opened — so it has no address here.
export const OPENING_OF = Object.freeze({
  event: 'selected', source: 'source', place: 'place', actor: 'actor', narrative: 'narrative',
});

// The record's own address on the atlas: the page, and the one parameter that
// opens it. Nothing of what the reader had done to get there.
//
// The correction issue used to carry `location.href` whole, which put the
// box, the window, the horizon and every step of the walked chain into a
// public issue about one record (health review A, finding 33). None of it
// helps whoever answers, all of it grows without bound — fifteen steps is
// about 1.5 KB of query, and GitHub's own limit is not far above — and the
// moment anything about the reader ever reaches the URL it would be a leak.
//
// `base` is the page, without its query: `location.origin + location.pathname`
// from the browser, and anything at all from a test. A kind with no opening
// is the bare page, which is still where the record lives.
export function recordUrl(kind, id, { base = '' } = {}) {
  const key = OPENING_OF[kind];
  if (!key || !id) return base || null;
  return `${base}?${new URLSearchParams({ [key]: id })}`;
}

// --- the view as a file ----------------------------------------------------

const SVG_NS = 'http://www.w3.org/2000/svg';

// Every custom property the stylesheet mentions. The names, not the values:
// the values are whatever the browser computed for this reader, which is the
// point of inlining them — a token is a promise about a colour, and a file
// that only carried the promise would be blank.
export function tokenNames(css) {
  return [...new Set([...String(css ?? '').matchAll(/--[a-z0-9-]+/g)].map((m) => m[0]))].sort();
}

// The tokens as a `:root` block. In a standalone SVG the root element *is*
// the `<svg>`, so `:root` reaches it and the rules below inherit from it.
function tokensBlock(tokens) {
  const lines = Object.entries(tokens).map(([name, value]) => `  ${name}: ${value};`);
  return lines.length ? `:root {\n${lines.join('\n')}\n}\n` : '';
}

// The whole file. The stylesheet comes with it because a drawing whose rules
// live in another file is a drawing of nothing: the classes on the marks are
// the drawing. The computed tokens are written first so they win over the
// stylesheet's own defaults, which is what "as the reader saw it" means.
export function svgFile({
  inner = '', viewBox = '', width = 0, height = 0, className = '', css = '', tokens = {}, title = 'Atlas causal',
}) {
  const size = width && height ? ` width="${width}" height="${height}"` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NS}" viewBox="${viewBox}"${size} class="${className}" role="img" aria-label="${title}">
<title>${title}</title>
<style>
${tokensBlock(tokens)}${css}
</style>
${inner}
</svg>
`;
}

// atlas-causal-map-2026-09-05.svg: what it is, which picture, and when the
// reader was looking at it.
export function exportName(view, { date = new Date() } = {}) {
  return `atlas-causal-${view}-${date.toISOString().slice(0, 10)}.svg`;
}

// The numbers in a viewBox, for the width and height attributes a file needs
// when nothing is going to give it a box to fill.
export function sizeOf(viewBox) {
  const n = String(viewBox ?? '').trim().split(/\s+/).map(Number);
  if (n.length !== 4 || n.some((v) => !Number.isFinite(v))) return { width: 0, height: 0 };
  return { width: n[2], height: n[3] };
}

export function collectTokens(css, { computed }) {
  const out = {};
  for (const name of tokenNames(css)) {
    const value = computed(name);
    if (value) out[name] = String(value).trim();
  }
  return out;
}

// The control both views carry, so neither has to know how the file is made.
// A button and not a link: there is no address to copy, and what it hands
// over is built at the moment it is pressed.
export function exportButton(root, view, options = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'view-export';
  button.textContent = 'Export this view';
  button.title = 'The picture on screen, as an SVG file';
  button.addEventListener('click', () => {
    button.disabled = true;
    exportSvg(root, { view, ...options }).finally(() => { button.disabled = false; });
  });
  return button;
}

// The DOM half: fetch the stylesheet once, read what the browser made of the
// tokens, and hand the file over. Everything it needs is injectable, so what
// is left untested here is only the browser's own download.
let cachedCss = null;
export async function exportSvg(root, {
  view = 'map',
  cssUrl = 'src/style.css',
  fetch: fetchFn = globalThis.fetch,
  doc = globalThis.document,
  win = globalThis.window,
  name = exportName(view),
} = {}) {
  if (cachedCss === null) {
    cachedCss = await fetchFn(cssUrl).then((r) => (r.ok ? r.text() : '')).catch(() => '');
  }
  const style = win.getComputedStyle(doc.documentElement);
  const viewBox = root.getAttribute('viewBox') ?? '';
  const text = svgFile({
    inner: root.innerHTML,
    viewBox,
    ...sizeOf(viewBox),
    className: root.getAttribute('class') ?? '',
    css: cachedCss,
    tokens: collectTokens(cachedCss, { computed: (n) => style.getPropertyValue(n) }),
  });
  const url = win.URL.createObjectURL(new win.Blob([text], { type: 'image/svg+xml' }));
  const link = doc.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noopener';
  doc.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next turn of the loop: revoking it in the same one has
  // been known to reach the browser before the download does.
  setTimeout(() => win.URL.revokeObjectURL(url), 1000);
  return name;
}
