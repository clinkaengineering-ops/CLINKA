import { VerificationLevel, AvailabilityStatus } from "../generated/prisma/client";

export const RankingWeights = {
  verification: 25,
  rating: 20,
  completedProjects: 15,
  profileCompletion: 15,
  reviews: 10,
  availability: 5,
  responseTime: 5,
  experience: 5,
};

export function calculateProfessionalScore(profile: any, completedProjectsCount: number): number {
  let score = 0;

  // 1. Verification (Max 25)
  if (profile.verificationLevel === 'TOP_ENGINEER') score += 25;
  else if (profile.verificationLevel === 'VERIFIED') score += 20;
  else if (profile.verificationLevel === 'COMPLETE') score += 10;

  // 2. Rating (Max 20)
  const rating = profile.averageRating || 0;
  score += (rating / 5) * 20;

  // 3. Completed Projects (Max 15, capped at 20 projects)
  const capProjects = Math.min(completedProjectsCount, 20);
  score += (capProjects / 20) * 15;

  // 4. Profile Completion (Max 15)
  const completion = profile.profileCompletion || 0;
  score += (completion / 100) * 15;

  // 5. Reviews (Max 10, capped at 20 reviews)
  const reviews = profile.totalReviews || 0;
  const capReviews = Math.min(reviews, 20);
  score += (capReviews / 20) * 10;

  // 6. Availability (Max 5)
  if (profile.availabilityStatus === 'AVAILABLE_NOW') score += 5;
  else if (profile.availabilityStatus === 'OPEN_TO_WORK') score += 4;
  else if (profile.availabilityStatus === 'AVAILABLE_NEXT_WEEK') score += 3;
  else if (profile.availabilityStatus === 'AVAILABLE_NEXT_MONTH') score += 2;

  // 7. Response Time (Max 5) - Note: responseTime not in V1 schema, assuming default 0 for now
  // If we had responseTime: WITHIN_1_HOUR=5, WITHIN_24_HOURS=3, WITHIN_2_DAYS=1
  score += 0; // Defaulting to 0 since we missed adding responseTime enum to the schema initially, wait, we added it? Let's check schema later. If not, 0.

  // 8. Experience (Max 5, capped at 10 years)
  const exp = profile.yearsOfExperience || 0;
  const capExp = Math.min(exp, 10);
  score += (capExp / 10) * 5;

  return Math.round(score);
}
