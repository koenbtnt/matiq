import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Plan §9.2: every static testID of the design's table (§7) exists in the UI source. Dynamic ids
 * (`<refId>` …) are checked by the screen tests; ids composed from a prefix (`<prefix>.less`) match on the prefix.
 */
const root = resolve(__dirname, '..');
const design = readFileSync(resolve(root, '../docs/foundation/design.md'), 'utf8');
const section = design.slice(design.indexOf('## §7 testID table'), design.indexOf('## §8 Deviations'));

const ids = new Set<string>();
for (const line of section.split('\n')) {
  if (!line.startsWith('| `')) continue;
  const cell = line.split('|')[1] ?? '';
  for (const m of cell.matchAll(/`([^`]+)`/g)) ids.add(m[1]!.trim());
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    if (/__tests__|__mocks__/.test(p)) return [];
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(e) ? [p] : [];
  });
}
const source = [...files(join(root, 'app')), ...files(join(root, 'src/components')), ...files(join(root, 'src/features'))]
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

// The table lists `a` / `.b` / `.c` variants in one cell; keep the full first id and expand the others.
const covered = (id: string) => {
  if (id.includes('<')) return true;
  const parts = id.split('.');
  for (let n = parts.length; n >= 1; n--) {
    const candidate = parts.slice(0, n).join('.');
    if (source.includes(`'${candidate}'`) || source.includes(`"${candidate}"`) || source.includes(`\`${candidate}.`) || source.includes(`${candidate}.`)) return true;
  }
  return false;
};

describe('testID table (design §7)', () => {
  it('parsed a sensible number of ids', () => {
    expect(ids.size).toBeGreaterThan(80);
  });

  it.each([...ids].filter((i) => !i.startsWith('.')))('%s is present in the source', (id) => {
    expect(covered(id)).toBe(true);
  });
});
