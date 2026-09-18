// sRGB ⇄ OKLab, and the two numbers a palette has to be argued with:
// perceptual distance between two colours, and WCAG contrast. Tool-side and
// test-side only — nothing in src/ imports it, because nothing in the browser
// computes a colour: style.css names them all.
//
// OKLab because sRGB distance lies. Two blues a hex triple says are far apart
// can be indistinguishable on screen, and the whole point of eight territory
// hues is that no two of them are.

const toLinear = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
const fromLinear = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
const clamp = (x) => Math.min(1, Math.max(0, x));

// '#rrggbb' → [r, g, b] in 0…1. Throws on anything else: a token that is not
// a six-digit hex is a bug in style.css, not a colour to guess at.
export function fromHex(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`not a hex colour: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
}

export function toHex(rgb) {
  return `#${rgb.map((v) => Math.round(clamp(v) * 255).toString(16).padStart(2, '0')).join('')}`;
}

export function oklab([r, g, b]) {
  const R = toLinear(r); const G = toLinear(g); const B = toLinear(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

// Euclidean distance in OKLab. About 0.02 is where two large flat fields stop
// being tellable apart; text and thin lines need more.
export function distance(a, b) {
  const x = oklab(a); const y = oklab(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

// What a fill actually looks like: SVG composites it over what is under it,
// so a wash at 0.62 over the land token is the colour the eye is asked to
// tell from its neighbour, not the token itself.
export function over(colour, alpha, background) {
  return colour.map((v, i) => v * alpha + background[i] * (1 - alpha));
}

const luminance = ([r, g, b]) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

// WCAG 2.1 contrast ratio: 4.5 for body text, 3 for large text and for the
// non-text things a control is recognised by.
export function contrast(a, b) {
  const x = luminance(a); const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Every `--name: #rrggbb` in a stylesheet, whichever :root block it is in.
export function tokensOf(css) {
  return new Map([...css.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-f]{3,8})\b/gi)].map((m) => [m[1], m[2]]));
}
