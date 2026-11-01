// Per-face subpaths: the package barrel bundles every weight (~12 MB, review-2 R2-01).
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';

import { displayFontFamily, fontFamily } from '../theme/tokens';

/** Every family named in `tokens.ts` (`fontFamily`, `displayFontFamily`), keyed by that name (plan §7). */
export const fontMap = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
};

export const tokenFamilies: string[] = [...Object.values(fontFamily), ...Object.values(displayFontFamily)];
