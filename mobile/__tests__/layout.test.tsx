import { fireEvent, render, screen, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../src/i18n';
import { mockStore } from '../src/__mocks__/mockStore';
import { fontMap, tokenFamilies } from '../src/hooks/fonts';
import RootLayout from '../app/_layout';

jest.mock('expo-router', () => require('../src/__mocks__/routerMock'));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(() => Promise.resolve()), hideAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
const mockUseFonts = jest.fn();
jest.mock('expo-font', () => ({ useFonts: (...a: unknown[]) => mockUseFonts(...a) }));
const SplashScreen = require('expo-splash-screen');

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };
const mount = () => render(<SafeAreaProvider initialMetrics={metrics}><RootLayout /></SafeAreaProvider>);

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.reset();
});

describe('font map', () => {
  it('covers every family named in tokens.ts', () => {
    expect(tokenFamilies.length).toBeGreaterThanOrEqual(6);
    for (const family of tokenFamilies) expect(Object.keys(fontMap)).toContain(family);
  });
});

describe('root layout gate', () => {
  it('holds the splash (renders nothing) while fonts load', async () => {
    mockUseFonts.mockReturnValue([false, null]);
    await mount();
    expect(screen.queryByTestId('bootstrap.error')).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('holds the splash while the bootstrap is loading, even with fonts ready', async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockStore.bootstrap = { status: 'loading' };
    await mount();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
    await act(async () => {
      mockStore.bootstrap = { status: 'ready' };
      mockStore.emit();
    });
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('continues with system fonts on a font error, logging a warning', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockUseFonts.mockReturnValue([false, new Error('no font')]);
    await mount();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('fonts failed'), 'no font');
    warn.mockRestore();
  });

  it('renders the bootstrap error screen with code copy and retry', async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockStore.bootstrap = { status: 'error', code: 'DB_KEY_UNAVAILABLE' };
    await mount();
    expect(screen.getByTestId('bootstrap.error.title')).toHaveTextContent('Unlock your phone to open matIQ');
    expect(screen.getByText('Error code: DB_KEY_UNAVAILABLE')).toBeTruthy();
    expect(screen.getByTestId('bootstrap.devReset')).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('bootstrap.retry'));
    expect(screen.queryByTestId('bootstrap.error')).toBeNull();
  });
});
