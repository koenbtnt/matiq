import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Plan §9.2: every static testID of the design's table (§7) exists in the UI source. Dynamic ids
 * (`<refId>` …) are checked by the screen tests; every other id must appear verbatim.
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

// Ids the source composes at runtime: each maps to the literal fragment(s) that must exist where it is built.
const composed = (id: string): string[] | undefined => {
  const stepper = /^(.+)\.(less|more|value)$/.exec(id);
  if (stepper && source.includes(`testIDPrefix="${stepper[1]}"`)) return [];
  if (/^log\.sparring\.(landedWith|takenBy)\.(add|<n>)$/.test(id)) return ['`log.sparring.${b.idKey}.', `idKey: '${id.split('.')[2]}'`];
  if (/^log\.sparring\.useCount\.(landed|taken)$/.test(id)) return ['`log.sparring.useCount.${b.field}`', `field: '${id.split('.')[3]}'`];
  const row = /^home\.(planned|stale)\.<sessionId>(\.[A-Za-z]+)?$/.exec(id);
  if (row) return ['`home.${kind}.${session.id}`', `'${row[1]}'`, ...(row[2] ? [`\`\${id}${row[2]}\``] : [])];
  return undefined;
};

// Exact match: the full id as a string literal; otherwise it must be a known composed id whose pieces exist.
const covered = (id: string) => {
  if (source.includes(`'${id}'`) || source.includes(`"${id}"`) || source.includes(`\`${id}\``)) return true;
  const pieces = composed(id);
  if (pieces) return pieces.every((p) => source.includes(p));
  if (id.includes('<')) return source.includes(id.slice(0, id.indexOf('<')));
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
