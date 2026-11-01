/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(__dirname, '..');
const files = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === '__tests__' ? [] : files(path.join(dir, e.name))) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : [],
  );

describe('domain purity (data.md)', () => {
  it.each(files(root).map((f) => path.relative(root, f)))('%s imports no I/O and reads no clock or randomness', (rel) => {
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    expect(src).not.toMatch(/from '(\.\.\/)+(db|repositories)\//);
    expect(src).not.toMatch(/from '(react|react-native|expo[^']*|drizzle-orm[^']*)'/);
    expect(src).not.toMatch(/Date\.now\(|Math\.random\(|new Date\(\)|randomUUID|getRandomBytes/);
  });
});
