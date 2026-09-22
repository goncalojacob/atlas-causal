// What the published site says about its own state of repair, and what it
// does not.
//
// The owner's standing orders for the week: the atlas is *"a demo to show the
// platform"* to win funding, and review and contribution are deferred until
// there is funding. The Fable review of 22 September (finding A2) read the
// live site as a first-time reader and found the consequence of that: the
// masthead says "0 of 245 read", every card says "Unread: no person has
// checked this record", every citation is tagged "unchecked", and every card
// offers "Discuss this record" and "Edit this record" — two doors into a
// contribution process that is closed. A funder's first minute is spent being
// told the atlas is unverified and being offered two ways in that lead
// nowhere they should go yet.
//
// **None of it is untrue and none of it is deleted.** The records say exactly
// what they said, `review.status` is what it was, `node tools/validate.mjs`
// prints the same queue, and `review.html` — the maintainer's page, which is
// where the exception of CLAUDE.md is retired one record at a time — is
// untouched. What changes is that the apparatus of reviewing is not the first
// thing a visitor reads on a page that is not asking them to review anything.
//
// So: one flag, off by default, on with `?review=1`. Off is the published
// site; on is a maintainer looking at the atlas with the standing of every
// record on the surface, which is what M70 built and what nothing here
// removes. It is a fact about the page and not about what the atlas is
// showing, so it is not state: two readers opening the same link see the same
// records, as they do across a phone and a desktop (phone.js says the same
// thing about the sheet).
//
// `?review` is carried through a state write by `state.js`'s PASSTHROUGH, the
// way `?fixtures` is, so following a link inside the atlas does not silently
// drop it.

export const REVIEW_PARAM = 'review';

// Pure: what a query string says about the flag. Anything but an explicit
// falsy value turns it on, because `?review` with no value is what somebody
// types.
export function showsReview(search) {
  const params = new URLSearchParams(typeof search === 'string' ? search : '');
  if (!params.has(REVIEW_PARAM)) return false;
  const value = params.get(REVIEW_PARAM);
  return value !== '0' && value !== 'false';
}

// The page's own answer, read from its URL the first time anything asks. Every
// page of the site gets it for free — there is no bootstrap to remember to
// call — and a test sets it directly.
let on = null;

export function showingReview() {
  if (on === null) on = showsReview(globalThis.location?.search ?? '');
  return on;
}

// For the tests, and for nothing else: a page never changes its own flag.
export function setReview(value) {
  on = value === null ? null : Boolean(value);
}

// How the atlas signs an account it publishes.
//
// The two narratives in `data/` are signed "Claude (assistant draft,
// unreviewed)", which is the truth about the file and the wrong thing to put
// under a title on the front page of a demo: a reader takes it for the
// author's byline rather than for a note about the review queue. The names
// stay in the records — nothing under `data/` changes, and `review.html` shows
// them as it always did — and the *site* signs them as its own until a person
// has read one and put their name on it.
export const ATLAS_BYLINE = 'Atlas causal';

// The names a narrative or any other signed record is published under: its own
// authors where the review vocabulary is on, and the atlas's own byline where
// it is not. One function, so the intro card, the narrative card and
// `narratives.html` cannot come to sign the same account three ways.
export function bylineOf(record) {
  const names = (record?.authors ?? []).map((a) => a?.name).filter(Boolean);
  if (!showingReview()) return ATLAS_BYLINE;
  return names.length ? names.join(', ') : 'unsigned';
}
