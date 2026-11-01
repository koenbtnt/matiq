import { addDays, diffDays, weekStartOf } from '../../session/localDate';
import type { ConsistencyData, DayCell, SessionDayRow, WeekRow } from '../types';
import { windowStartOf } from '../v1/window';

/**
 * Consistency heatmap (plan §6.6, PS-21): Monday weeks from the Monday on/before `windowStart` to
 * the Sunday on/after `today`. Pure date-string arithmetic; `localDate` was fixed at write time
 * (ADR 0016). `weeks[i].days[j]` is `gridStart + 7i + j`.
 */
export function aggregateConsistency(
  rows: readonly SessionDayRow[],
  { today, windowWeeks }: { today: string; windowWeeks: number },
): ConsistencyData {
  const windowStart = windowStartOf(today, windowWeeks);
  const gridStart = weekStartOf(windowStart);
  const gridEnd = addDays(weekStartOf(today), 6);
  const dayCount = diffDays(gridStart, gridEnd) + 1;

  const cells: DayCell[] = Array.from({ length: dayCount }, (_, i) => {
    const localDate = addDays(gridStart, i);
    return {
      localDate,
      inWindow: localDate >= windowStart && localDate <= today,
      future: localDate > today,
      completed: 0,
      skipped: 0,
      pending: 0,
      minutes: 0,
    };
  });

  for (const r of rows) {
    if (r.localDate < gridStart || r.localDate > today) continue;
    const cell = cells[diffDays(gridStart, r.localDate)]!;
    if (r.status === 'COMPLETED') {
      cell.completed += 1;
      cell.minutes += r.durationMinutes ?? 0;
    } else if (r.status === 'SKIPPED') cell.skipped += 1;
    else cell.pending += 1;
  }

  const weeks: WeekRow[] = [];
  for (let i = 0; i < dayCount; i += 7) {
    const days = cells.slice(i, i + 7) as WeekRow['days'];
    weeks.push({ weekStart: days[0].localDate, days, completed: days.reduce((s, d) => s + d.completed, 0) });
  }

  const inWin = cells.filter((c) => c.inWindow);
  let streak = 0;
  // The current week counts only once it has a session; otherwise start from the previous week.
  let i = weeks.length - 1;
  if (weeks[i] && weeks[i]!.completed === 0) i -= 1;
  for (; i >= 0 && weeks[i]!.completed > 0; i -= 1) streak += 1;

  return {
    windowStart,
    today,
    weeks,
    totals: {
      completed: inWin.reduce((s, c) => s + c.completed, 0),
      activeDays: inWin.filter((c) => c.completed > 0).length,
      minutes: inWin.reduce((s, c) => s + c.minutes, 0),
      weeksWithTraining: weeks.filter((w) => w.days.some((d) => d.inWindow && d.completed > 0)).length,
      weeksInWindow: windowWeeks,
      currentStreakWeeks: streak,
    },
  };
}
