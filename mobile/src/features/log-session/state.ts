import type {
  Direction, FocusInput, FocusKind, FocusPickerRow, HomeData, LogSessionInput, PlanSessionInput, SessionDetail,
} from '../../hooks/data';

export type LogMode = 'log' | 'plan' | 'edit';
export type TechniqueRef = { id: string; name: string };

export type FocusDraft = {
  kind: FocusKind;
  refId: string;
  name: string;
  planned: boolean;
  actual: boolean;
  removed: boolean;
  needsWork: boolean;
  rating?: number;
  comment: string;
  hitCount?: number;
  caughtCount?: number;
  techniques: TechniqueRef[];
};

export type SubmissionDraft = { direction: Direction; techniqueId: string; name: string };

export type LogDraft = {
  mode: LogMode;
  sessionId?: string;
  sessionTypeId?: string;
  when: Date;
  durationMinutes?: number;
  rating?: number;
  intensity?: number;
  energy?: number;
  contextNote: string;
  whatWorked: string;
  whatFailed: string;
  focuses: FocusDraft[];
  rounds?: number;
  landed?: number;
  taken?: number;
  submissions: SubmissionDraft[];
};

export type TextField = 'contextNote' | 'whatWorked' | 'whatFailed';
export type ScaleField = 'rating' | 'intensity' | 'energy';

export type Action =
  | { type: 'setType'; id: string }
  | { type: 'setWhen'; when: Date }
  | { type: 'addFocus'; kind: FocusKind; refId: string; name: string; actual: boolean }
  | { type: 'removeFocus'; refId: string }
  | { type: 'toggleTrained'; refId: string }
  | { type: 'focusPatch'; refId: string; patch: Partial<Pick<FocusDraft, 'rating' | 'needsWork' | 'comment' | 'hitCount' | 'caughtCount'>> }
  | { type: 'attachTechnique'; refId: string; technique: TechniqueRef }
  | { type: 'detachTechnique'; refId: string; techniqueId: string }
  | { type: 'setCount'; field: 'rounds' | 'landed' | 'taken' | 'durationMinutes'; value: number | undefined }
  | { type: 'setScale'; field: ScaleField; value: number | undefined }
  | { type: 'setText'; field: TextField; value: string }
  | { type: 'addSubmission'; submission: SubmissionDraft }
  | { type: 'removeSubmission'; direction: Direction; index: number };

const patchFocus = (d: LogDraft, refId: string, fn: (f: FocusDraft) => FocusDraft): LogDraft => ({
  ...d,
  focuses: d.focuses.map((f) => (f.refId === refId ? fn(f) : f)),
});

export function reducer(d: LogDraft, a: Action): LogDraft {
  switch (a.type) {
    case 'setType': return { ...d, sessionTypeId: a.id };
    case 'setWhen': return { ...d, when: a.when };
    case 'addFocus':
      if (d.focuses.some((f) => f.refId === a.refId)) return d;
      return {
        ...d,
        focuses: [...d.focuses, {
          kind: a.kind, refId: a.refId, name: a.name, planned: d.mode === 'plan', actual: d.mode === 'plan' ? false : a.actual,
          removed: false, needsWork: false, comment: '', techniques: [],
        }],
      };
    case 'removeFocus': return { ...d, focuses: d.focuses.filter((f) => f.refId !== a.refId) };
    // Un-ticking keeps the row (F-20); its body values stay in local state but are not sent.
    case 'toggleTrained': return patchFocus(d, a.refId, (f) => ({ ...f, actual: !f.actual }));
    case 'focusPatch': return patchFocus(d, a.refId, (f) => ({ ...f, ...a.patch }));
    case 'attachTechnique':
      return patchFocus(d, a.refId, (f) => (f.techniques.some((t) => t.id === a.technique.id) ? f : { ...f, techniques: [...f.techniques, a.technique] }));
    case 'detachTechnique':
      return patchFocus(d, a.refId, (f) => ({ ...f, techniques: f.techniques.filter((t) => t.id !== a.techniqueId) }));
    case 'setCount': return { ...d, [a.field === 'rounds' ? 'rounds' : a.field]: a.value };
    case 'setScale': return { ...d, [a.field]: a.value };
    case 'setText': return { ...d, [a.field]: a.value };
    case 'addSubmission': return { ...d, submissions: [...d.submissions, a.submission] };
    case 'removeSubmission': {
      let seen = -1;
      return { ...d, submissions: d.submissions.filter((s) => (s.direction === a.direction && ++seen === a.index ? false : true)) };
    }
  }
}

/** Plan mode needs ≥ 1 focus; log/edit need ≥ 1 trained focus (plan §8, R-C6). */
export function canSave(d: LogDraft): boolean {
  if (!d.sessionTypeId) return false;
  return d.mode === 'plan' ? d.focuses.length >= 1 : d.focuses.some((f) => f.actual);
}

export const namedCount = (d: LogDraft, direction: Direction) => d.submissions.filter((s) => s.direction === direction).length;

export const submissionsOf = (d: LogDraft, direction: Direction) => d.submissions.filter((s) => s.direction === direction);

export function isDirty(current: LogDraft, initial: LogDraft): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial);
}

const rating5 = (n: number | undefined) => (n && n >= 1 && n <= 5 ? (n as 1 | 2 | 3 | 4 | 5) : undefined);
const text = (s: string) => (s.trim() ? s.trim() : undefined);

export function toLogInput(d: LogDraft, timeZone: string): LogSessionInput {
  const focuses: FocusInput[] = d.focuses.map((f) => ({
    kind: f.kind,
    refId: f.refId,
    isPlanned: f.planned,
    isActual: f.actual,
    // Body values are sent only while the row is actual (NEEDS_WORK_REQUIRES_ACTUAL & co. cannot trigger).
    ...(f.actual
      ? {
          needsWork: f.needsWork,
          rating: rating5(f.rating),
          comment: text(f.comment),
          hitCount: f.hitCount,
          caughtCount: f.caughtCount,
          techniqueIds: f.techniques.map((t) => t.id),
        }
      : {}),
  }));
  return {
    sessionId: d.sessionId,
    sessionTypeId: d.sessionTypeId ?? '',
    startsAt: d.when.toISOString(),
    timeZone,
    durationMinutes: d.durationMinutes,
    rating: d.rating,
    intensity: d.intensity,
    energy: d.energy,
    contextNote: text(d.contextNote),
    whatWorked: text(d.whatWorked),
    whatFailed: text(d.whatFailed),
    focuses,
    aggregates: { roundsCount: d.rounds, submissionsLanded: d.landed, submissionsTaken: d.taken },
    submissions: d.submissions.map((s) => ({ direction: s.direction, techniqueId: s.techniqueId })),
  };
}

export function toPlanInput(d: LogDraft, timeZone: string): PlanSessionInput {
  return {
    sessionId: d.sessionId,
    sessionTypeId: d.sessionTypeId ?? '',
    startsAt: d.when.toISOString(),
    timeZone,
    focuses: d.focuses.map((f) => ({ kind: f.kind, refId: f.refId })),
  };
}

/** D-A8: plan mode defaults to today at the next full hour; log mode to now. */
export function defaultWhen(mode: LogMode, now: Date = new Date()): Date {
  if (mode !== 'plan') return now;
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

export function draftFromSession(s: SessionDetail, mode: LogMode): LogDraft {
  const fromPlan = s.status === 'PLANNED';
  return {
    mode,
    sessionId: s.id,
    sessionTypeId: s.sessionTypeId,
    when: new Date(s.startsAt),
    durationMinutes: s.durationMinutes,
    rating: s.rating,
    intensity: s.intensity,
    energy: s.energy,
    contextNote: s.contextNote ?? '',
    whatWorked: s.whatWorked ?? '',
    whatFailed: s.whatFailed ?? '',
    focuses: [...s.focuses]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((f) => ({
        kind: f.kind, refId: f.refId, name: f.name, planned: f.isPlanned,
        // Completing a plan pre-ticks every planned row (plan §8).
        actual: mode === 'plan' ? false : fromPlan ? f.isPlanned : f.isActual,
        removed: f.removed, needsWork: f.needsWork, rating: f.rating, comment: f.comment ?? '',
        hitCount: f.hitCount, caughtCount: f.caughtCount, techniques: f.techniques,
      })),
    rounds: s.roundsCount,
    landed: s.submissionsLanded,
    taken: s.submissionsTaken,
    submissions: s.submissions.flatMap((x) => (x.techniqueId ? [{ direction: x.direction, techniqueId: x.techniqueId, name: x.techniqueName ?? x.techniqueId }] : [])),
  };
}

export function blankDraft(mode: LogMode, sessionTypeId: string | undefined, when: Date = defaultWhen(mode)): LogDraft {
  return {
    mode, sessionTypeId, when, contextNote: '', whatWorked: '', whatFailed: '', focuses: [], submissions: [],
  };
}

export type QuickAddGroups = { flagged: FocusPickerRow[]; last: FocusPickerRow[] };

/** D-A4: flagged focuses of the last session, then its other trained ones; at most 6; added ones excluded. */
export function quickAddGroups(home: HomeData | undefined, added: Set<string>): QuickAddGroups {
  const rows = (home?.lastCompleted?.focuses ?? []).filter((f) => f.isActual && !f.removed && !added.has(f.refId));
  const toRow = (f: (typeof rows)[number]): FocusPickerRow => ({ kind: f.kind, refId: f.refId, name: f.name, aliases: f.aliases });
  const flagged = rows.filter((f) => f.needsWork).map(toRow).slice(0, 6);
  const last = rows.filter((f) => !f.needsWork).map(toRow).slice(0, 6 - flagged.length);
  return { flagged, last };
}

/** Param `focus=POSITION:<id>` from a Home suggestion. */
export function parseFocusParam(p: string | undefined): { kind: FocusKind; refId: string } | undefined {
  if (!p) return undefined;
  const [kind, refId] = p.split(':');
  return (kind === 'POSITION' || kind === 'SUBJECT') && refId ? { kind, refId } : undefined;
}
