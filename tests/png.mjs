// A PNG, read back as pixels. Chromium's own screenshot is the only picture
// in these tests that is asserted about rather than looked at, and what it is
// asserted about — the paper band a label is drawn over, and what is on either
// side of a letter — cannot be read off the DOM: the stroke of an SVG text is
// not in its bounding box, and a computed `stroke-width` says what was asked
// for and not what was painted (M66).
//
// Zero dependencies, as everything else here: a screenshot is 8-bit RGBA, not
// interlaced, and `zlib` is Node's own. Anything else is refused by name
// rather than decoded wrongly.

import { inflateSync } from 'node:zlib';
import assert from 'node:assert/strict';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Paeth, as the specification writes it.
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

// The bytes of a PNG as { width, height, at(x, y) -> [r, g, b] }. Alpha is
// dropped: a screenshot is opaque, and what these tests ask is which colour a
// pixel is.
export function decodePng(bytes) {
  assert.ok(bytes.subarray(0, 8).equals(SIGNATURE), 'the screenshot is a PNG');
  let width = 0;
  let height = 0;
  let depth = 0;
  let colour = 0;
  const parts = [];
  for (let at = 8; at + 8 <= bytes.length;) {
    const length = bytes.readUInt32BE(at);
    const kind = bytes.toString('ascii', at + 4, at + 8);
    const body = bytes.subarray(at + 8, at + 8 + length);
    if (kind === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      colour = body[9];
      assert.equal(depth, 8, 'eight bits a channel');
      assert.ok(colour === 6 || colour === 2, `RGB or RGBA, not colour type ${colour}`);
      assert.equal(body[12], 0, 'not interlaced');
    } else if (kind === 'IDAT') {
      parts.push(body);
    } else if (kind === 'IEND') {
      break;
    }
    at += 12 + length;
  }
  const channels = colour === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i += 1) {
      const left = i >= channels ? pixels[y * stride + i - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + i] : 0;
      const upLeft = y > 0 && i >= channels ? pixels[(y - 1) * stride + i - channels] : 0;
      let value = line[i];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += Math.floor((left + up) / 2);
      else if (filter === 4) value += paeth(left, up, upLeft);
      else if (filter !== 0) assert.fail(`unknown PNG filter ${filter} on row ${y}`);
      pixels[y * stride + i] = value & 0xff;
    }
  }
  return {
    width,
    height,
    at(x, y) {
      const i = y * stride + x * channels;
      return [pixels[i], pixels[i + 1], pixels[i + 2]];
    },
  };
}

// One clip of the page, at whatever resolution the caller asks for: `scale`
// device pixels to the CSS pixel, so a band a pixel and a half wide is still
// several pixels to count.
export async function shoot(page, { x, y, width, height, scale = 1 }) {
  const shot = await page.send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: Math.max(0, x), y: Math.max(0, y), width, height, scale,
    },
  });
  return decodePng(Buffer.from(shot.data, 'base64'));
}
