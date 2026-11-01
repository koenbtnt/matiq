/**
 * @jest-environment node
 */
import { IdRegistry, attributionFrom } from '../curated.ts';

describe('id registry (A-29)', () => {
  it('returns registered ids and records missing keys in check mode', () => {
    const r = new IdRegistry({ 'grapplemap:gm:1': 'a' }, false);
    expect(r.id('grapplemap:gm:1')).toBe('a');
    r.id('grapplemap:gm:2');
    expect([...r.missing]).toEqual(['grapplemap:gm:2']);
  });

  it('mints UUID v4s only with --mint, sorted on save', () => {
    const r = new IdRegistry({ 'b:2': 'x' }, true);
    expect(r.id('a:1')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(Object.keys(r.sorted())).toEqual(['a:1', 'b:2']);
    expect(r.missing.size).toBe(0);
  });

  it('extracts the attribution JSON block', () => {
    expect(attributionFrom('# x\n```json\n{"a":1}\n```\n')).toEqual({ a: 1 });
    expect(() => attributionFrom('no block')).toThrow();
  });
});
