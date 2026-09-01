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

export function html(tag, attrs = {}, text = null) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) el.setAttribute(k, String(v));
  }
  if (text !== null) el.textContent = text;
  return el;
}
