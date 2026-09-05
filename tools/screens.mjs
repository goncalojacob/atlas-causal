#!/usr/bin/env node
// Takes the screenshots under docs/screens/. Serves the repository with
// tools/serve.mjs and drives a headless Chromium through its command line —
// no Puppeteer, no Playwright, no npm at all, which is the rule for this
// repository and not a preference. Anything the browser cannot be told from
// its own arguments is not worth a dependency.
//
//   CHROME=/path/to/chrome node tools/screens.mjs [--port 8123] [--only m19-map-1911]
//
// The browser is found through $CHROME, or in the usual places; without one
// the tool says so and exits 0, because a machine with no browser is not a
// broken repository and CI never takes screenshots.

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer, HOST } from './serve.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCREENS = path.join(ROOT, 'docs', 'screens');
const DEFAULT_PORT = 8123;

// A browser cache keeps one directory per build — chromium-1194, and the
// next one tomorrow — so the versioned ones are looked up rather than
// written down. Newest first, by the number in the name.
function cachedChromium(root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers') {
  if (!root || !existsSync(root)) return [];
  return readdirSync(root)
    .filter((name) => /^chromium(_headless_shell)?-\d+$/.test(name))
    .sort((a, b) => Number(b.replace(/\D+/g, '')) - Number(a.replace(/\D+/g, '')))
    .flatMap((name) => [`${root}/${name}/chrome-linux/chrome`, `${root}/${name}/chrome-linux/headless_shell`]);
}

const CANDIDATES = [
  process.env.CHROME,
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
  ...cachedChromium(),
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

// What each screenshot is of. The name is the file, the query is the state —
// which is the whole of it, because the atlas keeps what it is showing in the
// URL and nothing else has to be clicked to get there.
export const SHOTS = Object.freeze([
  { name: 'm19-map-1911', query: '?from=1911&to=1911', width: 1440, height: 900,
    what: 'the colonial world in eight hues, no two neighbours alike' },
  { name: 'm19-map-1975', query: '?from=1975&to=1975', width: 1440, height: 900,
    what: 'the same actors keeping their hues after independence' },
  { name: 'm19-map-angola', query: '?from=1974&to=1974&actor=angola', width: 1440, height: 900,
    what: 'a selected actor filled cobalt over its hue' },
  { name: 'm19-event-card', query: '?selected=carnation-revolution-1974', width: 1440, height: 900,
    what: 'the panel: title, prose, consequences, a dispute' },
  { name: 'm19-graph', query: '?view=graph&selected=carnation-revolution-1974', width: 1440, height: 900,
    what: 'the graph and the key to the five line patterns' },
  { name: 'm19-about', page: 'about.html', query: '', width: 1100, height: 1000,
    what: 'a reading page on the same tokens' },
]);

export function findChrome(candidates = CANDIDATES) {
  return candidates.find((file) => existsSync(file)) ?? null;
}

// Not spawnSync: the server that answers the browser is this process, and a
// synchronous child blocks the event loop that would have served the page —
// the browser then waits for a request that can never be answered and the
// tool hangs until somebody kills it.
function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (status) => resolve({ status, stderr }));
  });
}

export function chromeArgs(chrome, { url, file, width, height }) {
  return [chrome, [
    '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--window-size=${width},${height}`,
    // Long enough for the spine, a geometry shard and two typefaces; the
    // browser advances its own clock, so this is not a sleep.
    '--virtual-time-budget=20000',
    `--screenshot=${file}`,
    url,
  ]];
}

async function main(argv) {
  let port = DEFAULT_PORT;
  let only = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--port') port = Number(argv[++i]);
    else if (argv[i] === '--only') only = argv[++i];
    else {
      console.error(`unknown argument ${argv[i]}`);
      return 2;
    }
  }
  const chrome = findChrome();
  if (!chrome) {
    console.log('no headless browser found; set $CHROME to one. Nothing written.');
    return 0;
  }
  await mkdir(SCREENS, { recursive: true });
  const server = createServer({ port });
  await new Promise((resolve) => server.listen(port, HOST, resolve));
  try {
    for (const shot of SHOTS) {
      if (only && shot.name !== only) continue;
      const file = path.join(SCREENS, `${shot.name}.png`);
      const url = `http://${HOST}:${port}/${shot.page ?? ''}${shot.query}`;
      const [bin, args] = chromeArgs(chrome, { url, file, width: shot.width, height: shot.height });
      const result = await run(bin, args);
      if (result.status !== 0) {
        console.error(`${shot.name}: chrome exited ${result.status}\n${result.stderr}`);
        return 1;
      }
      console.log(`docs/screens/${shot.name}.png — ${shot.what}`);
    }
  } finally {
    server.close();
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
