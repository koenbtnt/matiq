import fs from 'node:fs';
import path from 'node:path';

import { parseRecord, splitRecords } from './parse.ts';
import { slugify } from './slug.ts';

/** File name of a record: zero-padded index plus a slug of its name (stack-notes, PR 5 shape). */
export function recordFileName(index: number, rawName: string): string {
  const slug = slugify(rawName.replace(/\\n/g, ' ')).slice(0, 60).replace(/-+$/, '') || 'unnamed';
  return `${String(index).padStart(4, '0')}-${slug}.txt`;
}

/** Writes one file per record (exact bytes) into `dir`; returns the file names in order. */
export function splitToDirectory(text: string, dir: string): string[] {
  fs.mkdirSync(dir, { recursive: true });
  return splitRecords(text).map((raw) => {
    const name = recordFileName(raw.index, parseRecord(raw).name);
    fs.writeFileSync(path.join(dir, name), raw.text);
    return name;
  });
}
