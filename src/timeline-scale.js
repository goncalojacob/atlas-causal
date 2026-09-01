// The timeline's horizontal scale, injected into timeline.js so deep time
// can swap in a bucketed scale later without touching the lanes. Works in
// astronomical years (see util/dates.js); callers convert at the edges.

import { fromAstronomical, formatYear } from './util/dates.js';

const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];

export function createLinearScale({ domain, range }) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return {
    domain,
    range,
    x(year) {
      return r0 + (year - d0) * k;
    },
    invert(px) {
      return k === 0 ? d0 : d0 + (px - r0) / k;
    },
    // Round tick values inside the domain, about `count` of them. Year 0
    // does not exist in the data but is a fine tick position on an
    // astronomical axis; its label is "1 BCE".
    ticks(count = 8) {
      const span = Math.abs(d1 - d0);
      if (span === 0) return [{ value: d0, label: formatYear(fromAstronomical(Math.round(d0))) }];
      const rough = span / count;
      const step = STEPS.find((s) => s >= rough) ?? STEPS[STEPS.length - 1];
      const out = [];
      for (let v = Math.ceil(Math.min(d0, d1) / step) * step; v <= Math.max(d0, d1); v += step) {
        out.push({ value: v, label: formatYear(fromAstronomical(v)) });
      }
      return out;
    },
  };
}
