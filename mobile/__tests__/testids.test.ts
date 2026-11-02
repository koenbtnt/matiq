import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Every static testID of every sprint design's table (`## §7 testID table` … `## §8 Deviations`) exists in the UI
 * source. Dynamic ids (`<refId>` …) are checked by the screen tests; every other id must appear verbatim.
 * Sprint designs are discovered under `docs/*\/design.md`; a design without both headings is skipped.
 */
const root = resolve(__dirname, '..');
const docs = resolve(root, '../docs');
const START = '\n## §7 testID table';
const END = '\n## §8 Deviations';

/** Ids of one design's table (first column), `undefined` when the design has no table. */
function tableIds(design: string): Set<string> | undefined {
  const from = design.indexOf(START);
  const to = design.indexOf(END, from);
  if (from < 0 || to < 0) return undefined;
  const ids = new Set<string>();
  for (const line of design.slice(from, to).split('\n')) {
    if (!line.startsWith('| `')) continue;
    const cell = line.split('|')[1] ?? '';
    for (const m of cell.matchAll(/`([^`]+)`/g)) ids.add(m[1]!.trim());
  }
  return ids;
}

const designs = readdirSync(docs)
  .map((slug) => ({ slug, file: join(docs, slug, 'design.md') }))
  .filter(({ file }) => existsSync(file))
  .flatMap(({ slug, file }) => {
    const ids = tableIds(readFileSync(file, 'utf8'));
    return ids ? [{ slug, ids }] : [];
  });

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
  // RankCard takes `testIDPrefix` (home | progress | profile) and builds `<prefix>.set` / `<prefix>.update`.
  const rank = /^(home|progress|profile)\.rank\.(set|update)$/.exec(id);
  if (rank) return [`\`\${testIDPrefix}.${rank[2]}\``, `${rank[1]}.rank`];
  // PositionPicker builds `libraryEdit.<field>.<part>` from its `field` prop.
  const picker = /^libraryEdit\.(from|to|parent)\.(input|clear|selected|result)(\.<positionId>)?$/.exec(id);
  if (picker) return [`field="${picker[1]}"`, picker[2] === 'result' ? '`${id}.result.${p.id}`' : `\`\${id}.${picker[2]}\``];
  // Technique detail endpoints: `technique.from` / `technique.to`.
  const endpoint = /^technique\.(from|to)$/.exec(id);
  if (endpoint) return ['`technique.${which}`', `endpoint('${endpoint[1]}'`];
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

describe('testID tables (design §7, every sprint)', () => {
  it('finds the foundation and progress-settings designs', () => {
    expect(designs.map((d) => d.slug)).toEqual(expect.arrayContaining(['foundation', 'progress-settings']));
  });

  describe.each(designs)('$slug', ({ ids }) => {
    it('parsed a sensible number of ids', () => {
      expect(ids.size).toBeGreaterThan(20);
    });

    it.each([...ids].filter((i) => !i.startsWith('.')))('%s is present in the source', (id) => {
      expect(covered(id)).toBe(true);
    });
  });
});
