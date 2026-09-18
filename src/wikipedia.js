// The link out to Wikipedia, and which article to offer. Pure — a record's
// identity in, a { lang, title, href } or null out — so the event, actor and
// place cards say the same thing about the same record and node --test can
// hold it to it. Nothing here escapes anything: the caller puts it in the DOM
// and the caller calls esc().
//
// What this is *not* is the atlas's own text. The summary a card shows is
// written by a person and lives in the record; the link is an offer to go and
// read somebody else's account, and it is labelled as such wherever it
// appears (about.html says so at more length).

import { WIKIPEDIA_LANG } from './validate/rules.js';

// The edition English is written in, and the fallback when the reader's own
// languages have no article: it is the largest edition, not a judgement about
// whose history this is.
export const DEFAULT_LANGUAGE = 'en';

// A title becomes a path segment: spaces are underscores in a Wikipedia URL,
// and everything else is percent-encoded, which the site accepts and which
// keeps a title with a slash or a colon in it from becoming a different path.
export function articleUrl(lang, title) {
  if (!WIKIPEDIA_LANG.test(String(lang ?? ''))) return null;
  const name = String(title ?? '').trim();
  if (name === '') return null;
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`;
}

// "pt-BR" and "pt_BR" are the same request as "pt-br", and a reader asking
// for "pt-BR" is also asking for "pt": the tag itself first, then the
// language it is a variety of.
export function preferredLanguages(languages = []) {
  const out = [];
  for (const raw of languages ?? []) {
    const tag = String(raw ?? '').trim().toLowerCase().replace(/_/g, '-');
    if (tag === '') continue;
    if (!out.includes(tag)) out.push(tag);
    const primary = tag.split('-')[0];
    if (primary && !out.includes(primary)) out.push(primary);
  }
  return out;
}

// The article to offer: the reader's language when there is one, then
// English, then whatever the record has, in the order the record lists it.
// The language is always shown beside the link, because handing somebody an
// article they cannot read without saying which language it is in is worse
// than offering nothing.
export function articleFor(record, languages = []) {
  const titles = record?.wikipedia;
  if (titles === null || typeof titles !== 'object' || Array.isArray(titles)) return null;
  const keys = Object.keys(titles);
  const wanted = [...preferredLanguages(languages), DEFAULT_LANGUAGE, ...keys];
  for (const lang of wanted) {
    if (!Object.hasOwn(titles, lang)) continue;
    const href = articleUrl(lang, titles[lang]);
    if (href) return { lang, title: String(titles[lang]), href };
  }
  return null;
}

// Every article title a record has, for the search: a reader who knows a
// thing by the name Wikipedia gives it finds the record, and the record's own
// names stay what the atlas calls it.
export function articleTitles(record) {
  const titles = record?.wikipedia;
  if (titles === null || typeof titles !== 'object' || Array.isArray(titles)) return [];
  return Object.values(titles).filter((t) => typeof t === 'string' && t.trim() !== '');
}
