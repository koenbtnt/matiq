import type { KeyStore } from './KeyStore';

/** In-memory KeyStore for Jest and the bootstrap fakes. */
export class MemoryKeyStore implements KeyStore {
  constructor(private value: string | null = null) {}

  get(): Promise<string | null> {
    return Promise.resolve(this.value);
  }

  set(hex: string): Promise<void> {
    this.value = hex;
    return Promise.resolve();
  }

  delete(): Promise<void> {
    this.value = null;
    return Promise.resolve();
  }
}
