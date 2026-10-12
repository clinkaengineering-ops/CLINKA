import { nationalityFlag } from './nationalityFlags';

describe('nationalityFlag', () => {
  it('returns flag for valid demonym', () => {
    const flag = nationalityFlag('Egyptian');
    expect(flag).not.toBe('🌍');
    expect(flag.length).toBeGreaterThan(0);
  });

  it('returns earth emoji for unknown nationality', () => {
    expect(nationalityFlag('Unknown')).toBe('🌍');
    expect(nationalityFlag('')).toBe('🌍');
  });
});
