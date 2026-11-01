import '../i18n';

import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { toast } from '../components/Toast';
import { ToastHost } from '../components/Toast';
import { mockStore } from './mockStore';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

/** Renders under a SafeAreaProvider with the toast host mounted; resets the mock store first. */
export async function renderScreen(ui: ReactElement, prepare?: () => void) {
  mockStore.reset();
  prepare?.();
  toast.clear();
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      {ui}
      <ToastHost />
    </SafeAreaProvider>,
  );
}
