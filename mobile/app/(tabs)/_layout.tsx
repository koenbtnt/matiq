import { Tabs } from 'expo-router/js-tabs';

import { MainTabBar } from '../../src/components/MainTabBar';

/** Home · Log · Library (D-A2). `log` never renders: the bar's Log action opens the Log sheet (D-A1). */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <MainTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="log" />
      <Tabs.Screen name="library" />
    </Tabs>
  );
}
