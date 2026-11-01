import { useColorScheme } from 'react-native';

import { colors, type ColorScheme } from './tokens';

export type SchemeName = 'light' | 'dark';

/** Colour set for the current system scheme (DSR-21: the system scheme only in sprint 1). */
export function useTheme(): { c: ColorScheme; scheme: SchemeName } {
  const scheme: SchemeName = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { c: colors[scheme], scheme };
}
