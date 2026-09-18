// The live preview under the entry textarea. The contribution form and the
// review dashboard both draw this block, so it is checked once, as a string.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewHtml, previewNotes } from '../src/entry/preview.js';
import { FIELDS } from '../src/contribute/bundle.js';

test('an empty entry previews as an invitation, not an error', () => {
  assert.match(previewHtml(''), /Nothing written yet/);
  assert.match(previewHtml('   \n  '), /Nothing written yet/);
  assert.doesNotMatch(previewHtml(''), /preview-notes/);
});

test('the preview renders the subset and lists the sections', () => {
  const html = previewHtml('## One\n\ntext\n\n## Two\n\n- a list item');
  assert.match(html, /Sections: One · Two/);
  assert.match(html, /<h2 id="entry-one">One<\/h2>/);
  assert.match(html, /<ul><li>a list item<\/li><\/ul>/);
  // One heading is not a table of contents and is not offered as one.
  assert.doesNotMatch(previewHtml('## Only one\n\ntext'), /Sections:/);
});

test('record links are text in a preview, and the note says whether they resolve', () => {
  const known = (kind, id) => kind === 'event' && id === 'a-real-event';
  const html = previewHtml('See [this](event:a-real-event) and [that](event:no-such-event).', { known });
  // No link navigates away from a form with unsaved work in it.
  assert.doesNotMatch(html, /<a /);
  assert.match(html, /See this and that\./);
  // The quotation marks are escaped, as everything in a note is.
  assert.match(html, /&quot;no-such-event&quot; is linked as an event and there is no such record/);
  assert.doesNotMatch(html, /a-real-event&quot; is linked/);
});

test('a citation mark is checked against the citation rows as they stand', () => {
  const cited = new Set(['book-a']);
  const html = previewHtml('One[^book-a] and two[^book-b].', { cited });
  assert.match(html, /&quot;book-b&quot; is cited in the entry but is not among this record&#39;s sources/);
  assert.doesNotMatch(html, /&quot;book-a&quot; is cited/);
  assert.match(html, /class="cite-mark unresolved"/);
  // With no citation list given nothing is checked: that is the caller
  // saying it does not know yet, not that everything resolves.
  assert.deepEqual(previewNotes('One[^book-b].').notes, []);
});

test('every refusal is explained in words rather than left silent', () => {
  const cases = [
    ['<script>alert(1)</script>', /HTML is not markup here/],
    ['![a](https://example.org/p.png)', /images are not part of the subset/],
    ['[x](javascript:alert)', /an http\(s\) address/],
    ['[x](event:../../secret)', /lowercase words joined by hyphens/],
    ['# A title', /headings are ## and ###/],
  ];
  for (const [text, expected] of cases) {
    const html = previewHtml(text);
    assert.match(html, /<ul class="preview-notes">/, text);
    assert.match(html, expected, text);
    assert.doesNotMatch(html, /<script|<img/, text);
  }
  // Each complaint is made once however often the mistake is repeated.
  const repeated = previewNotes('<b>a</b>\n\n<b>b</b>\n\n<b>c</b>');
  assert.equal(repeated.notes.length, 1);
});

test('nothing in a note reaches the markup unescaped', () => {
  const html = previewHtml('x[^a] y', { cited: new Set() });
  assert.match(html, /&quot;a&quot; is cited in the entry/);
  const attack = previewHtml('[x](event:a)', { known: () => false });
  assert.doesNotMatch(attack, /<script/);
});

test('the field the preview hangs on is the one marked as a body', () => {
  for (const kind of ['event', 'actor', 'place']) {
    const field = FIELDS[kind].find((f) => f.key === 'body');
    assert.equal(field.body, true, kind);
    assert.equal(field.input, 'textarea', kind);
  }
});
