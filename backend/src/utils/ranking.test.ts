import { calculateProfessionalScore, RankingWeights } from './ranking';

describe('ranking', () => {
  it('exports valid ranking weights summing to 100', () => {
    const total = Object.values(RankingWeights).reduce((sum, w) => sum + w, 0);
    expect(total).toBe(100);
  });

  it('calculates 0 score for empty profile', () => {
    const score = calculateProfessionalScore({}, 0);
    expect(score).toBe(0);
  });

  it('calculates maximum score for a top engineer with full stats', () => {
    const profile = {
      verificationLevel: 'TOP_ENGINEER',
      averageRating: 5,
      profileCompletion: 100,
      totalReviews: 25,
      availabilityStatus: 'AVAILABLE_NOW',
      yearsOfExperience: 15,
    };
    // 25 + 20 + 15 + 15 + 10 + 5 + 0 + 5 = 95 (since responseTime default is 0)
    const score = calculateProfessionalScore(profile, 25);
    expect(score).toBe(95);
  });

  it('calculates score with VERIFIED level and OPEN_TO_WORK status', () => {
    const profile = {
      verificationLevel: 'VERIFIED',
      averageRating: 4,
      profileCompletion: 80,
      totalReviews: 10,
      availabilityStatus: 'OPEN_TO_WORK',
      yearsOfExperience: 5,
    };
    // 20 + (4/5)*20 (16) + (10/20)*15 (7.5) + (80/100)*15 (12) + (10/20)*10 (5) + 4 + (5/10)*5 (2.5) = 67
    const score = calculateProfessionalScore(profile, 10);
    expect(score).toBe(67);
  });

  it('calculates score with COMPLETE verification and staggered availability', () => {
    const profile1 = {
      verificationLevel: 'COMPLETE',
      availabilityStatus: 'AVAILABLE_NEXT_WEEK',
    };
    expect(calculateProfessionalScore(profile1, 0)).toBe(13); // 10 + 3

    const profile2 = {
      availabilityStatus: 'AVAILABLE_NEXT_MONTH',
    };
    expect(calculateProfessionalScore(profile2, 0)).toBe(2);
  });
});

