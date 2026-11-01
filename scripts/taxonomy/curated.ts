import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import type { NameRules } from './names.ts';
import type { TechniqueType } from './edgeTypes.ts';

/** The curated layer `data/taxonomy/curated/` (F-14) as typed data. */
export type CorePosition = { sourceId: string; name: string; parent?: string; aliases?: string[]; description?: string };
export type CoreTechnique = { sourceId: string; name: string; from: string; to?: string; type: TechniqueType; aliases?: string[] };
export type Core = { positions: CorePosition[]; techniques: CoreTechnique[]; families: { tag: string; parent: string }[] };
export type GiTechnique = {
  key: string;
  name: string;
  type: TechniqueType;
  from: string;
  to?: string;
  perspective?: 'TOP' | 'BOTTOM';
  aliases?: string[];
};
export type FlowsMap = { positions: Record<string, string>; techniques: Record<string, string> };
export type Catalog = {
  sessionTypes: { key: string; name: string }[];
  subjects: { key: string; name: string; description?: string }[];
  resourceTypes: { key: string; name: string }[];
};
export type Release = { taxonomy: string; catalog: string; grapplemapSnapshot: string };

export type Curated = {
  core: Core;
  gi: GiTechnique[];
  flows: FlowsMap;
  edgeTypes: Record<string, TechniqueType>;
  nameRules: NameRules;
  catalog: Catalog;
  release: Release;
  attribution: unknown;
};

const read = <T>(dir: string, file: string): T => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as T;

/** The JSON block inside ATTRIBUTION.md is the machine-readable attribution (→ attribution.json). */
export function attributionFrom(markdown: string): unknown {
  const m = /```json\n([\s\S]*?)\n```/.exec(markdown);
  if (!m) throw new Error('ATTRIBUTION.md has no ```json block');
  return JSON.parse(m[1]!);
}

export function loadCurated(dir: string): Curated {
  return {
    core: read<Core>(dir, 'core.json'),
    gi: read<{ techniques: GiTechnique[] }>(dir, 'gi.json').techniques,
    flows: read<FlowsMap>(dir, 'aliases.json'),
    edgeTypes: read<{ overrides: Record<string, TechniqueType> }>(dir, 'edge-types.json').overrides,
    nameRules: read<NameRules>(dir, 'name-rules.json'),
    catalog: read<Catalog>(dir, 'catalog.json'),
    release: read<Release>(dir, 'release.json'),
    attribution: attributionFrom(fs.readFileSync(path.join(dir, 'ATTRIBUTION.md'), 'utf8')),
  };
}

/**
 * The id registry `ids.json` (A-29): `<source>:<source_id>` → UUID v4, append-only. Lookups of a
 * missing key are collected; `--mint` fills them (the only non-deterministic step, run by a human).
 */
export class IdRegistry {
  private readonly ids: Record<string, string>;
  readonly missing = new Set<string>();
  private readonly used = new Set<string>();
  private readonly mint: boolean;

  constructor(ids: Record<string, string>, mint: boolean) {
    this.ids = { ...ids };
    this.mint = mint;
  }

  static load(file: string, mint: boolean): IdRegistry {
    return new IdRegistry(fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>) : {}, mint);
  }

  id(key: string): string {
    this.used.add(key);
    let v = this.ids[key];
    if (!v && this.mint) {
      v = randomUUID();
      this.ids[key] = v;
    }
    if (!v) {
      this.missing.add(key);
      return `00000000-0000-4000-8000-${'0'.repeat(12)}`;
    }
    return v;
  }

  /** Registry content with sorted keys (minted entries included). */
  sorted(): Record<string, string> {
    return Object.fromEntries(Object.keys(this.ids).sort().map((k) => [k, this.ids[k]!]));
  }

  /** Keys in the registry that this run did not use (retired rows keep their ids). */
  unused(): string[] {
    return Object.keys(this.ids).filter((k) => !this.used.has(k)).sort();
  }
}
