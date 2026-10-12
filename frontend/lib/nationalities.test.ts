import { NATIONALITIES, getNationalityFlag } from './nationalities';

describe('nationalities', () => {
  it('contains expected nationalities list', () => {
    expect(NATIONALITIES.length).toBeGreaterThan(50);
    expect(NATIONALITIES).toContain('Egyptian');
    expect(NATIONALITIES).toContain('American');
  });

  it('converts nationality to country flag emoji', () => {
    const flag = getNationalityFlag('Egyptian');
    expect(flag).toBeTruthy();
    expect(typeof flag).toBe('string');
  });

  it('returns empty string for missing or invalid nationality', () => {
    expect(getNationalityFlag(null)).toBe('');
    expect(getNationalityFlag(undefined)).toBe('');
    expect(getNationalityFlag('UnknownLand')).toBe('');
  });
});
