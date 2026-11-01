import { canonical, decodePose, keyOf, rms, variants } from './pose.ts';

export type ResolveOptions = {
  /** Grid of the quantised key, metres. */
  eps: number;
  /** Nearest-neighbour acceptance: RMS joint distance below this, metres. */
  epsMax: number;
};

export const DEFAULT_RESOLVE: ResolveOptions = { eps: 0.02, epsMax: 0.03 };

export type Resolution = { index: number; method: 'key' | 'nearest'; distance: number } | { index: null; method: 'unresolved'; distance: number };

/**
 * Endpoint resolution (F-12): positions are indexed by the canonical key of all four symmetry
 * variants of their pose; a transition endpoint resolves by key, else to the nearest position
 * variant whose RMS joint distance is below `epsMax`, else it is unresolved (the edge is dropped,
 * the nodes stay). Ties go to the lower record index, so the result is deterministic.
 */
export class PoseIndex {
  private readonly byKey = new Map<string, number>();
  private readonly all: { index: number; v: number[] }[] = [];
  private readonly opts: ResolveOptions;

  constructor(positions: readonly { index: number; digits: string }[], opts: ResolveOptions = DEFAULT_RESOLVE) {
    this.opts = opts;
    for (const p of positions) {
      for (const v of variants(decodePose(p.digits)).map(canonical)) {
        const key = keyOf(v, opts.eps);
        if (!this.byKey.has(key)) this.byKey.set(key, p.index);
        this.all.push({ index: p.index, v });
      }
    }
  }

  /** Keys that map to more than one position (should be 0 for the tuned eps). */
  ownKeyCollisions(positions: readonly { index: number; digits: string }[]): number {
    const seen = new Map<string, number>();
    let n = 0;
    for (const p of positions) {
      const k = keyOf(canonical(decodePose(p.digits)), this.opts.eps);
      if (seen.has(k) && seen.get(k) !== p.index) n += 1;
      seen.set(k, p.index);
    }
    return n;
  }

  resolve(digits: string): Resolution {
    const v = canonical(decodePose(digits));
    const hit = this.byKey.get(keyOf(v, this.opts.eps));
    if (hit !== undefined) return { index: hit, method: 'key', distance: 0 };
    let best = Infinity;
    let bestIndex = -1;
    for (const c of this.all) {
      const d = rms(v, c.v);
      if (d < best || (d === best && c.index < bestIndex)) {
        best = d;
        bestIndex = c.index;
      }
    }
    const distance = Math.round(best * 1e6) / 1e6;
    return best < this.opts.epsMax ? { index: bestIndex, method: 'nearest', distance } : { index: null, method: 'unresolved', distance };
  }
}
