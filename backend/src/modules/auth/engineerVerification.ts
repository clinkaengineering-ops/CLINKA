export const MIN_ENGINEER_PORTFOLIO = 3;

export function hasCompleteEngineerApplication(
  profile: { portfolio?: unknown[] | null },
  portfolioCount = profile.portfolio?.length ?? 0,
): boolean {
  return portfolioCount >= MIN_ENGINEER_PORTFOLIO;
}

/** Prisma filter: PENDING profiles */
export const pendingWithDocumentWhere = {
  verificationStatus: "PENDING" as const,
};
