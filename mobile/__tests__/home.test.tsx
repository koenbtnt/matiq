import { fireEvent, screen } from '@testing-library/react-native';
import { act } from 'react';

import { mockStore } from '../src/__mocks__/mockStore';
import { HomeScreen } from '../src/features/home/HomeScreen';
import { renderScreen } from '../src/__mocks__/renderScreen';

jest.mock('expo-router', () => require('../src/__mocks__/routerMock'));
jest.mock('../src/repositories', () => require('../src/__mocks__/repositoriesMock'));
const { router } = require('../src/__mocks__/routerMock');

beforeEach(() => jest.clearAllMocks());

describe('Home', () => {
  it('shows the next planned session with its two actions', async () => {
    await renderScreen(<HomeScreen />);
    expect(screen.getByTestId('home.next')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('home.next.logIt'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/log-session', params: { mode: 'log', sessionId: 'ses-today' } });
    await fireEvent.press(screen.getByTestId('home.next.editPlan'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/log-session', params: { mode: 'plan', sessionId: 'ses-today' } });
  });

  it('quick log targets the single planned session of today, else a new session of the last-used type', async () => {
    await renderScreen(<HomeScreen />);
    expect(screen.getByText(/Logs today’s|Logs today's/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('home.quickLog'));
    await act(async () => {});
    expect(router.push).toHaveBeenCalledWith({ pathname: '/log-session', params: { mode: 'log', sessionId: 'ses-today' } });

    await act(async () => {
      await mockStore.softDelete('ses-today');
    });
    expect(screen.getByText(/Starts a new No-gi class session/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('home.quickLog'));
    await act(async () => {});
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/log-session', params: { mode: 'log', typeId: 'st-nogi' } });
  });

  it('labels a suggestion with its source and flags it', async () => {
    await renderScreen(<HomeScreen />);
    const row = screen.getByTestId('home.suggestion.pos-half');
    expect(row).toHaveTextContent(/Flagged last session.*Flagged$/);
    await fireEvent.press(row);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/log-session', params: { mode: 'plan', focus: 'POSITION:pos-half' } });
  });

  it('skips a stale session and offers Undo', async () => {
    await renderScreen(<HomeScreen />);
    await fireEvent.press(screen.getByTestId('home.stale.ses-stale.skip'));
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Session skipped');
    expect(screen.queryByTestId('home.stale.ses-stale')).toBeNull();
    await fireEvent.press(screen.getByTestId('toast.undo'));
    expect(await screen.findByTestId('home.stale.ses-stale')).toBeTruthy();
  });

  it('first run: plan-empty card, recent-empty text and the rank prompt', async () => {
    await renderScreen(<HomeScreen />);
    await act(async () => {
      mockStore.sessions = [];
      mockStore.rank = null;
      mockStore.emit();
    });
    expect(screen.getByTestId('home.planEmpty.action')).toBeTruthy();
    expect(screen.getByTestId('home.recent.empty')).toHaveTextContent(/^No sessions logged yet/);
    expect(screen.getByTestId('home.rank.set')).toBeTruthy();
    expect(screen.getByText(/Starts a new/)).toBeTruthy();
  });

  it('renders loading and error states from one hook result', async () => {
    await renderScreen(<HomeScreen />);
    await act(async () => {
      mockStore.forced = 'loading';
      mockStore.emit();
    });
    expect(screen.getByTestId('home.loading')).toBeTruthy();
    await act(async () => {
      mockStore.forced = { error: { code: 'SETTING_UNKNOWN' } };
      mockStore.emit();
    });
    expect(screen.getByTestId('home.error')).toHaveTextContent(/A setting couldn/);
    expect(screen.getByTestId('home.error.retry')).toBeTruthy();
  });
});
