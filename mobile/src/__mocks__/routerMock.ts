/** Shared `expo-router` mock: `jest.mock('expo-router', () => require('./helpers/routerMock'))`. */
export const router = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  dismissTo: jest.fn(),
};
export const useLocalSearchParams = jest.fn(() => ({}));
export const Redirect = () => null;
export const Stack = Object.assign(() => null, { Screen: () => null });
