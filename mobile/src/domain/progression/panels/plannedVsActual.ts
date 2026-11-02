import type { FocusHistory, GapRow, PlannedVsActualData } from '../types';
import { classifyPlanned, inWindow, windowStartOf } from '../v1/window';

/**
 * Planned-vs-actual gap panel (plan §6.7, PS-22). Uses the §6.3 classification verbatim
 * (`classifyPlanned`), so a row's `gap` equals the focus's `gap` signal. Rows: focuses with a
 * planned or an unplanned-trained row in the window; notTrained desc, gap desc, name asc; removed last.
 */
export function aggregatePlannedVsActual(
  histories: readonly FocusHistory[],
  { today, windowWeeks, nowIso }: { today: string; windowWeeks: number; nowIso: string },
): PlannedVsActualData {
  const windowStart = windowStartOf(today, windowWeeks);
  const rows: GapRow[] = [];
  for (const h of histories) {
    const c = { planned: 0, trained: 0, notTrained: 0, pending: 0, unplannedTrained: 0 };
    for (const r of inWindow(h.rows, windowStart, today)) {
      const k = classifyPlanned(r, nowIso);
      if (k === 'unplanned') {
        if (r.isActual && r.status === 'COMPLETED') c.unplannedTrained += 1;
        continue;
      }
      c.planned += 1;
      c[k] += 1;
    }
    if (c.planned === 0 && c.unplannedTrained === 0) continue;
    const row: GapRow = { ref: { kind: h.ref.kind, refId: h.ref.refId }, name: h.name, removed: h.removed, ...c };
    if (c.planned > 0) row.gap = c.notTrained / c.planned;
    rows.push(row);
  }
  rows.sort(
    (a, b) =>
      Number(a.removed) - Number(b.removed) ||
      b.notTrained - a.notTrained ||
      (b.gap ?? -1) - (a.gap ?? -1) ||
      a.name.localeCompare(b.name, 'en'),
  );
  const totals = rows.reduce(
    (t, r) => ({
      planned: t.planned + r.planned,
      trained: t.trained + r.trained,
      notTrained: t.notTrained + r.notTrained,
      pending: t.pending + r.pending,
      unplannedTrained: t.unplannedTrained + r.unplannedTrained,
    }),
    { planned: 0, trained: 0, notTrained: 0, pending: 0, unplannedTrained: 0 },
  );
  return { windowStart, today, totals, rows };
}
