/**
 * Taxonomy pipeline (R-28, F-10…F-16): vendored GrappleMap snapshot + grapple-flows aliases +
 * curated overlay → `mobile/src/db/seed/{taxonomy,catalog,report,attribution}.json`.
 * Deterministic: no network, no clock, no randomness (ids come from `curated/ids.json`; `--mint`
 * is the one exception and is run by a human before a commit). Zero dependencies. The CLI is
 * `convert.ts`; this module has no entry point so Jest can import it.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { IdRegistry, loadCurated, type Curated } from './curated.ts';
import { deriveType, perspectiveOf, type TechniqueType } from './edgeTypes.ts';
import { bySource, stableStringify, writeJson } from './emit.ts';
import { joinDirectory } from './join.ts';
import { assignSlugs, compileRules, fill, sentenceCase } from './names.ts';
import { isPosition, parseRecord, poseCount, poseDigits, splitRecords, type GmRecord } from './parse.ts';
import { DEFAULT_RESOLVE, PoseIndex, type ResolveOptions } from './resolve.ts';
import { slugify } from './slug.ts';
import { validateRecords } from './validate.ts';

type Tier = 'CORE' | 'EXTENDED';
type Source = 'grapplemap' | 'grapple-flows' | 'curated';
type Prov = { id: string; source: Source; sourceId: string; sourceVersion: string };
export type SeedPosition = Prov & { slug: string; canonicalName: string; description?: string; parentSourceId?: string; tier: Tier };
export type SeedTechnique = Prov & {
  slug: string; name: string; type: TechniqueType; fromSourceId: string; toSourceId?: string;
  appliesTo: 'GI' | 'NOGI' | 'BOTH'; perspective?: 'TOP' | 'BOTTOM'; description?: string; tier: Tier;
};
export type SeedAlias = Prov & { targetKind: 'POSITION' | 'TECHNIQUE'; targetSourceId: string; name: string };
export type SeedResource = Prov & { title: string; url?: string; author?: string; resourceTypeKey: string; notes?: string };
export type SeedResourceLink = { id: string; resourceSourceId: string; targetKind: 'TECHNIQUE'; targetSourceId: string };

export type Paths = { root: string; records: string; flows: string; curated: string; out: string };

export const defaultPaths = (root: string): Paths => ({
  root,
  records: path.join(root, 'data/taxonomy/grapplemap/records'),
  flows: path.join(root, 'data/taxonomy/grapple-flows'),
  curated: path.join(root, 'data/taxonomy/curated'),
  out: path.join(root, 'mobile/src/db/seed'),
});

export type ConvertResult = {
  taxonomy: {
    release: string; grapplemapSnapshot: string; positions: SeedPosition[]; techniques: SeedTechnique[];
    aliases: SeedAlias[]; resources: SeedResource[]; resourceLinks: SeedResourceLink[];
  };
  catalog: unknown;
  report: Record<string, unknown>;
  attribution: unknown;
  registry: IdRegistry;
};

const GM_VERSION = '2023-02-06';
const sha1 = (s: string) => createHash('sha1').update(s).digest('hex');
const descriptionOf = (r: GmRecord): string | undefined => {
  const text = r.description
    .filter((l) => !/^(todo\b|wip\b|\?$)/i.test(l.trim()))
    .map((l) => l.replace(/\\n/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
  return text || undefined;
};

/** `Author "Title", rest` → author / title / notes (A-27); a URL becomes `url`. */
export function parseCitation(ref: string): { title: string; author?: string; notes?: string; url?: string } {
  const url = /https?:\/\/\S+/.exec(ref)?.[0];
  const q = /^(.*?)"([^"]+)"(.*)$/.exec(ref);
  if (!q) return { title: ref.trim(), ...(url ? { url } : {}) };
  const author = q[1]!.trim().replace(/[,:]$/, '').trim();
  const notes = q[3]!.trim().replace(/^[,;:]/, '').trim();
  return { title: q[2]!.trim(), ...(author ? { author } : {}), ...(notes ? { notes } : {}), ...(url ? { url } : {}) };
}

/** Name of a grapple-flows slug: hyphens → spaces, token rules, sentence case. */
const slugName = (slug: string, clean: (s: string) => string) => sentenceCase(clean(slug.replace(/-/g, ' ')));

export function convert(paths: Paths, { mint = false, resolve = DEFAULT_RESOLVE }: { mint?: boolean; resolve?: ResolveOptions } = {}): ConvertResult {
  const cur: Curated = loadCurated(paths.curated);
  const rules = compileRules(cur.nameRules);
  const registry = IdRegistry.load(path.join(paths.curated, 'ids.json'), mint);
  const curVersion = cur.release.taxonomy;

  // 1–2. join + parse + validate
  const records = splitRecords(joinDirectory(paths.records)).map(parseRecord);
  const errors = validateRecords(records);
  if (errors.length) throw new Error(`GrappleMap validation failed:\n${errors.slice(0, 20).map((e) => `record ${e.index} line ${e.line}: ${e.message}`).join('\n')}`);
  const posRecords = records.filter(isPosition);
  const trRecords = records.filter((r) => !isPosition(r));

  // Curated lookups
  const corePos = new Map(cur.core.positions.map((p) => [p.sourceId, p]));
  const coreTech = new Map(cur.core.techniques.map((t) => [t.sourceId, t]));
  const gmPosIds = new Set(posRecords.map((r) => `gm:${r.index}`));
  const knownPositions = new Set([...gmPosIds, ...cur.core.positions.map((p) => p.sourceId)]);
  for (const p of cur.core.positions) {
    if (p.sourceId.startsWith('gm:') && !gmPosIds.has(p.sourceId)) throw new Error(`core.json: unknown position ${p.sourceId}`);
    if (p.parent && !knownPositions.has(p.parent)) throw new Error(`core.json: unknown parent ${p.parent}`);
  }
  const trIds = new Set(trRecords.map((r) => `gm:${r.index}`));
  for (const t of cur.core.techniques) {
    if (!trIds.has(t.sourceId)) throw new Error(`core.json: unknown technique ${t.sourceId}`);
    for (const e of [t.from, t.to]) if (e && !knownPositions.has(e)) throw new Error(`core.json: unknown endpoint ${e} on ${t.sourceId}`);
  }
  for (const g of cur.gi) for (const e of [g.from, g.to]) if (e && !knownPositions.has(e)) throw new Error(`gi.json: unknown endpoint ${e} on ${g.key}`);

  // 3. positions (core order first so curated names get the clean slugs, then record order)
  const familyOf = (r: GmRecord) => cur.core.families.find((f) => r.tags.includes(f.tag))?.parent;
  type PosDraft = Omit<SeedPosition, 'id' | 'slug'>;
  const posDraft = new Map<string, PosDraft>();
  for (const p of cur.core.positions.filter((x) => x.sourceId.startsWith('cur:'))) {
    posDraft.set(p.sourceId, {
      source: 'curated', sourceId: p.sourceId, sourceVersion: curVersion, canonicalName: p.name,
      description: p.description, parentSourceId: p.parent, tier: 'CORE',
    });
  }
  for (const r of posRecords) {
    const sid = `gm:${r.index}`;
    const core = corePos.get(sid);
    const family = familyOf(r);
    const name = core?.name ?? (rules.isPlaceholder(r.name) ? fill(cur.nameRules.positionPlaceholder, { index: r.index }) : sentenceCase(rules.clean(r.name)));
    posDraft.set(sid, {
      source: 'grapplemap', sourceId: sid, sourceVersion: GM_VERSION, canonicalName: name,
      description: core?.description ?? descriptionOf(r),
      parentSourceId: core ? core.parent : family && family !== sid ? family : undefined,
      tier: core ? 'CORE' : 'EXTENDED',
    });
  }
  const posOrder = [...cur.core.positions.map((p) => p.sourceId), ...posRecords.map((r) => `gm:${r.index}`).filter((s) => !corePos.has(s))];
  const posSlugs = assignSlugs(posOrder.map((s) => posDraft.get(s)!.canonicalName));
  const positions: SeedPosition[] = posOrder.map((s, i) => {
    const d = posDraft.get(s)!;
    return { ...d, id: registry.id(`${d.source}:${d.sourceId}`), slug: posSlugs[i]! };
  });
  const nameOfPos = new Map(positions.map((p) => [p.sourceId, p.canonicalName]));

  // 4. resolve endpoints
  const index = new PoseIndex(posRecords.map((r) => ({ index: r.index, digits: poseDigits(r, 0) })), resolve);
  const endpointStats = { key: 0, nearest: 0, unresolved: 0 };
  const resolveEnd = (digits: string) => {
    const res = index.resolve(digits);
    endpointStats[res.method] += 1;
    return res.index === null ? undefined : `gm:${res.index}`;
  };

  // 5–6. techniques
  type TechDraft = Omit<SeedTechnique, 'id' | 'slug'> & { refs: string[] };
  const drafts: TechDraft[] = [];
  const dropped = { unresolvedFrom: 0, unresolvedTo: 0 };
  let edgesBothResolved = 0;
  for (const r of trRecords) {
    const sid = `gm:${r.index}`;
    const core = coreTech.get(sid);
    const cleaned = rules.clean(r.name);
    const from = resolveEnd(poseDigits(r, 0));
    const to = resolveEnd(poseDigits(r, poseCount(r) - 1));
    if (from && to) edgesBothResolved += 1;
    const type = core?.type ?? deriveType(r.tags, cleaned, cur.edgeTypes[sid]);
    const fromSid = core?.from ?? from;
    const toSid = type === 'SUBMISSION' ? undefined : (core?.to ?? to);
    if (!fromSid) { dropped.unresolvedFrom += 1; continue; }
    if (type !== 'SUBMISSION' && !toSid) { dropped.unresolvedTo += 1; continue; }
    const fromName = nameOfPos.get(fromSid)!;
    const toName = toSid ? nameOfPos.get(toSid)! : '';
    const name = core?.name ?? (rules.isPlaceholder(r.name)
      ? fill(type === 'SUBMISSION' ? cur.nameRules.submissionPlaceholder : cur.nameRules.transitionPlaceholder, { from: fromName, to: toName })
      : sentenceCase(cleaned));
    const base = {
      source: 'grapplemap' as const, sourceVersion: GM_VERSION, appliesTo: 'BOTH' as const,
      perspective: perspectiveOf(r.properties), description: descriptionOf(r),
    };
    drafts.push({ ...base, sourceId: sid, name, type, fromSourceId: fromSid, toSourceId: toSid, tier: core ? 'CORE' : 'EXTENDED', refs: r.refs });
    if (r.properties.includes('bidirectional') && type !== 'SUBMISSION' && toSid) {
      drafts.push({
        ...base, perspective: undefined, sourceId: `${sid}#rev`, name: `${name}${cur.nameRules.reverseSuffix}`, type: 'TRANSITION',
        fromSourceId: toSid, toSourceId: fromSid, tier: 'EXTENDED', refs: [],
      });
    }
  }
  for (const g of cur.gi) {
    drafts.push({
      source: 'curated', sourceId: `cur:gi:${g.key}`, sourceVersion: curVersion, name: g.name, type: g.type,
      fromSourceId: g.from, toSourceId: g.type === 'SUBMISSION' ? undefined : g.to, appliesTo: 'GI',
      perspective: g.perspective, tier: 'CORE', refs: [],
    });
  }
  const techOrder = [
    ...cur.core.techniques.map((t) => drafts.find((d) => d.sourceId === t.sourceId)!),
    ...drafts.filter((d) => d.source === 'curated'),
    ...drafts.filter((d) => d.source === 'grapplemap' && !coreTech.has(d.sourceId)),
  ];
  const techSlugs = assignSlugs(techOrder.map((d) => d.name));
  const techniques: SeedTechnique[] = techOrder.map((d, i) => {
    const { refs: _refs, ...rest } = d;
    return { ...rest, id: registry.id(`${d.source}:${d.sourceId}`), slug: techSlugs[i]! };
  });
  const techById = new Set(techniques.map((t) => t.sourceId));

  // 7. aliases: curated (core.json, gi.json) and grapple-flows (vendored file, mapped in aliases.json)
  const aliases: SeedAlias[] = [];
  const aliasSeen = new Set<string>();
  const addAlias = (a: Omit<SeedAlias, 'id'>) => {
    const target = a.targetKind === 'POSITION' ? nameOfPos.get(a.targetSourceId) : techniques.find((t) => t.sourceId === a.targetSourceId)?.name;
    if (!target) throw new Error(`alias target ${a.targetSourceId} not emitted`);
    const k = `${a.targetKind}|${a.targetSourceId}|${a.name.toLowerCase()}`;
    if (a.name.toLowerCase() === target.toLowerCase() || aliasSeen.has(k)) return;
    aliasSeen.add(k);
    aliases.push({ ...a, id: registry.id(`${a.source}:${a.sourceId}`) });
  };
  const curatedAlias = (targetKind: 'POSITION' | 'TECHNIQUE', targetSourceId: string, name: string) =>
    addAlias({ source: 'curated', sourceId: `cur:alias:${targetSourceId}:${slugify(name)}`, sourceVersion: curVersion, targetKind, targetSourceId, name });
  for (const p of cur.core.positions) for (const a of p.aliases ?? []) curatedAlias('POSITION', p.sourceId, a);
  for (const t of cur.core.techniques) for (const a of t.aliases ?? []) curatedAlias('TECHNIQUE', t.sourceId, a);
  for (const g of cur.gi) for (const a of g.aliases ?? []) curatedAlias('TECHNIQUE', `cur:gi:${g.key}`, a);

  const flowsFile = JSON.parse(fs.readFileSync(path.join(paths.flows, 'taxonomy.json'), 'utf8')) as {
    categories: { entries: { tag: string; label: string }[] }[];
    aliases: Record<string, string>;
  };
  const flowsSource = fs.readFileSync(path.join(paths.flows, 'SOURCE.md'), 'utf8');
  const flowsVersion = /commit date[^0-9]*(\d{4}-\d{2}-\d{2})/i.exec(flowsSource)?.[1];
  if (!flowsVersion) throw new Error('grapple-flows SOURCE.md names no commit date');
  const labels = new Map(flowsFile.categories.flatMap((c) => c.entries.map((e) => [e.tag, e.label] as const)));
  const flowsAliasCount = Object.keys(flowsFile.aliases).length;
  for (const [kind, map] of [['POSITION', cur.flows.positions], ['TECHNIQUE', cur.flows.techniques]] as const) {
    for (const [tag, targetSourceId] of Object.entries(map)) {
      const label = labels.get(tag);
      if (!label) throw new Error(`aliases.json: grapple-flows tag ${tag} not in the vendored file`);
      if (kind === 'TECHNIQUE' && !techById.has(targetSourceId)) throw new Error(`aliases.json: technique ${targetSourceId} not emitted`);
      if (kind === 'POSITION' && !nameOfPos.has(targetSourceId)) throw new Error(`aliases.json: position ${targetSourceId} unknown`);
      const base = { source: 'grapple-flows' as const, sourceVersion: flowsVersion, targetKind: kind, targetSourceId };
      addAlias({ ...base, sourceId: tag, name: label });
      for (const [aliasSlug, to] of Object.entries(flowsFile.aliases).sort()) {
        if (to === tag) addAlias({ ...base, sourceId: aliasSlug, name: slugName(aliasSlug, rules.clean) });
      }
    }
  }

  // 9. resources from ref: citations (A-27), linked to the citing techniques that were emitted
  const resources = new Map<string, SeedResource>();
  const links: SeedResourceLink[] = [];
  const linkKeys = new Set<string>();
  const allRefs = new Set<string>();
  for (const d of drafts) {
    for (const ref of d.refs) {
      allRefs.add(ref);
      const sourceId = `ref:${sha1(ref)}`;
      if (!resources.has(sourceId)) {
        resources.set(sourceId, {
          id: registry.id(`grapplemap:${sourceId}`), source: 'grapplemap', sourceId, sourceVersion: GM_VERSION,
          resourceTypeKey: 'instructional', ...parseCitation(ref),
        });
      }
      const linkKey = `${d.sourceId}|${sourceId}`;
      if (!linkKeys.has(linkKey)) {
        linkKeys.add(linkKey);
        links.push({ id: registry.id(`link:${linkKey}`), resourceSourceId: sourceId, targetKind: 'TECHNIQUE', targetSourceId: d.sourceId });
      }
    }
  }
  const positionRefs = posRecords.reduce((n, r) => n + r.refs.length, 0);

  // catalog
  const catRow = (prefix: string, key: string, i: number, name: string, description?: string) => {
    const sourceId = `${prefix}:${key}`;
    return { id: registry.id(`curated:${sourceId}`), source: 'curated', sourceId, sourceVersion: cur.release.catalog, name, sortOrder: i + 1, ...(description ? { description } : {}) };
  };
  const catalog = {
    release: cur.release.catalog,
    sessionTypes: cur.catalog.sessionTypes.map((s, i) => catRow('st', s.key, i, s.name)),
    subjects: cur.catalog.subjects.map((s, i) => catRow('subj', s.key, i, s.name, s.description)),
    resourceTypes: cur.catalog.resourceTypes.map((s, i) => ({ ...catRow('rt', s.key, i, s.name), key: s.key })),
  };

  const count = <T>(xs: readonly T[], f: (x: T) => string) => xs.reduce<Record<string, number>>((acc, x) => ((acc[f(x)] = (acc[f(x)] ?? 0) + 1), acc), {});
  const forward = techniques.filter((t) => t.source === 'grapplemap' && !t.sourceId.endsWith('#rev'));
  const report = {
    release: cur.release.taxonomy,
    grapplemap: { records: records.length, positions: posRecords.length, transitions: trRecords.length, validationErrors: 0 },
    resolution: {
      eps: resolve.eps, epsMax: resolve.epsMax, ownKeyCollisions: index.ownKeyCollisions(posRecords.map((r) => ({ index: r.index, digits: poseDigits(r, 0) }))),
      endpoints: endpointStats,
      transitionsBothEndsResolved: edgesBothResolved,
      bothEndsRate: Number((edgesBothResolved / trRecords.length).toFixed(4)),
      transitionsEmitted: forward.length,
      emittedRate: Number((forward.length / trRecords.length).toFixed(4)),
      dropped,
    },
    positions: { total: positions.length, core: positions.filter((p) => p.tier === 'CORE').length, withParent: positions.filter((p) => p.parentSourceId).length },
    techniques: {
      total: techniques.length,
      core: techniques.filter((t) => t.tier === 'CORE').length,
      reverseEdges: techniques.filter((t) => t.sourceId.endsWith('#rev')).length,
      gi: techniques.filter((t) => t.appliesTo === 'GI').length,
      byType: count(techniques, (t) => t.type),
      coreByType: count(techniques.filter(isCoreRow), (t) => t.type),
    },
    aliases: { total: aliases.length, bySource: count(aliases, (a) => a.source), grappleFlowsAliasEntries: flowsAliasCount },
    resources: { citations: allRefs.size, emitted: resources.size, links: links.length, positionCitationsNotLinked: positionRefs },
    catalog: { sessionTypes: catalog.sessionTypes.length, subjects: catalog.subjects.length, resourceTypes: catalog.resourceTypes.length },
  };

  const taxonomy = {
    release: cur.release.taxonomy,
    grapplemapSnapshot: cur.release.grapplemapSnapshot,
    positions: [...positions].sort(bySource),
    techniques: [...techniques].sort(bySource),
    aliases: aliases.sort(bySource),
    resources: [...resources.values()].sort(bySource),
    resourceLinks: links.sort((a, b) => (`${a.targetSourceId}|${a.resourceSourceId}` < `${b.targetSourceId}|${b.resourceSourceId}` ? -1 : 1)),
  };
  return { taxonomy, catalog, report, attribution: cur.attribution, registry };
}

const isCoreRow = (t: { tier: Tier }) => t.tier === 'CORE';

/** Writes the four seed files (and, with `--mint`, the updated registry). Throws on missing ids. */
export function run(paths: Paths, mint: boolean): ConvertResult {
  const result = convert(paths, { mint });
  if (result.registry.missing.size > 0) {
    throw new Error(`ids.json lacks ${result.registry.missing.size} ids (e.g. ${[...result.registry.missing].slice(0, 3).join(', ')}); run with --mint and commit ids.json`);
  }
  if (mint) fs.writeFileSync(path.join(paths.curated, 'ids.json'), stableStringify(result.registry.sorted()));
  writeJson(path.join(paths.out, 'taxonomy.json'), result.taxonomy);
  writeJson(path.join(paths.out, 'catalog.json'), result.catalog);
  writeJson(path.join(paths.out, 'report.json'), result.report);
  writeJson(path.join(paths.out, 'attribution.json'), result.attribution);
  return result;
}
