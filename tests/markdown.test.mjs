// The entry renderer: every construct of the subset, and every construct it
// must refuse. A body is untrusted input, so the refusals are the half of
// this file that matters most — each of them asserts that what came out is
// text and not markup.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseBody, renderBody, bodyCitations, bodyLinks, citationOrder, headingId, tocHtml, RECORD_LINK_KINDS,
} from '../src/markdown.js';

const html = (text, options) => renderBody(text, options).html;

test('paragraphs are separated by blank lines and wrapped lines join', () => {
  assert.equal(html('One line.\nstill one.\n\nTwo.'), '<p>One line. still one.</p><p>Two.</p>');
  assert.equal(html(''), '');
  assert.equal(html(null), '');
});

test('two levels of heading, each with an id, and nothing else', () => {
  const out = renderBody('## The voyage\n\ntext\n\n### The return');
  assert.equal(out.html, '<h2 id="entry-the-voyage">The voyage</h2><p>text</p><h3 id="entry-the-return">The return</h3>');
  assert.deepEqual(out.headings, [
    { level: 2, text: 'The voyage', id: 'entry-the-voyage' },
    { level: 3, text: 'The return', id: 'entry-the-return' },
  ]);
  // A single "#" is the page's own title and "####" is a depth an entry has
  // no use for: both stay as the characters that were typed.
  assert.equal(html('# Title'), '<p># Title</p>');
  assert.equal(html('#### Deep'), '<p>#### Deep</p>');
  assert.equal(parseBody('# Title').notes[0].reason, 'heading-level');
});

test('emphasis, nested and one level at a time', () => {
  assert.equal(html('*a* and **b** and _c_'), '<p><em>a</em> and <strong>b</strong> and <em>c</em></p>');
  assert.equal(html('**bold with *inner* **'), '<p><strong>bold with <em>inner</em> </strong></p>');
  assert.equal(html('2 * 3 * 4 is not emphasis across\nlines'), '<p>2 <em> 3 </em> 4 is not emphasis across lines</p>');
});

test('bullet and numbered lists, with wrapped items', () => {
  assert.equal(html('- one\n- two'), '<ul><li>one</li><li>two</li></ul>');
  assert.equal(html('1. one\n2. two'), '<ol><li>one</li><li>two</li></ol>');
  assert.equal(html('- one\n  continued\n- two'), '<ul><li>one continued</li><li>two</li></ul>');
  // A year opening a sentence is a sentence, not the 1415th item.
  assert.equal(html('1415. The fleet sailed.'), '<p>1415. The fleet sailed.</p>');
});

test('block quotes hold blocks of their own', () => {
  assert.equal(html('> quoted\n> still quoted'), '<blockquote><p>quoted still quoted</p></blockquote>');
  assert.equal(html('> ## inside\n> text'), '<blockquote><h2 id="entry-inside">inside</h2><p>text</p></blockquote>');
});

test('record links resolve by kind and id', () => {
  assert.equal(
    html('[the revolution](event:carnation-revolution-1974)'),
    '<p><a class="record-link event" href="entry.html?id=carnation-revolution-1974">the revolution</a></p>',
  );
  assert.equal(
    html('[the book](source:russell-2000-henry)'),
    '<p><a class="record-link source" href="index.html?source=russell-2000-henry">the book</a></p>',
  );
  for (const kind of RECORD_LINK_KINDS) {
    assert.match(html(`[x](${kind}:some-id)`), /<a class="record-link /, kind);
  }
  assert.deepEqual(bodyLinks('[a](actor:salazar) and [b](place:lisbon)'), [
    { kind: 'actor', id: 'salazar' },
    { kind: 'place', id: 'lisbon' },
  ]);
});

test('http(s) links go out, and nothing else is a link at all', () => {
  assert.equal(
    html('[archive](https://example.org/a)'),
    '<p><a href="https://example.org/a" rel="noopener" target="_blank">archive</a></p>',
  );
  // The refusals: a scheme that is not http(s) is text, and the label with it.
  for (const target of ['javascript:alert(1)', 'data:text/html,<script>', 'mailto:a@b.c', '/etc/passwd', 'ftp://x.y']) {
    const out = html(`[click](${target})`);
    assert.doesNotMatch(out, /<a /, target);
    assert.doesNotMatch(out, /<script/, target);
    assert.match(out, /click/, target);
  }
  // A record kind with an id that is not a slug is refused rather than
  // turned into a path.
  assert.doesNotMatch(html('[x](event:../../secret)'), /<a /);
  assert.equal(parseBody('[x](event:../../secret)').notes[0].reason, 'record-id');
});

test('images are refused whole and never become a link', () => {
  const out = html('![a picture](https://example.org/p.png)');
  assert.doesNotMatch(out, /<img/);
  assert.doesNotMatch(out, /<a /);
  assert.equal(out, '<p>![a picture](https://example.org/p.png)</p>');
  assert.equal(parseBody('![a](b)').notes[0].reason, 'image');
});

test('raw HTML is escaped, reported, and never executed', () => {
  const attempts = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<b>bold</b>',
    '<a href="javascript:alert(1)">x</a>',
    '<div onclick="x">y</div>',
  ];
  for (const attempt of attempts) {
    const out = html(attempt);
    assert.doesNotMatch(out, /<(script|img|b|div)\b/, attempt);
    assert.match(out, /&lt;/, attempt);
    assert.equal(parseBody(attempt).notes.some((n) => n.reason === 'html'), true, attempt);
  }
  // Inside every other construct too: a heading, a list item, a quote, a
  // link label and an emphasis are all escaped by the same pass.
  assert.doesNotMatch(html('## <script>x</script>'), /<script/);
  assert.doesNotMatch(html('- <script>x</script>'), /<script/);
  assert.doesNotMatch(html('> <script>x</script>'), /<script/);
  assert.doesNotMatch(html('[<script>x</script>](event:a)'), /<script/);
  assert.doesNotMatch(html('*<script>x</script>*'), /<script/);
});

test('a quotation mark in a label cannot close an attribute', () => {
  const out = html('[a" onmouseover="alert(1)](event:some-event)');
  // The attempt survives as text — escaped, inside the element — and the
  // tag's own attributes are exactly the two the renderer wrote.
  assert.equal(out, '<p><a class="record-link event" href="entry.html?id=some-event">a&quot; onmouseover=&quot;alert(1)</a></p>');
  // The same in a heading, whose id is an attribute built from the text.
  assert.equal(html('## a" onmouseover="x'), '<h2 id="entry-a-onmouseover-x">a&quot; onmouseover=&quot;x</h2>');
  // And in a citation mark's title, and in an outward link's href.
  assert.doesNotMatch(html('x[^a" onmouseover="b]'), /onmouseover="/);
  assert.doesNotMatch(html('[x](https://example.org/a"onmouseover="b)'), /onmouseover="b/);
});

test('citation marks number by first mention and link to the list', () => {
  const out = renderBody('One[^book-a] two[^book-b p. 12] three[^book-a].', { cited: new Set(['book-a', 'book-b']) });
  assert.deepEqual(out.order, ['book-a', 'book-b']);
  assert.match(out.html, /<a class="cite-mark" href="#entry-cite-book-a" title="book-a"><sup>\[1\]<\/sup><\/a>/);
  assert.match(out.html, /<sup>\[2, p\. 12\]<\/sup>/);
  assert.deepEqual(bodyCitations('a[^x] b[^y p. 3]'), [
    { source: 'x', locator: null },
    { source: 'y', locator: 'p. 3' },
  ]);
  assert.deepEqual(citationOrder([{ source: 'a' }, { source: 'b' }, { source: 'a' }]), ['a', 'b']);
});

test('a citation mark to a source the record does not cite is shown and marked', () => {
  const out = html('text[^not-cited]', { cited: new Set(['other']) });
  assert.match(out, /class="cite-mark unresolved"/);
  assert.match(out, /\[\^not-cited\]/);
  assert.doesNotMatch(out, /<sup>/);
  // With no citation list to check against — a preview — nothing is marked.
  assert.doesNotMatch(html('text[^anything]'), /unresolved/);
});

test('href is injectable, so a preview can point somewhere else', () => {
  const out = html('[x](event:a)', { href: () => null });
  assert.equal(out, '<p>x</p>');
  assert.equal(html('[x](event:a)', { href: (kind, id) => `/${kind}/${id}` }), '<p><a class="record-link event" href="/event/a">x</a></p>');
});

test('headingId is a slug, prefixed, and never empty', () => {
  assert.equal(headingId('The Voyage of 1498'), 'entry-the-voyage-of-1498');
  assert.equal(headingId('Ceuta — Rendição'), 'entry-ceuta-rendicao');
  assert.equal(headingId('###'), 'entry-section');
});

test('the table of contents needs two headings to be a way around a page', () => {
  assert.equal(tocHtml([{ level: 2, text: 'One', id: 'entry-one' }]), '');
  const toc = tocHtml([
    { level: 2, text: 'One', id: 'entry-one' },
    { level: 3, text: 'Two', id: 'entry-two' },
  ]);
  assert.match(toc, /<nav class="entry-toc"/);
  assert.match(toc, /<li class="level-3"><a href="#entry-two">Two<\/a><\/li>/);
});

test('a whole entry parses into the pieces a page needs', () => {
  const body = [
    '## Before the voyage',
    '',
    'The fleet was assembled at [Lisbon](place:lisbon)[^book-a p. 4], under',
    '**the king**.',
    '',
    '- one reason',
    '- another[^book-b]',
    '',
    '> Somebody said something.',
    '',
    '### After',
    '',
    'See [the revolution](event:carnation-revolution-1974) and <b>nothing else</b>.',
  ].join('\n');
  const out = renderBody(body, { cited: new Set(['book-a', 'book-b']) });
  assert.equal(out.headings.length, 2);
  assert.equal(out.links.length, 2);
  assert.deepEqual(out.order, ['book-a', 'book-b']);
  assert.match(out.html, /<h2 id="entry-before-the-voyage">/);
  assert.match(out.html, /<ul><li>one reason<\/li>/);
  assert.match(out.html, /<blockquote><p>Somebody said something\.<\/p><\/blockquote>/);
  assert.doesNotMatch(out.html, /<b>/);
  assert.equal(out.notes.some((n) => n.reason === 'html'), true);
});
