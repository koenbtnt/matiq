import { DomainError } from '../errors';
import { isLocalDate } from '../session/localDate';

export const ADULT_BELT_LIST = ['WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK'] as const;
export const KIDS_BELT_LIST = [
  'WHITE', 'GREY_WHITE', 'GREY', 'GREY_BLACK', 'YELLOW_WHITE', 'YELLOW', 'YELLOW_BLACK',
  'ORANGE_WHITE', 'ORANGE', 'ORANGE_BLACK', 'GREEN_WHITE', 'GREEN', 'GREEN_BLACK',
] as const;

export type RankIn = { scale: string; belt: string; stripes: number; awardedOn: string };

/**
 * Rank rules (plan §10): belt belongs to the scale; stripes are an integer 0–4, up to 6 on BLACK
 * (degrees); `awardedOn` is a real date not after today.
 */
export function validateRank(input: RankIn, today: string): void {
  const belts: readonly string[] =
    input.scale === 'ADULT' ? ADULT_BELT_LIST : input.scale === 'KIDS' ? KIDS_BELT_LIST : [];
  if (!belts.includes(input.belt)) throw new DomainError('RANK_BELT_INVALID_FOR_SCALE');
  const maxStripes = input.belt === 'BLACK' ? 6 : 4;
  if (!Number.isInteger(input.stripes) || input.stripes < 0 || input.stripes > maxStripes)
    throw new DomainError('RANK_STRIPES_INVALID');
  if (!isLocalDate(input.awardedOn) || input.awardedOn > today) throw new DomainError('RANK_DATE_INVALID');
}

/** Current rank: latest by awardedOn, then createdAt (ties broken by the later entry). */
export function currentOf<T extends { awardedOn: string; createdAt: string }>(entries: readonly T[]): T | undefined {
  return [...entries].sort((a, b) =>
    a.awardedOn !== b.awardedOn ? (a.awardedOn < b.awardedOn ? 1 : -1) : a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  )[0];
}
