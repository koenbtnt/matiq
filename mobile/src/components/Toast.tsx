import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isAndroid, vSlop } from '../theme/layout';
import { motion, radius, semantic, size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon } from './Icon';
import { Touch } from './Touch';
import { Txt } from './Txt';

export type ToastSpec = {
  message: string;
  /** Present only where an API can revert (D-A10). */
  undo?: () => void;
  /** Called when the toast leaves for any reason except Undo (drops a held draft, D-A9). */
  onExpire?: () => void;
};

type Current = (ToastSpec & { key: number }) | null;

let current: Current = null;
let counter = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function replace(next: Current, expire: boolean) {
  const prev = current;
  current = next;
  if (expire) prev?.onExpire?.();
  emit();
}

/** Imperative API for non-component code (and tests). A new toast replaces the current one. */
export const toast = {
  show(spec: ToastSpec) {
    counter += 1;
    replace({ ...spec, key: counter }, true);
  },
  dismiss() {
    replace(null, true);
  },
  /** Navigation drops a toast whose draft/undo no longer applies (D-A11). */
  clear() {
    replace(null, true);
  },
};

export function useToast() {
  return toast;
}

function useCurrent(): Current {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    () => current,
  );
}

/** One host in the root layout (cm:263-271). */
export function ToastHost({ bottomOffset }: { bottomOffset?: number }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const cur = useCurrent();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!cur) return;
    AccessibilityInfo.announceForAccessibility(cur.message);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    void Promise.all([AccessibilityInfo.isScreenReaderEnabled(), AccessibilityInfo.isReduceMotionEnabled()]).then(([reader, reduce]) => {
      if (cancelled) return;
      if (!reduce) {
        opacity.setValue(0);
        Animated.timing(opacity, { toValue: 1, duration: motion.durationState.duration, useNativeDriver: true }).start();
      }
      // D-A11: with a screen reader the toast stays until the next toast or navigation.
      if (!reader) timer = setTimeout(() => replace(null, true), motion.durationToast.duration);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [cur, opacity]);

  if (!cur) return null;
  const bottom = bottomOffset ?? (isAndroid ? size.tabbarHeightAndroid : size.tabbarHeightIos) + spacing[3];
  return (
    <View pointerEvents="box-none" style={[styles.layer, { bottom }]}>
      <Animated.View
        testID="toast"
        accessibilityLiveRegion="polite"
        style={[styles.body, { backgroundColor: c[semantic.toast.bg], opacity }]}
      >
        <Icon name="check" color={semantic.toast.text} emphasis />
        <Txt testID="toast.message" variant="button" numberOfLines={2} style={[styles.msg, { color: c[semantic.toast.text] }]}>{cur.message}</Txt>
        {cur.undo ? (
          <Touch
            testID="toast.undo"
            accessibilityRole="button"
            accessibilityLabel={t('toast.undo.a11y', { message: cur.message })}
            hitSlop={vSlop(size.toastActionHeight)}
            onPress={() => {
              const undo = cur.undo;
              replace(null, false);
              undo?.();
            }}
            style={styles.undo}
          >
            <Txt variant="buttonStrong" style={[styles.underline, { color: c[semantic.toast.text] }]}>{t('common.undo')}</Txt>
          </Touch>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: spacing[5], right: spacing[5] },
  body: { minHeight: size.toastHeight, borderRadius: radius.md, paddingLeft: spacing[4], paddingRight: spacing[2], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  msg: { flex: 1 },
  undo: { height: size.toastActionHeight, paddingHorizontal: spacing[3], justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
