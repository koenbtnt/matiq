import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openQuickLog } from '../features/home/openQuickLog';
import { hit, isAndroid } from '../theme/layout';
import { radius, semantic, size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon, type IconName } from './Icon';
import { Touch } from './Touch';
import { Txt } from './Txt';

const TABS: Record<string, { icon: IconName; label: 'tabs.home' | 'tabs.library'; testID: string }> = {
  index: { icon: 'home', label: 'tabs.home', testID: 'tabs.home' },
  library: { icon: 'library', label: 'tabs.library', testID: 'tabs.library' },
};

/** Custom JS tab bar: Home · Log · Library (D-A2; cm:273-288). */
export function MainTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tabbar"
      style={[
        styles.bar,
        isAndroid
          ? { height: size.tabbarHeightAndroid + insets.bottom, backgroundColor: c.bgSurface }
          : { minHeight: size.tabbarHeightIos, paddingBottom: insets.bottom, backgroundColor: c.tabbar, borderTopWidth: size.borderWidth, borderTopColor: c.borderDefault },
      ]}
    >
      {state.routes.map((route, index) => {
        if (route.name === 'log') {
          return (
            <View key={route.key} style={styles.col}>
              <Touch
                testID="tabs.log"
                accessibilityRole="button"
                accessibilityLabel={t('tabs.log')}
                onPress={() => void openQuickLog()}
                style={[styles.log, { backgroundColor: c[semantic.buttonPrimary.bg] }]}
              >
                <Icon name="plus" size={size.iconTabIos} color={semantic.buttonPrimary.text} emphasis />
              </Touch>
            </View>
          );
        }
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };
        const tint = focused ? 'accentText' : 'textSecondary';
        return (
          <Touch
            key={route.key}
            testID={tab.testID}
            accessibilityRole="tab"
            accessibilityLabel={t(tab.label)}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={styles.col}
          >
            {isAndroid ? (
              <View style={[styles.pill, focused ? { backgroundColor: c[semantic.tabActiveAndroid.bg] } : null]}>
                <Icon name={tab.icon} size={size.iconTabAndroid} color={tint} />
              </View>
            ) : (
              <Icon name={tab.icon} size={size.iconTabIos} color={tint} />
            )}
            <Txt
              variant={isAndroid ? (focused ? 'tabLabelAndroidActive' : 'tabLabelAndroid') : 'tabLabel'}
              style={{ color: isAndroid ? (focused ? c.textPrimary : c.textSecondary) : c[tint] }}
            >
              {t(tab.label)}
            </Txt>
          </Touch>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: spacing[2], alignItems: 'flex-start' },
  col: { flex: 1, minHeight: hit, alignItems: 'center', justifyContent: 'center', gap: spacing[1] },
  log: { width: size.logAction, height: size.logAction, borderRadius: size.logAction / 2, alignItems: 'center', justifyContent: 'center' },
  pill: { width: size.tabPillWidth, height: size.tabPillHeight, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
