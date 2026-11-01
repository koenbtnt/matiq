/**
 * Phase-A mirror of the data contract in docs/foundation/plan.md §4 (`repositories/contracts.ts`).
 * Phase B replaces this file's body with `export * from '../../repositories/contracts'`.
 */
export type FocusKind = 'POSITION' | 'SUBJECT';
export type TechniqueType = 'TRANSITION' | 'GUARD_PASS' | 'SWEEP' | 'ESCAPE' | 'TAKEDOWN' | 'SUBMISSION';
export type AppliesTo = 'GI' | 'NOGI' | 'BOTH';
export type Perspective = 'TOP' | 'BOTTOM';
export type Tier = 'CORE' | 'EXTENDED';
export type SessionStatus = 'PLANNED' | 'COMPLETED' | 'SKIPPED';
export type Direction = 'LANDED' | 'TAKEN';
export type Belt = 'WHITE' | 'BLUE' | 'PURPLE' | 'BROWN' | 'BLACK';
export type RankScale = 'ADULT' | 'KIDS';
export type SuggestionSource = 'LAST_NEEDS_WORK' | 'CYCLE' | 'NEEDS_WORK' | 'NOT_TRAINED';

export type DomainErrorLike = { code: string; message?: string };
export type HookResult<T> = { data?: T; error?: DomainErrorLike };

export type FocusRef = { kind: FocusKind; refId: string };
export type FocusInput = FocusRef & {
  isPlanned: boolean;
  isActual: boolean;
  needsWork?: boolean;
  rating?: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  hitCount?: number;
  caughtCount?: number;
  techniqueIds?: string[];
};
export type FocusRow = FocusRef & {
  id: string;
  isPlanned: boolean;
  isActual: boolean;
  needsWork: boolean;
  rating?: number;
  comment?: string;
  hitCount?: number;
  caughtCount?: number;
  sortOrder: number;
  name: string;
  aliases: string[];
  removed: boolean;
  techniques: { id: string; name: string }[];
};

export type SubmissionInput = { id?: string; direction: Direction; techniqueId?: string; roundId?: string; note?: string };
export type SubmissionRow = { id: string; direction: Direction; techniqueId?: string; techniqueName?: string; roundId?: string; note?: string };

export type SessionSummary = {
  id: string;
  status: SessionStatus;
  sessionTypeId: string;
  sessionTypeName: string;
  startsAt: string;
  localDate: string;
  durationMinutes?: number;
  rating?: number;
  focusNames: string[];
};
export type SessionDetail = SessionSummary & {
  intensity?: number;
  energy?: number;
  contextNote?: string;
  whatWorked?: string;
  whatFailed?: string;
  roundsCount?: number;
  submissionsLanded?: number;
  submissionsTaken?: number;
  completedAt?: string;
  reviewedAt?: string;
  focuses: FocusRow[];
  submissions: SubmissionRow[];
};

export type LogSessionInput = {
  sessionId?: string;
  sessionTypeId: string;
  startsAt: string;
  timeZone: string;
  durationMinutes?: number;
  rating?: number;
  intensity?: number;
  energy?: number;
  contextNote?: string;
  whatWorked?: string;
  whatFailed?: string;
  focuses: FocusInput[];
  aggregates?: { roundsCount?: number; submissionsLanded?: number; submissionsTaken?: number };
  submissions?: SubmissionInput[];
};
export type PlanSessionInput = { sessionId?: string; sessionTypeId: string; startsAt: string; timeZone: string; focuses: FocusRef[] };

export type Suggestion = { ref: FocusRef; name: string; source: SuggestionSource };
export type RankEntry = { id: string; scale: RankScale; belt: Belt; stripes: number; awardedOn: string; note?: string };
export type RankInput = { scale: RankScale; belt: Belt; stripes: number; awardedOn: string; note?: string };

export type HomeData = {
  today: string;
  nextPlanned?: SessionSummary;
  todayPlanned: SessionSummary[];
  stalePlanned: SessionSummary[];
  recent: SessionSummary[];
  lastCompleted?: SessionDetail;
  lastUsedTypeId?: string;
  suggestions: Suggestion[];
  rank?: RankEntry;
};

export type FocusPickerRow = FocusRef & { name: string; aliases: string[]; matchedAlias?: string; tier?: Tier };
export type PositionRow = { id: string; slug: string; canonicalName: string; aliases: string[]; tier: Tier; parentId?: string; matchedAlias?: string };
export type TechniqueRow = {
  id: string;
  slug: string;
  name: string;
  type: TechniqueType;
  fromPositionId: string;
  fromName: string;
  toPositionId?: string;
  toName?: string;
  appliesTo: AppliesTo;
  perspective?: Perspective;
  tier: Tier;
  aliases: string[];
  matchedAlias?: string;
};
export type PositionDetail = {
  id: string;
  slug: string;
  canonicalName: string;
  description?: string;
  notes?: string;
  tier: Tier;
  aliases: string[];
  parent?: { id: string; canonicalName: string };
  children: { id: string; canonicalName: string; tier: Tier }[];
  techniquesFrom: TechniqueRow[];
  techniquesTo: TechniqueRow[];
};
export type SubjectRow = { id: string; name: string; description?: string };
export type SessionTypeRow = { id: string; name: string; sortOrder: number };

/** `{ sessionId } | { sessionTypeId; focuses: [] }` — plan §4 `sessions.quickLogTarget`. */
export type QuickLogTarget = { sessionId: string } | { sessionTypeId: string; focuses: [] };

/** Bootstrap result (plan §4 `db.bootstrapDatabase`), without the `db` handle the UI never touches. */
export type BootstrapState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; code: string };

/** Mutations the screens call (plan §4). Each rejects with `{ code }` (a `DomainError`). */
export type DataActions = {
  logSession: (input: LogSessionInput) => Promise<SessionDetail>;
  planSession: (input: PlanSessionInput) => Promise<SessionDetail>;
  softDelete: (sessionId: string) => Promise<SessionSummary>;
  undoDelete: (sessionId: string) => Promise<SessionSummary>;
  skip: (sessionId: string) => Promise<SessionSummary>;
  undoSkip: (sessionId: string) => Promise<SessionSummary>;
  addRank: (input: RankInput) => Promise<RankEntry>;
  resetDatabase: () => Promise<void>;
};
