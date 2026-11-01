import type { CatalogSeed, TaxonomySeed } from '../../domain/taxonomy/seed';

/** Small fictional-safe seed fixtures (taxonomy vocabulary only; no personal data). */
const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const FX = {
  gi: id(1), nogi: id(2), openMat: id(3),
  grips: id(10), retention: id(11),
  rtInstructional: id(20), rtBook: id(21),
  mount: id(30), sideControl: id(31), closedGuard: id(32), guard: id(33), halfGuard: id(34),
  armbarFromMount: id(40), passToSide: id(41), sweepToMount: id(42), escapeToGuard: id(43),
  aliasFullMount: id(50), aliasCrossSide: id(51), aliasScissor: id(52),
  resource: id(60), link: id(61),
};

const V = '2026-11-01.1';
const gm = (sourceId: string) => ({ source: 'grapplemap' as const, sourceId, sourceVersion: '2023-02-06' });
const cur = (sourceId: string) => ({ source: 'curated' as const, sourceId, sourceVersion: V });

export const catalogFixture = (): CatalogSeed => ({
  release: V,
  sessionTypes: [
    { id: FX.gi, ...cur('st:gi-class'), name: 'Gi class', sortOrder: 1 },
    { id: FX.nogi, ...cur('st:no-gi-class'), name: 'No-gi class', sortOrder: 2 },
    { id: FX.openMat, ...cur('st:open-mat'), name: 'Open mat', sortOrder: 3 },
  ],
  subjects: [
    { id: FX.grips, ...cur('subj:grip-fighting'), name: 'Grip fighting', sortOrder: 1, description: 'Winning the grip exchange' },
    { id: FX.retention, ...cur('subj:guard-retention'), name: 'Guard retention', sortOrder: 2 },
  ],
  resourceTypes: [
    { id: FX.rtInstructional, ...cur('rt:instructional'), key: 'instructional', name: 'Instructional', sortOrder: 1 },
    { id: FX.rtBook, ...cur('rt:book'), key: 'book', name: 'Book', sortOrder: 2 },
  ],
});

export const taxonomyFixture = (release = V): TaxonomySeed => ({
  release,
  grapplemapSnapshot: '2023-02-06',
  positions: [
    { id: FX.guard, ...cur('cur:guard'), slug: 'guard', canonicalName: 'Guard', tier: 'CORE' },
    { id: FX.closedGuard, ...gm('gm:10'), slug: 'closed-guard', canonicalName: 'Closed guard', parentSourceId: 'cur:guard', tier: 'CORE' },
    { id: FX.mount, ...gm('gm:11'), slug: 'mount', canonicalName: 'Mount', description: 'Top, astride the torso', tier: 'CORE' },
    { id: FX.sideControl, ...gm('gm:12'), slug: 'side-control', canonicalName: 'Side control', tier: 'CORE' },
    { id: FX.halfGuard, ...gm('gm:13'), slug: 'half-guard-variant', canonicalName: 'Deep half variant', tier: 'EXTENDED' },
  ],
  techniques: [
    { id: FX.armbarFromMount, ...gm('gm:20'), slug: 'armbar-from-mount', name: 'Armbar from mount', type: 'SUBMISSION', fromSourceId: 'gm:11', appliesTo: 'BOTH', perspective: 'TOP', tier: 'CORE' },
    { id: FX.passToSide, ...gm('gm:21'), slug: 'knee-slice', name: 'Knee slice', type: 'GUARD_PASS', fromSourceId: 'gm:10', toSourceId: 'gm:12', appliesTo: 'BOTH', perspective: 'TOP', tier: 'CORE' },
    { id: FX.sweepToMount, ...gm('gm:22'), slug: 'scissor-sweep', name: 'Scissor sweep', type: 'SWEEP', fromSourceId: 'gm:10', toSourceId: 'gm:11', appliesTo: 'GI', perspective: 'BOTTOM', tier: 'CORE' },
    { id: FX.escapeToGuard, ...gm('gm:23'), slug: 'elbow-escape', name: 'Elbow escape', type: 'ESCAPE', fromSourceId: 'gm:11', toSourceId: 'gm:13', appliesTo: 'BOTH', tier: 'EXTENDED' },
  ],
  aliases: [
    { id: FX.aliasFullMount, ...cur('cur:alias:full-mount'), targetKind: 'POSITION', targetSourceId: 'gm:11', name: 'Full mount' },
    { id: FX.aliasCrossSide, source: 'grapple-flows', sourceId: 'cross-side', sourceVersion: '2026-09-27', targetKind: 'POSITION', targetSourceId: 'gm:12', name: 'Cross side' },
    { id: FX.aliasScissor, ...cur('cur:alias:tesoura'), targetKind: 'TECHNIQUE', targetSourceId: 'gm:22', name: 'Tesoura' },
  ],
  resources: [
    { id: FX.resource, ...gm('ref:abc'), title: 'Guard basics', author: 'A. Coach', resourceTypeKey: 'instructional', notes: '@ p12' },
  ],
  resourceLinks: [{ id: FX.link, resourceSourceId: 'ref:abc', targetKind: 'TECHNIQUE', targetSourceId: 'gm:22' }],
});
