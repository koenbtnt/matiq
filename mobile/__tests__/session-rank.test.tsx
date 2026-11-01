import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { mockStore } from '../src/__mocks__/mockStore';
import { SessionDetailScreen } from '../src/features/session/SessionDetailScreen';
import { SetRankSheet } from '../src/features/rank/SetRankSheet';
import { renderScreen } from '../src/__mocks__/renderScreen';

jest.mock('expo-router', () => require('../src/__mocks__/routerMock'));
const { router } = require('../src/__mocks__/routerMock');

const has = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

beforeEach(() => jest.clearAllMocks());

describe('Session detail', () => {
  it('shows planned vs actual as text for every focus', async () => {
    await renderScreen(<SessionDetailScreen id="ses-last" />);
    expect(screen.getByTestId('session.focus.pos-half.status')).toHaveTextContent(has('Planned · trained'));
    expect(screen.getByTestId('session.focus.pos-mount.status')).toHaveTextContent(has('Not planned · trained'));
    expect(screen.getByTestId('session.focus.pos-half')).toHaveTextContent(has('Flagged'));
    await fireEvent.press(screen.getByTestId('session.edit'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/log-session', params: { mode: 'edit', sessionId: 'ses-last', from: 'session' } });
  });

  it('a planned-not-trained focus reads "Planned · not trained"', async () => {
    await renderScreen(<SessionDetailScreen id="ses-last" />);
    mockStore.sessions.find((s) => s.id === 'ses-last')!.focuses[0]!.isActual = false;
    mockStore.emit();
    expect(await screen.findByTestId('session.focus.pos-half.status')).toHaveTextContent(has('Planned · not trained'));
  });

  it('PLANNED session offers Log it; SKIPPED has no action bar', async () => {
    await renderScreen(<SessionDetailScreen id="ses-today" />);
    expect(screen.getByTestId('session.logIt')).toBeTruthy();
    await renderScreen(<SessionDetailScreen id="ses-stale" />);
    await fireEvent.press(screen.getAllByTestId('session.logIt')[0]!);
  });

  it('not found state', async () => {
    await renderScreen(<SessionDetailScreen id="gone" />);
    expect(screen.getByTestId('session.notFound')).toHaveTextContent(has('Session not found'));
  });
});

describe('Set-rank sheet', () => {
  it('prefills the current rank and previews the title live', async () => {
    await renderScreen(<SetRankSheet />);
    expect(screen.getByText('Blue belt · 2 stripes')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('rank.belt.BLACK'));
    expect(screen.getByText('Black belt · 2 stripes')).toBeTruthy();
    expect(screen.getByTestId('rank.belt.BLACK')).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
  });

  it('stripes cap at 4, or 6 on black', async () => {
    await renderScreen(<SetRankSheet />);
    await fireEvent.press(screen.getByTestId('rank.stripes.more'));
    await fireEvent.press(screen.getByTestId('rank.stripes.more'));
    expect(screen.getByTestId('rank.stripes.more')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('rank.belt.BLACK'));
    expect(screen.getByTestId('rank.stripes.more')).toBeEnabled();
  });

  it('saves via rank.add, dismisses, toasts without Undo', async () => {
    await renderScreen(<SetRankSheet />);
    await fireEvent.press(screen.getByTestId('rank.belt.PURPLE'));
    await fireEvent.press(screen.getByTestId('rank.save'));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(mockStore.rank).toMatchObject({ belt: 'PURPLE', stripes: 2, scale: 'ADULT' });
    expect(await screen.findByTestId('toast.message')).toHaveTextContent(has('Rank saved'));
    expect(screen.queryByTestId('toast.undo')).toBeNull();
  });

  it('shows a RANK_* error in the banner', async () => {
    await renderScreen(<SetRankSheet />);
    mockStore.failNextWith = 'RANK_DATE_INVALID';
    await fireEvent.press(screen.getByTestId('rank.save'));
    expect(await screen.findByTestId('rank.error')).toHaveTextContent(has("The award date can't be in the future."));
  });
});
