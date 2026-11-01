import type { TFunction } from 'i18next';

import type { Belt } from '../../hooks/data';

export const BELTS: Belt[] = ['WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK'];

/** "Blue belt · 2 stripes": the rank is always a text name beside the belt graphic (R-C5, DSR-4). */
export function rankTitle(t: TFunction, belt: Belt, stripes: number): string {
  return t('rank.title', {
    beltName: t('rank.beltName', { belt: t(`rank.belt.${belt}`) }),
    stripes: t('rank.stripes', { count: stripes }),
  });
}

/** `YYYY-MM-DD` (a local date) to a Date at local noon. */
export const parseLocalDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
};

export const toLocalDate = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
