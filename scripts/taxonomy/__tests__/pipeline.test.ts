/**
 * @jest-environment node
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { deriveType, perspectiveOf } from '../edgeTypes.ts';
import { stableStringify } from '../emit.ts';
import { joinDirectory, recordFiles } from '../join.ts';
import { assignSlugs, compileRules, sentenceCase } from '../names.ts';
import { isPosition, parseRecord, poseDigits, splitRecords, joinRecords } from '../parse.ts';
import { convert, defaultPaths, parseCitation } from '../pipeline.ts';
import { canonical, decodePose, keyOf, POSE_DIGITS, rms, variants, type Pose } from '../pose.ts';
import { PoseIndex } from '../resolve.ts';
import { recordFileName } from '../split.ts';
import { validateRecords } from '../validate.ts';

const root = path.resolve(__dirname, '../../..');
const paths = defaultPaths(root);
const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const text = joinDirectory(paths.records);
const records = splitRecords(text).map(parseRecord);
const rules = compileRules(JSON.parse(fs.readFileSync(path.join(paths.curated, 'name-rules.json'), 'utf8')));

describe('vendored snapshot (F-10, stage 1–2)', () => {
  it('join(records/) is byte-identical to GrappleMap.txt (sha256 in SOURCE.md)', () => {
    const source = fs.readFileSync(path.join(root, 'data/taxonomy/grapplemap/SOURCE.md'), 'utf8');
    const expected = /sha256 \| `([0-9a-f]{64})`/.exec(source)?.[1];
    expect(expected).toBe('734c5af03958f7384af1c09b18bf06500748a8c505573e5be9a48174ddcfb74e');
    expect(Buffer.byteLength(text, 'utf8')).toBe(2674097);
    expect(sha256(text)).toBe(expected);
  });

  it('split → join round-trips and file names follow NNNN-<slug>.txt', () => {
    const raws = splitRecords(text);
    expect(joinRecords(raws)).toBe(text);
    const files = recordFiles(paths.records);
    expect(files).toHaveLength(2086);
    expect(files.map((f, i) => f.startsWith(`${String(i).padStart(4, '0')}-`))).not.toContain(false);
    expect(recordFileName(7, 'combat base vs\\nfreshly broken guard')).toBe('0007-combat-base-vs-freshly-broken-guard.txt');
  });

  it('validates with 0 errors: 601 positions + 1485 transitions', () => {
    expect(validateRecords(records)).toEqual([]);
    expect(records.filter(isPosition)).toHaveLength(601);
    expect(records.filter((r) => !isPosition(r))).toHaveLength(1485);
  });

  it('reports bad records with index and line', () => {
    const bad = parseRecord({ index: 3, startLine: 10, text: 'x\ntags: Bad-Tag\nproperties: flying\n    abc\n' });
    expect(validateRecords([bad]).map((e) => [e.index, e.line, e.message])).toEqual([
      [3, 13, 'pose line is not 69 base-62 digits'],
      [3, 10, 'pose line count 1 is not a multiple of 4'],
      [3, 10, 'record has no pose'],
      [3, 10, 'bad tag "Bad-Tag"'],
      [3, 10, 'unknown property "flying"'],
    ]);
  });
});

describe('pose canonicalisation (F-12, stage 3–4)', () => {
  const first = records.find(isPosition)!;
  const pose = decodePose(poseDigits(first, 0));
  const transform = (p: Pose, angle: number, dx: number, dz: number): Pose =>
    p.map((pl) => pl.map(([x, y, z]) => [Math.cos(angle) * x! - Math.sin(angle) * z! + dx, y!, Math.sin(angle) * x! + Math.cos(angle) * z! + dz]));

  it('decodes 276 digits into 2 × 23 joints in metres', () => {
    expect(POSE_DIGITS).toBe(276);
    expect(pose).toHaveLength(2);
    expect(pose[0]).toHaveLength(23);
    expect(pose.flat().every(([x, y, z]) => x! >= -2 && x! < 2 && y! >= 0 && y! < 4 && z! >= -2 && z! < 2)).toBe(true);
  });

  it('is invariant under rotation about the vertical axis and ground translation', () => {
    const moved = transform(pose, 1.234, 0.7, -0.3);
    expect(rms(canonical(pose), canonical(moved))).toBeLessThan(1e-9);
  });

  it('a mirrored, swapped, rotated copy matches one of the four variants', () => {
    const [, , , swappedMirror] = variants(pose);
    const moved = canonical(transform(swappedMirror!, -2.1, -0.4, 0.9));
    const best = Math.min(...variants(pose).map((v) => rms(canonical(v), moved)));
    expect(best).toBeLessThan(1e-9);
  });

  it('a hand-built pair: two players 1 m apart resolve to the same key whichever way they face', () => {
    const player = (cx: number) => Array.from({ length: 23 }, (_, j) => [cx + (j % 2 ? 0.1 : -0.1), j * 0.05, 0]);
    const a: Pose = [player(-0.5), player(0.5)];
    const b = transform(a, Math.PI / 2, 0.2, 0.2);
    expect(keyOf(canonical(a), 0.02)).toBe(keyOf(canonical(b), 0.02));
  });

  it('every position resolves to itself by key; own keys never collide', () => {
    const positions = records.filter(isPosition).map((r) => ({ index: r.index, digits: poseDigits(r, 0) }));
    const index = new PoseIndex(positions);
    expect(index.ownKeyCollisions(positions)).toBe(0);
    for (const p of positions.slice(0, 50)) expect(index.resolve(p.digits)).toEqual({ index: p.index, method: 'key', distance: 0 });
  });
});

describe('edge types (F-13, stage 6)', () => {
  it.each<[string[], string, string]>([
    [['armbar'], 'arm bar', 'SUBMISSION'],
    [['rear_naked_choke'], 'trap arm and choke', 'SUBMISSION'],
    [['single_leg_takedown', 'kimura'], 'drive', 'SUBMISSION'],
    [['double_leg_takedown'], 'drive forward', 'TAKEDOWN'],
    [['throw', 'pass_split'], 'x', 'TAKEDOWN'],
    [['knee_slice'], 'start', 'GUARD_PASS'],
    [['butterfly_sweep'], 'sweep finish', 'SWEEP'],
    [['bridge'], 'upa', 'ESCAPE'],
    [[], 'tap', 'SUBMISSION'],
    [[], 'lock down', 'TRANSITION'],
    [[], 'get body lock', 'TRANSITION'],
    [[], 'finish pass', 'GUARD_PASS'],
    [[], 'sweep', 'SWEEP'],
    [[], 'shrimp escape', 'ESCAPE'],
    [[], 'leg weave takedown', 'TAKEDOWN'],
    [[], 'bottom gets underhook', 'TRANSITION'],
  ])('%j + "%s" → %s', (tags, name, type) => {
    expect(deriveType(tags, name)).toBe(type);
  });

  it('an override wins; properties give the perspective', () => {
    expect(deriveType(['armbar'], 'x', 'SWEEP')).toBe('SWEEP');
    expect(perspectiveOf(['detailed', 'top'])).toBe('TOP');
    expect(perspectiveOf(['bottom'])).toBe('BOTTOM');
    expect(perspectiveOf(['bidirectional'])).toBeUndefined();
  });
});

describe('name rules (stage 5, A-32)', () => {
  it.each([
    ['side ctrl w/ near open elbow\\nand crossface', 'Side control with near open elbow and crossface'],
    ['seated rnc w/ trapped arm', 'Seated RNC with trapped arm'],
    ['smashed ¼ vs whizzer', 'Smashed quarter vs. whizzer'],
    ['standing vs reverse dlr', 'Standing vs. reverse DLR'],
    ['dogfight w/o leg control', 'Dogfight without leg control'],
    ['3/4 mount w/ underhook', 'Three-quarter mount with underhook'],
  ])('%s → %s', (raw, expected) => {
    expect(sentenceCase(rules.clean(raw))).toBe(expected);
  });

  it('detects placeholders and de-duplicates slugs in order', () => {
    expect(['...', '...A', 'todo: x', '?', 'escape'].map((n) => rules.isPlaceholder(n))).toEqual([true, true, true, true, false]);
    expect(assignSlugs(['Escape', 'Escape', 'Escape!', 'Mount'])).toEqual(['escape', 'escape-2', 'escape-3', 'mount']);
  });

  it('parses citations (A-27)', () => {
    expect(parseCitation('Demian Maia "Science of Jiu Jitsu" Volume 2, Technique 10 @ 29:56')).toEqual({
      author: 'Demian Maia', title: 'Science of Jiu Jitsu', notes: 'Volume 2, Technique 10 @ 29:56',
    });
    expect(parseCitation('see https://example.org/x')).toEqual({ title: 'see https://example.org/x', url: 'https://example.org/x' });
  });
});

describe('emit (F-11, stage 7–10)', () => {
  const a = convert(paths);
  it('is deterministic and equals the committed seed files', () => {
    const b = convert(paths);
    expect(stableStringify(a.taxonomy)).toBe(stableStringify(b.taxonomy));
    expect(a.registry.missing.size).toBe(0);
    for (const [file, value] of [['taxonomy.json', a.taxonomy], ['catalog.json', a.catalog], ['report.json', a.report], ['attribution.json', a.attribution]] as const) {
      expect(fs.readFileSync(path.join(paths.out, file), 'utf8')).toBe(stableStringify(value));
    }
  });

  it('meets the plan’s structural rules', () => {
    const t = a.taxonomy;
    const posIds = new Set(t.positions.map((p) => p.sourceId));
    expect(t.techniques.every((x) => posIds.has(x.fromSourceId) && (x.toSourceId === undefined || posIds.has(x.toSourceId)))).toBe(true);
    expect(t.techniques.every((x) => (x.type === 'SUBMISSION') === (x.toSourceId === undefined))).toBe(true);
    expect(new Set(t.positions.map((p) => p.slug)).size).toBe(t.positions.length);
    expect(new Set(t.techniques.map((p) => p.slug)).size).toBe(t.techniques.length);
    expect(new Set([...t.positions, ...t.techniques, ...t.aliases, ...t.resources].map((x) => x.id)).size).toBe(
      t.positions.length + t.techniques.length + t.aliases.length + t.resources.length,
    );
    expect(t.positions.every((p) => p.parentSourceId === undefined || posIds.has(p.parentSourceId))).toBe(true);
    expect(t.techniques.filter((x) => x.sourceId.endsWith('#rev')).every((x) => x.type === 'TRANSITION')).toBe(true);
    expect(t.aliases.every((x) => ['curated', 'grapple-flows'].includes(x.source))).toBe(true);
    const techIds = new Set(t.techniques.map((x) => x.sourceId));
    const resIds = new Set(t.resources.map((x) => x.sourceId));
    expect(t.resourceLinks.every((l) => techIds.has(l.targetSourceId) && resIds.has(l.resourceSourceId))).toBe(true);
  });

  it('core sizes are inside the R-28 targets; the gi layer has ≥ 8 rows (A-28)', () => {
    const report = a.report as { positions: { core: number }; techniques: { core: number; gi: number } };
    expect(report.positions.core).toBeGreaterThanOrEqual(40);
    expect(report.positions.core).toBeLessThanOrEqual(60);
    expect(report.techniques.core).toBeGreaterThanOrEqual(140);
    expect(report.techniques.gi).toBeGreaterThanOrEqual(8);
  });

  it('records the endpoint resolution in report.json (acceptance target 95 %, see stack-notes)', () => {
    const r = (a.report as { resolution: { emittedRate: number; endpoints: { key: number; nearest: number; unresolved: number } } }).resolution;
    expect(r.endpoints.key + r.endpoints.nearest + r.endpoints.unresolved).toBe(2 * 1485);
    expect(r.emittedRate).toBeGreaterThan(0.8);
  });
});
