import { SymbolView } from 'expo-symbols';

import { useTheme } from '../theme/useTheme';
import { size as sizes, type ColorScheme } from '../theme/tokens';

const ICONS = {
  home: { ios: 'house', android: 'home' },
  library: { ios: 'book.closed', android: 'menu_book' },
  plus: { ios: 'plus', android: 'add' },
  minus: { ios: 'minus', android: 'remove' },
  check: { ios: 'checkmark', android: 'check' },
  chevron: { ios: 'chevron.right', android: 'chevron_right' },
  search: { ios: 'magnifyingglass', android: 'search' },
  close: { ios: 'xmark', android: 'close' },
  calendar: { ios: 'calendar', android: 'calendar_today' },
  clock: { ios: 'clock', android: 'schedule' },
  error: { ios: 'exclamationmark.circle', android: 'error' },
  flag: { ios: 'flag', android: 'flag' },
} as const;

export type IconName = keyof typeof ICONS;

type Props = { name: IconName; size?: number; color?: keyof ColorScheme; emphasis?: boolean };

/** Decorative glyph (SF Symbols on iOS, Material Symbols on Android); hidden from screen readers. */
export function Icon({ name, size = sizes.iconInline, color = 'textPrimary', emphasis = false }: Props) {
  const { c } = useTheme();
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={c[color]}
      weight={emphasis ? 'semibold' : 'regular'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
