import en from './en.json';

export type TKey = keyof typeof en;

/** The one message for a `DomainError` code (`errors.<CODE>`), falling back to `errors.UNKNOWN`. */
export function errorKey(code: string | undefined): TKey {
  const key = `errors.${code}`;
  return key in en ? (key as TKey) : 'errors.UNKNOWN';
}
