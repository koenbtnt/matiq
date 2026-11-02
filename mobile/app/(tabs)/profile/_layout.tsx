import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { textStyle } from '../../../src/theme/tokens';
import { useTheme } from '../../../src/theme/useTheme';

/** Profile tab Stack (design §4.1.2): the Settings screen and its pushed sub-screens, library-style headers. */
export default function ProfileLayout() {
  const { t } = useTranslation();
  const { c } = useTheme();
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: c.bgBase },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: c.bgBase },
        headerTintColor: c.textPrimary,
        headerTitleStyle: { fontFamily: textStyle.headline.fontFamily, fontSize: textStyle.headline.fontSize },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="algorithm" options={{ title: t('algorithm.title') }} />
      <Stack.Screen name="suggestions" options={{ title: t('suggestions.title') }} />
      <Stack.Screen name="rank" options={{ title: t('profileRank.title') }} />
      <Stack.Screen name="about" options={{ title: t('about.title') }} />
    </Stack>
  );
}
