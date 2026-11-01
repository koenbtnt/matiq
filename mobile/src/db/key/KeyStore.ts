/** Where the SQLCipher key lives (F-05). The key is 64 lowercase hex chars; never log it. */
export interface KeyStore {
  get(): Promise<string | null>;
  set(hex: string): Promise<void>;
  delete(): Promise<void>;
}
