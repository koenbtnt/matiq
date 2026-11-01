import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { mockStore } from '../src/__mocks__/mockStore';
import { LogSessionScreen } from '../src/features/log-session/LogSessionScreen';
import { renderScreen } from '../src/__mocks__/renderScreen';

jest.mock('expo-router', () => require('../src/__mocks__/routerMock'));
jest.mock('../src/repositories', () => require('../src/__mocks__/repositoriesMock'));
const { router } = require('../src/__mocks__/routerMock');

beforeEach(() => jest.clearAllMocks());

const open = (params: Record<string, string>) => renderScreen(<LogSessionScreen params={params} />);

describe('Log Session', () => {
  it('disables Save with the reason until a trained focus exists, then saves', async () => {
    await open({ mode: 'log' });
    const save = await screen.findByTestId('log.save');
    expect(save).toBeDisabled();
    expect(screen.getByTestId('log.save.reason')).toHaveTextContent('Tick or add at least one focus you trained to save.');

    await fireEvent.changeText(screen.getByTestId('log.search.input'), 'mount');
    await fireEvent.press(await screen.findByTestId('log.search.result.pos-mount'));
    expect(screen.getByTestId('log.focus.pos-mount.status')).toHaveTextContent('Added');
    expect(screen.getByTestId('log.save')).toBeEnabled();
    expect(screen.queryByTestId('log.save.reason')).toBeNull();

    await fireEvent.press(screen.getByTestId('log.save'));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Session saved');
    expect(mockStore.sessions.some((s) => s.status === 'COMPLETED' && s.focuses.some((f) => f.refId === 'pos-mount'))).toBe(true);
  });

  it('prefills the last-used type and offers quick-add chips (flagged first)', async () => {
    await open({ mode: 'log', typeId: 'st-nogi' });
    expect(await screen.findByTestId('log.type.st-nogi')).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
    expect(screen.getByTestId('log.quickAdd.pos-half')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('log.quickAdd.pos-half'));
    expect(screen.queryByTestId('log.quickAdd.pos-half')).toBeNull();
    expect(screen.getByTestId('log.save')).toBeEnabled();
  });

  it('pre-ticks the planned rows; un-ticking keeps the row as planned-not-trained', async () => {
    await open({ mode: 'log', sessionId: 'ses-today' });
    const trained = await screen.findByTestId('log.focus.pos-side.trained');
    expect(trained).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
    expect(screen.getByTestId('log.focus.pos-side.status')).toHaveTextContent('Planned');
    expect(screen.getByTestId('log.save')).toBeEnabled();

    await fireEvent.press(screen.getByTestId('log.focus.pos-side.trained'));
    expect(screen.getByTestId('log.focus.pos-side.status')).toHaveTextContent('Planned · not trained');
    expect(screen.queryByTestId('log.focus.pos-side.rating.4')).toBeNull();
    expect(screen.getByTestId('log.focus.sub-grips.trained')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('log.focus.sub-grips.trained'));
    expect(screen.getByTestId('log.save')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('log.focus.pos-side.trained'));
    await fireEvent.press(screen.getByTestId('log.focus.pos-side.rating.4'));
    await fireEvent.press(screen.getByTestId('log.save'));
    await waitFor(() => expect(router.back).toHaveBeenCalled());

    const saved = mockStore.sessions.find((s) => s.id === 'ses-today');
    expect(saved?.status).toBe('COMPLETED');
    expect(saved?.focuses.find((f) => f.refId === 'sub-grips')).toMatchObject({ isPlanned: true, isActual: false });
    expect(saved?.focuses.find((f) => f.refId === 'pos-side')).toMatchObject({ isActual: true, rating: 4 });
  });

  it('maps a DomainError code to its copy in the error banner', async () => {
    await open({ mode: 'log', sessionId: 'ses-today' });
    await screen.findByTestId('log.save');
    mockStore.failNextWith = 'FOCUS_REF_NOT_FOUND';
    await fireEvent.press(screen.getByTestId('log.save'));
    expect(await screen.findByTestId('log.error')).toHaveTextContent('One of the focuses is no longer in the library. Remove it and save again.');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('falls back to the generic copy for an unknown code', async () => {
    await open({ mode: 'log', sessionId: 'ses-today' });
    await screen.findByTestId('log.save');
    mockStore.failNextWith = 'SOMETHING_NEW';
    await fireEvent.press(screen.getByTestId('log.save'));
    expect(await screen.findByTestId('log.error')).toHaveTextContent('Something went wrong. Try again.');
  });

  it('plan mode: needs one focus, hides sparring and session sections, saves a plan with Undo', async () => {
    await open({ mode: 'plan', focus: 'POSITION:pos-half' });
    await screen.findByTestId('log.save');
    expect(screen.queryByTestId('log.sparring.rounds.more')).toBeNull();
    expect(screen.queryByTestId('log.session.duration.more')).toBeNull();
    expect(screen.getByTestId('log.focus.pos-half.status')).toHaveTextContent('Planned');
    expect(screen.getByTestId('log.save')).toHaveTextContent('Save plan');
    await fireEvent.press(screen.getByTestId('log.save'));
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Plan saved');
    const planned = mockStore.sessions.filter((s) => s.status === 'PLANNED').length;

    await fireEvent.press(screen.getByTestId('toast.undo'));
    await waitFor(() => expect(screen.getByTestId('toast.message')).toHaveTextContent('Plan deleted'));
    expect(mockStore.sessions.filter((s) => s.status === 'PLANNED' && !s.deleted).length).toBe(planned - 1);
  });

  it('delete in edit mode soft-deletes, dismisses, and the toast Undo calls undoDelete', async () => {
    await open({ mode: 'edit', sessionId: 'ses-last', from: 'session' });
    await fireEvent.press(await screen.findByTestId('log.delete'));
    await waitFor(() => expect(router.dismissTo).toHaveBeenCalledWith('/'));
    expect(mockStore.sessions.find((s) => s.id === 'ses-last')?.deleted).toBe(true);
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Session deleted');
    await fireEvent.press(screen.getByTestId('toast.undo'));
    await waitFor(() => expect(mockStore.sessions.find((s) => s.id === 'ses-last')?.deleted).toBe(false));
  });

  it('shows a not-found state for a deleted session', async () => {
    await open({ mode: 'edit', sessionId: 'ses-missing' });
    expect(await screen.findByText('Session not found')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('log.notFound.cancel'));
    expect(router.back).toHaveBeenCalled();
  });

  it('shows the loading state with a disabled Save while data loads', async () => {
    await renderScreen(<LogSessionScreen params={{ mode: 'log' }} />, () => {
      mockStore.forced = 'loading';
    });
    expect(screen.getByLabelText('Loading')).toBeTruthy();
    expect(screen.getByTestId('log.save')).toBeDisabled();
  });

  it('named submissions: mismatch offer sets the stepper to the named count', async () => {
    await open({ mode: 'log', sessionId: 'ses-today' });
    await fireEvent.press(await screen.findByTestId('log.sparring.landedWith.add'));
    await fireEvent.press(await screen.findByTestId('log.techniqueSearch.result.tec-kimura'));
    expect(screen.getByTestId('log.sparring.landedWith.0')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('log.sparring.useCount.landed'));
    expect(screen.getByTestId('log.sparring.landed.value')).toHaveTextContent('1');
    expect(screen.queryByTestId('log.sparring.useCount.landed')).toBeNull();
  });

  it('details disclosure reveals comment, counts and technique attach for a trained row', async () => {
    await open({ mode: 'log', sessionId: 'ses-today' });
    await fireEvent.press(await screen.findByTestId('log.focus.pos-side.details'));
    expect(screen.getByTestId('log.focus.pos-side.comment')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('log.focus.pos-side.hit.more'));
    expect(screen.getByTestId('log.focus.pos-side.hit.value')).toHaveTextContent('1');
    await fireEvent.press(screen.getByTestId('log.focus.pos-side.addTechnique'));
    await fireEvent.press(await screen.findByTestId('log.techniqueSearch.result.tec-knee-cut'));
    expect(screen.getByTestId('log.focus.pos-side.technique.tec-knee-cut')).toBeTruthy();
  });

  it('re-tapping the selected session rating clears it (D-A6)', async () => {
    await open({ mode: 'log' });
    await fireEvent.press(await screen.findByTestId('log.session.rating.3'));
    expect(screen.getByText('Session rating · 3 of 5')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('log.session.rating.3'));
    expect(screen.getByText('Session rating')).toBeTruthy();
  });

  it('duration stepper: first tap 60, then steps of 15', async () => {
    await open({ mode: 'log' });
    await fireEvent.press(await screen.findByTestId('log.session.duration.more'));
    expect(screen.getByTestId('log.session.duration.value')).toHaveTextContent('60min');
    await fireEvent.press(screen.getByTestId('log.session.duration.more'));
    expect(screen.getByTestId('log.session.duration.value')).toHaveTextContent('75min');
  });
});
