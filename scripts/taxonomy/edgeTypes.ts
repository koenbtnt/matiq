export type TechniqueType = 'TRANSITION' | 'GUARD_PASS' | 'SWEEP' | 'ESCAPE' | 'TAKEDOWN' | 'SUBMISSION';

const SUBMISSION_TAGS = new Set([
  'kimura', 'armbar', 'triangle', 'rear_naked_choke', 'guillotine', 'darce', 'anaconda', 'omoplata', 'monoplata',
  'gogoplata', 'twister', 'neck_crank', 'calf_crank', 'americana', 'ezekiel', 'heel_hook', 'kneebar', 'knee_bar',
  'toe_hold', 'toehold', 'straight_ankle_lock', 'arm_triangle', 'north_south_choke', 'loop_choke', 'bow_and_arrow',
  'baseball_choke', 'peruvian_necktie', 'japanese_necktie', 'electric_chair', 'banana_split', 'arm_choke',
]);

type Rule = { type: Exclude<TechniqueType, 'TRANSITION'>; tag: (t: string) => boolean; name: RegExp };

/**
 * Priority order (F-13): SUBMISSION > TAKEDOWN > GUARD_PASS > SWEEP > ESCAPE > TRANSITION. Tags
 * decide first; name keywords are the fallback; `edge-types.json` overrides by source id win.
 * `knee_bar` / `toehold` / `arm_choke` are the spellings GrappleMap uses for the plan's
 * `kneebar` / `toe_hold` / arm chokes.
 */
const RULES: Rule[] = [
  {
    type: 'SUBMISSION',
    tag: (t) => SUBMISSION_TAGS.has(t),
    name: /\b(tap|taps|choke|crank|arm ?bar|knee ?bar|toe ?hold|heel ?hook|ankle ?lock|americana)\b/,
  },
  {
    type: 'TAKEDOWN',
    tag: (t) => t.endsWith('_takedown') || ['takedown', 'throw', 'trip', 'inside_trip', 'ankle_pick', 'knee_pick', 'te_waza', 'ashi_waza', 'koshi_waza', 'sutemi_waza', 'sacrifice_throw'].includes(t),
    name: /\b(takedown|throw|trip|ankle pick|double leg|single leg)\b/,
  },
  {
    type: 'GUARD_PASS',
    tag: (t) => t === 'pass' || t.startsWith('pass_') || t === 'passing' || ['knee_slice', 'leg_drag', 'back_step'].includes(t),
    name: /\bpass(es|ing)?\b/,
  },
  { type: 'SWEEP', tag: (t) => t === 'sweep' || t.endsWith('_sweep'), name: /\bsweeps?\b/ },
  { type: 'ESCAPE', tag: (t) => t === 'escape' || t === 'bridge', name: /\bescapes?\b/ },
];

/** Edge type of a GrappleMap transition from its own tags, then its normalised (lower-case) name. */
export function deriveType(tags: readonly string[], name: string, override?: TechniqueType): TechniqueType {
  if (override) return override;
  for (const r of RULES) if (tags.some(r.tag)) return r.type;
  const n = name.toLowerCase();
  for (const r of RULES) if (r.name.test(n)) return r.type;
  return 'TRANSITION';
}

export const perspectiveOf = (properties: readonly string[]): 'TOP' | 'BOTTOM' | undefined =>
  properties.includes('top') ? 'TOP' : properties.includes('bottom') ? 'BOTTOM' : undefined;
