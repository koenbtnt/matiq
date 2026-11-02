import type {
  AliasRow, MergeResult, PositionInput, PositionRow, SubjectInput, SubjectRow, TaxonomyKind, TechniqueInput, TechniqueRow,
} from '../hooks/data/types';
import { positions, subjects, techniques } from './fixtures';

/**
 * Phase-A stand-in for the taxonomy editing repository (plan §5.5): create / update / soft delete,
 * aliases with ids, merge + undo, over the shared fixture arrays. Errors are `{ code }` like the rest
 * of the mock store. Phase B deletes this and the seam calls `taxonomy.*`.
 */
export type MockError = { code: string; details?: Record<string, string | number> };
const fail = (code: string, details?: MockError['details']): never => {
  throw { code, details } satisfies MockError;
};

type Row = PositionRow | TechniqueRow | SubjectRow;
type Merge = { id: string; kind: TaxonomyKind; fromId: string; intoId: string; loser: Row; at: number; movedAliases: string[]; added: string[]; undone: boolean };

const copy = <T extends object>(rows: T[]): T[] => rows.map((r) => ({ ...r }));
const norm = (s: string) => s.trim().toLowerCase();

export class TaxonomyMock {
  private seq = 0;
  private aliases: AliasRow[] = [];
  private removedAliases = new Set<string>();
  private deleted = new Map<string, { kind: TaxonomyKind; row: Row; index: number }>();
  private merges: Merge[] = [];
  private initial = { positions: copy(positions), techniques: copy(techniques), subjects: copy(subjects) };
  /** Position / technique notes by id (user text, never `user_edited_at`). */
  notes = new Map<string, string>();

  constructor(private emit: () => void) {
    this.reset();
  }

  reset() {
    positions.splice(0, positions.length, ...copy(this.initial.positions).map((p) => ({ ...p, aliases: [...p.aliases] })));
    techniques.splice(0, techniques.length, ...copy(this.initial.techniques).map((t) => ({ ...t, aliases: [...t.aliases] })));
    subjects.splice(0, subjects.length, ...copy(this.initial.subjects));
    this.seq = 0;
    this.removedAliases.clear();
    this.deleted.clear();
    this.merges = [];
    this.notes.clear();
    this.aliases = [
      ...positions.flatMap((p) => p.aliases.map((name, i): AliasRow => ({ id: `al-${p.id}-${i}`, targetKind: 'POSITION', targetId: p.id, name, origin: 'seed' }))),
      ...techniques.flatMap((t) => t.aliases.map((name, i): AliasRow => ({ id: `al-${t.id}-${i}`, targetKind: 'TECHNIQUE', targetId: t.id, name, origin: 'seed' }))),
    ];
  }

  private id(prefix: string) {
    this.seq += 1;
    return `${prefix}-user-${this.seq}`;
  }
  private list(kind: TaxonomyKind): Row[] {
    return kind === 'POSITION' ? positions : kind === 'TECHNIQUE' ? techniques : subjects;
  }
  private find(kind: TaxonomyKind, id: string): Row {
    const row = this.list(kind).find((r) => r.id === id);
    if (row) return row;
    return this.deleted.has(id) ? fail('TAXONOMY_ROW_DELETED') : fail('TAXONOMY_ROW_NOT_FOUND');
  }
  private nameOf(r: Row): string {
    return 'canonicalName' in r ? r.canonicalName : r.name;
  }
  private setAliasNames(kind: TaxonomyKind, id: string) {
    if (kind === 'SUBJECT') return;
    const row = this.list(kind).find((r) => r.id === id) as PositionRow | TechniqueRow | undefined;
    if (row) row.aliases = this.aliasRows(id).map((a) => a.name);
  }

  aliasRows(targetId: string): AliasRow[] {
    return this.aliases.filter((a) => a.targetId === targetId && !this.removedAliases.has(a.id));
  }
  aliasRowsFor(kind: TaxonomyKind, id: string): AliasRow[] {
    return kind === 'SUBJECT' ? [] : this.aliasRows(id);
  }

  private checkName(kind: TaxonomyKind, name: string, selfId?: string, edge?: { from: string; to?: string | null; type: string }) {
    const n = norm(name);
    if (!n) fail('TAXONOMY_NAME_REQUIRED');
    if (kind === 'TECHNIQUE') {
      const dup = techniques.some((t) => t.id !== selfId && norm(t.name) === n && t.fromPositionId === edge?.from && (t.toPositionId ?? null) === (edge?.to ?? null) && t.type === edge?.type);
      if (dup) fail('TAXONOMY_NAME_DUPLICATE');
      return;
    }
    const dup = this.list(kind).some((r) => r.id !== selfId && norm(this.nameOf(r)) === n)
      || (kind === 'POSITION' && this.aliases.some((a) => a.targetKind === 'POSITION' && a.targetId !== selfId && !this.removedAliases.has(a.id) && norm(a.name) === n));
    if (dup) fail('TAXONOMY_NAME_DUPLICATE');
  }

  private addAliasRow(kind: 'POSITION' | 'TECHNIQUE', targetId: string, name: string, origin: 'seed' | 'user'): AliasRow {
    const row: AliasRow = { id: this.id('al'), targetKind: kind, targetId, name: name.trim(), origin };
    this.aliases.push(row);
    this.setAliasNames(kind, targetId);
    return row;
  }

  createPosition(i: PositionInput): PositionRow {
    this.checkName('POSITION', i.canonicalName);
    if (i.parentId && !positions.some((p) => p.id === i.parentId)) fail('TAXONOMY_ROW_NOT_FOUND');
    const id = this.id('pos');
    const row: PositionRow & { description?: string } = { id, slug: norm(i.canonicalName).replace(/\s+/g, '-'), canonicalName: i.canonicalName.trim(), aliases: [], tier: 'CORE', parentId: i.parentId ?? undefined, description: i.description };
    positions.push(row);
    if (i.notes) this.notes.set(id, i.notes);
    this.emit();
    return row;
  }

  createTechnique(i: TechniqueInput): TechniqueRow {
    const isSub = i.type === 'SUBMISSION';
    this.checkName('TECHNIQUE', i.name, undefined, { from: i.fromPositionId, to: i.toPositionId, type: i.type });
    const from = positions.find((p) => p.id === i.fromPositionId) ?? fail('TAXONOMY_ROW_NOT_FOUND');
    if (isSub && i.toPositionId) fail('TECHNIQUE_SUBMISSION_HAS_TARGET');
    if (!isSub && !i.toPositionId) fail('TECHNIQUE_TARGET_REQUIRED');
    const to = i.toPositionId ? positions.find((p) => p.id === i.toPositionId) ?? fail('TAXONOMY_ROW_NOT_FOUND') : undefined;
    const id = this.id('tec');
    const row: TechniqueRow = {
      id, slug: norm(i.name).replace(/\s+/g, '-'), name: i.name.trim(), type: i.type, fromPositionId: from.id, fromName: from.canonicalName,
      toPositionId: to?.id, toName: to?.canonicalName, appliesTo: i.appliesTo, perspective: i.perspective ?? undefined, tier: 'CORE', aliases: [],
    };
    techniques.push(row);
    if (i.notes) this.notes.set(id, i.notes);
    this.emit();
    return row;
  }

  createSubject(i: SubjectInput): SubjectRow {
    this.checkName('SUBJECT', i.name);
    const row: SubjectRow = { id: this.id('sub'), name: i.name.trim(), description: i.description };
    subjects.push(row);
    this.emit();
    return row;
  }

  updatePosition(id: string, patch: Partial<PositionInput>): PositionRow {
    const row = this.find('POSITION', id) as PositionRow & { description?: string };
    if (patch.canonicalName !== undefined && patch.canonicalName.trim() !== row.canonicalName) {
      this.checkName('POSITION', patch.canonicalName, id);
      const old = row.canonicalName;
      row.canonicalName = patch.canonicalName.trim();
      if (patch.keepOldNameAsAlias !== false) this.addAliasRow('POSITION', id, old, 'user');
    }
    if ('parentId' in patch) {
      let up = patch.parentId ?? undefined;
      while (up) {
        if (up === id) fail('POSITION_PARENT_CYCLE');
        up = positions.find((p) => p.id === up)?.parentId;
      }
      row.parentId = patch.parentId ?? undefined;
    }
    if (patch.description !== undefined) row.description = patch.description || undefined;
    if (patch.notes !== undefined) this.notes.set(id, patch.notes);
    this.emit();
    return row;
  }

  updateTechnique(id: string, patch: Partial<TechniqueInput>): TechniqueRow {
    const row = this.find('TECHNIQUE', id) as TechniqueRow;
    const next = { ...row, ...('name' in patch ? { name: patch.name ?? row.name } : {}) };
    const type = patch.type ?? row.type;
    const to = 'toPositionId' in patch ? patch.toPositionId ?? undefined : row.toPositionId;
    const from = patch.fromPositionId ?? row.fromPositionId;
    if (type === 'SUBMISSION' && to) fail('TECHNIQUE_SUBMISSION_HAS_TARGET');
    if (type !== 'SUBMISSION' && !to) fail('TECHNIQUE_TARGET_REQUIRED');
    if (patch.name !== undefined && patch.name.trim() !== row.name) {
      this.checkName('TECHNIQUE', patch.name, id, { from, to, type });
      if (patch.keepOldNameAsAlias !== false) this.addAliasRow('TECHNIQUE', id, row.name, 'user');
      next.name = patch.name.trim();
    }
    Object.assign(row, {
      name: next.name, type, fromPositionId: from, fromName: positions.find((p) => p.id === from)?.canonicalName ?? row.fromName,
      toPositionId: to, toName: to ? positions.find((p) => p.id === to)?.canonicalName : undefined,
      appliesTo: patch.appliesTo ?? row.appliesTo, perspective: 'perspective' in patch ? patch.perspective ?? undefined : row.perspective,
    });
    if (patch.notes !== undefined) this.notes.set(id, patch.notes);
    this.emit();
    return row;
  }

  updateSubject(id: string, patch: Partial<SubjectInput>): SubjectRow {
    const row = this.find('SUBJECT', id) as SubjectRow;
    if (patch.name !== undefined && patch.name.trim() !== row.name) {
      this.checkName('SUBJECT', patch.name, id);
      row.name = patch.name.trim();
    }
    if (patch.description !== undefined) row.description = patch.description || undefined;
    this.emit();
    return row;
  }

  softDelete(kind: TaxonomyKind, id: string): void {
    const list = this.list(kind);
    const index = list.findIndex((r) => r.id === id);
    if (index < 0) fail(this.deleted.has(id) ? 'TAXONOMY_ROW_DELETED' : 'TAXONOMY_ROW_NOT_FOUND');
    this.deleted.set(id, { kind, row: list[index]!, index });
    list.splice(index, 1);
    this.emit();
  }

  undoDelete(kind: TaxonomyKind, id: string): void {
    const d = this.deleted.get(id) ?? fail('TAXONOMY_ROW_NOT_FOUND');
    this.list(kind).splice(Math.min(d.index, this.list(kind).length), 0, d.row);
    this.deleted.delete(id);
    this.emit();
  }

  addAlias(kind: 'POSITION' | 'TECHNIQUE', id: string, name: string): AliasRow {
    const row = this.find(kind, id);
    if (!norm(name)) fail('ALIAS_NAME_REQUIRED');
    if (norm(this.nameOf(row)) === norm(name) || this.aliasRows(id).some((a) => norm(a.name) === norm(name))) fail('ALIAS_DUPLICATE');
    const alias = this.addAliasRow(kind, id, name, 'user');
    this.emit();
    return alias;
  }

  removeAlias(aliasId: string): AliasRow {
    const a = this.aliases.find((x) => x.id === aliasId && !this.removedAliases.has(x.id)) ?? fail('ALIAS_NOT_FOUND');
    this.removedAliases.add(aliasId);
    this.setAliasNames(a.targetKind, a.targetId);
    this.emit();
    return a;
  }

  undoRemoveAlias(aliasId: string): AliasRow {
    const a = this.aliases.find((x) => x.id === aliasId) ?? fail('ALIAS_NOT_FOUND');
    this.removedAliases.delete(aliasId);
    this.setAliasNames(a.targetKind, a.targetId);
    this.emit();
    return a;
  }

  merge(kind: TaxonomyKind, fromId: string, intoId: string): MergeResult {
    if (fromId === intoId) fail('TAXONOMY_SELF_MERGE');
    const loser = this.find(kind, fromId);
    const survivor = this.find(kind, intoId);
    if (kind === 'TECHNIQUE' && ((loser as TechniqueRow).type === 'SUBMISSION') !== ((survivor as TechniqueRow).type === 'SUBMISSION')) fail('TAXONOMY_MERGE_KIND_MISMATCH');
    const merge: Merge = { id: this.id('mrg'), kind, fromId, intoId, loser: { ...loser }, at: this.merges.length, movedAliases: [], added: [], undone: false };
    if (kind !== 'SUBJECT') {
      for (const a of this.aliasRows(fromId)) {
        a.targetId = intoId;
        merge.movedAliases.push(a.id);
      }
      merge.added.push(this.addAliasRow(kind, intoId, this.nameOf(loser), 'user').id);
    }
    this.merges.push(merge);
    const list = this.list(kind);
    list.splice(list.findIndex((r) => r.id === fromId), 1);
    if (kind !== 'SUBJECT') this.setAliasNames(kind, intoId);
    this.emit();
    return { mergeId: merge.id, kind, fromId, intoId, moved: {}, folded: 0, aliasesAdded: merge.added.length };
  }

  undoMerge(mergeId: string): MergeResult {
    const m = this.merges.find((x) => x.id === mergeId) ?? fail('MERGE_NOT_FOUND');
    if (m.undone) fail('MERGE_ALREADY_UNDONE');
    if (this.merges.some((x) => !x.undone && x.at > m.at && [x.fromId, x.intoId].some((id) => id === m.fromId || id === m.intoId))) fail('MERGE_NOT_LATEST');
    m.undone = true;
    for (const id of m.added) this.aliases = this.aliases.filter((a) => a.id !== id);
    for (const id of m.movedAliases) {
      const a = this.aliases.find((x) => x.id === id);
      if (a) a.targetId = m.fromId;
    }
    this.list(m.kind).push(m.loser);
    if (m.kind !== 'SUBJECT') {
      this.setAliasNames(m.kind, m.intoId);
      this.setAliasNames(m.kind, m.fromId);
    }
    this.emit();
    return { mergeId, kind: m.kind, fromId: m.fromId, intoId: m.intoId, moved: {}, folded: 0, aliasesAdded: 0 };
  }

  /** Is a position currently soft-deleted? (Technique detail renders "(removed)" endpoints.) */
  isDeleted(id: string): boolean {
    return this.deleted.has(id);
  }
}
