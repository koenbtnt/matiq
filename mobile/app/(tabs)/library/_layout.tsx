import { Stack } from 'expo-router';

import { textStyle } from '../../../src/theme/tokens';
import { useTheme } from '../../../src/theme/useTheme';

export default function LibraryLayout() {
  const { c } = useTheme();
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: c.bgBase },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: c.bgBase },
        headerTintColor: c.textPrimary,
        headerTitle: '',
        headerTitleStyle: { fontFamily: textStyle.headline.fontFamily, fontSize: textStyle.headline.fontSize },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="position/[id]" />
      <Stack.Screen name="technique/[id]" />
    </Stack>
  );
}
