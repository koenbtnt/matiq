import { getRandomBytesAsync } from 'expo-crypto';

const KEY_HEX = /^[0-9a-f]{64}$/;

/** True for a 32-byte key as 64 lowercase hex chars — the only shape ever interpolated into SQL. */
export const isKeyHex = (s: unknown): s is string => typeof s === 'string' && KEY_HEX.test(s);

/** 32 random bytes as 64 lowercase hex chars (F-06). */
export async function generateKeyHex(random: (n: number) => Promise<Uint8Array> = getRandomBytesAsync): Promise<string> {
  const bytes = await random(32);
  if (bytes.length !== 32) throw new Error('key generator returned the wrong length');
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
