import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { AccessibilityInfo, findNodeHandle, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { hit } from '../theme/layout';
import { size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Touch } from './Touch';
import { Txt } from './Txt';

type Props = { title: string; onCancel: () => void; cancelTestID: string; titleTestID: string; /** Defaults to "Cancel"; read-only sheets say "Close". */ cancelLabel?: string };

/** Handle + header row (cm:249-261). Focus moves to the title when the sheet opens (§9). */
export function SheetChrome({ title, onCancel, cancelTestID, titleTestID, cancelLabel }: Props) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const ref = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    const node = ref.current ? findNodeHandle(ref.current) : null;
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
  }, []);
  return (
    // Opaque and above the scroll body: a sibling ScrollView otherwise draws and hit-tests over the header (A-1).
    <View style={[styles.root, { backgroundColor: c.bgSurface }]}>
      <View style={[styles.handle, { backgroundColor: c.borderStronger }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <View style={styles.header}>
        <View style={styles.side}>
          <Touch testID={cancelTestID} accessibilityRole="button" accessibilityLabel={cancelLabel ?? t('common.cancel')} onPress={onCancel} style={styles.cancel}>
            <Txt variant="rowTitle" color="textSecondary">{cancelLabel ?? t('common.cancel')}</Txt>
          </Touch>
        </View>
        <View style={styles.title}>
          <View ref={ref} accessible>
            <Txt testID={titleTestID} variant="headline" accessibilityRole="header" numberOfLines={1} style={styles.center}>{title}</Txt>
          </View>
        </View>
        <View style={styles.side} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 1, elevation: 1 },
  body: { flex: 1, overflow: 'hidden' },
  frame: { flex: 1 },
  handle: { width: size.sheetHandleWidth, height: size.sheetHandleHeight, borderRadius: size.sheetHandleHeight / 2, alignSelf: 'center', marginTop: spacing[2] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingVertical: spacing[1] },
  side: { flex: 1, alignItems: 'flex-start' },
  title: { flex: 2 },
  center: { textAlign: 'center' },
  cancel: { minHeight: hit, minWidth: hit, padding: spacing[2], justifyContent: 'center' },
});

/** Clips a sheet's scroll body to the area below `SheetChrome`, so scrolled content never paints over the header (A-1). */
export function SheetBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

/**
 * Root of a sheet that holds text inputs: lifts the pinned action bar above the keyboard with one mechanism.
 * Sheets must NOT also set `automaticallyAdjustKeyboardInsets` on their ScrollView: when the keyboard opens during
 * the formSheet presentation (autoFocus) the native inset is computed against a mid-transition frame and the
 * body renders blank (CO-47).
 */
export function SheetFrame({ testID, children }: { testID: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <KeyboardAvoidingView testID={testID} style={[styles.frame, { backgroundColor: c.bgSurface }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {children}
    </KeyboardAvoidingView>
  );
}
