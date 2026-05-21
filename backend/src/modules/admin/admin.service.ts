import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { UpdateVerificationInput } from "./admin.validation";

function stripPassword<T extends { password: string }>({ password: _, ...safe }: T) {
  return safe;
}

export async function getAdminStats() {
  const [
    totalUsers,
    totalEngineers,
    totalClients,
    totalProjects,
    pendingVerifications,
    payments,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "ENGINEER" } }),
    db.user.count({ where: { role: "CLIENT" } }),
    db.project.count(),
    db.engineerProfile.count({ where: { verificationStatus: "PENDING" } }),
    db.payment.findMany({
      where: { status: { in: ["FUNDED", "RELEASED"] } },
      select: { amount: true, status: true },
    }),
  ]);

  const gmv = payments.reduce((sum, p) => sum + p.amount, 0);
  const inEscrow = payments
    .filter((p) => p.status === "FUNDED")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    totalUsers,
    totalEngineers,
    totalClients,
    totalProjects,
    pendingVerifications,
    gmv,
    inEscrow,
    openDisputes: 0,
  };
}

export async function getPendingVerifications() {
  const engineers = await db.user.findMany({
    where: {
      role: "ENGINEER",
      profile: { verificationStatus: "PENDING" },
    },
    include: { profile: true },
    orderBy: { createdAt: "desc" },
  });

  return engineers.map((e) => {
    const p = e.profile!;
    const docType = p.syndicateCardUrl
      ? "Syndicate Card"
      : p.collegeIdUrl
        ? "College ID"
        : p.certificateUrl
          ? "Certificate"
          : "Document";
    return {
      profileId: p.id,
      userId: e.id,
      name: e.name,
      email: e.email,
      specialty: p.specialty,
      documentType: docType,
      collegeIdUrl: p.collegeIdUrl,
      certificateUrl: p.certificateUrl,
      syndicateCardUrl: p.syndicateCardUrl,
      submittedAt: p.createdAt,
    };
  });
}

export async function updateEngineerVerification(
  profileId: number,
  data: UpdateVerificationInput,
) {
  const profile = await db.engineerProfile.findUnique({
    where: { id: profileId },
    include: { user: true },
  });
  if (!profile) throw new ApiError(404, "Engineer profile not found");

  const updated = await db.engineerProfile.update({
    where: { id: profileId },
    data: { verificationStatus: data.status },
    include: { user: true },
  });

  return stripPassword(updated.user);
}
