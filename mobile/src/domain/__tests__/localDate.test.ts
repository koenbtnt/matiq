/**
 * @jest-environment node
 */
import { setEnv } from '../../db/testing/env';
import { addDays, isIsoUtc, isLocalDate, localDateOf, weekStartOf } from '../session/localDate';

describe('localDateOf (ADR 0016, CO-06)', () => {
  it.each([
    ['2026-03-02T23:30:00.000Z', 'Europe/Amsterdam', '2026-03-03'],
    ['2026-03-02T23:30:00.000Z', 'America/New_York', '2026-03-02'],
    ['2026-03-02T23:30:00.000Z', 'UTC', '2026-03-02'],
    ['2026-03-03T04:30:00Z', 'America/Los_Angeles', '2026-03-02'],
    ['2026-03-02T12:00:00.000Z', 'Pacific/Kiritimati', '2026-03-03'],
  ])('%s in %s is %s', (iso, zone, expected) => {
    expect(localDateOf(iso, zone)).toBe(expected);
  });

  it('is fixed by the zone passed in, not the process TZ', () => {
    for (const tz of ['UTC', 'Asia/Tokyo', 'America/Sao_Paulo']) {
      const restore = setEnv('TZ', tz);
      try {
        expect(localDateOf('2026-03-29T00:30:00.000Z', 'Europe/Amsterdam')).toBe('2026-03-29');
      } finally {
        restore();
      }
    }
  });

  it('handles the DST switch nights (Europe/Amsterdam)', () => {
    // 2026-03-29 02:00 → 03:00 local; 2026-10-25 03:00 → 02:00 local.
    expect(localDateOf('2026-03-28T22:59:59.000Z', 'Europe/Amsterdam')).toBe('2026-03-28');
    expect(localDateOf('2026-03-28T23:00:00.000Z', 'Europe/Amsterdam')).toBe('2026-03-29');
    expect(localDateOf('2026-10-24T21:59:59.000Z', 'Europe/Amsterdam')).toBe('2026-10-24');
    expect(localDateOf('2026-10-24T22:00:00.000Z', 'Europe/Amsterdam')).toBe('2026-10-25');
    expect(localDateOf('2026-10-25T22:59:59.000Z', 'Europe/Amsterdam')).toBe('2026-10-25');
  });

  it('rejects malformed instants and unknown zones', () => {
    expect(() => localDateOf('2026-03-02 10:00', 'UTC')).toThrow('SESSION_START_INVALID');
    expect(() => localDateOf('2026-02-30T10:00:00Z', 'UTC')).toThrow('SESSION_START_INVALID');
    expect(() => localDateOf('2026-03-02T10:00:00Z', 'Mars/Olympus')).toThrow('SESSION_START_INVALID');
  });
});

describe('date helpers', () => {
  it('validates ISO UTC and local dates', () => {
    expect(isIsoUtc('2026-03-02T10:00:00.000Z')).toBe(true);
    expect(isIsoUtc('2026-03-02T10:00:00+01:00')).toBe(false);
    expect(isLocalDate('2026-02-28')).toBe(true);
    expect(isLocalDate('2026-02-29')).toBe(false);
    expect(isLocalDate('2028-02-29')).toBe(true);
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('starts weeks on Monday (R-15)', () => {
    expect(weekStartOf('2026-03-02')).toBe('2026-03-02'); // Monday
    expect(weekStartOf('2026-03-08')).toBe('2026-03-02'); // Sunday
    expect(weekStartOf('2026-03-04')).toBe('2026-03-02');
  });
});
