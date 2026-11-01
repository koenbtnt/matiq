import fs from 'node:fs';
import path from 'node:path';

/** Record files in index order (their names start with the zero-padded index). */
export const recordFiles = (dir: string): string[] =>
  fs.readdirSync(dir).filter((f) => /^\d{4}-.*\.txt$/.test(f)).sort();

/** Re-assembles GrappleMap.txt byte-for-byte from the vendored record files. */
export const joinDirectory = (dir: string): string =>
  recordFiles(dir).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('');
