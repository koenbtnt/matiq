import type {
  FocusPickerRow, FocusRow, HomeData, LogSessionInput, PlanSessionInput,
  PositionDetail, PositionRow, RankEntry, RankInput, SessionDetail, SessionSummary, SubjectRow, Suggestion,
  TechniqueRow, TechniqueType,
} from '../repositories/contracts';
import { buildSessions, currentRank, localDateOf, positions, sessionTypes, subjects, techniques } from './fixtures';

/**
 * In-memory stand-in for the repositories (phase A). The seam in `src/hooks/data/index.ts` is the only
 * importer; phase B replaces that file's implementation and leaves the screens untouched.
 */

export type DomainErrorLike = { code: string; message?: string };
export type BootstrapState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; code: string };

type Listener = () => void;
export type ForcedState = 'loading' | { error: DomainErrorLike } | null;

class MockStore {
  private listeners = new Set<Listener>();
  private seq = 0;
  sessions: (SessionDetail & { deleted?: boolean })[] = [];
  rank: RankEntry | null = null;
  showExtended = false;
  bootstrap: BootstrapState = { status: 'ready' };
  /** Tests/dev: force every read hook into loading or error. */
  forced: ForcedState = null;
  /** Tests: make the next mutation reject with this code. */
  failNextWith: string | null = null;

  constructor() {
    this.reset();
  }

  reset(now: Date = new Date()) {
    this.sessions = buildSessions(now);
    this.rank = { ...currentRank };
    this.showExtended = false;
    this.bootstrap = { status: 'ready' };
    this.forced = null;
    this.failNextWith = null;
    this.seq = 0;
    this.emit();
  }

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => void this.listeners.delete(l);
  };
  emit() {
    this.listeners.forEach((l) => l());
  }
  private id(prefix: string) {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }
  private maybeFail() {
    if (this.failNextWith) {
      const code = this.failNextWith;
      this.failNextWith = null;
      throw { code } satisfies DomainErrorLike;
    }
  }

  // ---- reads -------------------------------------------------------------
  private live() {
    return this.sessions.filter((s) => !s.deleted);
  }
  private summary(s: SessionDetail): SessionSummary {
    const { id, status, sessionTypeId, sessionTypeName, startsAt, localDate, durationMinutes, rating, focusNames } = s;
    return { id, status, sessionTypeId, sessionTypeName, startsAt, localDate, durationMinutes, rating, focusNames };
  }

  home(): HomeData {
    const today = localDateOf(new Date().toISOString());
    const planned = this.live().filter((s) => s.status === 'PLANNED').sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const completed = this.live().filter((s) => s.status === 'COMPLETED').sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    const last = completed[0];
    const suggestions: Suggestion[] = (last?.focuses ?? [])
      .filter((f) => f.isActual && f.needsWork && !f.removed)
      .map((f) => ({ ref: { kind: f.kind, refId: f.refId }, name: f.name, source: 'LAST_NEEDS_WORK' as const }));
    return {
      today,
      nextPlanned: planned.filter((s) => s.localDate >= today).map((s) => this.summary(s))[0],
      todayPlanned: planned.filter((s) => s.localDate === today).map((s) => this.summary(s)),
      stalePlanned: planned.filter((s) => s.localDate < today).map((s) => this.summary(s)),
      recent: completed.slice(0, 5).map((s) => this.summary(s)),
      lastCompleted: last,
      lastUsedTypeId: last?.sessionTypeId,
      suggestions,
      rank: this.rank ?? undefined,
    };
  }

  session(id: string): SessionDetail {
    const s = this.live().find((x) => x.id === id);
    if (!s) throw { code: 'SESSION_NOT_FOUND' } satisfies DomainErrorLike;
    return s;
  }

  searchFocuses(query: string): FocusPickerRow[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const rows: FocusPickerRow[] = [
      ...positions.filter((p) => this.showExtended || p.tier === 'CORE').map((p) => ({ kind: 'POSITION' as const, refId: p.id, name: p.canonicalName, aliases: p.aliases, tier: p.tier })),
      ...subjects.map((s) => ({ kind: 'SUBJECT' as const, refId: s.id, name: s.name, aliases: [] as string[] })),
    ];
    return rows
      .flatMap((r) => {
        if (r.name.toLowerCase().includes(q)) return [{ r, rank: r.name.toLowerCase().startsWith(q) ? 0 : 1 }];
        const alias = r.aliases.find((a) => a.toLowerCase().includes(q));
        return alias ? [{ r: { ...r, matchedAlias: alias }, rank: 2 }] : [];
      })
      .sort((a, b) => a.rank - b.rank)
      .map((x) => x.r)
      .slice(0, 30);
  }

  listPositions(query?: string): PositionRow[] {
    const q = (query ?? '').trim().toLowerCase();
    return positions
      .filter((p) => this.showExtended || p.tier === 'CORE')
      .flatMap((p): PositionRow[] => {
        if (!q || p.canonicalName.toLowerCase().includes(q)) return [p];
        const alias = p.aliases.find((a) => a.toLowerCase().includes(q));
        return alias ? [{ ...p, matchedAlias: alias }] : [];
      })
      .sort((a, b) => (a.tier === b.tier ? a.canonicalName.localeCompare(b.canonicalName) : a.tier === 'CORE' ? -1 : 1));
  }

  listTechniques(query: string, type?: TechniqueType): TechniqueRow[] {
    const q = query.trim().toLowerCase();
    return techniques
      .filter((t) => (this.showExtended || t.tier === 'CORE') && (!type || t.type === type))
      .flatMap((t): TechniqueRow[] => {
        if (!q || t.name.toLowerCase().includes(q)) return [t];
        const alias = t.aliases.find((a) => a.toLowerCase().includes(q));
        return alias ? [{ ...t, matchedAlias: alias }] : [];
      })
      .slice(0, 30);
  }

  position(id: string): PositionDetail {
    const p = positions.find((x) => x.id === id);
    if (!p) throw { code: 'TAXONOMY_ROW_NOT_FOUND' } satisfies DomainErrorLike;
    const parent = positions.find((x) => x.id === p.parentId);
    const order: TechniqueType[] = ['TRANSITION', 'GUARD_PASS', 'SWEEP', 'ESCAPE', 'TAKEDOWN', 'SUBMISSION'];
    const sort = (a: TechniqueRow, b: TechniqueRow) => order.indexOf(a.type) - order.indexOf(b.type) || a.name.localeCompare(b.name);
    const visible = techniques.filter((t) => this.showExtended || t.tier === 'CORE');
    return {
      id: p.id, slug: p.slug, canonicalName: p.canonicalName, description: p.description, tier: p.tier, aliases: p.aliases,
      parent: parent ? { id: parent.id, canonicalName: parent.canonicalName } : undefined,
      children: positions.filter((x) => x.parentId === p.id).map((x) => ({ id: x.id, canonicalName: x.canonicalName, tier: x.tier })),
      techniquesFrom: visible.filter((t) => t.fromPositionId === p.id).sort(sort),
      techniquesTo: visible.filter((t) => t.toPositionId === p.id).sort(sort),
    };
  }

  subjects(): SubjectRow[] {
    return subjects;
  }
  sessionTypes() {
    return sessionTypes;
  }

  // ---- mutations ---------------------------------------------------------
  private focusRows(inputs: { kind: FocusRow['kind']; refId: string; isPlanned: boolean; isActual: boolean; needsWork?: boolean; rating?: number; comment?: string; hitCount?: number; caughtCount?: number; techniqueIds?: string[] }[]): FocusRow[] {
    return inputs.map((f, i) => {
      const name = f.kind === 'POSITION' ? positions.find((p) => p.id === f.refId)?.canonicalName : subjects.find((s) => s.id === f.refId)?.name;
      if (!name) throw { code: 'FOCUS_REF_NOT_FOUND' } satisfies DomainErrorLike;
      return {
        id: this.id('fr'), kind: f.kind, refId: f.refId, name, aliases: [], isPlanned: f.isPlanned, isActual: f.isActual,
        needsWork: !!f.needsWork, rating: f.rating, comment: f.comment, hitCount: f.hitCount, caughtCount: f.caughtCount,
        sortOrder: i, removed: false,
        techniques: (f.techniqueIds ?? []).map((id) => ({ id, name: techniques.find((t) => t.id === id)?.name ?? id })),
      };
    });
  }
  private typeName(id: string) {
    const t = sessionTypes.find((x) => x.id === id);
    if (!t) throw { code: 'SESSION_TYPE_NOT_FOUND' } satisfies DomainErrorLike;
    return t.name;
  }

  planSession(input: PlanSessionInput): SessionDetail {
    this.maybeFail();
    if (!input.sessionTypeId) throw { code: 'SESSION_TYPE_REQUIRED' } satisfies DomainErrorLike;
    if (input.focuses.length === 0) throw { code: 'FOCUS_REQUIRED' } satisfies DomainErrorLike;
    const focuses = this.focusRows(input.focuses.map((f) => ({ ...f, isPlanned: true, isActual: false })));
    const existing = input.sessionId ? this.sessions.find((s) => s.id === input.sessionId) : undefined;
    if (input.sessionId && !existing) throw { code: 'SESSION_NOT_FOUND' } satisfies DomainErrorLike;
    if (existing && existing.status !== 'PLANNED') throw { code: 'SESSION_NOT_PLANNED' } satisfies DomainErrorLike;
    const next: SessionDetail = {
      id: existing?.id ?? this.id('ses'), status: 'PLANNED', sessionTypeId: input.sessionTypeId, sessionTypeName: this.typeName(input.sessionTypeId),
      startsAt: input.startsAt, localDate: localDateOf(input.startsAt), focusNames: focuses.map((f) => f.name), focuses, submissions: [], rounds: [],
    };
    this.upsert(next);
    return next;
  }

  logSession(input: LogSessionInput): SessionDetail {
    this.maybeFail();
    if (!input.sessionTypeId) throw { code: 'SESSION_TYPE_REQUIRED' } satisfies DomainErrorLike;
    if (!input.focuses.some((f) => f.isActual)) throw { code: 'SESSION_NEEDS_ACTUAL_FOCUS' } satisfies DomainErrorLike;
    const focuses = this.focusRows(input.focuses);
    const existing = input.sessionId ? this.sessions.find((s) => s.id === input.sessionId) : undefined;
    if (input.sessionId && !existing) throw { code: 'SESSION_NOT_FOUND' } satisfies DomainErrorLike;
    const next: SessionDetail = {
      id: existing?.id ?? this.id('ses'), status: 'COMPLETED', sessionTypeId: input.sessionTypeId, sessionTypeName: this.typeName(input.sessionTypeId),
      startsAt: input.startsAt, localDate: localDateOf(input.startsAt), durationMinutes: input.durationMinutes, rating: input.rating,
      intensity: input.intensity, energy: input.energy, contextNote: input.contextNote, whatWorked: input.whatWorked, whatFailed: input.whatFailed,
      roundsCount: input.aggregates?.roundsCount, submissionsLanded: input.aggregates?.submissionsLanded, submissionsTaken: input.aggregates?.submissionsTaken,
      focusNames: focuses.map((f) => f.name), focuses, rounds: [],
      submissions: (input.submissions ?? []).map((s) => ({ id: this.id('sub'), direction: s.direction, techniqueId: s.techniqueId, techniqueName: techniques.find((t) => t.id === s.techniqueId)?.name })),
    };
    this.upsert(next);
    return next;
  }

  private upsert(s: SessionDetail) {
    const i = this.sessions.findIndex((x) => x.id === s.id);
    if (i >= 0) this.sessions[i] = s;
    else this.sessions.push(s);
    this.emit();
  }
  private mark(id: string, fn: (s: SessionDetail & { deleted?: boolean }) => void): SessionSummary {
    this.maybeFail();
    const s = this.sessions.find((x) => x.id === id);
    if (!s) throw { code: 'SESSION_NOT_FOUND' } satisfies DomainErrorLike;
    fn(s);
    this.emit();
    return this.summary(s);
  }
  softDelete = (id: string) => this.mark(id, (s) => { s.deleted = true; });
  undoDelete = (id: string) => this.mark(id, (s) => { s.deleted = false; });
  skip = (id: string) => this.mark(id, (s) => {
    if (s.status !== 'PLANNED') throw { code: 'SESSION_NOT_PLANNED' } satisfies DomainErrorLike;
    s.status = 'SKIPPED';
  });
  undoSkip = (id: string) => this.mark(id, (s) => {
    if (s.status !== 'SKIPPED') throw { code: 'SESSION_NOT_PLANNED' } satisfies DomainErrorLike;
    s.status = 'PLANNED';
  });

  addRank(input: RankInput): RankEntry {
    this.maybeFail();
    if (input.stripes < 0 || input.stripes > (input.belt === 'BLACK' ? 6 : 4)) throw { code: 'RANK_STRIPES_INVALID' } satisfies DomainErrorLike;
    if (input.awardedOn > localDateOf(new Date().toISOString())) throw { code: 'RANK_DATE_INVALID' } satisfies DomainErrorLike;
    this.rank = { id: this.id('rk'), ...input };
    this.emit();
    return this.rank;
  }
}

export const mockStore = new MockStore();
