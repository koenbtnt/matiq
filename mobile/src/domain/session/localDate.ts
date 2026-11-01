import { DomainError } from '../errors';

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?Z$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for an ISO-8601 UTC timestamp (`…Z`) that denotes a real instant. */
export const isIsoUtc = (s: string): boolean => ISO_UTC.test(s) && !Number.isNaN(Date.parse(s));

/** True for a real calendar date `YYYY-MM-DD`. */
export function isLocalDate(s: string): boolean {
  const m = LOCAL_DATE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    formatters.set(timeZone, f);
  }
  return f;
}

/**
 * Local calendar date of a UTC instant in an IANA zone (ADR 0016: fixed at write time).
 * Throws SESSION_START_INVALID for a malformed instant or an unknown zone.
 */
export function localDateOf(isoUtc: string, timeZone: string): string {
  if (!isIsoUtc(isoUtc)) throw new DomainError('SESSION_START_INVALID');
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = formatterFor(timeZone).formatToParts(new Date(isoUtc));
  } catch {
    throw new DomainError('SESSION_START_INVALID');
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** `date` plus `days` calendar days (negative allowed). */
export function addDays(date: string, days: number): string {
  const m = LOCAL_DATE.exec(date);
  if (!m) throw new DomainError('SESSION_START_INVALID');
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `date` (weeks start on Monday, R-15). */
export function weekStartOf(date: string): string {
  const m = LOCAL_DATE.exec(date);
  if (!m) throw new DomainError('SESSION_START_INVALID');
  const weekday = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay(); // 0 = Sunday
  return addDays(date, -((weekday + 6) % 7));
}
