// The live preview of a full entry, under the textarea it is typed into. The
// contribution form and the review dashboard both use it, so what a
// contributor is shown while writing and what the entry page draws come out
// of one renderer and cannot drift apart.
//
// Pure: text in, markup and a list of complaints out. form.js and editor.js
// are the halves that own a textarea and assign what this returns.
//
// Record links are drawn as text rather than as links. A preview sits inside
// a form with unsaved work in it, and a link that navigated away would cost
// the contributor the draft; what they need to know is whether the id
// resolves, and the notes below say so in words.

import { esc } from '../util/esc.js';
import { renderBody } from '../markdown.js';

const REFUSAL = Object.freeze({
  html: 'HTML is not markup here and is shown as the characters you typed',
  image: 'images are not part of the subset',
  'link-target': 'a link goes to a record by id or to an http(s) address, and nothing else',
  'record-id': 'a record link needs an id: lowercase words joined by hyphens',
  'heading-level': 'headings are ## and ###; the page owns the title above them',
});

// text: what is in the textarea. cited: the ids of the sources the record
// cites right now, so a mark can be checked against the citation rows as they
// are edited. known: (kind, id) => boolean, the topology's opinion on whether
// a link goes anywhere; nothing is checked when it is not given.
export function previewNotes(text, { cited = null, known = null } = {}) {
  const rendered = renderBody(text, { cited, href: () => null });
  const notes = [];
  const seen = new Set();
  const say = (message) => { if (!seen.has(message)) { seen.add(message); notes.push(message); } };

  for (const note of rendered.notes) say(REFUSAL[note.reason] ?? `refused: ${note.reason}`);
  if (cited) {
    for (const { source } of rendered.citations) {
      if (!cited.has(source)) say(`"${source}" is cited in the entry but is not among this record's sources`);
    }
  }
  if (known) {
    for (const { kind, id } of rendered.links) {
      if (!known(kind, id)) say(`"${id}" is linked as ${kind === 'event' || kind === 'actor' ? 'an' : 'a'} ${kind} and there is no such record`);
    }
  }
  return { html: rendered.html, headings: rendered.headings, order: rendered.order, notes };
}

// The whole block under the textarea: what it will look like, and what is
// wrong with it. An empty entry previews as nothing rather than as an error —
// the field is optional and most records will never have one.
export function previewHtml(text, options = {}) {
  if (typeof text !== 'string' || text.trim() === '') {
    return '<p class="hint">Nothing written yet. What you type here becomes the record\'s own page.</p>';
  }
  const { html, headings, notes } = previewNotes(text, options);
  const contents = headings.length >= 2
    ? `<p class="hint">Sections: ${headings.map((h) => esc(h.text)).join(' · ')}</p>`
    : '';
  const complaints = notes.length
    ? `<ul class="preview-notes">${notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`
    : '';
  return `${contents}<div class="entry-body preview-body">${html}</div>${complaints}`;
}
