/**
 * Row and input shapes the UI consumes (plan §4). The UI imports these and the repository
 * namespaces from `src/repositories`, never drizzle-orm or expo-sqlite.
 */
import type { BackupExclusionStatus } from '../db/backup';
import type attributionJson from '../db/seed/attribution.json';
import type { DomainError } from '../domain/errors';
import type { ConsistencyData, PlannedVsActualData, ProgressResult } from '../domain/progression/types';
import type { SettingKey, SettingValue, SettingValueType } from '../domain/settings/defaults';

export type { SettingKey, SettingValue, SettingValueType };

export type FocusKind = 'POSITION' | 'SUBJECT';
export type TechniqueType = 'TRANSITION' | 'GUARD_PASS' | 'SWEEP' | 'ESCAPE' | 'TAKEDOWN' | 'SUBMISSION';
export type AppliesTo = 'GI' | 'NOGI' | 'BOTH';
export type Perspective = 'TOP' | 'BOTTOM';
export type Tier = 'CORE' | 'EXTENDED';
export type SessionStatus = 'PLANNED' | 'COMPLETED' | 'SKIPPED';
export type Direction = 'LANDED' | 'TAKEN';
export type Outcome = 'DOMINANT' | 'EVEN' | 'DOMINATED';
export type RankScale = 'ADULT' | 'KIDS';
export type AdultBelt = 'WHITE' | 'BLUE' | 'PURPLE' | 'BROWN' | 'BLACK';
export type KidsBelt =
  | 'WHITE' | 'GREY_WHITE' | 'GREY' | 'GREY_BLACK' | 'YELLOW_WHITE' | 'YELLOW' | 'YELLOW_BLACK'
  | 'ORANGE_WHITE' | 'ORANGE' | 'ORANGE_BLACK' | 'GREEN_WHITE' | 'GREEN' | 'GREEN_BLACK';
export type Belt = AdultBelt | KidsBelt;
export type SuggestionSource = 'LAST_NEEDS_WORK' | 'CYCLE' | 'NEEDS_WORK' | 'NOT_TRAINED';
export type Rating = 1 | 2 | 3 | 4 | 5;

/** `data === undefined && !error` means loading. */
export type HookResult<T> = { data?: T; error?: DomainError };

export type FocusRef = { kind: FocusKind; refId: string };

export type FocusInput = FocusRef & {
  isPlanned: boolean;
  isActual: boolean;
  needsWork?: boolean;
  rating?: Rating;
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
  /** Current name of the referenced position/subject (renames show through). */
  name: string;
  aliases: string[];
  /** The referenced position/subject is soft-deleted; render with "(removed)". */
  removed: boolean;
  techniques: { id: string; name: string }[];
};

export type SubmissionInput = {
  id?: string;
  direction: Direction;
  techniqueId?: string;
  roundId?: string;
  note?: string;
};

export type SubmissionRow = {
  id: string;
  direction: Direction;
  techniqueId?: string;
  techniqueName?: string;
  roundId?: string;
  note?: string;
};

export type RoundInput = {
  id?: string;
  roundNo: number;
  partnerBelt?: Belt;
  outcome?: Outcome;
  durationMinutes?: number;
  note?: string;
  submissions?: SubmissionInput[];
};

export type RoundRow = {
  id: string;
  roundNo: number;
  partnerBelt?: Belt;
  outcome?: Outcome;
  durationMinutes?: number;
  note?: string;
  submissions: SubmissionRow[];
};

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
  /** Session-level submissions only (`roundId` absent); per-round ones are under `rounds`. */
  submissions: SubmissionRow[];
  rounds: RoundRow[];
};

export type Aggregates = { roundsCount?: number; submissionsLanded?: number; submissionsTaken?: number };

export type LogSessionInput = {
  sessionId?: string;
  sessionTypeId: string;
  /** ISO-8601 UTC. */
  startsAt: string;
  /** IANA zone of the device at log time; fixes `localDate` (ADR 0016). */
  timeZone: string;
  durationMinutes?: number;
  rating?: Rating;
  intensity?: Rating;
  energy?: Rating;
  contextNote?: string;
  whatWorked?: string;
  whatFailed?: string;
  focuses: FocusInput[];
  aggregates?: Aggregates;
  submissions?: SubmissionInput[];
  rounds?: RoundInput[];
};

export type PlanSessionInput = {
  sessionId?: string;
  sessionTypeId: string;
  startsAt: string;
  timeZone: string;
  focuses: FocusRef[];
};

export type Suggestion = { ref: FocusRef; name: string; source: SuggestionSource };

export type RankEntry = {
  id: string;
  scale: RankScale;
  belt: Belt;
  stripes: number;
  awardedOn: string;
  note?: string;
};

export type RankInput = { scale: RankScale; belt: Belt; stripes: number; awardedOn: string; note?: string };

export type HomeData = {
  /** Local date (device zone) the partition was computed for. */
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

export type QuickLogTarget = { sessionId: string } | { sessionTypeId: string; focuses: [] };

export type FocusPickerRow = FocusRef & { name: string; aliases: string[]; matchedAlias?: string; tier?: Tier };

export type PositionRow = {
  id: string;
  slug: string;
  canonicalName: string;
  aliases: string[];
  tier: Tier;
  parentId?: string;
  matchedAlias?: string;
};

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
  /** Live aliases with ids, for remove/undo (N9); `aliases` stays for display. */
  aliasRows: AliasRow[];
  parent?: { id: string; canonicalName: string };
  children: { id: string; canonicalName: string; tier: Tier }[];
  /** Ordered by type, then name. */
  techniquesFrom: TechniqueRow[];
  /** Ordered by type, then name. */
  techniquesTo: TechniqueRow[];
};

export type SubjectRow = { id: string; name: string; description?: string };
export type SessionTypeRow = { id: string; name: string; sortOrder: number };

export type Setting<K extends SettingKey = SettingKey> = { key: K; value: SettingValue<K>; valueType: SettingValueType };

export type AlgorithmParamRow = {
  id: string;
  algorithmVersion: string;
  key: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
};

export type ImportReport = {
  release: string;
  added: number;
  updated: number;
  skippedUserEdited: number;
  skippedDeleted: number;
  retired: number;
};

export type EnsureSeededResult = {
  taxonomy: ImportReport | 'current';
  catalog: 'seeded' | 'current';
  /** Settings rows inserted this run. */
  settings: number;
  /** algorithm_params rows inserted this run. */
  params: number;
};

// ---------------------------------------------------------------------------------------------
// Sprint 2 (progress-settings plan §5.1)
// ---------------------------------------------------------------------------------------------

export type { BackupExclusion, BackupExclusionResult, BackupExclusionStatus } from '../db/backup';
export type {
  ConsistencyData, DayCell, FocusHistory, FocusHistoryRow, GapRow, PlannedVsActualData, ProgressResult, ProgressState,
  SessionDayRow, SignalId, SignalRow, WeekRow,
} from '../domain/progression/types';

export type ProgressOverview = {
  today: string;
  windowStart: string;
  algorithmVersion: string;
  params: Record<string, number>;
  /** PS-04: live focuses first, then removed; each by state (NEEDS_WORK, NOT_TRAINED, STEADY, IMPROVING), then name. */
  results: ProgressResult[];
  consistency: ConsistencyData;
  plannedVsActual: PlannedVsActualData;
};
export type ParamInput = { version: string; key: string; value: number };

export type TaxonomyKind = 'POSITION' | 'TECHNIQUE' | 'SUBJECT';
export type PositionInput = {
  canonicalName: string;
  parentId?: string | null;
  description?: string;
  notes?: string;
  /** Rename only; default true (R-50). */
  keepOldNameAsAlias?: boolean;
};
export type TechniqueInput = {
  name: string;
  type: TechniqueType;
  fromPositionId: string;
  toPositionId?: string | null;
  appliesTo: AppliesTo;
  perspective?: Perspective | null;
  description?: string;
  notes?: string;
  keepOldNameAsAlias?: boolean;
};
export type SubjectInput = { name: string; description?: string };
export type AliasRow = { id: string; targetKind: 'POSITION' | 'TECHNIQUE'; targetId: string; name: string; origin: 'seed' | 'user' };
export type MergeResult = {
  mergeId: string;
  kind: TaxonomyKind;
  fromId: string;
  intoId: string;
  /** Re-pointed rows per table name. */
  moved: Record<string, number>;
  folded: number;
  aliasesAdded: number;
};

export type ResourceStatus = 'TO_WATCH' | 'WATCHED';
export type ResourceRow = {
  id: string;
  title: string;
  url?: string;
  author?: string;
  resourceTypeId: string;
  resourceTypeName: string;
  notes?: string;
  status: ResourceStatus;
  origin: 'seed' | 'user';
};
export type ResourceInput = { title: string; url?: string; author?: string; resourceTypeId: string; notes?: string; status?: ResourceStatus };
export type ResourceTarget = { kind: 'TECHNIQUE' | 'POSITION' | 'SUBJECT' | 'CYCLE'; id: string };
export type ResourceTypeRow = { id: string; name: string; sortOrder: number };

export type TechniqueHistoryRow = { sessionId: string; localDate: string; sessionTypeName: string; via: 'ATTACHED' | 'SUBMISSION' };
export type TechniqueDetail = TechniqueRow & {
  description?: string;
  notes?: string;
  origin: 'seed' | 'user';
  /** The technique itself is soft-deleted (opened from history). */
  removed: boolean;
  resources: ResourceRow[];
  /** Endpoint soft-delete flags (design §10.2, N9): the UI renders "(removed)" and disables the link. */
  fromRemoved: boolean;
  toRemoved?: boolean;
  /** Aliases with ids for remove/undo; `aliases: string[]` (from TechniqueRow) stays for display. */
  aliasRows: AliasRow[];
  /** Newest first, at most 20 rows (PS-16). */
  history: TechniqueHistoryRow[];
};

export type AttributionData = typeof attributionJson;
export type AboutData = {
  appVersion: string;
  algorithmVersion: string;
  taxonomyRelease: string;
  backup: BackupExclusionStatus;
  attribution: AttributionData;
};
