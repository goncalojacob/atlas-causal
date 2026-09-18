// Everything under data/ is untrusted input: it becomes community
// contributions later. Nothing from a record reaches innerHTML without
// esc(), and a url is only ever rendered as a link when safeUrl() lets it.

const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
}

// http(s) only. "javascript:" and friends come back null and are shown as
// text, never as an href.
export function safeUrl(value) {
  if (typeof value !== 'string') return null;
  return /^https?:\/\/\S+$/i.test(value) ? value : null;
}
