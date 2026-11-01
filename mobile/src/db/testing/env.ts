/** Sets `process.env[key]` and returns a restore function that deletes the key when it was unset. */
export function setEnv(key: string, value: string): () => void {
  const had = Object.hasOwn(process.env, key);
  const before = process.env[key];
  process.env[key] = value;
  return () => {
    if (had) process.env[key] = before;
    else delete process.env[key];
  };
}
