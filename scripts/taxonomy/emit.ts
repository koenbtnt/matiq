import fs from 'node:fs';
import path from 'node:path';

/** JSON with recursively sorted object keys, 2-space indent and a trailing newline. */
export function stableStringify(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as object).sort()) {
        const x = (v as Record<string, unknown>)[k];
        if (x !== undefined) out[k] = sort(x);
      }
      return out;
    }
    return v;
  };
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}

export const bySource = <T extends { source: string; sourceId: string }>(a: T, b: T): number =>
  a.source < b.source ? -1 : a.source > b.source ? 1 : a.sourceId < b.sourceId ? -1 : a.sourceId > b.sourceId ? 1 : 0;

export function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableStringify(value));
}
