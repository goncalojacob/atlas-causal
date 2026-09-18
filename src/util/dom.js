// The few lines of DOM plumbing the views share. Attribute values are set
// with setAttribute, never by string concatenation into markup, so record
// text is safe here; markup built as strings goes through esc() instead.

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svg(tag, attrs = {}, children = []) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) el.setAttribute(k, String(v));
  }
  for (const child of children) el.appendChild(child);
  return el;
}

export function svgTitle(text) {
  const el = document.createElementNS(SVG_NS, 'title');
  el.textContent = text;
  return el;
}

// --- children kept from one render to the next ----------------------------
//
// A view that calls `replaceChildren` throws away every node it drew and
// builds them all again, and the browser lays out and paints the lot: at
// twenty thousand events the timeline was doing that four times per state
// change (health review B, finding 23). Nothing about the picture requires
// it — a bar that was a bar before is the same element with different
// numbers on it.
//
// So a group hands its children out in order instead. `take` gives the next
// one back if it is already the right kind of element and makes one only when
// it is not; `done` drops whatever the render did not ask for. The caller
// gives the whole attribute set every time, and an attribute it set last time
// and did not set now is removed — a stale `class` is how a bar stays
// selected after the selection has moved on.
//
// One group per kind of element, or `take` spends its time replacing a rect
// with a text and back again. The z-order is then the order the groups are
// in, which the caller decides once.
const applied = new WeakMap();

function apply(el, attrs) {
  const before = applied.get(el);
  const now = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    now.push(k);
    const value = String(v);
    // Read before write: setting an attribute to what it already says still
    // costs the browser an invalidation.
    if (el.getAttribute(k) !== value) el.setAttribute(k, value);
  }
  if (before) for (const k of before) if (!now.includes(k)) el.removeAttribute(k);
  applied.set(el, now);
}

export function reuse(group) {
  let at = 0;
  return {
    // `title` is the SVG tooltip, as the first child; `text` is the element's
    // own text, for a <text>. Never both: writing textContent would throw the
    // title away, which is what the code this replaced did.
    take(tag, attrs, { title = null, text = null } = {}) {
      let el = group.childNodes[at];
      if (!el || el.tagName !== tag) {
        const made = document.createElementNS(SVG_NS, tag);
        if (el) group.replaceChild(made, el);
        else group.appendChild(made);
        el = made;
      }
      apply(el, attrs);
      if (text !== null) {
        if (el.textContent !== text) el.textContent = text;
      } else {
        const first = el.firstChild;
        const had = first && first.tagName === 'title' ? first : null;
        if (title === null) {
          // A tooltip from the last render, on an element that is not
          // offering one now: it would say something about a record this is
          // no longer standing for.
          if (had) el.removeChild(had);
        } else if (had) {
          if (had.textContent !== title) had.textContent = title;
        } else {
          el.insertBefore(svgTitle(title), first ?? null);
        }
      }
      at += 1;
      return el;
    },
    done() {
      while (group.childNodes.length > at) group.removeChild(group.lastChild);
    },
  };
}

export function html(tag, attrs = {}, text = null) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) el.setAttribute(k, String(v));
  }
  if (text !== null) el.textContent = text;
  return el;
}
