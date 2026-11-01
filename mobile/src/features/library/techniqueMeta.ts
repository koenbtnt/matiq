import type { TFunction } from 'i18next';

import type { TechniqueRow } from '../../hooks/data';

/** Subtitle of a technique row (design §4.6.4): "Sweep · Half guard → Mount" (+ " · from top"). */
export function techniqueMeta(t: TFunction, row: TechniqueRow): string {
  const type = t(`library.technique.type.${row.type}`);
  let base: string;
  if (row.type === 'SUBMISSION') base = t('library.technique.metaSubmission', { from: row.fromName });
  else if (row.toName) base = t('library.technique.meta', { type, from: row.fromName, to: row.toName });
  else base = `${type} · ${row.fromName}`;
  return row.perspective ? `${base} · ${t(`library.technique.perspective.${row.perspective}`)}` : base;
}
