import { Stack } from 'expo-router';

import { useTheme } from '../../../src/theme/useTheme';

/** Progress tab Stack (design §4.1.2): the list is the only screen; the why sheet is a root formSheet. */
export default function ProgressLayout() {
  const { c } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: c.bgBase } }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
