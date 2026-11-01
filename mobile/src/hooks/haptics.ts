import * as Haptics from 'expo-haptics';

/** R-M4: light tick on each stepper change. Haptics never block or fail the UI. */
export function hapticStepper(): void {
  void Haptics.selectionAsync().catch(() => undefined);
}

/** R-M4: success notification on save. */
export function hapticSave(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
