import { useLayoutEffect } from 'react';
import { Appearance } from 'react-native';

import { useSetting } from '../../hooks/data';

/** SYSTEM → `'auto'` resets the override (RN `ColorSchemeOverride`, S1); never `null`, never `'unspecified'`. */
export const SCHEME_FOR: Record<string, 'light' | 'dark' | 'auto'> = { SYSTEM: 'auto', LIGHT: 'light', DARK: 'dark' };

/**
 * Applies `theme.override` (PS-09, Q5): the one override point, so `useTheme`, native headers, sheets and the
 * status bar follow. Renders nothing; `onSettled` fires once the setting is read (or failed), which the root
 * layout waits for before it hides the splash, so the first visible frame has the right scheme.
 */
export function ThemeOverride({ onSettled }: { onSettled: () => void }) {
  const setting = useSetting('theme.override');
  const mode = typeof setting.data === 'string' ? setting.data : undefined;
  useLayoutEffect(() => {
    if (mode !== undefined) Appearance.setColorScheme(SCHEME_FOR[mode] ?? 'auto');
    if (mode !== undefined || setting.error) onSettled();
  }, [mode, setting.error, onSettled]);
  return null;
}
