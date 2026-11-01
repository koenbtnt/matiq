import { act, fireEvent, screen } from '@testing-library/react-native';
import type { ComponentProps } from 'react';
import { Appearance, Linking } from 'react-native';

import { MainTabBar } from '../src/components/MainTabBar';
import { mockStore } from '../src/__mocks__/mockStore';
import { progressStore } from '../src/__mocks__/progressStore';
import { renderScreen } from '../src/__mocks__/renderScreen';
import { AboutScreen, sourceSlug } from '../src/features/profile/AboutScreen';
import { AlgorithmScreen } from '../src/features/profile/AlgorithmScreen';
import { ProfileScreen } from '../src/features/profile/ProfileScreen';
import { RankScreen } from '../src/features/profile/RankScreen';
import { SuggestionsScreen } from '../src/features/profile/SuggestionsScreen';
import { ThemeOverride } from '../src/features/profile/ThemeOverride';
import { parseTyped, roundTo } from '../src/features/profile/paramUi';
import { SetRankSheet } from '../src/features/rank/SetRankSheet';

jest.mock('expo-router', () => require('../src/__mocks__/routerMock'));
jest.mock('../src/repositories', () => require('../src/__mocks__/repositoriesMock'));
const { router, useLocalSearchParams } = require('../src/__mocks__/routerMock');

const has = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const param = (key: string) => progressStore.params.find((p) => p.key === key)!.value;

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({});
});

describe('Profile', () => {
  it('puts the rank card first, then the groups with their current values', async () => {
    await renderScreen(<ProfileScreen />);
    expect(screen.getByTestId('profile.rank')).toHaveTextContent(has('Blue belt · 2 stripes'));
    expect(screen.getByTestId('profile.algorithm')).toHaveTextContent(has('8-week window'));
    expect(screen.getByTestId('profile.suggestions')).toHaveTextContent(has('Up to 3'));
    expect(screen.getByTestId('profile.rankHistory')).toHaveTextContent(has('Adult'));
    expect(screen.getByTestId('profile.about')).toHaveTextContent(has('Version 0.1.0'));
    await fireEvent.press(screen.getByTestId('profile.algorithm'));
    await fireEvent.press(screen.getByTestId('profile.suggestions'));
    await fireEvent.press(screen.getByTestId('profile.rankHistory'));
    await fireEvent.press(screen.getByTestId('profile.about'));
    expect(router.push.mock.calls.map((c: unknown[]) => c[0])).toEqual(['/profile/algorithm', '/profile/suggestions', '/profile/rank', '/profile/about']);
  });

  it('says "Off" for suggestions when the maximum is 0 or every source is off', async () => {
    await renderScreen(<ProfileScreen />, () => { progressStore.settings['suggest.max'] = 0; });
    expect(screen.getByTestId('profile.suggestions')).toHaveTextContent(has('Off'));
  });

  it('a switch row is one accessibility stop that toggles and stores the setting', async () => {
    await renderScreen(<ProfileScreen />);
    const row = screen.getByTestId('profile.detailedRounds');
    expect(row).toHaveProp('accessibilityRole', 'switch');
    expect(row).toHaveProp('accessibilityState', { checked: false });
    await fireEvent.press(row);
    expect(progressStore.settings['log.detailedRounds']).toBe(true);
    expect(screen.getByTestId('profile.detailedRounds')).toHaveProp('accessibilityState', { checked: true });
    await fireEvent.press(screen.getByTestId('profile.showExtended'));
    expect(mockStore.showExtended).toBe(true);
  });

  it('the theme control stores SYSTEM / LIGHT / DARK', async () => {
    await renderScreen(<ProfileScreen />);
    expect(screen.getByTestId('profile.theme.SYSTEM')).toHaveProp('accessibilityState', { selected: true });
    await fireEvent.press(screen.getByTestId('profile.theme.DARK'));
    expect(progressStore.settings['theme.override']).toBe('DARK');
    expect(screen.getByTestId('profile.theme.DARK')).toHaveProp('accessibilityState', { selected: true });
  });

  it('shows the empty rank card when there is no rank', async () => {
    await renderScreen(<ProfileScreen />, () => { mockStore.rank = null; });
    await fireEvent.press(screen.getByTestId('profile.rank.set'));
    expect(router.push).toHaveBeenCalledWith('/set-rank');
  });
});

describe('Theme override (Q5)', () => {
  const spy = () => jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);

  it.each([
    ['SYSTEM', 'auto'],
    ['LIGHT', 'light'],
    ['DARK', 'dark'],
  ])('%s calls Appearance.setColorScheme(%s)', async (value, scheme) => {
    const set = spy();
    const settled = jest.fn();
    await renderScreen(<ThemeOverride onSettled={settled} />, () => { progressStore.settings['theme.override'] = value; });
    expect(set).toHaveBeenCalledWith(scheme);
    expect(settled).toHaveBeenCalled();
    set.mockRestore();
  });

  it('follows a change at once', async () => {
    const set = spy();
    await renderScreen(<ThemeOverride onSettled={jest.fn()} />);
    await act(async () => { progressStore.setSetting('theme.override', 'DARK'); });
    expect(set).toHaveBeenLastCalledWith('dark');
    set.mockRestore();
  });
});

describe('Tab bar', () => {
  it('renders Home · Library · Log · Progress · Profile and navigates', async () => {
    const names = ['index', 'library', 'log', 'progress', 'profile'];
    const state = { index: 3, routes: names.map((n) => ({ key: n, name: n })) };
    const navigateToTab = jest.fn();
    const emitter = { emit: jest.fn(() => ({ defaultPrevented: false })) };
    const props = { state, emitter, navigateToTab } as unknown as ComponentProps<typeof MainTabBar>;
    await renderScreen(<MainTabBar {...props} />);
    for (const id of ['tabs.home', 'tabs.library', 'tabs.log', 'tabs.progress', 'tabs.profile']) expect(screen.getByTestId(id)).toBeTruthy();
    expect(screen.getByTestId('tabs.progress')).toHaveProp('accessibilityState', { selected: true });
    await fireEvent.press(screen.getByTestId('tabs.profile'));
    expect(navigateToTab).toHaveBeenCalledWith('profile');
  });
});

describe('Algorithm', () => {
  it('previews the state counts and lists every parameter with its range', async () => {
    await renderScreen(<AlgorithmScreen />);
    expect(screen.getByTestId('algorithm.preview')).toHaveTextContent(has('1 needs work · 2 not trained lately · 3 steady · 1 improving'));
    for (const k of ['windowWeeks', 'staleDays', 'minSessions', 'trendImproving', 'needsWorkThreshold', 'wNeedsWork', 'wHitCaught', 'wGap', 'wTrend', 'hitCaughtMinEvents']) {
      expect(screen.getByTestId(`algorithm.param.${k}.input`)).toBeTruthy();
    }
    expect(screen.getByText(has('From 2 to 26 · default 8'))).toBeTruthy();
  });

  it('keeps the stepper value and the typed field as separate accessibility stops', async () => {
    await renderScreen(<AlgorithmScreen />);
    const value = screen.getByTestId('algorithm.param.windowWeeks.value');
    const input = screen.getByTestId('algorithm.param.windowWeeks.input');
    expect(value).toHaveProp('accessibilityRole', 'adjustable');
    expect(value).toHaveProp('accessibilityValue', { min: 2, max: 26, now: 8 });
    expect(input).toHaveProp('accessibilityLabel', 'Window: type a value');
    expect(input.parent).not.toBe(value);
    expect(input.props.accessibilityRole).not.toBe('adjustable');
  });

  it('the stepper commits one step; decimal steps do not drift', async () => {
    await renderScreen(<AlgorithmScreen />);
    await fireEvent.press(screen.getByTestId('algorithm.param.windowWeeks.more'));
    expect(param('windowWeeks')).toBe(9);
    await fireEvent.press(screen.getByTestId('algorithm.param.wNeedsWork.more'));
    expect(param('wNeedsWork')).toBe(0.45);
    expect(screen.getByTestId('algorithm.param.windowWeeks.input').props.value).toBe('9');
  });

  it('rejects a typed out-of-range value with the range in the banner and reverts the field', async () => {
    await renderScreen(<AlgorithmScreen />);
    const input = screen.getByTestId('algorithm.param.wNeedsWork.input');
    await fireEvent.changeText(input, '1.5');
    await fireEvent(input, 'blur');
    expect(await screen.findByTestId('algorithm.param.wNeedsWork.error')).toHaveTextContent('Enter a value from 0 to 1.');
    expect(param('wNeedsWork')).toBe(0.4);
    expect(screen.getByTestId('algorithm.param.wNeedsWork.input').props.value).toBe('0.4');
  });

  it('rejects a fractional whole-number param and non-numbers; accepts a comma decimal', async () => {
    await renderScreen(<AlgorithmScreen />);
    const weeks = screen.getByTestId('algorithm.param.windowWeeks.input');
    await fireEvent.changeText(weeks, '8.5');
    await fireEvent(weeks, 'blur');
    expect(await screen.findByTestId('algorithm.param.windowWeeks.error')).toHaveTextContent('Enter a whole number.');
    await fireEvent.changeText(weeks, 'abc');
    await fireEvent(weeks, 'blur');
    expect(screen.getByTestId('algorithm.param.windowWeeks.error')).toHaveTextContent('Enter a number.');
    const gap = screen.getByTestId('algorithm.param.wGap.input');
    await fireEvent.changeText(gap, '0,35');
    await fireEvent(gap, 'blur');
    expect(param('wGap')).toBe(0.35);
    await fireEvent.changeText(weeks, '12');
    await fireEvent(weeks, 'submitEditing');
    expect(param('windowWeeks')).toBe(12);
    expect(screen.queryByTestId('algorithm.param.windowWeeks.error')).toBeNull();
  });

  it('disables the stepper at its limits', async () => {
    await renderScreen(<AlgorithmScreen />, () => { progressStore.setParam('v1', 'wTrend', 1); });
    expect(screen.getByTestId('algorithm.param.wTrend.more')).toHaveProp('accessibilityState', expect.objectContaining({ disabled: true }));
  });

  it('Reset to defaults restores every value and the toast Undo brings the previous ones back', async () => {
    await renderScreen(<AlgorithmScreen />);
    await fireEvent.press(screen.getByTestId('algorithm.param.windowWeeks.more'));
    await fireEvent.press(screen.getByTestId('algorithm.param.staleDays.more'));
    await fireEvent.press(screen.getByTestId('algorithm.reset'));
    expect(param('windowWeeks')).toBe(8);
    expect(param('staleDays')).toBe(21);
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Defaults restored');
    await fireEvent.press(screen.getByTestId('toast.undo'));
    expect(param('windowWeeks')).toBe(9);
    expect(param('staleDays')).toBe(22);
  });

  it('shows an error state with Try again', async () => {
    await renderScreen(<AlgorithmScreen />, () => { progressStore.forced = { error: { code: 'DB_NOT_OPEN' } }; });
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});

describe('paramUi helpers', () => {
  it('rounds to the field decimals and parses "," or "."', () => {
    expect(roundTo(0.45000000000000007, 2)).toBe(0.45);
    expect(parseTyped('0,35')).toBe(0.35);
    expect(parseTyped(' 12 ')).toBe(12);
    expect(parseTyped('')).toBeNaN();
    expect(parseTyped('1e3')).toBeNaN();
  });
});

describe('Suggestions', () => {
  it('stores each source switch and the maximum', async () => {
    await renderScreen(<SuggestionsScreen />);
    await fireEvent.press(screen.getByTestId('suggestions.needsWork'));
    expect(progressStore.settings['suggest.needsWork']).toBe(false);
    expect(screen.getByTestId('suggestions.needsWork')).toHaveProp('accessibilityState', { checked: false });
    await fireEvent.press(screen.getByTestId('suggestions.max.more'));
    expect(progressStore.settings['suggest.max']).toBe(4);
    await fireEvent.press(screen.getByTestId('suggestions.cycle'));
    expect(progressStore.settings['suggest.cycle']).toBe(false);
    expect(screen.getByText(has('Focus cycles come in a later version'))).toBeTruthy();
  });

  it('keeps the maximum within 0 to 10', async () => {
    await renderScreen(<SuggestionsScreen />, () => { progressStore.settings['suggest.max'] = 10; });
    expect(screen.getByTestId('suggestions.max.more')).toHaveProp('accessibilityState', expect.objectContaining({ disabled: true }));
  });
});

describe('Profile › Rank', () => {
  it('lists the active scale only, switches scale without deleting, and opens entries and the add sheet', async () => {
    await renderScreen(<RankScreen />);
    expect(screen.getByTestId('profileRank.entry.rk-3')).toHaveTextContent(has('Blue belt · 2 stripes'));
    expect(screen.queryByTestId('profileRank.entry.rk-k2')).toBeNull();
    await fireEvent.press(screen.getByTestId('profileRank.scale.KIDS'));
    expect(progressStore.settings['rank.scale']).toBe('KIDS');
    expect(screen.getByTestId('profileRank.entry.rk-k2')).toHaveTextContent(has('Grey-white belt · 1 stripe'));
    expect(screen.queryByTestId('profileRank.entry.rk-3')).toBeNull();
    expect(progressStore.ranks).toHaveLength(4);
    await fireEvent.press(screen.getByTestId('profileRank.entry.rk-k2'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/set-rank', params: { entryId: 'rk-k2' } });
    await fireEvent.press(screen.getByTestId('profileRank.add'));
    expect(router.push).toHaveBeenCalledWith('/set-rank');
  });

  it('an empty scale shows the empty state', async () => {
    await renderScreen(<RankScreen />, () => { progressStore.ranks = []; });
    expect(screen.getByTestId('profileRank.empty')).toHaveTextContent(has('No ranks on this scale yet'));
  });
});

describe('Set rank sheet (scale, edit, delete)', () => {
  it('lists the 5 adult belts, or the 13 kids belts on the kids scale', async () => {
    await renderScreen(<SetRankSheet />);
    expect(screen.getAllByTestId(/^rank\.belt\./)).toHaveLength(5);
    await screen.unmount();
    await renderScreen(<SetRankSheet />, () => { progressStore.settings['rank.scale'] = 'KIDS'; });
    expect(screen.getAllByTestId(/^rank\.belt\./).length).toBeGreaterThanOrEqual(13);
    expect(screen.getByTestId('rank.belt.GREEN_BLACK')).toHaveTextContent(has('Green-black belt'));
  });

  it('adds with the active scale', async () => {
    await renderScreen(<SetRankSheet />, () => { progressStore.settings['rank.scale'] = 'KIDS'; mockStore.rank = null; });
    await fireEvent.press(screen.getByTestId('rank.belt.YELLOW'));
    await fireEvent.press(screen.getByTestId('rank.save'));
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Rank saved');
    expect(progressStore.ranks.some((r) => r.scale === 'KIDS' && r.belt === 'YELLOW')).toBe(true);
  });

  it('edit mode prefills the entry, saves with update, and deletes with an Undo toast', async () => {
    useLocalSearchParams.mockReturnValue({ entryId: 'rk-2' });
    await renderScreen(<SetRankSheet />);
    expect(screen.getByTestId('rank.title')).toHaveTextContent('Edit rank entry');
    expect(screen.getByTestId('rank.belt.BLUE')).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
    await fireEvent.press(screen.getByTestId('rank.stripes.more'));
    await fireEvent.press(screen.getByTestId('rank.save'));
    await screen.findByTestId('toast.message');
    expect(progressStore.ranks.find((r) => r.id === 'rk-2')!.stripes).toBe(1);

    await screen.unmount();
    await renderScreen(<SetRankSheet />);
    await fireEvent.press(screen.getByTestId('rank.delete'));
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Rank entry deleted');
    expect(progressStore.rankHistory().some((r) => r.id === 'rk-2')).toBe(false);
    await fireEvent.press(screen.getByTestId('toast.undo'));
    expect(progressStore.rankHistory().some((r) => r.id === 'rk-2')).toBe(true);
  });

  it('has no delete button when adding', async () => {
    await renderScreen(<SetRankSheet />);
    expect(screen.queryByTestId('rank.delete')).toBeNull();
  });
});

describe('About', () => {
  it('renders every attribution source with its licence and links (CO-35)', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await renderScreen(<AboutScreen />);
    expect(sourceSlug('bjj-data by Grapple Flows')).toBe('bjj-data-by-grapple-flows');
    expect(screen.getByTestId('about.attribution.grapplemap')).toHaveTextContent(has('Licence: Public domain'));
    const flows = screen.getByTestId('about.attribution.bjj-data-by-grapple-flows');
    expect(flows).toHaveTextContent(has('Licence: CC BY 4.0'));
    expect(flows).toHaveTextContent(has('Data from bjj-data by Grapple Flows'));
    expect(flows).toHaveTextContent(has('Changes: slugs rendered as display names'));
    expect(flows).toHaveTextContent(has('Version: aecbd79'));
    expect(screen.getByTestId('about.attribution.matiq-curated-layer')).toHaveTextContent(has('Licence: matIQ'));
    expect(screen.queryByTestId('about.attribution.matiq-curated-layer.link')).toBeNull();
    await fireEvent.press(screen.getByTestId('about.attribution.bjj-data-by-grapple-flows.licence'));
    expect(open).toHaveBeenCalledWith('https://creativecommons.org/licenses/by/4.0/');
    await fireEvent.press(screen.getByTestId('about.attribution.bjj-data-by-grapple-flows.link'));
    expect(open).toHaveBeenCalledWith('https://github.com/grapple-flows/bjj-data');
    expect(screen.getByTestId('about.attribution.bjj-data-by-grapple-flows.link')).toHaveProp('accessibilityRole', 'link');
    open.mockRestore();
  });

  it('shows the versions and the backup status from the mocked value', async () => {
    await renderScreen(<AboutScreen />);
    expect(screen.getByTestId('about.version')).toHaveTextContent('Version 0.1.0');
    expect(screen.getByTestId('about.backup.status')).toHaveTextContent(has('excluded from iCloud and computer backups'));
    await act(async () => { progressStore.about = { ...progressStore.about, backup: 'failed' }; progressStore.emit(); });
    expect(screen.getByTestId('about.backup.status')).toHaveTextContent(has("couldn't exclude your data from backups"));
  });
});
