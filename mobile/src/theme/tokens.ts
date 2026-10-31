/**
 * matIQ design tokens — GENERATED from design-system/tokens.json (version 0).
 * Do not edit by hand: node scripts/sync-design-tokens.mjs
 * Source of truth: the design artifact in design-system/artifact/, via the designer intake.
 */

/** "starter" until the design intake has run; screens are not specified against starter tokens. */
export const designStatus = 'starter' as const;

/** One family name per weight (Android does not synthesise weights). "System" = the platform font. */
export const fontFamily = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
} as const;

/** Ratings, counts and scores: tabular-nums (RN: fontVariant: [...fontVariantNumeric]). */
export const fontVariantNumeric = ['tabular-nums'] as const;

export const textStyle = {
  heading1: { fontSize: 24, lineHeight: 29, fontWeight: '700' as const }, // Screen title.
  heading2: { fontSize: 18, lineHeight: 23, fontWeight: '600' as const }, // Section and card title.
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const }, // Default text, list rows.
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' as const }, // Button labels, emphasised rows.
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const }, // Labels, helper text.
  numberLg: { fontSize: 28, lineHeight: 31, fontWeight: '700' as const }, // Ratings and scores. Always tabular-nums.
} as const;

export const spacing = {
  1: 4, // Hairline gaps.
  2: 8, // Inside chips and between related items.
  3: 12, // Inside cards.
  4: 16, // Screen gutter.
  6: 24, // Between sections.
  8: 32, // Above the primary action.
} as const;

export const radius = {
  sm: 6, // Chips.
  md: 12, // Cards, inputs.
  lg: 20, // Sheets.
} as const;

export const size = {
  touchTarget: 44, // Minimum hit target.
  inputHeight: 48, // Text inputs and primary buttons.
} as const;

export const light = {
  bg: '#f7f7f8', // Screen background.
  surface: '#ffffff', // Cards, sheets, inputs.
  surfaceMuted: '#eceef1', // Chips, selected rows, dividers' background.
  border: '#dfe2e7', // Card and input borders.
  text: '#16181d', // Primary text.
  textMuted: '#5b6270', // Secondary text; meets 4.5:1 on surface.
  accent: '#1f5fbf', // Primary action, links, selected state.
  onAccent: '#ffffff', // Text on accent.
  success: '#2e7d32', // Improving / completed.
  warning: '#b7791f', // Needs work / planned-but-not-trained.
  danger: '#b42318', // Destructive actions, errors.
  overlay: 'rgba(22, 24, 29, 0.45)', // Scrim behind sheets.
} as const;

export type ColorScheme = { [K in keyof typeof light]: string };

export const dark = {
  bg: '#101114',
  surface: '#1a1c21',
  surfaceMuted: '#262930',
  border: '#2e323a',
  text: '#eef0f3',
  textMuted: '#9aa3b2',
  accent: '#7aa7ff',
  onAccent: '#0b1a33',
  success: '#6ccb70',
  warning: '#e9b44c',
  danger: '#f0776b',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const satisfies ColorScheme;

export const colors = { light, dark } as const;

/** Semantic pairings (status, progression), as token names — never hex. */
export const semantic = {
  focusImproving: { bg: 'success', text: 'onAccent' }, // Progression: improving.
  focusNeedsWork: { bg: 'warning', text: 'text' }, // Progression: lacking / flagged needs work.
} as const satisfies Record<string, { bg: keyof ColorScheme; text: keyof ColorScheme }>;
