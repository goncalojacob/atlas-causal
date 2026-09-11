// Bundle → clipboard → the contribution issue. This is the only file in the
// project that knows where the repository is: one constant, so that when a
// small relay replaces the target later (for contributors without a GitHub
// account) nothing else changes and the bundle stays the wire format.

export const REPOSITORY = 'https://github.com/goncalojacob/atlas-causal';
export const CONTRIBUTION_TEMPLATE = 'contribution.yml';
export const CORRECTION_TEMPLATE = 'correction.yml';

// GitHub rejects request URLs somewhere around 8 KB (recollection, not
// measured), and a percent-encoded explanation reaches that fast. Above the
// cap the template opens empty and the page says "paste": the clipboard
// carries the bundle either way, so nothing is ever silently truncated.
export const MAX_PREFILL = 6 * 1024;

export function bundleText(bundle) {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

export function defaultTitle(bundle) {
  const records = bundle?.records ?? [];
  const first = records.find((r) => r.kind === 'event') ?? records[0];
  const name = first?.title || first?.id || '';
  const rest = records.length > 1 ? ` (+${records.length - 1})` : '';
  return name ? `Contribution: ${name}${rest}` : 'Contribution';
}

// → { url, prefilled, bytes }. `prefilled` false means the bundle is not in
// the URL and the contributor pastes it from the clipboard.
export function issueUrl(bundle, {
  repository = REPOSITORY,
  template = CONTRIBUTION_TEMPLATE,
  title = defaultTitle(bundle),
  maxPrefill = MAX_PREFILL,
  text = bundleText(bundle),
} = {}) {
  const params = new URLSearchParams({ template });
  if (title) params.set('title', title);
  const bytes = new URLSearchParams({ bundle: text }).toString().length - 'bundle='.length;
  const prefilled = bytes <= maxPrefill;
  if (prefilled) params.set('bundle', text);
  return { url: `${repository}/issues/new?${params.toString()}`, prefilled, bytes };
}

// navigator.clipboard needs a secure context, which http://localhost is but
// http://192.168.x.x is not, so the textarea fallback stays.
export async function copyText(text, { navigator: nav = globalThis.navigator, document: doc = globalThis.document } = {}) {
  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the textarea
  }
  if (!doc?.body) return false;
  const area = doc.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  doc.body.appendChild(area);
  area.select();
  let copied = false;
  try {
    copied = doc.execCommand ? doc.execCommand('copy') : false;
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

// Copy first, then open: if the clipboard fails the page can still say so
// while the issue is open, and the textarea in the template is the backstop.
export async function submitBundle(bundle, { open, navigator, document, ...urlOptions } = {}) {
  const text = bundleText(bundle);
  const copied = await copyText(text, { navigator, document });
  const target = issueUrl(bundle, { ...urlOptions, text });
  const openIn = open ?? ((url) => globalThis.window?.open(url, '_blank', 'noopener'));
  openIn(target.url);
  return { ...target, copied, text };
}
