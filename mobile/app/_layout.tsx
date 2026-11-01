import '../src/i18n';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ToastHost } from '../src/components/Toast';
import { BootstrapErrorScreen } from '../src/features/bootstrap/BootstrapErrorScreen';
import { useDataActions, useDatabaseBootstrap } from '../src/hooks/data';
import { fontMap } from '../src/hooks/fonts';
import { radius, textStyle } from '../src/theme/tokens';
import { useTheme } from '../src/theme/useTheme';

// Hold the native splash until fonts AND the bootstrap gate resolve (plan §7).
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const actions = useDataActions();
  const [fontsLoaded, fontError] = useFonts(fontMap);
  const boot = useDatabaseBootstrap();
  const ready = (fontsLoaded || !!fontError) && boot.status !== 'loading';

  useEffect(() => {
    // R-Y6 deviation, logged: a font failure continues with system fonts (plan §7).
    if (fontError) console.warn('matIQ: fonts failed to load, continuing with the system font', fontError.message);
  }, [fontError]);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
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
      <Stack screenOptions={{ contentStyle: { backgroundColor: c.bgBase } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="log-session" options={sheet} />
        <Stack.Screen name="set-rank" options={{ ...sheet, sheetAllowedDetents: 'fitToContents' }} />
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
