import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { createNotification } from "../../utils/notifications";
import { assertUserNotBanned } from "../messages/ban.service";

export async function inviteEngineerToProject(
  clientId: number,
  projectId: number,
  engineerUserId: number,
) {
  await assertUserNotBanned(clientId, "invite engineers");

  const project = await db.project.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) {
    throw new ApiError(403, "You can only invite engineers to your own projects");
  }
  if (project.status === "AWAITING_PAYMENT") {
    throw new ApiError(400, "An engineer has already accepted this project. Complete payment to begin work.");
  }
  if (project.status !== "OPEN") {
    throw new ApiError(400, "You can only invite engineers to open projects");
  }

  const engineer = await db.user.findUnique({
    where: { id: engineerUserId },
  });
  if (!engineer || engineer.role !== "ENGINEER") {
    throw new ApiError(400, "User is not an engineer");
  }
  if (engineerUserId === clientId) {
    throw new ApiError(400, "You cannot invite yourself");
  }

  // Limit check
  const pendingCount = await db.projectInvitation.count({
    where: { projectId, status: "PENDING" },
  });
  if (pendingCount >= 10) {
    throw new ApiError(400, "This project has reached the maximum of 10 pending invitations.");
  }

  // Duplicate check
  const existing = await db.projectInvitation.findFirst({
    where: {
      projectId,
      engineerId: engineerUserId,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });
  if (existing) {
    throw new ApiError(409, "You have already invited this engineer to this project.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  const invitation = await db.$transaction(async (tx) => {
    const inv = await tx.projectInvitation.create({
      data: {
        projectId,
        engineerId: engineerUserId,
        clientId,
        status: "PENDING",
        expiresAt,
      },
      include: {
        client: { select: { name: true } },
        project: { select: { title: true } },
      },
    });

    await tx.invitationEvent.create({
      data: {
        invitationId: inv.id,
        event: "SENT",
        actorId: clientId,
      },
    });

    return inv;
  });

  await createNotification(
    engineerUserId,
    "PROJECT_INVITATION",
    "New Project Invitation",
    `${invitation.client.name} invited you to work on "${invitation.project.title}".`,
    `/invitations`,
    { email: { senderName: invitation.client.name, projectTitle: invitation.project.title } }
  );

  return invitation;
}

export async function markInvitationViewed(
  engineerUserId: number,
  invitationId: number,
  metadata?: any
) {
  const inv = await db.projectInvitation.findUnique({
    where: { id: invitationId },
  });
  if (!inv) return;
  if (inv.engineerId !== engineerUserId) return;
  
  if (inv.status === "PENDING" && inv.expiresAt < new Date()) {
    await db.projectInvitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" },
    });
    await db.invitationEvent.create({
      data: { invitationId, event: "EXPIRED" }
    });
    return;
  }

  const alreadyViewed = await db.invitationEvent.findFirst({
    where: { invitationId, event: "VIEWED" },
  });

  if (!alreadyViewed) {
    await db.invitationEvent.create({
      data: {
        invitationId,
        event: "VIEWED",
        actorId: engineerUserId,
        metadata: metadata || {},
      },
    });
  }
}

export async function respondToInvitation(
  engineerUserId: number,
  invitationId: number,
  action: "ACCEPT" | "DECLINE",
  metadata?: any
) {
  await assertUserNotBanned(engineerUserId, "respond to invitations");

  const invitation = await db.projectInvitation.findUnique({
    where: { id: invitationId },
    include: {
      project: true,
      engineer: { select: { name: true } },
    },
  });

  if (!invitation) throw new ApiError(404, "Invitation not found");
  if (invitation.engineerId !== engineerUserId) {
    throw new ApiError(403, "Not your invitation");
  }

  if (invitation.status !== "PENDING") {
    throw new ApiError(400, `Invitation is already ${invitation.status}`);
  }

  if (invitation.expiresAt < new Date()) {
    await db.projectInvitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" },
    });
    await db.invitationEvent.create({
      data: { invitationId, event: "EXPIRED" }
    });
    throw new ApiError(400, "This invitation has expired");
  }

  if (action === "DECLINE") {
    const updated = await db.$transaction(async (tx) => {
      const inv = await tx.projectInvitation.update({
        where: { id: invitationId },
        data: { status: "DECLINED" },
      });
      await tx.invitationEvent.create({
        data: { invitationId, event: "DECLINED", actorId: engineerUserId, metadata },
      });
      return inv;
    });

    await createNotification(
      invitation.clientId,
      "INVITATION_DECLINED",
      "Invitation Declined",
      `${invitation.engineer.name} declined your invitation for "${invitation.project.title}".`,
      `/projects?id=${invitation.projectId}`
    );
    return updated;
  }

  if (action === "ACCEPT") {
    const updated = await db.$transaction(async (tx) => {
      // Concurrency check
      const acceptedExists = await tx.projectInvitation.findFirst({
        where: { projectId: invitation.projectId, status: "ACCEPTED" },
      });
      if (acceptedExists) {
        throw new ApiError(409, "Another engineer has already accepted an invitation for this project.");
      }

      const inv = await tx.projectInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      });

      await tx.invitationEvent.create({
        data: { invitationId, event: "ACCEPTED", actorId: engineerUserId, metadata },
      });

      // Update project
      await tx.project.update({
        where: { id: invitation.projectId },
        data: { status: "AWAITING_PAYMENT" },
      });

      // Cancel other pending
      await tx.projectInvitation.updateMany({
        where: { projectId: invitation.projectId, status: "PENDING", id: { not: invitationId } },
        data: { status: "CANCELLED" },
      });
      // Log cancelled events
      const cancelledInvs = await tx.projectInvitation.findMany({
        where: { projectId: invitation.projectId, status: "CANCELLED", updatedAt: { gte: new Date(Date.now() - 5000) } }
      });
      for (const c of cancelledInvs) {
        // Only log if it doesn't already have one
        const hasLog = await tx.invitationEvent.findFirst({ where: { invitationId: c.id, event: "CANCELLED" } });
        if (!hasLog) {
          await tx.invitationEvent.create({
            data: { invitationId: c.id, event: "CANCELLED", metadata: { reason: "Another engineer accepted" } }
          });
        }
      }

      // Create conversation
      await tx.conversation.upsert({
        where: { projectId: invitation.projectId },
        create: {
          projectId: invitation.projectId,
          clientId: invitation.clientId,
          engineerId: engineerUserId,
          invitationId: invitation.id,
        },
        update: {
          invitationId: invitation.id,
        },
      });

      return inv;
    });

    await createNotification(
      invitation.clientId,
      "INVITATION_ACCEPTED",
      "Invitation Accepted",
      `${invitation.engineer.name} accepted your invitation for "${invitation.project.title}". Please proceed to payment.`,
      `/projects?id=${invitation.projectId}`
    );

    return updated;
  }
}

export async function cancelInvitation(
  clientId: number,
  invitationId: number,
  metadata?: any
) {
  const invitation = await db.projectInvitation.findUnique({
    where: { id: invitationId },
    include: { project: true },
  });

  if (!invitation) throw new ApiError(404, "Invitation not found");
  if (invitation.clientId !== clientId) throw new ApiError(403, "Not your invitation");
  if (invitation.status !== "PENDING") throw new ApiError(400, "You can only cancel pending invitations");

  const updated = await db.$transaction(async (tx) => {
    const inv = await tx.projectInvitation.update({
      where: { id: invitationId },
      data: { status: "CANCELLED" },
    });
    await tx.invitationEvent.create({
      data: { invitationId, event: "CANCELLED", actorId: clientId, metadata },
    });
    return inv;
  });

  await createNotification(
    invitation.engineerId,
    "INVITATION_CANCELLED",
    "Invitation Cancelled",
    `The invitation for "${invitation.project.title}" has been cancelled.`,
    `/invitations`
  );

  return updated;
}

export async function getMyInvitations(engineerUserId: number) {
  const invitations = await db.projectInvitation.findMany({
    where: { engineerId: engineerUserId },
    include: {
      project: { select: { id: true, title: true, budget: true, serviceType: true, status: true } },
      client: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Runtime expiration check
  const now = new Date();
  for (const inv of invitations) {
    if (inv.status === "PENDING" && inv.expiresAt < now) {
      await db.projectInvitation.update({
        where: { id: inv.id },
        data: { status: "EXPIRED" },
      });
      await db.invitationEvent.create({
        data: { invitationId: inv.id, event: "EXPIRED" }
      });
      inv.status = "EXPIRED";
    }
  }

  return invitations;
}

export async function getProjectInvitations(clientId: number, projectId: number) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) throw new ApiError(403, "Not your project");

  const invitations = await db.projectInvitation.findMany({
    where: { projectId },
    include: {
      engineer: {
        include: { profile: { select: { specialty: true, nationality: true } } }
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  for (const inv of invitations) {
    if (inv.status === "PENDING" && inv.expiresAt < now) {
      await db.projectInvitation.update({
        where: { id: inv.id },
        data: { status: "EXPIRED" },
      });
      await db.invitationEvent.create({
        data: { invitationId: inv.id, event: "EXPIRED" }
      });
      inv.status = "EXPIRED";
    }
  }

  return invitations;
}

export async function expireStaleInvitations() {
  const now = new Date();
  const stale = await db.projectInvitation.findMany({
    where: { status: "PENDING", expiresAt: { lt: now } },
  });

  for (const inv of stale) {
    await db.projectInvitation.update({
      where: { id: inv.id },
      data: { status: "EXPIRED" },
    });
    await db.invitationEvent.create({
      data: { invitationId: inv.id, event: "EXPIRED" },
    });
  }

  // Payment timeout for AWAITING_PAYMENT projects (7 days old ACCEPTED invitations without payment)
  const timeoutLimit = new Date();
  timeoutLimit.setDate(timeoutLimit.getDate() - 7);

  const awaitingPaymentInvs = await db.projectInvitation.findMany({
    where: {
      status: "ACCEPTED",
      project: { status: "AWAITING_PAYMENT" },
      updatedAt: { lt: timeoutLimit }
    },
    include: { project: true }
  });

  for (const inv of awaitingPaymentInvs) {
    // Has a payment been made? (Just in case the status is stale)
    const payment = await db.payment.findFirst({ where: { invitationId: inv.id } });
    if (!payment) {
      await db.$transaction(async (tx) => {
        await tx.projectInvitation.update({
          where: { id: inv.id },
          data: { status: "CANCELLED" },
        });
        await tx.invitationEvent.create({
          data: { invitationId: inv.id, event: "CANCELLED", metadata: { reason: "Payment timeout" } },
        });
        await tx.project.update({
          where: { id: inv.projectId },
          data: { status: "OPEN" },
        });
      });

      await createNotification(
        inv.clientId,
        "INVITATION_CANCELLED",
        "Invitation Cancelled (Payment Timeout)",
        `The accepted invitation for "${inv.project.title}" was cancelled because payment was not completed within 7 days. The project is now open again.`,
        `/projects?id=${inv.projectId}`
      );
      await createNotification(
        inv.engineerId,
        "INVITATION_CANCELLED",
        "Invitation Cancelled",
        `The accepted invitation for "${inv.project.title}" was cancelled because the client did not complete payment in time.`,
        `/invitations`
      );
    }
  }
}
