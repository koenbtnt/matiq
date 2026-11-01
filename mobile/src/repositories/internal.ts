/** null → undefined, so rows match the optional fields of the contracts. */
export const opt = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);

/** Drops keys whose value is undefined (contracts use optional fields, not explicit undefined). */
export function compact<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out as T;
}

/** Escapes LIKE wildcards; use with `ESCAPE '\\'`. */
export const likeContains = (q: string): string => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export const seamValues = (id: string, now: string) => ({ id, createdAt: now, updatedAt: now });
