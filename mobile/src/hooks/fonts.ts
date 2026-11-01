import { Archivo_700Bold, Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

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
