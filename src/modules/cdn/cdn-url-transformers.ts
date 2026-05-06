/**
 * CDN URL transformers registry.
 *
 * Each entry matches a domain and transforms the scraped URL to the highest
 * quality version available on that CDN.
 *
 * To add a new brand: append an entry to the TRANSFORMERS array.
 */

type Transformer = {
  /** Substring to match against the URL (usually the domain) */
  match: string;
  /** Returns the max-quality URL for this CDN */
  transform: (url: string) => string;
};

const TRANSFORMERS: Transformer[] = [
  {
    // AGV / Momo Design — Thron DAM CDN
    match: 'dainese-cdn.thron.com',
    transform: (url) => {
      const base = url.split('?')[0];
      return `${base.replace(/\d+x\d+/, '1920x1920')}?format=webp&quality=high`;
    },
  },
  {
    // Shark — Shopify CDN (supports width param up to ~1946)
    match: 'shark-helmets.com',
    transform: (url) => {
      const [base, query] = url.split('?');
      const params = new URLSearchParams(query ?? '');
      params.set('width', '1946');
      return `${base}?${params.toString()}`;
    },
  },
  {
    // HJC — static CDN, max native resolution is 500px, no transforms supported
    match: 'hjchelmets.us',
    transform: (url) => url.split('?')[0],
  },
];

/**
 * Returns the highest quality URL available for the given scraped image URL.
 * Falls back to the original URL if no transformer matches.
 */
export function getMaxQualityUrl(url: string): string {
  const transformer = TRANSFORMERS.find((t) => url.includes(t.match));
  return transformer ? transformer.transform(url) : url;
}
