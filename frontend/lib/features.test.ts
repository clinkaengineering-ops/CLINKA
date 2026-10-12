import { FeatureFlags } from './features';

describe('FeatureFlags', () => {
  it('is an object with boolean values', () => {
    for (const [key, value] of Object.entries(FeatureFlags)) {
      expect(typeof value).toBe('boolean');
    }
  });

  it('includes the ENABLE_PROFESSIONAL_PROFILES flag', () => {
    expect('ENABLE_PROFESSIONAL_PROFILES' in FeatureFlags).toBe(true);
  });

  it('has all expected feature flags', () => {
    const keys = Object.keys(FeatureFlags);
    expect(keys).toContain('ENABLE_PROFESSIONAL_PROFILES');
    expect(keys).toContain('ENABLE_ENHANCED_PORTFOLIO');
    expect(keys).toContain('ENABLE_PROFILE_ANALYTICS');
    expect(keys).toContain('ENABLE_SIMILAR_ENGINEERS');
  });
});
