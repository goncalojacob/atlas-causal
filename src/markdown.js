// The long form of an entry, written in a closed Markdown subset and turned
// into escaped markup. Pure: no DOM, no fetch, so the validator runs it in
// Node and the form previews with it in the browser.
//
// The subset is what an entry needs and nothing more — paragraphs, two levels
// of heading, emphasis, lists, block quotes, links into the atlas or out to
// the web, and citation marks. Everything outside it is shown as the
// characters somebody typed, which is the whole point: a record is untrusted
// input (CLAUDE.md), and a renderer that lets one construct through unescaped
// is one contribution away from being the hole. There is no raw HTML and
// there are no images.
//
// Nothing here reaches innerHTML on its own; it returns a string that the
// caller assigns, and every piece of that string came out of esc() or is
// markup this file wrote.

import { esc, safeUrl } from './util/esc.js';

// The kinds a body may link to by id. An edge and a narrative are arguments
// about records rather than records a reader opens a page of, and a body that
// wants to talk about one names the events at its ends.
export const RECORD_LINK_KINDS = Object.freeze(['event', 'actor', 'place', 'source']);

// The same slug every id in this repository has: a link target that is not
// one is refused rather than turned into a path.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// One pass, alternatives in precedence order: an image before a link, so
// `![a](b)` is refused whole rather than read as "!" and a link; a citation
// mark before a link, because both open with "[".
const INLINE = String.raw`!\[[^\]\n]*\]\([^()\s]*\)`
  + String.raw`|\[\^([a-z0-9][a-z0-9-]*)(?:[ \t]+([^\]\n]+))?\]`
  + String.raw`|\[([^\]\n]*)\]\(([^()\s]+)\)`
  // Strong takes a lone "*" in its stride, so emphasis can nest inside it;
  // the "**" that closes it is never part of the content.
  + String.raw`|\*\*((?:[^*\n]|\*(?!\*))+)\*\*`
  + String.raw`|\*([^*\n]+)\*`
  + String.raw`|_([^_\n]+)_`;

// A tag-shaped run anywhere in the text. It is never markup here — it is
// escaped like everything else — and this is only how a body says so, so that
// the form can tell a contributor their HTML did nothing rather than leaving
// them to wonder.
const TAGLIKE = /<\/?[a-zA-Z][^>\n]*>/;

const HEADING = /^(#{1,6})[ \t]+(.*)$/;
const BULLET = /^[ \t]*[-*][ \t]+(.*)$/;
// Three digits at most, which is not Markdown's own limit and is deliberate:
// "1415. The fleet sailed in August" is a sentence a history entry writes,
// and reading it as the 1415th item of a list would be the parser inventing
// a structure the writer did not ask for.
const NUMBERED = /^[ \t]*\d{1,3}[.)][ \t]+(.*)$/;
const QUOTE = /^[ \t]*>[ \t]?(.*)$/;

function refused(reason, text) {
  return { type: 'refused', reason, text };
}

function linkToken(label, target) {
  const colon = target.indexOf(':');
  const scheme = colon === -1 ? '' : target.slice(0, colon);
  if (RECORD_LINK_KINDS.includes(scheme)) {
    const id = target.slice(colon + 1);
    if (SLUG.test(id)) return { type: 'record', kind: scheme, id, children: inline(label) };
    return refused('record-id', `[${label}](${target})`);
  }
  // Anything that is not http(s) — "javascript:", a bare path, a mailto —
  // is text. safeUrl() is the same gate every other link in the site passes.
  if (safeUrl(target)) return { type: 'url', href: target, children: inline(label) };
  return refused('link-target', `[${label}](${target})`);
}

// The inline tokens of one run of text. Recursive for emphasis only, and the
// inner text is strictly shorter each time.
export function inline(text) {
  const re = new RegExp(INLINE, 'g');
  const out = [];
  let last = 0;
  let m = re.exec(text);
  while (m !== null) {
    if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) });
    last = m.index + m[0].length;
    if (m[0].startsWith('![')) out.push(refused('image', m[0]));
    else if (m[1] !== undefined) out.push({ type: 'cite', source: m[1], locator: (m[2] ?? '').trim() || null });
    else if (m[4] !== undefined) out.push(linkToken(m[3], m[4]));
    else if (m[5] !== undefined) out.push({ type: 'strong', children: inline(m[5]) });
    else out.push({ type: 'em', children: inline(m[6] ?? m[7]) });
    m = re.exec(text);
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
  return out;
}

function plainText(children) {
  return children.map((t) => {
    if (t.type === 'text' || t.type === 'refused') return t.text;
    if (t.type === 'cite') return '';
    return plainText(t.children ?? []);
  }).join('');
}

// "The voyage of 1498" → "the-voyage-of-1498". Prefixed, because a heading
// slug shares a document with ids this file did not write.
export function headingId(text) {
  const slug = String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return `entry-${slug === '' ? 'section' : slug}`;
}

function isBlockStart(line) {
  return line.trim() === '' || HEADING.test(line) || BULLET.test(line) || NUMBERED.test(line) || QUOTE.test(line);
}

// text → blocks, and the three things a caller wants out of a body without
// rendering it: its headings (the table of contents), its citation marks (the
// validator's business, and the list at the foot of the page) and the
// constructs it refused.
export function parseBody(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  const notes = [];
  const note = (reason, at) => { notes.push({ reason, text: at }); };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i += 1; continue; }

    const heading = HEADING.exec(line);
    if (heading) {
      const level = heading[1].length;
      // One "#" is the page's own title and four or more is a depth an entry
      // has no use for: both stay as the characters that were typed.
      if (level < 2 || level > 3) {
        note('heading-level', line.trim());
        blocks.push({ type: 'paragraph', children: inline(line) });
      } else {
        blocks.push({ type: 'heading', level, children: inline(heading[2].trim()) });
      }
      i += 1;
      continue;
    }

    if (QUOTE.test(line)) {
      const inner = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        inner.push(QUOTE.exec(lines[i])[1]);
        i += 1;
      }
      const parsed = parseBody(inner.join('\n'));
      notes.push(...parsed.notes);
      blocks.push({ type: 'quote', blocks: parsed.blocks });
      continue;
    }

    if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = !BULLET.test(line);
      const items = [];
      while (i < lines.length) {
        const match = ordered ? NUMBERED.exec(lines[i]) : BULLET.exec(lines[i]);
        if (!match) break;
        // A plain line under an item continues it, which is how a long point
        // is wrapped in a text editor.
        const parts = [match[1]];
        i += 1;
        while (i < lines.length && !isBlockStart(lines[i])) {
          parts.push(lines[i].trim());
          i += 1;
        }
        items.push({ children: inline(parts.join(' ').trim()) });
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const parts = [];
    while (i < lines.length && !isBlockStart(lines[i])) {
      parts.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'paragraph', children: inline(parts.join(' ')) });
  }

  const headings = [];
  const citations = [];
  const links = [];
  const walkInline = (children) => {
    for (const token of children ?? []) {
      if (token.type === 'cite') citations.push({ source: token.source, locator: token.locator });
      else if (token.type === 'record') links.push({ kind: token.kind, id: token.id });
      else if (token.type === 'refused') note(token.reason, token.text);
      if (token.children) walkInline(token.children);
    }
  };
  const walk = (list) => {
    for (const block of list) {
      if (block.type === 'heading') {
        const label = plainText(block.children).trim();
        block.id = headingId(label);
        headings.push({ level: block.level, text: label, id: block.id });
      }
      if (block.children) walkInline(block.children);
      if (block.items) for (const item of block.items) walkInline(item.children);
      if (block.blocks) walk(block.blocks);
    }
  };
  walk(blocks);
  if (TAGLIKE.test(String(text ?? ''))) note('html', TAGLIKE.exec(String(text))[0]);

  return { blocks, headings, citations, links, notes };
}

// The citation marks a body makes, in the order it makes them. What rule 23
// checks and what the entry page lists.
export function bodyCitations(text) {
  return parseBody(text).citations;
}

// The records a body links to by id. Rule 23 checks that each resolves.
export function bodyLinks(text) {
  return parseBody(text).links;
}

// Distinct cited sources in order of first mention, numbered from one: the
// mark shows the number and the list at the foot of the page is in this
// order, so [3] is the third work named and not the third mark made.
export function citationOrder(citations) {
  const order = [];
  for (const { source } of citations ?? []) if (!order.includes(source)) order.push(source);
  return order;
}

// Where a record link goes by default: an entry page for the three kinds that
// have one, and the atlas's own source card for a book, which has no entry.
export function defaultHref(kind, id) {
  const q = encodeURIComponent(id);
  return kind === 'source' ? `index.html?source=${q}` : `entry.html?id=${q}`;
}

function renderInline(children, ctx) {
  return (children ?? []).map((token) => {
    switch (token.type) {
      case 'text':
      case 'refused':
        return esc(token.text);
      case 'strong':
        return `<strong>${renderInline(token.children, ctx)}</strong>`;
      case 'em':
        return `<em>${renderInline(token.children, ctx)}</em>`;
      case 'record': {
        const href = ctx.href(token.kind, token.id);
        const label = renderInline(token.children, ctx) || esc(token.id);
        if (!href) return label;
        return `<a class="record-link ${esc(token.kind)}" href="${esc(href)}">${label}</a>`;
      }
      case 'url': {
        // safeUrl() has already passed it; running it again is what keeps
        // this branch honest if the token ever arrives from elsewhere.
        const href = safeUrl(token.href);
        const label = renderInline(token.children, ctx) || esc(token.href);
        return href ? `<a href="${esc(href)}" rel="noopener" target="_blank">${label}</a>` : label;
      }
      case 'cite': {
        const at = ctx.order.indexOf(token.source);
        const title = token.locator ? `${token.source} · ${token.locator}` : token.source;
        // A mark naming a source the record does not cite is shown as the
        // characters that were typed and marked: rule 23 is the error, and
        // silently dropping it would hide the mistake from whoever wrote it.
        if (!ctx.cites(token.source)) {
          return `<span class="cite-mark unresolved" title="${esc(title)} — not cited by this record">[^${esc(token.source)}${token.locator ? ` ${esc(token.locator)}` : ''}]</span>`;
        }
        return `<a class="cite-mark" href="#entry-cite-${esc(token.source)}" title="${esc(title)}"><sup>[${at + 1}${token.locator ? `, ${esc(token.locator)}` : ''}]</sup></a>`;
      }
      default:
        return '';
    }
  }).join('');
}

function renderBlocks(blocks, ctx) {
  return blocks.map((block) => {
    switch (block.type) {
      case 'heading':
        return `<h${block.level} id="${esc(block.id)}">${renderInline(block.children, ctx)}</h${block.level}>`;
      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul';
        const items = block.items.map((item) => `<li>${renderInline(item.children, ctx)}</li>`).join('');
        return `<${tag}>${items}</${tag}>`;
      }
      case 'quote':
        return `<blockquote>${renderBlocks(block.blocks, ctx)}</blockquote>`;
      default:
        return `<p>${renderInline(block.children, ctx)}</p>`;
    }
  }).join('');
}

// The body as markup, with everything a page needs around it.
//
// `cited` is the set of source ids the record itself cites: a mark outside it
// is left visible and marked rather than dropped. Passing nothing means "do
// not check", which is what a preview does before a citation list exists.
export function renderBody(text, { href = defaultHref, cited = null } = {}) {
  const parsed = parseBody(text);
  const order = citationOrder(parsed.citations);
  const ctx = {
    href,
    order,
    cites: (id) => (cited === null ? true : cited.has(id)),
  };
  return {
    html: renderBlocks(parsed.blocks, ctx),
    headings: parsed.headings,
    citations: parsed.citations,
    order,
    links: parsed.links,
    notes: parsed.notes,
  };
}

// The table of contents. Nothing for a body with one heading or none: a list
// of one is not a way around a page.
export function tocHtml(headings, { heading = 'On this page' } = {}) {
  if ((headings ?? []).length < 2) return '';
  const items = headings.map((h) => `<li class="level-${h.level}"><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`);
  return `<nav class="entry-toc" aria-label="${esc(heading)}"><h2>${esc(heading)}</h2><ul>${items.join('')}</ul></nav>`;
}
