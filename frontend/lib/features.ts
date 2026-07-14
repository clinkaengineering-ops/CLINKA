export const FeatureFlags = {
  // Enables the new professional profile layout vs the old basic layout
  ENABLE_PROFESSIONAL_PROFILES: process.env.NEXT_PUBLIC_ENABLE_PROFESSIONAL_PROFILES === 'true' || true,
  
  // Enables the enhanced portfolio upload with files (PDFs, multi-images)
  ENABLE_ENHANCED_PORTFOLIO: process.env.NEXT_PUBLIC_ENABLE_ENHANCED_PORTFOLIO === 'true' || true,
  
  // Enables analytics tracking on profile views
  ENABLE_PROFILE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_PROFILE_ANALYTICS === 'true' || true,
  
  // Enables recommendation of similar engineers
  ENABLE_SIMILAR_ENGINEERS: process.env.NEXT_PUBLIC_ENABLE_SIMILAR_ENGINEERS === 'true' || false,
};
