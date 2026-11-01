import * as SecureStore from 'expo-secure-store';

import type { KeyStore } from './KeyStore';

export const DB_KEY_ITEM = 'matiq.db.key';

// Device-only keychain class (A-11, A-17): never synced, never restored to another device.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: false,
};

/** KeyStore backed by expo-secure-store (iOS Keychain / Android Keystore). */
export const secureKeyStore: KeyStore = {
  get: () => SecureStore.getItemAsync(DB_KEY_ITEM, OPTIONS),
  set: (hex) => SecureStore.setItemAsync(DB_KEY_ITEM, hex, OPTIONS),
  delete: () => SecureStore.deleteItemAsync(DB_KEY_ITEM, OPTIONS),
};
