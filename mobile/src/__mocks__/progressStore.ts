import { defaultSettings } from '../domain/settings/defaults';
import type {
  AboutData, AlgorithmParamRow, ProgressOverview, RankEntry, RankInput, ResourceInput, ResourceRow, ResourceStatus, ResourceTarget,
  ResourceTypeRow, TechniqueDetail,
} from '../hooks/data/types';
import { techniques } from './fixtures';
import { mockStore } from './mockStore';
import {
  buildAbout, buildOverview, EMPTY_PANELS, initialResources, INTEGER_PARAMS, PARAM_DEFAULTS, rankHistory, resourceTypes,
} from './progressFixtures';
import type { MockError } from './taxonomyMock';

/**
 * In-memory stand-in for the sprint-2 repositories (phase A, plan §5.2-§5.7): progression overview,
 * algorithm params, settings, rank history, resources and the technique detail. The seam
 * (`src/hooks/data/index.ts`) is the only importer; phase B swaps the seam to `src/repositories`.
 */
type Listener = () => void;
export type Forced = 'loading' | { error: MockError } | null;

const fail = (code: string, details?: MockError['details']): never => {
  throw { code, details } satisfies MockError;
};

export const toLocalToday = (d = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

class ProgressStore {
  private listeners = new Set<Listener>();
  private seq = 0;
  /** Tests: force every phase-A read into loading or error. */
  forced: Forced = null;
  /** `results: []` and empty panels, for the empty-state tests. */
  emptyOverview = false;
  /** Tests: reshape the overview (e.g. a past pending day) before the hooks read it. */
  tweak: ((o: ProgressOverview) => ProgressOverview) | null = null;
  params: AlgorithmParamRow[] = [];
  settings: Record<string, unknown> = {};
  ranks: (RankEntry & { deleted?: boolean })[] = [];
  resources: Record<string, ResourceRow[]> = {};
  deletedResources = new Map<string, { techniqueId: string; row: ResourceRow }>();
  about: AboutData = buildAbout();
  resourceTypes: ResourceTypeRow[] = resourceTypes;

  constructor() {
    this.reset();
  }

  reset() {
    this.params = PARAM_DEFAULTS.map((p) => ({ ...p }));
    this.settings = { ...defaultSettings() };
    this.ranks = rankHistory();
    this.resources = initialResources();
    this.deletedResources.clear();
    this.about = buildAbout();
    this.forced = null;
    this.emptyOverview = false;
    this.tweak = null;
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
    return `${prefix}-m${this.seq}`;
  }

  // ---- reads -------------------------------------------------------------
  paramMap(): Record<string, number> {
    return Object.fromEntries(this.params.map((p) => [p.key, p.value]));
  }

  overview(): ProgressOverview {
    const params = this.paramMap();
    const today = toLocalToday();
    const base = buildOverview(today, params);
    const o = this.emptyOverview ? { ...base, results: [], ...EMPTY_PANELS(today, params.windowWeeks ?? 8) } : base;
    return this.tweak ? this.tweak(o) : o;
  }

  scale(): 'ADULT' | 'KIDS' {
    return this.settings['rank.scale'] === 'KIDS' ? 'KIDS' : 'ADULT';
  }

  rankHistory(): RankEntry[] {
    const scale = this.scale();
    return this.ranks.filter((r) => !r.deleted && r.scale === scale).sort((a, b) => b.awardedOn.localeCompare(a.awardedOn));
  }

  resourcesFor(target: ResourceTarget): ResourceRow[] {
    const rows = target.kind === 'TECHNIQUE' ? this.resources[target.id] ?? [] : [];
    return [...rows].sort((a, b) => (a.status === b.status ? a.title.localeCompare(b.title) : a.status === 'TO_WATCH' ? -1 : 1));
  }

  technique(id: string): TechniqueDetail {
    const row = techniques.find((t) => t.id === id);
    if (!row) return fail('TAXONOMY_ROW_NOT_FOUND');
    const tax = mockStore.taxonomy;
    return {
      ...row,
      aliases: tax.aliasRows(id).map((a) => a.name),
      aliasRows: tax.aliasRows(id),
      description: row.slug === 'scissor-sweep' ? 'Sweep from closed guard by cutting with the legs.' : undefined,
      notes: tax.notes.get(id),
      origin: id.startsWith('tec-user') ? 'user' : 'seed',
      removed: false,
      fromRemoved: tax.isDeleted(row.fromPositionId),
      toRemoved: row.toPositionId ? tax.isDeleted(row.toPositionId) : undefined,
      resources: this.resourcesFor({ kind: 'TECHNIQUE', id }),
      history: id === 'tec-scissor'
        ? [
            { sessionId: 'ses-last', localDate: toLocalToday(new Date(Date.now() - 2 * 864e5)), sessionTypeName: 'No-gi class', via: 'ATTACHED' },
            { sessionId: 'ses-old', localDate: toLocalToday(new Date(Date.now() - 6 * 864e5)), sessionTypeName: 'Gi class', via: 'SUBMISSION' },
          ]
        : [],
    };
  }

  // ---- mutations ---------------------------------------------------------
  setParam(version: string, key: string, value: number): AlgorithmParamRow {
    const p = this.params.find((x) => x.key === key && x.algorithmVersion === version) ?? fail('PARAM_UNKNOWN');
    if (INTEGER_PARAMS.has(key) && !Number.isInteger(value)) fail('PARAM_NOT_INTEGER');
    if (!(value >= p.min && value <= p.max)) fail('PARAM_OUT_OF_RANGE', { min: p.min, max: p.max });
    p.value = value;
    this.emit();
    return p;
  }

  resetParams(version: string): AlgorithmParamRow[] {
    for (const p of this.params) if (p.algorithmVersion === version) p.value = p.defaultValue;
    this.emit();
    return this.params;
  }

  setSetting(key: string, value: unknown): void {
    if (key === 'theme.override' && !['SYSTEM', 'LIGHT', 'DARK'].includes(String(value))) fail('SETTING_VALUE_INVALID');
    if (key === 'rank.scale' && !['ADULT', 'KIDS'].includes(String(value))) fail('SETTING_VALUE_INVALID');
    if (key === 'suggest.max' && !(Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 10)) fail('SETTING_VALUE_INVALID');
    this.settings[key] = value;
    if (key === 'library.showExtended') mockStore.showExtended = value === true;
    this.emit();
    mockStore.emit();
  }

  addRank(input: RankInput): RankEntry {
    const row: RankEntry = { id: this.id('rk'), ...input };
    this.ranks.push(row);
    this.emit();
    return row;
  }

  updateRank(id: string, input: RankInput): RankEntry {
    const row = this.ranks.find((r) => r.id === id && !r.deleted) ?? fail('RANK_NOT_FOUND');
    Object.assign(row, input);
    this.emit();
    return row;
  }

  deleteRank(id: string, deleted: boolean): RankEntry {
    const row = this.ranks.find((r) => r.id === id) ?? fail('RANK_NOT_FOUND');
    row.deleted = deleted;
    this.emit();
    return row;
  }

  private typeName(id: string) {
    return (this.resourceTypes.find((t) => t.id === id) ?? fail('RESOURCE_TYPE_NOT_FOUND')).name;
  }
  private validateResource(i: Partial<ResourceInput>) {
    if (i.title !== undefined && !i.title.trim()) fail('RESOURCE_TITLE_REQUIRED');
    if (i.url && !/^https?:\/\/\S+$/i.test(i.url.trim())) fail('RESOURCE_URL_INVALID');
  }

  createResource(input: ResourceInput, target: ResourceTarget): ResourceRow {
    this.validateResource({ ...input, title: input.title ?? '' });
    if (target.kind !== 'TECHNIQUE' || !techniques.some((t) => t.id === target.id)) fail('RESOURCE_LINK_TARGET_NOT_FOUND');
    const row: ResourceRow = {
      id: this.id('res'), title: input.title.trim(), url: input.url?.trim() || undefined, author: input.author?.trim() || undefined,
      resourceTypeId: input.resourceTypeId, resourceTypeName: this.typeName(input.resourceTypeId), notes: input.notes?.trim() || undefined,
      status: input.status ?? 'TO_WATCH', origin: 'user',
    };
    this.resources[target.id] = [...(this.resources[target.id] ?? []), row];
    this.emit();
    return row;
  }

  private findResource(id: string): { techniqueId: string; row: ResourceRow } {
    for (const [techniqueId, rows] of Object.entries(this.resources)) {
      const row = rows.find((r) => r.id === id);
      if (row) return { techniqueId, row };
    }
    return fail('RESOURCE_NOT_FOUND');
  }

  updateResource(id: string, patch: Partial<ResourceInput>): ResourceRow {
    const { row } = this.findResource(id);
    this.validateResource(patch);
    Object.assign(row, {
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...('url' in patch ? { url: patch.url?.trim() || undefined } : {}),
      ...('author' in patch ? { author: patch.author?.trim() || undefined } : {}),
      ...('notes' in patch ? { notes: patch.notes?.trim() || undefined } : {}),
      ...(patch.resourceTypeId ? { resourceTypeId: patch.resourceTypeId, resourceTypeName: this.typeName(patch.resourceTypeId) } : {}),
      ...(patch.status ? { status: patch.status } : {}),
    });
    this.emit();
    return row;
  }

  setResourceStatus(id: string, status: ResourceStatus): ResourceRow {
    return this.updateResource(id, { status });
  }

  deleteResource(id: string): ResourceRow {
    const { techniqueId, row } = this.findResource(id);
    this.resources[techniqueId] = (this.resources[techniqueId] ?? []).filter((r) => r.id !== id);
    this.deletedResources.set(id, { techniqueId, row });
    this.emit();
    return row;
  }

  undoDeleteResource(id: string): ResourceRow {
    const d = this.deletedResources.get(id) ?? fail('RESOURCE_NOT_FOUND');
    this.resources[d.techniqueId] = [...(this.resources[d.techniqueId] ?? []), d.row];
    this.deletedResources.delete(id);
    this.emit();
    return d.row;
  }
}

export const progressStore = new ProgressStore();
