import i18n from '..';
import en from '../en.json';

describe('i18n', () => {
  it('resolves a flat dotted key', () => {
    expect(i18n.t('tabs.home')).toBe('Home');
  });

  it('keeps a key and its dotted children apart', () => {
    expect(i18n.t('log.notSet')).toBe('Not set');
    expect(i18n.t('log.notSet.short')).toBe('–');
  });

  it('interpolates', () => {
    expect(i18n.t('errors.DB_RESET_FAILED')).toMatch(/reset/i);
    expect(i18n.t('toast.undo.a11y', { message: 'Session saved' })).toBe('Undo: Session saved');
  });

  it('pluralises', () => {
    expect(i18n.t('rank.stripes', { count: 1 })).toBe('1 stripe');
    expect(i18n.t('rank.stripes', { count: 0 })).toBe('0 stripes');
  });

  it.each(Object.entries(en))('%s is a non-empty string', (_key, value) => {
    expect(typeof value).toBe('string');
    expect(value.trim().length).toBeGreaterThan(0);
  });
});
