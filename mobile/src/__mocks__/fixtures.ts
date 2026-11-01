import type {
  FocusRow, PositionRow, RankEntry, SessionDetail, SessionTypeRow, SubjectRow, TechniqueRow,
} from '../hooks/data/types';

/** Phase-A typed mock data shaped to docs/foundation/plan.md §4. Names are data, not copy. */

export const sessionTypes: SessionTypeRow[] = [
  { id: 'st-gi', name: 'Gi class', sortOrder: 1 },
  { id: 'st-nogi', name: 'No-gi class', sortOrder: 2 },
  { id: 'st-open', name: 'Open mat', sortOrder: 3 },
  { id: 'st-drill', name: 'Drilling', sortOrder: 4 },
  { id: 'st-comp', name: 'Competition prep', sortOrder: 5 },
  { id: 'st-private', name: 'Private lesson', sortOrder: 6 },
];

export const positions: (PositionRow & { description?: string })[] = [
  { id: 'pos-closed', slug: 'closed-guard', canonicalName: 'Closed guard', aliases: ['Full guard'], tier: 'CORE', description: 'Legs locked around the opponent’s torso.' },
  { id: 'pos-half', slug: 'half-guard', canonicalName: 'Half guard', aliases: ['Half'], tier: 'CORE' },
  { id: 'pos-mount', slug: 'mount', canonicalName: 'Mount', aliases: ['Full mount'], tier: 'CORE' },
  { id: 'pos-side', slug: 'side-control', canonicalName: 'Side control', aliases: ['Cross side', '100 kilos'], tier: 'CORE' },
  { id: 'pos-kob', slug: 'knee-on-belly', canonicalName: 'Knee on belly', aliases: ['Knee ride'], tier: 'CORE' },
  { id: 'pos-scarf', slug: 'scarf-hold', canonicalName: 'Scarf hold', aliases: ['Kesa gatame'], tier: 'EXTENDED', parentId: 'pos-side' },
  { id: 'pos-turtle', slug: 'turtle', canonicalName: 'Turtle', aliases: [], tier: 'CORE' },
  { id: 'pos-back', slug: 'back-control', canonicalName: 'Back control', aliases: ['Back mount'], tier: 'CORE' },
];

export const subjects: SubjectRow[] = [
  { id: 'sub-grips', name: 'Grip fighting', description: 'Winning the hand fight before the position starts.' },
  { id: 'sub-escapes', name: 'Escapes', description: 'Recovering guard from bad positions.' },
  { id: 'sub-pressure', name: 'Pressure passing' },
];

const t = (r: Omit<TechniqueRow, 'tier' | 'aliases' | 'appliesTo'> & Partial<TechniqueRow>): TechniqueRow => ({
  tier: 'CORE', aliases: [], appliesTo: 'BOTH', ...r,
});

export const techniques: TechniqueRow[] = [
  t({ id: 'tec-scissor', slug: 'scissor-sweep', name: 'Scissor sweep', type: 'SWEEP', fromPositionId: 'pos-closed', fromName: 'Closed guard', toPositionId: 'pos-mount', toName: 'Mount', perspective: 'BOTTOM' }),
  t({ id: 'tec-kimura', slug: 'kimura', name: 'Kimura', type: 'SUBMISSION', fromPositionId: 'pos-closed', fromName: 'Closed guard', aliases: ['Double wrist lock'] }),
  t({ id: 'tec-armbar', slug: 'armbar-mount', name: 'Armbar from mount', type: 'SUBMISSION', fromPositionId: 'pos-mount', fromName: 'Mount' }),
  t({ id: 'tec-collar', slug: 'collar-choke', name: 'Collar choke', type: 'SUBMISSION', fromPositionId: 'pos-closed', fromName: 'Closed guard', appliesTo: 'GI' }),
  t({ id: 'tec-knee-cut', slug: 'knee-cut', name: 'Knee cut pass', type: 'GUARD_PASS', fromPositionId: 'pos-half', fromName: 'Half guard', toPositionId: 'pos-side', toName: 'Side control', perspective: 'TOP' }),
  t({ id: 'tec-mount-esc', slug: 'trap-and-roll', name: 'Trap and roll', type: 'ESCAPE', fromPositionId: 'pos-mount', fromName: 'Mount', toPositionId: 'pos-closed', toName: 'Closed guard', appliesTo: 'NOGI' }),
  t({ id: 'tec-ezekiel', slug: 'ezekiel', name: 'Ezekiel choke', type: 'SUBMISSION', fromPositionId: 'pos-mount', fromName: 'Mount', tier: 'EXTENDED' }),
];

const isoDaysFromNow = (days: number, hour: number, now: Date) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const focus = (kind: FocusRow['kind'], refId: string, name: string, over: Partial<FocusRow> = {}): FocusRow => ({
  id: `fr-${refId}`, kind, refId, name, aliases: [], isPlanned: false, isActual: true, needsWork: false,
  sortOrder: 0, removed: false, techniques: [], ...over,
});

export function localDateOf(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function buildSessions(now: Date): SessionDetail[] {
  const base = (id: string, status: SessionDetail['status'], typeId: string, startsAt: string, focuses: FocusRow[], over: Partial<SessionDetail> = {}): SessionDetail => ({
    id, status, sessionTypeId: typeId, sessionTypeName: sessionTypes.find((s) => s.id === typeId)?.name ?? typeId,
    startsAt, localDate: localDateOf(startsAt), focusNames: focuses.map((f) => f.name), focuses, submissions: [], rounds: [], ...over,
  });
  return [
    base('ses-last', 'COMPLETED', 'st-nogi', isoDaysFromNow(-2, 19, now), [
      focus('POSITION', 'pos-half', 'Half guard', { needsWork: true, rating: 3, isPlanned: true, comment: 'Lost the underhook.' }),
      focus('POSITION', 'pos-mount', 'Mount', { rating: 4, hitCount: 2, caughtCount: 0 }),
    ], { durationMinutes: 90, rating: 4, intensity: 4, energy: 3, whatWorked: 'Knee cut', whatFailed: 'Guard retention', roundsCount: 5, submissionsLanded: 2, submissionsTaken: 1 }),
    base('ses-old', 'COMPLETED', 'st-gi', isoDaysFromNow(-6, 18, now), [focus('POSITION', 'pos-closed', 'Closed guard', { rating: 5 })], { durationMinutes: 60, rating: 5 }),
    base('ses-today', 'PLANNED', 'st-gi', isoDaysFromNow(0, 23, now), [
      focus('POSITION', 'pos-side', 'Side control', { isPlanned: true, isActual: false }),
      focus('SUBJECT', 'sub-grips', 'Grip fighting', { isPlanned: true, isActual: false }),
    ]),
    base('ses-stale', 'PLANNED', 'st-open', isoDaysFromNow(-3, 12, now), [focus('POSITION', 'pos-turtle', 'Turtle', { isPlanned: true, isActual: false })]),
  ];
}

export const currentRank: RankEntry = { id: 'rk-1', scale: 'ADULT', belt: 'BLUE', stripes: 2, awardedOn: '2025-06-14' };
