import { DomainError } from '../errors';

/**
 * An absolute http(s) URL with a host and no whitespace. A regex, not `new URL()`: React Native
 * 0.88's `URL` constructor accepts any string, so `new URL()` would validate in Jest only.
 */
const HTTP_URL = /^https?:\/\/(?:[^\s/?#@]+@)?[^\s/?#@:]+(?::\d{1,5})?(?:[/?#]\S*)?$/i;

/** Blank → undefined; otherwise an http(s) URL or RESOURCE_URL_INVALID (plan §8.1). */
export function normalizeResourceUrl(url: string | null | undefined): string | undefined {
  const t = (url ?? '').trim();
  if (!t) return undefined;
  if (!HTTP_URL.test(t)) throw new DomainError('RESOURCE_URL_INVALID');
  return t;
}

/** Trimmed title or RESOURCE_TITLE_REQUIRED. */
export function normalizeResourceTitle(title: string | null | undefined): string {
  const t = (title ?? '').trim();
  if (!t) throw new DomainError('RESOURCE_TITLE_REQUIRED');
  return t;
}

/** Blank optional text → undefined. */
export const blankToUndefined = (s: string | null | undefined): string | undefined => {
  const t = (s ?? '').trim();
  return t ? t : undefined;
};
