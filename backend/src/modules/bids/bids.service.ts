import db from "../../config/db";
import { ProjectStatus } from "../../generated/prisma/enums";
import ApiError from "../../utils/ApiError";
import { CreateBidInput } from "./bids.validation";

export async function createBid(
  engineerId: number,
  projectId: number,
  data: CreateBidInput,
) {
  const { price, duration, description } = data;

  // Check user is an engineer
  const user = await db.user.findUnique({ where: { id: engineerId } });
  if (!user || user.role !== "ENGINEER") {
    throw new ApiError(403, "Only engineers can place bids");
  }

  // Get engineer profile
  const profile = await db.engineerProfile.findUnique({
    where: { userId: engineerId },
  });
  if (!profile) throw new ApiError(404, "Engineer profile not found");

  // Check project exists
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, "Project not found");

  // Check project is still open
  if (project.status !== "OPEN") {
    throw new ApiError(400, "Bidding is closed for this project");
  }

  // Check engineer hasn't already bid
  const existingBid = await db.bid.findFirst({
    where: { engineerId: profile.id, projectId },
  });
  if (existingBid) {
    throw new ApiError(400, "You already placed a bid on this project");
  }

  // Create the bid
  const bid = await db.bid.create({
    data: {
      engineerId: profile.id,
      projectId,
      price,
      duration,
      description,
    },
  });
  return bid;
}

export async function getBidsForProject(projectId: number) {
  const bids = await db.bid.findMany({
    where: { projectId },
    include: {
      engineer: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  return bids;
}

export async function approveBid(clientId: number, bidId: number) {
  // Get the bid
  const bid = await db.bid.findUnique({ where: { id: bidId } });
  if (!bid) throw new ApiError(404, "Bid not found");

  // Get the project
  const project = await db.project.findUnique({ where: { id: bid.projectId } });
  if (!project) throw new ApiError(404, "Project not found");

  // Check client owns this project
  if (project.clientId !== clientId) {
    throw new ApiError(403, "Not your project");
  }

  // Check project is still open
  if (project.status !== "OPEN") {
    throw new ApiError(400, "Project is not open for bidding");
  }

  // Accept this bid
  await db.bid.update({
    where: { id: bidId },
    data: { status: "ACCEPTED" },
  });

  // Reject all other bids on this project
  await db.bid.updateMany({
    where: {
      projectId: project.id,
      id: { not: bidId },
    },
    data: { status: "REJECTED" },
  });

  // Move project to IN_PROGRESS
  await db.project.update({
    where: { id: project.id },
    data: { status: "IN_PROGRESS" },
  });

  return { message: "Bid approved and project assigned to engineer" };
}
