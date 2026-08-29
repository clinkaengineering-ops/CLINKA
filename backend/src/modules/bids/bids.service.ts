import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { createNotification } from "../../utils/notifications";
import { CreateBidInput } from "./bids.validation";
import { assertUserNotBanned } from "../messages/ban.service";

export async function createBid(
  engineerId: number,
  projectId: number,
  data: CreateBidInput,
) {
  await assertUserNotBanned(engineerId, "place bids");

  const { price, duration, description } = data;

  // Check user is an engineer
  const user = await db.user.findUnique({ where: { id: engineerId } });
  if (!user || user.role === "ADMIN") {
    throw new ApiError(403, "Admins cannot place bids");
  }
  if (user.role !== "ENGINEER") {
    throw new ApiError(403, "Only engineers can place bids");
  }

  // Get engineer profile
  const profile = await db.engineerProfile.findUnique({
    where: { userId: engineerId },
  });
  if (!profile) throw new ApiError(404, "Engineer profile not found");
  if (profile.verificationStatus !== "APPROVED") {
    throw new ApiError(
      403,
      "Your engineer account must be verified before bidding",
    );
  }

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

  await createNotification(
    project.clientId,
    "NEW_BID",
    "New bid received",
    `${user.name} placed a bid on "${project.title}"`,
    `/projects?project=${projectId}`,
  );

  // Open a project thread so client and engineer can discuss before bid acceptance
  await db.conversation.upsert({
    where: { projectId },
    create: {
      projectId,
      clientId: project.clientId,
      engineerId,
    },
    update: {},
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

  await db.$transaction(async (tx) => {
    // Accept this bid
    await tx.bid.update({
      where: { id: bidId },
      data: { status: "ACCEPTED" },
    });

    // Reject all other bids on this project
    await tx.bid.updateMany({
      where: {
        projectId: project.id,
        id: { not: bidId },
      },
      data: { status: "REJECTED" },
    });

    // Move project to IN_PROGRESS
    await tx.project.update({
      where: { id: project.id },
      data: { status: "IN_PROGRESS" },
    });
  });

  // Create conversation between client and engineer for this project
const engineerUser = await db.user.findFirst({
  where: { profile: { id: bid.engineerId } },
  select: { id: true },
});

await db.conversation.upsert({
  where: { projectId: project.id },
  create: {
    projectId: project.id,
    clientId: project.clientId,
    engineerId: engineerUser!.id,
  },
  update: {},
});

  if (engineerUser) {
    await createNotification(
      engineerUser.id,
      "BID_ACCEPTED",
      "Bid accepted",
      `Your bid on "${project.title}" was accepted. The client will pay to start — you'll get a message when payment is received.`,
      `/messages?project=${project.id}`,
    );
  }

  return { message: "Bid approved and project assigned to engineer" };
}

export async function listMyBids(engineerUserId: number) {
  await assertUserNotBanned(engineerUserId, "view your bids");

  const profile = await db.engineerProfile.findUnique({
    where: { userId: engineerUserId },
  });
  if (!profile) throw new ApiError(404, "Engineer profile not found");

  return db.bid.findMany({
    where: { engineerId: profile.id },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          status: true,
          serviceType: true,
          budget: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
