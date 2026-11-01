import '../src/i18n';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { backupExclusionAdapter } from '../modules/matiq-backup';
import { ToastHost } from '../src/components/Toast';
import { BootstrapErrorScreen } from '../src/features/bootstrap/BootstrapErrorScreen';
import { ThemeOverride } from '../src/features/profile/ThemeOverride';
import { setBootstrapOverrides, useDataActions, useDatabaseBootstrap } from '../src/hooks/data';
import { fontMap } from '../src/hooks/fonts';
import { radius, textStyle } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

// The native adapter must be in place before the first bootstrap (plan S6, CO-28).
setBootstrapOverrides({ backupExclusion: backupExclusionAdapter });

// Hold the native splash until fonts AND the bootstrap gate resolve (plan §7).
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const actions = useDataActions();
  const [fontsLoaded, fontError] = useFonts(fontMap);
  const boot = useDatabaseBootstrap();
  const gateOpen = (fontsLoaded || !!fontError) && boot.status !== 'loading';
  // The splash also waits for the theme override (PS-09, Q5) so the first visible frame has the right scheme.
  const [themeSettled, setThemeSettled] = useState(false);
  const settleTheme = useCallback(() => setThemeSettled(true), []);
  const ready = gateOpen && (boot.status === 'error' || themeSettled);

  useEffect(() => {
    // R-Y6 deviation, logged: a font failure continues with system fonts (plan §7).
    if (fontError) console.warn('matIQ: fonts failed to load, continuing with the system font', fontError.message);
  }, [fontError]);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!gateOpen) return null;
  if (boot.status === 'error') {
    return (
      <>
        <StatusBar style="auto" />
        <BootstrapErrorScreen
          code={boot.code}
          onRetry={boot.retry}
          onDevReset={__DEV__ ? async () => { await actions.resetDatabase(); boot.retry(); } : undefined}
        />
      </>
    );
  }

  const sheet = {
    presentation: 'formSheet' as const,
    sheetAllowedDetents: [1],
    sheetCornerRadius: radius.xl,
    sheetGrabberVisible: false,
    headerShown: false,
    contentStyle: { backgroundColor: c.bgSurface },
  };
  return (
    <>
      <StatusBar style="auto" />
      <ThemeOverride onSettled={settleTheme} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: c.bgBase }, headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="log-session" options={sheet} />
        <Stack.Screen name="set-rank" options={{ ...sheet, sheetAllowedDetents: 'fitToContents' }} />
        <Stack.Screen name="progress-why" options={{ ...sheet, sheetAllowedDetents: [0.5, 1] }} />
        <Stack.Screen name="library-edit" options={sheet} />
        <Stack.Screen name="resource-edit" options={sheet} />
        <Stack.Screen
          name="session/[id]"
          options={{
            title: t('session.title'),
            headerShadowVisible: false,
            headerStyle: { backgroundColor: c.bgBase },
            headerTintColor: c.textPrimary,
            headerTitleStyle: { fontFamily: textStyle.headline.fontFamily, fontSize: textStyle.headline.fontSize },
          }}
        />
        <Stack.Screen name="dev/reset" options={{ headerShown: false }} />
      </Stack>
      <ToastHost />
    </>
  );
}
