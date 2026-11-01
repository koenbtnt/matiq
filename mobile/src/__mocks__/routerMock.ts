import type { ReactNode } from 'react';

/** Shared `expo-router` mock: `jest.mock('expo-router', () => require('./helpers/routerMock'))`. */
export const router = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  dismiss: jest.fn(),
  dismissTo: jest.fn(),
  navigate: jest.fn(),
};
export const useLocalSearchParams = jest.fn(() => ({}));
export const Redirect = () => null;
/** `Stack.Screen` renders the screen's `headerRight` so tests can reach the native header action. */
const Screen = ({ options }: { options?: { headerRight?: () => ReactNode } }): ReactNode => options?.headerRight?.() ?? null;
export const Stack = Object.assign(() => null, { Screen });
