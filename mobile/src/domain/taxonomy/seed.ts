import { DomainError } from '../errors';

/** Shapes of `mobile/src/db/seed/{taxonomy,catalog}.json` (plan §4 `TaxonomySeed`, §6.3 emit). */
export type SeedSource = 'grapplemap' | 'grapple-flows' | 'curated';
type Provenance = { id: string; source: SeedSource; sourceId: string; sourceVersion: string };

export type SeedPosition = Provenance & {
  slug: string;
  canonicalName: string;
  description?: string;
  parentSourceId?: string;
  tier: 'CORE' | 'EXTENDED';
};
export type SeedTechnique = Provenance & {
  slug: string;
  name: string;
  type: 'TRANSITION' | 'GUARD_PASS' | 'SWEEP' | 'ESCAPE' | 'TAKEDOWN' | 'SUBMISSION';
  fromSourceId: string;
  toSourceId?: string;
  appliesTo: 'GI' | 'NOGI' | 'BOTH';
  perspective?: 'TOP' | 'BOTTOM';
  description?: string;
  tier: 'CORE' | 'EXTENDED';
};
export type SeedAlias = Provenance & { targetKind: 'POSITION' | 'TECHNIQUE'; targetSourceId: string; name: string };
export type SeedResource = Provenance & {
  title: string;
  url?: string;
  author?: string;
  resourceTypeKey: string;
  notes?: string;
};
export type SeedResourceLink = { id: string; resourceSourceId: string; targetKind: 'TECHNIQUE'; targetSourceId: string };

export type TaxonomySeed = {
  release: string;
  grapplemapSnapshot: string;
  positions: SeedPosition[];
  techniques: SeedTechnique[];
  aliases: SeedAlias[];
  resources: SeedResource[];
  resourceLinks: SeedResourceLink[];
  retired?: { source: SeedSource; sourceId: string }[];
};

export type CatalogRow = Provenance & { name: string; sortOrder: number; description?: string };
export type CatalogSeed = {
  release: string;
  sessionTypes: CatalogRow[];
  subjects: CatalogRow[];
  resourceTypes: (CatalogRow & { key: string })[];
};

const RELEASE = /^(\d{4})-(\d{2})-(\d{2})\.(\d+)$/;

/** Release ids are `YYYY-MM-DD.N`; returns <0, 0, >0 like a comparator. Throws on a bad id. */
export function compareReleases(a: string, b: string): number {
  const pa = RELEASE.exec(a);
  const pb = RELEASE.exec(b);
  if (!pa || !pb) throw new DomainError('SEED_FORMAT_UNSUPPORTED');
  const da = `${pa[1]}${pa[2]}${pa[3]}`;
  const db = `${pb[1]}${pb[2]}${pb[3]}`;
  return da !== db ? (da < db ? -1 : 1) : Number(pa[4]) - Number(pb[4]);
}

const isArr = (v: unknown): v is unknown[] => Array.isArray(v);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Structural check of a taxonomy seed; SEED_FORMAT_UNSUPPORTED when the shape is not this one. */
export function assertTaxonomySeed(seed: unknown): asserts seed is TaxonomySeed {
  const ok =
    isObj(seed) &&
    typeof seed.release === 'string' &&
    RELEASE.test(seed.release) &&
    typeof seed.grapplemapSnapshot === 'string' &&
    ['positions', 'techniques', 'aliases', 'resources', 'resourceLinks'].every((k) => isArr(seed[k])) &&
    (seed.retired === undefined || isArr(seed.retired));
  if (!ok) throw new DomainError('SEED_FORMAT_UNSUPPORTED');
}

export function assertCatalogSeed(seed: unknown): asserts seed is CatalogSeed {
  const ok =
    isObj(seed) &&
    typeof seed.release === 'string' &&
    RELEASE.test(seed.release) &&
    ['sessionTypes', 'subjects', 'resourceTypes'].every((k) => isArr(seed[k]));
  if (!ok) throw new DomainError('SEED_FORMAT_UNSUPPORTED');
}
