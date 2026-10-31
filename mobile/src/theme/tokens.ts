/**
 * matIQ design tokens — GENERATED from design-system/tokens.json (version 1).
 * Do not edit by hand: node scripts/sync-design-tokens.mjs
 * Source of truth: the design artifact in design-system/artifact/, via the designer intake.
 */

/** "starter" until the design intake has run; screens are not specified against starter tokens. */
export const designStatus = 'intake' as const;

/** Sans family name per weight (Android does not synthesise weights). "System" = the platform font. */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Display family name per weight. */
export const displayFontFamily = {
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
} as const;

/** Ratings, counts and scores: tabular-nums (RN: fontVariant: [...fontVariantNumeric]). */
export const fontVariantNumeric = ['tabular-nums'] as const;

export const textStyle = {
  display: { fontSize: 44, lineHeight: 44, fontFamily: 'Archivo_800ExtraBold', fontWeight: '800' as const, letterSpacing: -0.88, fontVariant: ['tabular-nums'] as const }, // fontStretch 125% — pending DSR-12 · Stats, tabular numbers.
  titleL: { fontSize: 28, lineHeight: 32, fontFamily: 'Archivo_800ExtraBold', fontWeight: '800' as const, letterSpacing: -0.28 }, // fontStretch 115% — pending DSR-12 · Screen titles.
  titleM: { fontSize: 20, lineHeight: 24, fontFamily: 'Archivo_700Bold', fontWeight: '700' as const }, // fontStretch 110% — pending DSR-12 · Cards, sections.
  stat: { fontSize: 32, lineHeight: 34, fontFamily: 'Archivo_800ExtraBold', fontWeight: '800' as const, fontVariant: ['tabular-nums'] as const }, // fontStretch 125% — pending DSR-12 · Stat-tile numeral (Components board "display numerals"). Unit suffix uses stat-unit.
  statUnit: { fontSize: 16, fontFamily: 'Archivo_800ExtraBold', fontWeight: '800' as const }, // fontStretch 125% — pending DSR-12 · Unit suffix inside a stat numeral ("wk"), colour text-secondary.
  stepperValue: { fontSize: 20, fontFamily: 'Archivo_800ExtraBold', fontWeight: '800' as const, fontVariant: ['tabular-nums'] as const }, // fontStretch 115% — pending DSR-12 · Stepper value ("90"); unit suffix uses caption.
  headline: { fontSize: 17, lineHeight: 22, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const }, // List titles, buttons, sheet titles.
  body: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular', fontWeight: '400' as const }, // Notes, steps.
  caption: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter_500Medium', fontWeight: '500' as const }, // Metadata, field labels, stepper unit.
  overline: { fontSize: 11, lineHeight: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const, letterSpacing: 1.32, textTransform: 'uppercase' as const }, // Section labels, "Next class", stat labels. Uppercase.
  buttonLg: { fontSize: 17, fontFamily: 'Inter_700Bold', fontWeight: '700' as const }, // Primary button label (56 high).
  button: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const }, // Secondary, ghost, destructive, disabled button label (48 high).
  buttonStrong: { fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' as const }, // Compact accent button (44 high, class card) and toast action.
  chip: { fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const }, // Segmented control, active/selected chip label.
  chipRegular: { fontSize: 14, fontFamily: 'Inter_500Medium', fontWeight: '500' as const }, // Unselected filter/technique chip label.
  tag: { fontSize: 13, fontFamily: 'Inter_500Medium', fontWeight: '500' as const }, // Tag and belt tag label (28 high).
  badge: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700' as const, letterSpacing: 0.66, textTransform: 'uppercase' as const }, // Badge label (Drilled/New/Comp/Injury/GI/COACH). Uppercase.
  input: { fontSize: 15, fontFamily: 'Inter_500Medium', fontWeight: '500' as const }, // Text input value.
  rowTitle: { fontSize: 16, fontFamily: 'Inter_500Medium', fontWeight: '500' as const }, // Settings-style list row title.
  rowValue: { fontSize: 14, fontFamily: 'Inter_400Regular', fontWeight: '400' as const }, // List row trailing value.
  statMeta: { fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const }, // Stat-tile delta ("+3.0 vs Sep"), colour accent-text.
  statNote: { fontSize: 12, fontFamily: 'Inter_400Regular', fontWeight: '400' as const }, // Stat-tile footnote ("Goal 3x / week"), colour text-secondary.
  tabLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const }, // iOS tab bar label.
  tabLabelAndroid: { fontSize: 12, fontFamily: 'Inter_500Medium', fontWeight: '500' as const }, // Android NavigationBar label, inactive.
  tabLabelAndroidActive: { fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700' as const }, // Android NavigationBar label, active.
} as const;

/** Per-style maxFontSizeMultiplier — a <Text> prop, not a style: <Text maxFontSizeMultiplier={textMaxScale.display}>. */
export const textMaxScale = {
  display: 1.3,
  titleL: 2,
  titleM: 2,
  stat: 1.3,
  statUnit: 2,
  stepperValue: 2,
  headline: 2,
  body: 2,
  caption: 2,
  overline: 2,
  buttonLg: 2,
  button: 2,
  buttonStrong: 2,
  chip: 2,
  chipRegular: 2,
  tag: 2,
  badge: 2,
  input: 2,
  rowTitle: 2,
  rowValue: 2,
  statMeta: 2,
  statNote: 2,
  tabLabel: 2,
  tabLabelAndroid: 2,
  tabLabelAndroidActive: 2,
} as const;

/** All styles scale with Dynamic Type / font scale up to 200%; display caps at 1.3x. */
export const textScaling = {
  maxFontSizeMultiplier: 2,
  displayMaxFontSizeMultiplier: 1.3,
} as const;

export const spacing = {
  1: 4, // Segment container padding and gap; caption-to-title gap in cards.
  2: 8, // Chip/tag row gap; paired card buttons gap.
  3: 12, // Button grid gap; field gaps; stepper/switch grid gap.
  4: 16, // Stat-tile and week-card padding; search field horizontal padding.
  5: 20, // Screen gutter (390 frame); session-card padding.
  6: 24, // Scale step; used only for board layout gaps in the canvas.
  8: 32, // Scale step; no component usage in the canvas.
  10: 40, // Scale step; no component usage in the canvas.
  14: 56, // Scale step; no component usage in the canvas.
} as const;

export const radius = {
  xs: 4, // Belts (large belt rank bar).
  sm: 8, // Tags.
  md: 12, // Inputs, textarea, date tile, thumbnail.
  lg: 16, // Cards.
  xl: 24, // Sheets (top corners).
  full: 28, // Pills and buttons: height / 2 (28 for the 56-high primary button).
} as const;

export const size = {
  touchTarget: 44, // Minimum hit target, iOS (pt).
  touchTargetAndroid: 48, // Minimum hit target, Android (dp).
  buttonPrimaryHeight: 56, // Primary button height.
  buttonHeight: 48, // Secondary/ghost/destructive/disabled button height.
  buttonCompactHeight: 44, // Compact buttons inside the class card.
  iconButton: 44, // Icon button diameter.
  logAction: 56, // Log action button diameter (Components board).
  tabLogAction: 52, // Log action inside the tab bar (key screens).
  inputHeight: 48, // Text input height.
  textareaHeight: 84, // Notes textarea height.
  searchHeight: 44, // Search field height.
  segmentHeight: 36, // Segment button height (Components board).
  chipHeight: 36, // Filter and technique chip height.
  tagHeight: 28, // Tag and belt-tag height.
  badgeHeight: 24, // Badge height.
  stepperButton: 44, // Stepper -/+ button.
  switchWidth: 51, // Switch track width.
  switchHeight: 31, // Switch track height.
  switchThumb: 27, // Switch thumb diameter.
  intensityBarHeight: 10, // Intensity scale bar (display, Components board).
  intensityBarHeightS: 6, // Intensity bar inside session/class card.
  intensityButtonHeight: 44, // Intensity picker button (Log session).
  listRowMinHeight: 60, // Settings-style list row.
  iconTile: 40, // Leading icon tile in a list row.
  icon: 24, // Icon grid.
  iconStroke: 1.75, // Default icon stroke width.
  iconStrokeEmphasis: 2.25, // Plus / check glyphs on accent and chips.
  iconStrokeChevron: 2, // Chevron glyph.
  iconButtonGlyph: 22, // Glyph inside a 44 icon button.
  iconTabIos: 26, // iOS tab icon.
  iconTabAndroid: 22, // Android tab icon.
  iconInline: 20, // Search glyph, list-tile glyph, toast check.
  iconChevron: 18, // Trailing chevron.
  iconCheck: 16, // Check glyph in selected chip.
  tabbarHeightIos: 82, // iOS tab bar height (Components board).
  tabbarHeightAndroid: 80, // Android NavigationBar height.
  tabPillWidth: 56, // Android active indicator pill width.
  tabPillHeight: 32, // Android active indicator pill height.
  appBarHeightAndroid: 64, // Material 3 top app bar height.
  sheetHandleWidth: 36, // Sheet drag handle width.
  sheetHandleHeight: 5, // Sheet drag handle height.
  toastHeight: 52, // Toast height.
  toastActionHeight: 40, // Toast Undo action height (visual; hit area >= touch-target).
  avatar: 48, // Athlete avatar diameter.
  avatarRing: 3, // Belt-coloured avatar ring width.
  borderWidth: 1, // Hairline: cards, inputs, chips, dividers.
  borderWidthFocus: 1.5, // Focused input edge, today ring in the week strip.
  beltLHeight: 32, // Belt rank L height.
  beltLBarWidth: 84, // Belt rank L: rank bar width.
  beltLStripe: 6, // Belt rank L: degree stripe width.
  beltLStripeGap: 5, // Belt rank L: gap between stripes.
  beltLBarPadding: 9, // Belt rank L: horizontal padding inside the bar.
  beltLTail: 16, // Belt rank L: fill segment after the bar.
  beltMHeight: 16, // Belt rank M height.
  beltMBarWidth: 40, // Belt rank M: rank bar width.
  beltMStripe: 3, // Belt rank M: degree stripe width.
  beltMStripeGap: 3, // Belt rank M: gap between stripes.
  beltMBarPadding: 5, // Belt rank M: horizontal padding inside the bar.
  beltMTail: 8, // Belt rank M: fill segment after the bar.
  beltSHeight: 8, // Belt rank S height.
  beltSBarWidth: 18, // Belt rank S: rank bar width.
  beltSTail: 4, // Belt rank S: fill segment after the bar.
  beltSwatchWidth: 14, // Belt swatch inside a tag or meta line.
  beltSwatchHeight: 6, // Belt swatch height.
  weekDay: 36, // Week-strip day circle.
  dateTile: 44, // Recent-session date tile.
  thumbnail: 56, // Continue-learning technique thumbnail.
  videoHeroHeight: 290, // Technique detail video area height.
  playButton: 72, // Play button diameter on the video area.
  stepNumber: 28, // Numbered step marker diameter.
  tabIndicatorHeight: 2, // Underline of the selected content tab.
  chartHeight: 120, // Mat-hours bar chart plot height.
} as const;

export const light = {
  bgBase: '#F6F6F3', // App background (bg.base).
  bgSurface: '#FFFFFF', // Cards, sheets, tab bar (bg.surface).
  bgRaised: '#EEEEEA', // Inputs, highlighted cards, secondary buttons (bg.raised).
  borderDefault: '#DCDCD6', // Hairlines, dividers (border.default). Decorative only: 1.18-1.38:1 on surfaces, never the sole boundary of an input or state.
  borderStrong: '#C9C9C2', // Outlined buttons, inactive bars, white/black belt edge (border.strong).
  borderStronger: '#A9AAA3', // Emphasised outlines: dashed add chip, sheet handle (border.stronger).
  textPrimary: '#0B0C0E', // Titles, body (text.primary).
  textSecondary: '#5A5F67', // Metadata, labels (text.secondary).
  textDisabled: '#9A9EA4', // Disabled labels only (text.disabled).
  textPlaceholder: '#8A8F97', // Input placeholder, same in both themes (text.placeholder). Fails AA on light bg-raised (2.80:1): see docs/design-system-contrast.md.
  inverseBg: '#15171A', // Selected segment, active filter chip, toast (inverse.bg).
  inverseFg: '#F6F6F3', // Text on inverse-bg (inverse.fg).
  accentFill: '#2EDB7F', // Emerald. Primary button, Log tab action (accent.fill). Max one accent button per screen.
  accentOn: '#0B0C0E', // Label/icon on accent-fill, always dark (accent.on).
  accentText: '#0B7A3E', // Links, active tab, overlines (accent.text).
  accentBorder: '#17B061', // Selected chip edge, focus ring (accent.border).
  accentGraphic: '#17B061', // Charts, intensity, progress (accent.graphic). Emerald doubles as success.
  accentTint: '#DCF8E8', // Selected chip fill, Drilled badge (accent.tint).
  feedbackDanger: '#C4223F', // Destructive, injury (feedback.danger).
  feedbackDangerTint: '#FCE3E8', // Destructive button fill, Injury badge fill (feedback.danger.tint).
  feedbackWarning: '#8F5600', // Comp, warnings (feedback.warning).
  feedbackWarningTint: '#FCEBD2', // Warning tag fill, Comp badge fill (feedback.warning.tint).
  feedbackInfo: '#1F5BD1', // Gi tag, New badge (feedback.info).
  feedbackInfoTint: '#E2EBFC', // Info tag fill (feedback.info.tint).
  tabbar: 'rgba(255,255,255,0.96)', // Tab / navigation bar background.
  scrim: '#B9B9B4', // Behind sheets.
  beltWhite: '#EDEDE8', // White belt fill; edge border-strong on every surface. Theme-invariant: rank only, never UI state.
  beltBlue: '#2E62F0', // Blue belt fill and edge. Theme-invariant: rank only, never UI state.
  beltPurple: '#7E4FE0', // Purple belt fill and edge. Theme-invariant: rank only, never UI state.
  beltBrown: '#7A4E2A', // Brown belt fill and edge. Theme-invariant: rank only, never UI state.
  beltBlack: '#111111', // Black belt fill; edge border-strong. Theme-invariant: rank only, never UI state.
  beltBar: '#0B0C0E', // Rank bar on white/blue/purple/brown belts (artifact "Rank bar" column). Theme-invariant: rank only, never UI state.
  beltBarBlack: '#D7262E', // Red rank bar of the black belt. Theme-invariant: rank only, never UI state.
  beltStripe: '#FFFFFF', // Degree stripes (0-4) on the rank bar. Theme-invariant: rank only, never UI state.
  beltKidsGrey: '#8E9196', // Kids grey; white/black split variants use a 50% band. Theme-invariant: rank only, never UI state.
  beltKidsYellow: '#F2C230', // Kids yellow; split variants use a 50% band. Theme-invariant: rank only, never UI state.
  beltKidsOrange: '#F2862E', // Kids orange; split variants use a 50% band. Theme-invariant: rank only, never UI state.
  beltKidsGreen: '#2FA35A', // Kids green; keep distinct from accent-fill. Theme-invariant: rank only, never UI state.
} as const;

export type ColorScheme = { [K in keyof typeof light]: string };

export const dark = {
  bgBase: '#0B0C0E',
  bgSurface: '#15171A',
  bgRaised: '#1E2125',
  borderDefault: '#2A2E33',
  borderStrong: '#3A3F45',
  borderStronger: '#4A4F56',
  textPrimary: '#F4F4F1',
  textSecondary: '#A3A8B0',
  textDisabled: '#6A6F77',
  textPlaceholder: '#8A8F97',
  inverseBg: '#F4F4F1',
  inverseFg: '#0B0C0E',
  accentFill: '#2EDB7F',
  accentOn: '#0B0C0E',
  accentText: '#5FE69C',
  accentBorder: '#2EDB7F',
  accentGraphic: '#2EDB7F',
  accentTint: 'rgba(46,219,127,0.16)',
  feedbackDanger: '#FF5C7A',
  feedbackDangerTint: 'rgba(255,92,122,0.14)',
  feedbackWarning: '#FFB547',
  feedbackWarningTint: 'rgba(255,181,71,0.16)',
  feedbackInfo: '#6FA8FF',
  feedbackInfoTint: 'rgba(111,168,255,0.16)',
  tabbar: 'rgba(21,23,26,0.96)',
  scrim: '#000000',
  beltWhite: '#EDEDE8',
  beltBlue: '#2E62F0',
  beltPurple: '#7E4FE0',
  beltBrown: '#7A4E2A',
  beltBlack: '#111111',
  beltBar: '#0B0C0E',
  beltBarBlack: '#D7262E',
  beltStripe: '#FFFFFF',
  beltKidsGrey: '#8E9196',
  beltKidsYellow: '#F2C230',
  beltKidsOrange: '#F2862E',
  beltKidsGreen: '#2FA35A',
} as const satisfies ColorScheme;

export const colors = { light, dark } as const;

/** Semantic pairings (status, progression), as token names — never hex. */
export const semantic = {
  buttonPrimary: { bg: 'accentFill', text: 'accentOn' }, // Primary button; one per screen.
  buttonSecondary: { bg: 'bgRaised', text: 'textPrimary' }, // Secondary button; 1px border-default.
  buttonDestructive: { bg: 'feedbackDangerTint', text: 'feedbackDanger' }, // Destructive button.
  buttonDisabled: { bg: 'bgRaised', text: 'textDisabled' }, // Disabled button (inactive; WCAG 1.4.3 exempt).
  segmentSelected: { bg: 'inverseBg', text: 'inverseFg' }, // Selected segment of a segmented control.
  chipActive: { bg: 'inverseBg', text: 'inverseFg' }, // Active category filter chip ("All").
  chipSelected: { bg: 'accentTint', text: 'accentText' }, // Selected multi-select chip; edge accent-border; check icon.
  badgeDrilled: { bg: 'accentTint', text: 'accentText' }, // Drilled badge.
  badgeNew: { bg: 'feedbackInfoTint', text: 'feedbackInfo' }, // New badge.
  badgeComp: { bg: 'feedbackWarningTint', text: 'feedbackWarning' }, // Comp badge.
  badgeInjury: { bg: 'feedbackDangerTint', text: 'feedbackDanger' }, // Injury badge.
  tagGi: { bg: 'feedbackInfoTint', text: 'feedbackInfo' }, // GI session-type tag.
  beltTag: { bg: 'bgRaised', text: 'textPrimary' }, // Belt tag: belt swatch + label; the belt colour is the swatch, never the text or fill.
  toast: { bg: 'inverseBg', text: 'inverseFg' }, // Toast.
  intensitySelected: { bg: 'accentFill', text: 'accentOn' }, // Intensity picker level <= chosen value.
  intensityUnselected: { bg: 'bgRaised', text: 'textSecondary' }, // Intensity picker level > chosen value.
  weekDayDone: { bg: 'accentFill', text: 'accentOn' }, // Week strip: day trained (check icon).
  drilledDone: { bg: 'accentTint', text: 'accentText' }, // Mark-as-drilled CTA after toggling ("Drilled today"); edge accent-border.
  tabActiveAndroid: { bg: 'accentTint', text: 'textPrimary' }, // Android active destination: pill accent-tint, label text-primary 700.
} as const satisfies Record<string, { bg: keyof ColorScheme; text: keyof ColorScheme }>;

/** Durations in ms. easing is a name from the design ("spring" has no parameters yet). Respect Reduce Motion. */
export const motion = {
  durationState: { duration: 200, easing: 'ease-out' }, // State changes.
  durationSheet: { duration: 320, easing: 'spring' }, // Sheets. Spring parameters are not defined in the artifact (design-system request).
  durationToast: { duration: 4000 }, // Toast on screen; always undoable.
} as const;

/** Haptic names per platform (expo-haptics on iOS, Android HapticFeedbackConstants). */
export const haptics = {
  hapticStepper: { ios: 'selection', android: 'CLOCK_TICK' }, // Light tick on each stepper change.
  hapticSave: { ios: 'success', android: 'CONFIRM' }, // Success notification on save.
} as const;

/** Icon drawing parameters. */
export const icon = {
  grid: 24,
  stroke: 1.75,
  linecap: 'round',
  linejoin: 'round',
} as const;
