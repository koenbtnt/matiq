import { Platform } from 'react-native';

import { size, spacing } from './tokens';

export const isAndroid = Platform.OS === 'android';

/** Minimum hit area: 44 pt on iOS, 48 dp on Android (ruling R-18). */
export const hit = isAndroid ? size.touchTargetAndroid : size.touchTarget;

/** Vertical hit slop that lifts a control of visual height `visual` to `hit`: (hit - visual) / 2. */
export function vSlop(visual: number): { top: number; bottom: number } {
  const v = Math.max(0, Math.ceil((hit - visual) / 2));
  return { top: v, bottom: v };
}

/** Row gap of wrapped chip rows: at least `hit - chipHeight` so slops never overlap (R1-10). */
export const chipRowGap = isAndroid ? spacing[3] : spacing[2];

/** Font scale at which two-column stepper grids stack (D-A24). */
export const STACK_FONT_SCALE = 1.5;
