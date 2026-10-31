import i18n from '..';
import en from '../en.json';

function flatten(obj: Record<string, unknown>, prefix = ''): [string, unknown][] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return v !== null && typeof v === 'object' ? flatten(v as Record<string, unknown>, key) : [[key, v]];
  });
}

describe('i18n', () => {
  it('resolves home.title', () => {
    expect(i18n.t('home.title')).toBe('matIQ');
  });

  it('interpolates app.migrationError', () => {
    expect(i18n.t('app.migrationError', { message: 'boom' })).toBe(
      'Could not prepare the database: boom',
    );
  });

  it.each(flatten(en))('%s is a non-empty string', (_key, value) => {
    expect(typeof value).toBe('string');
    expect((value as string).trim().length).toBeGreaterThan(0);
  });
});
