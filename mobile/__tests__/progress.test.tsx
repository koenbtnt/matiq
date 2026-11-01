import { act, fireEvent, screen } from '@testing-library/react-native';

import { addDays } from '../src/domain/session/localDate';
import { mockStore } from '../src/__mocks__/mockStore';
import { buildOverview } from '../src/__mocks__/progressFixtures';
import { progressStore, toLocalToday } from '../src/__mocks__/progressStore';
import { renderScreen } from '../src/__mocks__/renderScreen';
import { dayPhrase, weekLabel } from '../src/features/progress/ConsistencyCard';
import { ruleSentence, signalValue } from '../src/features/progress/format';
import { groupResults, ProgressScreen } from '../src/features/progress/ProgressScreen';
import { WhySheet } from '../src/features/progress/WhySheet';
import i18n from '../src/i18n';

jest.mock('expo-router', () => require('../src/__mocks__/routerMock'));
jest.mock('../src/repositories', () => require('../src/__mocks__/repositoriesMock'));
const { router, useLocalSearchParams } = require('../src/__mocks__/routerMock');

const has = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const t = i18n.t.bind(i18n);

beforeEach(() => jest.clearAllMocks());

describe('Progress list', () => {
  it('groups focuses by state in PS-04 order with Removed last, keeping the data order inside a state', async () => {
    await renderScreen(<ProgressScreen />);
    const sections = groupResults(progressStore.overview().results).map((s) => s.key);
    expect(sections).toEqual(['NEEDS_WORK', 'NOT_TRAINED', 'STEADY', 'IMPROVING', 'REMOVED']);
    for (const key of sections) expect(screen.getByTestId(`progress.section.${key}`)).toBeTruthy();
    expect(screen.getByTestId('progress.section.NOT_TRAINED')).toHaveTextContent(has('Not trained lately · 2'));
    const order = screen.getAllByTestId(/^progress\.row\.[A-Z]+\.[a-z-]+$/).map((n) => n.props.testID);
    expect(order).toEqual([
      'progress.row.POSITION.pos-half', 'progress.row.POSITION.pos-side', 'progress.row.POSITION.pos-turtle', 'progress.row.POSITION.pos-closed',
      'progress.row.SUBJECT.sub-grips', 'progress.row.POSITION.pos-mount', 'progress.row.POSITION.pos-retired',
    ]);
  });

  it('a row states the state and rule sentence in text, flags it, and opens the why sheet', async () => {
    await renderScreen(<ProgressScreen />);
    expect(screen.getByTestId('progress.row.POSITION.pos-half.state')).toHaveTextContent(has('Needs work · Needs-work score 0.58 is at or above 0.5'));
    expect(screen.getByTestId('progress.row.POSITION.pos-half.flagged')).toHaveTextContent(has('Flagged'));
    expect(screen.queryByTestId('progress.row.POSITION.pos-closed.flagged')).toBeNull();
    expect(screen.getByTestId('progress.row.POSITION.pos-side.state')).toHaveTextContent(has('Last trained 40 days ago, more than 21'));
    expect(screen.getByTestId('progress.row.POSITION.pos-turtle.state')).toHaveTextContent(has('No trained session yet'));
    expect(screen.getByTestId('progress.row.POSITION.pos-retired')).toHaveTextContent(has('Retired guard (removed)'));
    await fireEvent.press(screen.getByTestId('progress.row.POSITION.pos-half'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/progress-why', params: { kind: 'POSITION', refId: 'pos-half' } });
  });

  it('empty results name the next step and the panels still render', async () => {
    await renderScreen(<ProgressScreen />, () => { progressStore.emptyOverview = true; });
    expect(screen.getByTestId('progress.empty')).toHaveTextContent(has('No training logged yet'));
    expect(screen.getByTestId('progress.empty.action')).toBeTruthy();
    expect(screen.getByTestId('progress.consistency.empty')).toBeTruthy();
    expect(screen.getByTestId('progress.gap.empty')).toBeTruthy();
    expect(screen.getAllByTestId(/^progress\.consistency\.cell\./).length).toBeGreaterThanOrEqual(56);
  });

  it('shows loading, and an error with Try again', async () => {
    await renderScreen(<ProgressScreen />, () => { progressStore.forced = 'loading'; });
    expect(screen.getByTestId('progress.loading')).toBeTruthy();
    await act(async () => { progressStore.forced = { error: { code: 'DB_NOT_OPEN' } }; progressStore.emit(); });
    expect(screen.getByTestId('progress.error')).toBeTruthy();
    await act(async () => { progressStore.forced = null; });
    await fireEvent.press(screen.getByTestId('progress.error.retry'));
    expect(await screen.findByTestId('progress.screen')).toBeTruthy();
  });
});

describe('Consistency heatmap', () => {
  it('renders weeks × 7 cells and one role="image" stop per week row; cells are not accessibility elements', async () => {
    await renderScreen(<ProgressScreen />);
    const { weeks } = progressStore.overview().consistency;
    expect(weeks.length).toBeGreaterThanOrEqual(8);
    const rows = screen.getAllByTestId(/^progress\.consistency\.week\./);
    expect(rows).toHaveLength(weeks.length);
    for (const row of rows) {
      expect(row).toHaveProp('accessibilityRole', 'image');
      expect(row).toHaveProp('accessible', true);
    }
    const cells = screen.getAllByTestId(/^progress\.consistency\.cell\./);
    expect(cells).toHaveLength(weeks.length * 7);
    for (const cell of cells) expect(cell).toHaveProp('accessible', false);
  });

  it('draws the count in the cell and dims out-of-window days with a hairline instead of a fill', async () => {
    // A Wednesday: the first week starts before the window and the last one has future days.
    await renderScreen(<ProgressScreen />, () => { progressStore.tweak = () => buildOverview('2026-11-04', progressStore.paramMap()); });
    const o = progressStore.overview();
    const today = o.today;
    expect(screen.getByTestId(`progress.consistency.cell.${addDays(today, -4)}`)).toHaveTextContent('2');
    const days = o.consistency.weeks.flatMap((w) => w.days);
    const outside = days.find((d) => !d.inWindow && !d.future)!;
    expect(screen.getByTestId(`progress.consistency.cell.${outside.localDate}`)).toHaveStyle({ backgroundColor: 'transparent', borderWidth: 1 });
    const future = days.find((d) => d.future)!;
    expect(screen.getByTestId(`progress.consistency.cell.${future.localDate}`)).toHaveStyle({ backgroundColor: 'transparent', borderWidth: 0 });
    expect(screen.getByTestId(`progress.consistency.cell.${today}`)).toHaveStyle({ borderWidth: 1.5 });
  });

  it('the header text is the chart summary: plural parts, streak, minutes', async () => {
    await renderScreen(<ProgressScreen />);
    expect(screen.getByTestId('progress.consistency.summary')).toHaveTextContent(has('11 sessions on 8 days in the last 8 weeks'));
    expect(screen.getByTestId('progress.consistency.streak')).toBeTruthy();
    expect(screen.queryByTestId('progress.consistency.empty')).toBeNull();
  });

  it('singular copy reads "1 session on 1 day" (P-30)', async () => {
    await renderScreen(<ProgressScreen />, () => {
      progressStore.tweak = (o) => ({ ...o, consistency: { ...o.consistency, totals: { ...o.consistency.totals, completed: 1, activeDays: 1 } } });
    });
    expect(screen.getByTestId('progress.consistency.summary')).toHaveTextContent(has('1 session on 1 day in the last 8 weeks'));
  });

  it("today's pending session reads 'planned' and a past one 'not logged'; future days get no phrase", () => {
    const { consistency, today } = progressStore.overview();
    const days = consistency.weeks.flatMap((w) => w.days);
    const todayCell = days.find((d) => d.localDate === today)!;
    expect(dayPhrase(t, todayCell, today)).toMatch(/1 planned.*today/);
    expect(dayPhrase(t, todayCell, today)).not.toMatch(/not logged/);
    const past = { ...days.find((d) => d.inWindow && d.localDate < today)!, pending: 1 };
    expect(dayPhrase(t, past, today)).toMatch(/1 not logged/);
    const future = days.find((d) => d.future);
    if (future) expect(dayPhrase(t, future, today)).toBeUndefined();
  });

  it('week labels join the day phrases, say "no sessions", and note a partly-outside week', () => {
    const { consistency, today } = progressStore.overview();
    const active = consistency.weeks.find((w) => w.days.some((d) => d.localDate === addDays(today, -4)))!;
    expect(weekLabel(t, active, today)).toMatch(/^Week of .*: .*2 sessions, 150 min/);
    const quiet = consistency.weeks.find((w) => w.completed === 0 && w.days.every((d) => !d.pending && !d.skipped) && w.days.every((d) => !d.future && d.inWindow));
    if (quiet) expect(weekLabel(t, quiet, today)).toMatch(/no sessions$/);
    const week = consistency.weeks[1]!;
    const mixed = { ...week, days: week.days.map((d, i) => (i < 3 ? { ...d, inWindow: false } : d)) as typeof week.days };
    expect(weekLabel(t, mixed, today)).toMatch(/partly outside the window$/);
  });
});

describe('Planned vs trained', () => {
  it('lists rows in data order with "x of y", the unplanned part and a pending part', async () => {
    await renderScreen(<ProgressScreen />);
    expect(screen.getByTestId('progress.gap.summary')).toHaveTextContent(has('Planned focuses trained: 2 of 5'));
    const rows = screen.getAllByTestId(/^progress\.gap\.(POSITION|SUBJECT)\./).map((n) => n.props.testID);
    expect(rows).toEqual(['progress.gap.POSITION.pos-half', 'progress.gap.POSITION.pos-side', 'progress.gap.POSITION.pos-mount']);
    expect(screen.getByTestId('progress.gap.POSITION.pos-half')).toHaveTextContent(has('2 of 3'));
    expect(screen.getByTestId('progress.gap.POSITION.pos-side')).toHaveTextContent(has('1 not trained · 1 pending'));
    expect(screen.getByTestId('progress.gap.POSITION.pos-mount')).toHaveTextContent(has('+2 unplanned'));
    expect(screen.getByTestId('progress.gap.POSITION.pos-mount')).not.toHaveTextContent(has(' of '));
    await fireEvent.press(screen.getByTestId('progress.gap.POSITION.pos-side'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/progress-why', params: { kind: 'POSITION', refId: 'pos-side' } });
  });

  it('with no rows it names the next step and offers to plan a session', async () => {
    await renderScreen(<ProgressScreen />, () => { progressStore.emptyOverview = true; });
    await fireEvent.press(screen.getByTestId('progress.gap.empty.action'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/log-session', params: { mode: 'plan' } });
    expect(screen.queryByTestId('progress.gap.summary')).toBeNull();
  });
});

describe('Rank history panel', () => {
  it('shows the current rank, earlier promotions of the active scale and a link to Profile › Rank', async () => {
    await renderScreen(<ProgressScreen />);
    expect(screen.getByTestId('progress.rank')).toHaveTextContent(has('Blue belt · 2 stripes'));
    expect(screen.getByTestId('progress.rank.entry.rk-2')).toHaveTextContent(has('Blue belt · 0 stripes'));
    expect(screen.getByTestId('progress.rank.entry.rk-1')).toBeTruthy();
    expect(screen.queryByTestId('progress.rank.entry.rk-k2')).toBeNull();
    await fireEvent.press(screen.getByTestId('progress.rank.allHistory'));
    expect(router.push).toHaveBeenCalledWith('/profile/rank');
  });

  it('with no rank it offers Set rank', async () => {
    await renderScreen(<ProgressScreen />, () => { mockStore.rank = null; });
    await fireEvent.press(screen.getByTestId('progress.rank.set'));
    expect(router.push).toHaveBeenCalledWith('/set-rank');
  });
});

describe('Why sheet', () => {
  const open = async (kind: string, refId: string) => {
    useLocalSearchParams.mockReturnValue({ kind, refId });
    await renderScreen(<WhySheet />);
  };

  it('explains a Needs-work focus: state, rule, score, every signal in order, window', async () => {
    await open('POSITION', 'pos-half');
    expect(screen.getByTestId('why.title')).toHaveTextContent('Half guard');
    expect(screen.getByTestId('why.state')).toHaveTextContent('Needs work');
    expect(screen.getByTestId('why.rule')).toHaveTextContent(has('Needs-work score 0.58 is at or above 0.5'));
    expect(screen.getByTestId('why.score')).toHaveTextContent(has('Needs-work score 0.58 vs threshold 0.5'));
    const order = screen.getAllByTestId(/^why\.signal\.[A-Za-z]+$/).map((n) => n.props.testID.split('.')[2]);
    expect(order).toEqual(['n', 'daysSince', 'needsWorkRate', 'gap', 'hitRatio', 'trend']);
    expect(screen.getByTestId('why.signal.needsWorkRate.value')).toHaveTextContent('50%');
    expect(screen.getByTestId('why.signal.needsWorkRate')).toHaveTextContent(has('Weight 50%'));
    expect(screen.getByTestId('why.signal.needsWorkRate')).toHaveTextContent(has('Decided this result'));
    expect(screen.getByTestId('why.signal.trend.value')).toHaveTextContent('-0.5');
    expect(screen.getByTestId('why.window')).toBeTruthy();
  });

  it('a never-trained focus shows "Not enough data" rows, no score and the not-scored note', async () => {
    await open('POSITION', 'pos-turtle');
    expect(screen.getByTestId('why.rule')).toHaveTextContent(has('No trained session yet'));
    expect(screen.queryByTestId('why.score')).toBeNull();
    expect(screen.getByTestId('why.signal.needsWorkRate.value')).toHaveTextContent('Not enough data');
    expect(screen.getByText(has('Not scored'))).toBeTruthy();
  });

  it('a signal subset says the weights are rescaled', async () => {
    await open('POSITION', 'pos-closed');
    expect(screen.getByText(has('Score uses 1 of 4 signals; its weight is rescaled'))).toBeTruthy();
  });

  it('opens Settings › Algorithm from the link and closes with Close', async () => {
    await open('POSITION', 'pos-half');
    await fireEvent.press(screen.getByTestId('why.settings'));
    expect(router.dismiss).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith('/profile/algorithm');
    await fireEvent.press(screen.getByTestId('why.close'));
    expect(router.back).toHaveBeenCalled();
  });

  it('an unknown focus shows the not-found state', async () => {
    await open('POSITION', 'pos-gone');
    expect(screen.getByTestId('why.notFound')).toHaveTextContent(has('no progress data any more'));
  });
});

describe('rule sentences and signal values', () => {
  const params = progressStore.paramMap();
  const [half, side, turtle, closed, , mount] = progressStore.overview().results;

  it('picks the rule-1 variant from the daysSince signal (P-33)', () => {
    expect(ruleSentence(t, turtle!, params)).toBe('No trained session yet');
    expect(ruleSentence(t, side!, params)).toBe('Last trained 40 days ago, more than 21');
    const inWindow = { ...side!, signals: side!.signals.map((s) => (s.signal === 'daysSince' ? { ...s, value: 10 } : s)) };
    expect(ruleSentence(t, inWindow, params)).toBe('Not trained in the last 8 weeks');
  });

  it('rules 2-4 cite score, rise and session count', () => {
    expect(ruleSentence(t, half!, params)).toBe('Needs-work score 0.58 is at or above 0.5');
    expect(ruleSentence(t, mount!, params)).toBe('Ratings up 1.2 across 4 sessions');
    expect(ruleSentence(t, closed!, params)).toBe('Trained 3 times; no signal crossed a threshold');
  });

  it('formats each signal', () => {
    const by = (r: typeof half, id: string) => r!.signals.find((s) => s.signal === id)!;
    expect(signalValue(t, by(half, 'daysSince'))).toBe('2 days');
    expect(signalValue(t, by(half, 'hitRatio'))).toBe('40% hit');
    expect(signalValue(t, by(mount, 'trend'))).toBe('+1.2');
    expect(signalValue(t, by(turtle, 'trend'))).toBe('Not enough data');
  });
});

it('the mock "today" is the device-local date', () => {
  expect(progressStore.overview().today).toBe(toLocalToday());
});
