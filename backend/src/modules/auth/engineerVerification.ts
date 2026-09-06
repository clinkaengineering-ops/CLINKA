import ApiError from "../../utils/ApiError";

export const ENGINEER_DOCUMENT_TYPES = [
  "collegeIdUrl",
  "certificateUrl",
  "syndicateCardUrl",
] as const;

export type EngineerDocumentType = (typeof ENGINEER_DOCUMENT_TYPES)[number];

export const MIN_ENGINEER_PORTFOLIO = 3;

export type EngineerCredentialFields = {
  collegeIdUrl?: string | null;
  certificateUrl?: string | null;
  syndicateCardUrl?: string | null;
};

function isStoredUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasVerificationDocument(
  profile: EngineerCredentialFields,
): boolean {
  return (
    isStoredUrl(profile.collegeIdUrl) ||
    isStoredUrl(profile.certificateUrl) ||
    isStoredUrl(profile.syndicateCardUrl)
  );
}

export function hasCompleteEngineerApplication(
  profile: EngineerCredentialFields & { portfolio?: unknown[] | null },
  portfolioCount = profile.portfolio?.length ?? 0,
): boolean {
  return (
    hasVerificationDocument(profile) && portfolioCount >= MIN_ENGINEER_PORTFOLIO
  );
}

/** Prisma filter: PENDING profiles that have at least one non-empty document URL. */
export const pendingWithDocumentWhere = {
  verificationStatus: "PENDING" as const,
  OR: [
    { collegeIdUrl: { not: "" } },
    { certificateUrl: { not: "" } },
    { syndicateCardUrl: { not: "" } },
  ],
};

export function requireVerificationDocumentUrl(
  fileUrl: string | null | undefined,
): string {
  const url = fileUrl?.trim() ?? "";
  if (!url) {
    throw new ApiError(400, "Verification document is required");
  }
  return url;
}

export function requireEngineerDocumentType(
  value: unknown,
): EngineerDocumentType {
  if (
    value === "collegeIdUrl" ||
    value === "certificateUrl" ||
    value === "syndicateCardUrl"
  ) {
    return value;
  }
  throw new ApiError(400, "Select a document type to upload");
}
