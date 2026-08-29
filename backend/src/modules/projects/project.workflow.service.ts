import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { getStoredUploadPath } from "../../config/upload";
import {
  netEngineerAmount,
  recordPaymentLedger,
} from "../../utils/paymentLedger";
import {
  ensureWallet,
  walletHoldReleaseDate,
} from "../../utils/wallet";
import { assertUserNotBanned } from "../messages/ban.service";
import {
  assertProjectTransition,
  isReviewableStatus,
  isSubmittableStatus,
} from "./project.status";
import { createNotification } from "../../utils/notifications";
import {
  RequestRevisionInput,
  SubmitWorkInput,
  UpdateProgressInput,
} from "./project.validation";

async function getEngineerProfile(engineerUserId: number) {
  const profile = await db.engineerProfile.findUnique({
    where: { userId: engineerUserId },
  });
  if (!profile) throw new ApiError(404, "Engineer profile not found");
  return profile;
}

async function assertAssignedEngineer(
  projectId: number,
  engineerProfileId: number,
) {
  const bid = await db.bid.findFirst({
    where: { projectId, engineerId: engineerProfileId, status: "ACCEPTED" },
  });
  if (!bid) {
    throw new ApiError(403, "You are not the assigned engineer for this project");
  }
  return bid;
}

export async function updateProjectProgress(
  engineerUserId: number,
  projectId: number,
  data: UpdateProgressInput,
) {
  await assertUserNotBanned(engineerUserId, "update project progress");
  const profile = await getEngineerProfile(engineerUserId);
  await assertAssignedEngineer(projectId, profile.id);

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.status !== "IN_PROGRESS" && project.status !== "REVISION_REQUESTED") {
    throw new ApiError(
      400,
      "Progress can only be updated while the project is in progress",
    );
  }

  return db.project.update({
    where: { id: projectId },
    data: {
      progressNote: data.note,
      progressUpdatedAt: new Date(),
    },
  });
}

export async function submitProjectWork(
  engineerUserId: number,
  projectId: number,
  data: SubmitWorkInput,
  files: Express.Multer.File[] = [],
) {
  await assertUserNotBanned(engineerUserId, "submit project work");
  const profile = await getEngineerProfile(engineerUserId);
  await assertAssignedEngineer(projectId, profile.id);

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { payment: true },
  });
  if (!project) throw new ApiError(404, "Project not found");

  if (!isSubmittableStatus(project.status)) {
    throw new ApiError(
      400,
      `Cannot submit work while project is ${project.status.toLowerCase().replace(/_/g, " ")}`,
    );
  }

  if (!project.payment || project.payment.status !== "FUNDED") {
    await createNotification(
      project.clientId,
      "FUND_REMINDER",
      "Payment required",
      `The engineer submitted work for "${project.title}" but escrow is not funded yet.`,
      `/escrow?project=${projectId}`,
    );
    throw new ApiError(
      400,
      "Payment has not been made yet. Ask the client to pay before submitting work.",
    );
  }

  const hasDeliverables =
    files.length > 0 || (data.links?.length ?? 0) > 0 || !!data.notes?.trim();
  if (!hasDeliverables) {
    throw new ApiError(
      400,
      "Add deliverable files, links, or submission notes before submitting work",
    );
  }

  assertProjectTransition(project.status, "SUBMITTED_FOR_REVIEW");

  const result = await db.$transaction(async (tx) => {
    const updatedProject = await tx.project.update({
      where: { id: projectId },
      data: { status: "SUBMITTED_FOR_REVIEW" },
    });

    const submission = await tx.projectSubmission.create({
      data: {
        projectId,
        engineerId: profile.id,
        notes: data.notes?.trim() || null,
      },
    });

    const deliverableRows: Array<{
      submissionId: number;
      type: "FILE" | "LINK";
      url: string;
      name: string | null;
      mimeType: string | null;
    }> = [];

    for (const file of files) {
      const url = getStoredUploadPath(
        file as Express.Multer.File,
        "projects",
      ) ?? file.filename;
      deliverableRows.push({
        submissionId: submission.id,
        type: "FILE",
        url,
        name: file.originalname,
        mimeType: file.mimetype,
      });
    }

    for (const link of data.links ?? []) {
      deliverableRows.push({
        submissionId: submission.id,
        type: "LINK",
        url: link.url,
        name: link.name ?? link.url,
        mimeType: null,
      });
    }

    if (deliverableRows.length > 0) {
      await tx.projectDeliverable.createMany({ data: deliverableRows });
    }

    return { project: updatedProject, submissionId: submission.id };
  });

  await createNotification(
    project.clientId,
    "WORK_SUBMITTED",
    "Work ready for review",
    `The engineer submitted deliverables for "${project.title}". Review and approve or request revisions.`,
    `/messages?project=${projectId}`,
  );

  return result;
}

export async function requestProjectRevision(
  clientId: number,
  projectId: number,
  data: RequestRevisionInput,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      payment: true,
      submissions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) {
    throw new ApiError(403, "Only the project owner can request revisions");
  }
  if (!isReviewableStatus(project.status)) {
    throw new ApiError(400, "No submitted work is awaiting your review");
  }
  if (!project.payment || project.payment.status !== "FUNDED") {
    throw new ApiError(400, "Escrow must be funded before requesting revisions");
  }

  assertProjectTransition(project.status, "REVISION_REQUESTED");

  const latestSubmission = project.submissions[0];

  const updated = await db.$transaction(async (tx) => {
    if (latestSubmission) {
      await tx.projectSubmission.update({
        where: { id: latestSubmission.id },
        data: { revisionNote: data.note.trim() },
      });
    }
    return tx.project.update({
      where: { id: projectId },
      data: { status: "REVISION_REQUESTED" },
    });
  });

  const engineerProfile = await db.engineerProfile.findUnique({
    where: { id: project.payment.engineerId },
    select: { userId: true },
  });

  if (engineerProfile) {
    await createNotification(
      engineerProfile.userId,
      "REVISION_REQUESTED",
      "Revision requested",
      `The client requested changes on "${project.title}": ${data.note.trim()}`,
      `/messages?project=${projectId}`,
    );
  }

  return updated;
}

export async function approveProjectWork(clientId: number, projectId: number) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { payment: true },
  });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) {
    throw new ApiError(403, "Only the project owner can approve work");
  }
  if (!isReviewableStatus(project.status)) {
    throw new ApiError(400, "No submitted work is awaiting your approval");
  }
  if (!project.payment) throw new ApiError(400, "No payment record for this project");
  if (project.payment.status !== "FUNDED") {
    throw new ApiError(400, "Escrow must be funded before approving work");
  }

  assertProjectTransition(project.status, "COMPLETED");

  const netAmount = netEngineerAmount(
    project.payment.amountUsd,
    project.payment.commission,
  );

  const engineerProfile = await db.engineerProfile.findUnique({
    where: { id: project.payment.engineerId },
    select: { userId: true },
  });
  if (!engineerProfile) {
    throw new ApiError(404, "Engineer profile not found for this payment");
  }

  const projectTitle = project.title;

  const updated = await db.$transaction(async (tx) => {
    const released = await tx.payment.update({
      where: { id: project.payment!.id },
      data: { status: "RELEASED" },
    });
    await tx.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED" },
    });
    await recordPaymentLedger(tx, project.payment!.id, [
      {
        type: "RELEASED",
        amount: netAmount,
        note: "Client approved work — engineer earnings released",
      },
      {
        type: "PLATFORM_COMMISSION",
        amount: project.payment!.commission,
        note: "Platform commission retained",
      },
    ]);

    // Credit engineer wallet with pending balance (14-day hold)
    const wallet = await ensureWallet(tx, engineerProfile.userId);
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { pendingBalance: { increment: netAmount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: netAmount,
        type: "RELEASED",
        status: "PENDING",
        description: `Payment for "${projectTitle}". Available after 14-day hold.`,
        availableAt: walletHoldReleaseDate(),
        relatedPaymentId: project.payment!.id,
      },
    });

    return released;
  });

  await createNotification(
    clientId,
    "PROJECT_COMPLETED",
    "Project completed",
    `You approved work on "${projectTitle}". Payment has been released.`,
    `/projects?id=${projectId}`,
  );

  await createNotification(
    engineerProfile.userId,
    "WORK_APPROVED",
    "Work approved",
    `The client approved your work on "${projectTitle}". Earnings are now pending in your wallet.`,
    `/balance`,
  );
  await createNotification(
    engineerProfile.userId,
    "FUNDS_RELEASED",
    "Payment queued to wallet",
    `Payment for "${projectTitle}" will become available after the 14-day holding period.`,
    `/balance`,
  );

  return updated;
}

export async function getProjectSubmissions(projectId: number, userId: number) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      payment: true,
      bids: {
        where: { status: "ACCEPTED" },
        take: 1,
        include: { engineer: { include: { user: { select: { id: true } } } } },
      },
    },
  });
  if (!project) throw new ApiError(404, "Project not found");

  const isClient = project.clientId === userId;
  const isEngineer = project.bids[0]?.engineer.user.id === userId;
  if (!isClient && !isEngineer) {
    throw new ApiError(403, "You do not have access to these submissions");
  }

  return db.projectSubmission.findMany({
    where: { projectId },
    include: { deliverables: true },
    orderBy: { createdAt: "desc" },
  });
}

/** @deprecated Use submitProjectWork — kept for backward-compatible route */
export async function markProjectFinished(
  engineerUserId: number,
  projectId: number,
) {
  return submitProjectWork(
    engineerUserId,
    projectId,
    { notes: "Work submitted for review." },
    [],
  );
}
