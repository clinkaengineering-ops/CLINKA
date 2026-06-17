import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { CreateReviewInput } from "./reviews.validation";

const reviewInclude = {
  client: { select: { id: true, name: true } },
  project: { select: { id: true, title: true } },
} as const;

async function recalculateEngineerRating(engineerProfileId: number) {
  const reviews = await db.review.findMany({
    where: { engineerId: engineerProfileId },
    select: { rating: true },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  await db.engineerProfile.update({
    where: { id: engineerProfileId },
    data: {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
    },
  });
}

async function getAcceptedBid(projectId: number) {
  return db.bid.findFirst({
    where: { projectId, status: "ACCEPTED" },
    include: {
      engineer: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

export async function createProjectReview(
  clientId: number,
  projectId: number,
  data: CreateReviewInput,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { payment: true, review: true },
  });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) {
    throw new ApiError(403, "Only the project owner can leave a review");
  }
  if (project.review) {
    throw new ApiError(400, "This project already has a review");
  }
  if (project.status === "OPEN" || project.status === "CANCELLED") {
    throw new ApiError(400, "Cannot review a project that is not in progress or completed");
  }

  const payment = project.payment;
  if (!payment || payment.status !== "RELEASED") {
    throw new ApiError(
      400,
      "Release escrow payment before leaving a review",
    );
  }

  const bid = await getAcceptedBid(projectId);
  if (!bid) throw new ApiError(400, "No accepted engineer found for this project");

  const review = await db.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        projectId,
        clientId,
        engineerId: bid.engineerId,
        rating: data.rating,
        comment: data.comment ?? null,
      },
      include: reviewInclude,
    });

    await tx.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED" },
    });

    return created;
  });

  await recalculateEngineerRating(bid.engineerId);
  return review;
}

export async function getProjectReview(projectId: number) {
  const review = await db.review.findUnique({
    where: { projectId },
    include: reviewInclude,
  });
  if (!review) throw new ApiError(404, "Review not found");
  return review;
}

export async function getEngineerReviews(engineerUserId: number) {
  const engineer = await db.user.findUnique({
    where: { id: engineerUserId, role: "ENGINEER" },
    include: { profile: true },
  });
  if (!engineer?.profile) throw new ApiError(404, "Engineer not found");

  return db.review.findMany({
    where: { engineerId: engineer.profile.id },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listPendingReviews(clientId: number) {
  const projects = await db.project.findMany({
    where: {
      clientId,
      status: { in: ["IN_PROGRESS", "COMPLETED"] },
      review: null,
      payment: { status: "RELEASED" },
    },
    include: {
      payment: true,
      bids: {
        where: { status: "ACCEPTED" },
        take: 1,
        include: {
          engineer: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects
    .filter((p) => p.bids.length > 0)
    .map((p) => ({
      projectId: p.id,
      projectTitle: p.title,
      amount: p.payment?.amount ?? p.bids[0].price,
      engineerUserId: p.bids[0].engineer.user.id,
      engineerName: p.bids[0].engineer.user.name,
      projectStatus: p.status,
      paymentReleasedAt: p.payment?.updatedAt,
    }));
}

export async function listMyReviews(clientId: number) {
  return db.review.findMany({
    where: { clientId },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function canReviewProject(clientId: number, projectId: number) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      payment: true,
      review: { include: reviewInclude },
    },
  });
  if (!project) throw new ApiError(404, "Project not found");

  return {
    canReview:
      project.clientId === clientId &&
      !project.review &&
      project.status !== "OPEN" &&
      project.status !== "CANCELLED" &&
      project.payment?.status === "RELEASED",
    hasReview: !!project.review,
    review: project.review,
  };
}
