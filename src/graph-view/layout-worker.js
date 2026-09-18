// The arrangement, off the thread that draws.
//
// Nothing else lives here: no fetch, no data root, no `?fixtures=1`, no
// atlas. Everything this needs arrives in the message (layout-message.js),
// which is why the two traps a Worker usually falls into — finding the data
// again from a different base URL, and finding the fixtures instead of the
// data — cannot arise here. It is a pure function on a wire.
//
// A module Worker, so `layout.js` is imported rather than copied, and the
// URL is resolved against this file's own, so where the site is served from
// does not matter.

import { layoutGraph } from './layout.js';
import { unpackInput, packLayout } from './layout-message.js';

// The whole of the work, as a function of the message and nothing else. It
// is exported so `node --test` can drive it directly: a Worker cannot be
// started there, and a piece of arithmetic that only runs in a browser is a
// piece of arithmetic nothing checks.
export function arrangeMessage(input) {
  return packLayout(layoutGraph(unpackInput(input)));
}

// Only inside a Worker. `WorkerGlobalScope` exists nowhere else — not on the
// page and not in Node — and the site's own test imports every module under
// `src/` without a DOM, which this would otherwise fail.
const inWorker = typeof WorkerGlobalScope !== 'undefined'
  && typeof self !== 'undefined'
  && self instanceof WorkerGlobalScope;

if (inWorker) {
  self.onmessage = ({ data }) => {
    const { job, input } = data;
    try {
      self.postMessage({ job, layout: arrangeMessage(input) });
    } catch (error) {
      // The runner arranges on the main thread instead, so a failure here
      // costs a frame and never the picture.
      self.postMessage({ job, error: String(error?.message ?? error) });
    }
  };
}
