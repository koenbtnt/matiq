import type { FocusHistory, ProgressClock, ProgressResult, ProgressState, SignalRow } from '../types';
import { requireV1Params, type V1Params } from './params';
import { computeSignals, type FocusSignals } from './signals';

type Scored = 'needsWorkRate' | 'hitRatio' | 'gap' | 'trend';

/** The four scored signals, their weight key and the §6.4 term. */
const SCORED: readonly { signal: Scored; weight: keyof V1Params; term: (v: number) => number }[] = [
  { signal: 'needsWorkRate', weight: 'wNeedsWork', term: (v) => v },
  { signal: 'hitRatio', weight: 'wHitCaught', term: (v) => 1 - v },
  { signal: 'gap', weight: 'wGap', term: (v) => v },
  { signal: 'trend', weight: 'wTrend', term: (v) => Math.max(0, -v) / 4 },
];

/** §6.4 score: weighted mean over the available scored signals (rescaled); 0 when their weights sum to 0. */
function scoreOf(s: FocusSignals, p: V1Params): { score: number; weights: Partial<Record<Scored, number>> } {
  const avail = SCORED.filter((d) => s[d.signal].available);
  const total = avail.reduce((sum, d) => sum + p[d.weight], 0);
  const weights: Partial<Record<Scored, number>> = {};
  let score = 0;
  for (const d of avail) {
    weights[d.signal] = total > 0 ? p[d.weight] / total : 0;
    if (total > 0) score += p[d.weight] * d.term(s[d.signal].value!);
  }
  return { score: total > 0 ? score / total : 0, weights };
}

function evaluate(s: FocusSignals, p: V1Params) {
  const stale = !s.daysSince.available || s.daysSince.value! > p.staleDays;
  if (s.n === 0 || stale) return { state: 'NOT_TRAINED' as ProgressState, rule: 1 as const, score: undefined, weights: {} };
  const { score, weights } = scoreOf(s, p);
  if (score >= p.needsWorkThreshold) return { state: 'NEEDS_WORK' as ProgressState, rule: 2 as const, score, weights };
  if (s.trend.available && s.trend.value! >= p.trendImproving && s.n >= p.minSessions)
    return { state: 'IMPROVING' as ProgressState, rule: 3 as const, score, weights };
  return { state: 'STEADY' as ProgressState, rule: 4 as const, score, weights };
}

function signalRows(s: FocusSignals, p: V1Params, rule: 1 | 2 | 3 | 4, weights: Partial<Record<Scored, number>>): SignalRow[] {
  const row = (signal: SignalRow['signal'], available: boolean, value: number | undefined, extra: Partial<SignalRow>, contributed: boolean): SignalRow => {
    const out: SignalRow = { signal, available, contributed };
    if (value !== undefined) out.value = value;
    if (extra.weight !== undefined) out.weight = extra.weight;
    if (extra.threshold !== undefined) out.threshold = extra.threshold;
    return out;
  };
  const scoredContributed = (sig: Scored) => rule === 2 && s[sig].available && (weights[sig] ?? 0) > 0;
  const scored = (sig: Scored) =>
    row(sig, s[sig].available, s[sig].value, { weight: s[sig].available && rule !== 1 ? weights[sig] : undefined, threshold: sig === 'trend' ? p.trendImproving : undefined }, sig === 'trend' ? scoredContributed(sig) || rule === 3 : scoredContributed(sig));
  return [
    row('n', s.n > 0, s.n, { threshold: p.minSessions }, (rule === 1 && s.n === 0) || rule === 3),
    scored('trend'),
    scored('needsWorkRate'),
    scored('gap'),
    row('daysSince', s.daysSince.available, s.daysSince.value, { threshold: p.staleDays }, rule === 1 && s.daysSince.available && s.daysSince.value! > p.staleDays),
    scored('hitRatio'),
  ];
}

/**
 * Progression algorithm v1 (plan §6, PRODUCT §7): pure; params and the clock are inputs. Returns
 * one result per history, unsorted. Throws PARAM_UNKNOWN when a v1 key is missing.
 */
export function computeProgression(
  histories: readonly FocusHistory[],
  params: Readonly<Record<string, number>>,
  clock: ProgressClock,
): ProgressResult[] {
  const p = requireV1Params(params);
  return histories.map((h) => {
    const s = computeSignals(h.rows, p, clock);
    const { state, rule, score, weights } = evaluate(s, p);
    const result: ProgressResult = {
      ref: { kind: h.ref.kind, refId: h.ref.refId },
      name: h.name,
      removed: h.removed,
      state,
      rule,
      flagged: s.flagged,
      n: s.n,
      signals: signalRows(s, p, rule, weights),
    };
    if (score !== undefined) result.score = score;
    if (s.lastTrainedOn) result.lastTrainedOn = s.lastTrainedOn;
    return result;
  });
}
