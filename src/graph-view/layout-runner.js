// Where the arrangement is computed: here, or on a thread of its own.
//
// The rule is a measurement and not a preference. After the swept crossing
// count and the windowed layout of H4b, `layoutGraph` is about a tenth of a
// second at six hundred events on the machine the health cycle was measured
// on, and seven seconds at twenty thousand. Below the threshold the round
// trip — packing the message, cloning it twice, waiting a turn — costs more
// than the work and buys a flicker; above it the page would otherwise stop
// answering for seconds, which is what health review B, finding 3 measured.
//
// The Worker is never required, and it is never the tested path. Where one
// cannot be made — an older browser, a page opened from a file, a Node test
// — the arrangement happens here, on the records themselves, exactly as it
// did before there was a thread. A Worker that fails after starting falls
// back to that same call.

import { layoutGraph } from './layout.js';
import { packInput, unpackLayout } from './layout-message.js';
import { arrangeMessage } from './layout-worker.js';

// The count above which an arrangement is worth sending away. Events, not
// edges: it is the number the caller has in hand before any of the work.
export const OFFLOAD_ABOVE = 600;

function startWorker() {
  if (typeof Worker === 'undefined') return null;
  try {
    return new Worker(new URL('./layout-worker.js', import.meta.url), { type: 'module' });
  } catch {
    // A browser that refuses module Workers, or a page with no origin to
    // resolve the URL against. Neither is an error the reader should see.
    return null;
  }
}

// `records` is what the coordinates are put back on to: the atlas's own
// `events` and `edges` maps, which never leave this thread.
export function createLayoutRunner({ records, offloadAbove = OFFLOAD_ABOVE, worker = startWorker } = {}) {
  let thread = null;
  let started = false;
  let jobs = 0;
  const pending = new Map();

  // Started on the first arrangement big enough to want one, not on the
  // first page that might: a reader who never opens the graph, or never
  // opens one this large, never pays for a thread.
  const threadOf = () => {
    if (started) return thread;
    started = true;
    thread = worker();
    if (!thread) return null;
    thread.onmessage = ({ data }) => {
      const waiting = pending.get(data.job);
      if (!waiting) return;
      pending.delete(data.job);
      // An error from the other side is answered here and now, rather than
      // shown: the reader gets a picture either way.
      waiting.done(data.error ? layoutGraph(waiting.input) : unpackLayout(data.layout, records));
    };
    thread.onerror = () => {
      const owed = [...pending.values()];
      pending.clear();
      thread = null;
      for (const waiting of owed) waiting.done(layoutGraph(waiting.input));
    };
    return thread;
  };

  return {
    // Whether an arrangement of this many events would go away. Asked before
    // the message is packed, so a small one is never packed at all, and it
    // is what tells the view whether to expect an answer this turn.
    offloads(count) {
      return count > offloadAbove && Boolean(threadOf());
    },
    // Arranges, and calls `done` with a layout: on this turn when the work is
    // small or there is no thread, on a later one when there is.
    run(input, done) {
      if (!this.offloads(input.events.length)) {
        done(layoutGraph(input));
        return;
      }
      jobs += 1;
      const job = jobs;
      pending.set(job, { input, done });
      threadOf().postMessage({ job, input: packInput(input) });
    },
  };
}

