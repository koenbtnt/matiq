import { slugify, uniqueSlug } from './slug.ts';

export type NameRules = {
  tokens: Record<string, string>;
  placeholders: string[];
  positionPlaceholder: string;
  submissionPlaceholder: string;
  transitionPlaceholder: string;
  reverseSuffix: string;
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/** Compiled token replacer: longest token first, case-insensitive, on word boundaries. */
export function compileRules(rules: NameRules) {
  const tokens = Object.entries(rules.tokens).sort((a, b) => b[0].length - a[0].length || (a[0] < b[0] ? -1 : 1));
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${tokens.map(([t]) => escape(t)).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  const map = new Map(tokens.map(([t, v]) => [t.toLowerCase(), v]));
  const placeholders = rules.placeholders.map((p) => new RegExp(p, 'i'));
  return {
    rules,
    /** GrappleMap raw name → display text: literal `\n` → space, whitespace collapsed, tokens mapped. */
    clean(raw: string): string {
      const joined = raw.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
      return joined.replace(re, (m) => map.get(m.toLowerCase()) ?? m).replace(/\s+/g, ' ').trim();
    },
    isPlaceholder(raw: string): boolean {
      const joined = raw.replace(/\\n/g, ' ').trim();
      return placeholders.some((p) => p.test(joined));
    },
  };
}

export type CompiledRules = ReturnType<typeof compileRules>;

/** First letter upper case, the rest as written. */
export const sentenceCase = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

export const fill = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));

/** Assigns unique slugs in the given order (A-32: collisions get -2, -3 in that order). */
export function assignSlugs(names: readonly string[]): string[] {
  const taken = new Set<string>();
  return names.map((n) => {
    const s = uniqueSlug(slugify(n) || 'unnamed', taken);
    taken.add(s);
    return s;
  });
}
