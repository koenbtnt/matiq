import { getDb, type Db } from '../db/client';
import catalogJson from '../db/seed/catalog.json';
import taxonomyJson from '../db/seed/taxonomy.json';
import { compareReleases, type CatalogSeed, type TaxonomySeed } from '../domain/taxonomy/seed';
import { ensureV1ParamsSync } from './algorithmParams';
import { getAppMetaSync } from './appMeta';
import type { EnsureSeededResult } from './contracts';
import { ensureSettingRowsSync } from './settings';
import { importCatalogSync, importTaxonomySync } from './taxonomyImport';

export type SeedBundle = { catalog: CatalogSeed; taxonomy: TaxonomySeed };

const shipped = (): SeedBundle => ({
  catalog: catalogJson as unknown as CatalogSeed,
  taxonomy: taxonomyJson as unknown as TaxonomySeed,
});

/**
 * F-16, the one first-launch seed entry: catalog, taxonomy release, settings rows and
 * algorithm_params v1 rows — idempotent, one transaction (a second run writes nothing).
 */
export async function ensureSeeded(
  database: Db = getDb(),
  { now }: { now: () => string },
  bundle: SeedBundle = shipped(),
): Promise<EnsureSeededResult> {
  const at = now();
  return database.transaction((tx) => {
    const catalogCurrent = getAppMetaSync('catalog_release', tx) === bundle.catalog.release;
    if (!catalogCurrent) importCatalogSync(bundle.catalog, at, tx);
    const installed = getAppMetaSync('taxonomy_release', tx);
    const taxonomy =
      installed !== undefined && compareReleases(installed, bundle.taxonomy.release) === 0
        ? ('current' as const)
        : importTaxonomySync(bundle.taxonomy, at, tx);
    const settingsInserted = ensureSettingRowsSync(at, tx);
    const params = ensureV1ParamsSync(at, tx);
    return { taxonomy, catalog: catalogCurrent ? 'current' : 'seeded', settings: settingsInserted, params };
  });
}

export const seed = { ensureSeeded };
