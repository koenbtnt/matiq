import { fireEvent, screen, act } from '@testing-library/react-native';

import { mockStore } from '../src/__mocks__/mockStore';
import { LibraryScreen } from '../src/features/library/LibraryScreen';
import { PositionDetailScreen } from '../src/features/library/PositionDetailScreen';
import { renderScreen } from '../src/__mocks__/renderScreen';

jest.mock('expo-router', () => require('../src/__mocks__/routerMock'));
const { router } = require('../src/__mocks__/routerMock');

const has = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

const type = async (id: string, text: string) => {
  await fireEvent.changeText(screen.getByTestId(id), text);
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
};

describe('Library', () => {
  it('hides EXTENDED positions by default and lists CORE first', async () => {
    await renderScreen(<LibraryScreen />);
    expect(screen.getByTestId('library.position.pos-closed')).toBeTruthy();
    expect(screen.queryByTestId('library.position.pos-scarf')).toBeNull();
  });

  it('shows an Extended tag only when the setting is on', async () => {
    await renderScreen(<LibraryScreen />);
    await act(async () => {
      mockStore.showExtended = true;
      mockStore.emit();
    });
    expect(screen.getByTestId('library.position.pos-scarf')).toHaveTextContent(has('Extended'));
    expect(screen.getByTestId('library.position.pos-closed')).not.toHaveTextContent(has('Extended'));
  });

  it('an alias search shows the canonical row with "Also: <alias>"', async () => {
    await renderScreen(<LibraryScreen />);
    await type('library.search.input', 'knee ride');
    const row = screen.getByTestId('library.position.pos-kob');
    expect(row).toHaveTextContent(has('Knee on belly'));
    expect(row).toHaveTextContent(has('Also: Knee ride'));
    await fireEvent.press(row);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/library/position/[id]', params: { id: 'pos-kob' } });
  });

  it('no match: names the query and says aliases are searched', async () => {
    await renderScreen(<LibraryScreen />);
    await type('library.search.input', 'zzzz');
    expect(screen.getByTestId('library.empty')).toHaveTextContent(/No match for “zzzz”.*Aliases are searched too/);
  });

  it('technique rows are non-interactive and badge Gi / No-gi', async () => {
    await renderScreen(<LibraryScreen />);
    await fireEvent.press(screen.getByTestId('library.segment.techniques'));
    const gi = screen.getByTestId('library.technique.tec-collar');
    expect(gi).toHaveTextContent(has('Gi'));
    expect(gi).toHaveTextContent(has('Submission · from Closed guard'));
    expect(screen.getByTestId('library.technique.tec-mount-esc')).toHaveTextContent(has('No-gi'));
    expect(screen.getByTestId('library.technique.tec-scissor')).toHaveTextContent(has('Sweep · Closed guard → Mount · from bottom'));
    expect(screen.queryByTestId('library.technique.tec-ezekiel')).toBeNull();
  });

  it('subjects filter by name and description, keeping the query across segments', async () => {
    await renderScreen(<LibraryScreen />);
    await type('library.search.input', 'hand fight');
    await fireEvent.press(screen.getByTestId('library.segment.subjects'));
    expect(screen.getByTestId('library.subject.sub-grips')).toBeTruthy();
    expect(screen.queryByTestId('library.subject.sub-escapes')).toBeNull();
  });

  it('error state offers retry; loading shows the spinner', async () => {
    await renderScreen(<LibraryScreen />, () => {
      mockStore.forced = 'loading';
    });
    expect(screen.getByTestId('library.loading')).toBeTruthy();
    await act(async () => {
      mockStore.forced = { error: { code: 'UNKNOWN' } };
      mockStore.emit();
    });
    expect(screen.getByTestId('library.error.retry')).toBeTruthy();
  });
});

describe('Position detail', () => {
  it('groups techniques by type under From here / Into here', async () => {
    await renderScreen(<PositionDetailScreen id="pos-mount" />);
    expect(screen.getByText('From here')).toBeTruthy();
    expect(screen.getByText('Into here')).toBeTruthy();
    expect(screen.getByText('Submissions · 1')).toBeTruthy();
    expect(screen.getByTestId('position.technique.tec-armbar')).toBeTruthy();
    expect(screen.getByTestId('position.technique.tec-scissor')).toBeTruthy();
  });

  it('shows the parent row and children, and pushes to them', async () => {
    await renderScreen(<PositionDetailScreen id="pos-side" />);
    await act(async () => {
      mockStore.showExtended = true;
      mockStore.emit();
    });
    await fireEvent.press(screen.getByTestId('position.variant.pos-scarf'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/library/position/[id]', params: { id: 'pos-scarf' } });
  });

  it('variant-of row on a child', async () => {
    await renderScreen(<PositionDetailScreen id="pos-scarf" />);
    expect(screen.getByTestId('position.variantOf')).toHaveTextContent(has('Variant of Side control'));
  });

  it('not found', async () => {
    await renderScreen(<PositionDetailScreen id="nope" />);
    expect(screen.getByText('Position not found')).toBeTruthy();
    expect(screen.getByText('This entry is no longer in the library.')).toBeTruthy();
  });
});
