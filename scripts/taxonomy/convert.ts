/**
 * CLI of the taxonomy pipeline (Node type stripping, no build, no dependencies):
 *   node scripts/taxonomy/convert.ts            regenerate mobile/src/db/seed/*.json (CI + verify)
 *   node scripts/taxonomy/convert.ts --mint     also mint missing ids into curated/ids.json
 *   node scripts/taxonomy/convert.ts split <GrappleMap.txt>   vendor a new snapshot into records/
 *   node scripts/taxonomy/convert.ts join       print the re-assembled GrappleMap.txt
 */
import fs from 'node:fs';
import path from 'node:path';

import { joinDirectory } from './join.ts';
import { defaultPaths, run } from './pipeline.ts';
import { splitToDirectory } from './split.ts';

const paths = defaultPaths(path.resolve(import.meta.dirname, '../..'));
const [command, arg] = process.argv.slice(2);

if (command === 'split') {
  if (!arg) throw new Error('usage: convert.ts split <GrappleMap.txt>');
  console.log(`${splitToDirectory(fs.readFileSync(arg, 'utf8'), paths.records).length} records`);
} else if (command === 'join') {
  process.stdout.write(joinDirectory(paths.records));
} else {
  const { report } = run(paths, process.argv.includes('--mint'));
  const r = report as Record<string, unknown>;
  console.log(JSON.stringify({ resolution: r.resolution, positions: r.positions, techniques: r.techniques, aliases: r.aliases, resources: r.resources }));
}
