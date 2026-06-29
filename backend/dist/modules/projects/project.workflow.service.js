"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectProgress = updateProjectProgress;
exports.submitProjectWork = submitProjectWork;
exports.requestProjectRevision = requestProjectRevision;
exports.approveProjectWork = approveProjectWork;
exports.getProjectSubmissions = getProjectSubmissions;
exports.markProjectFinished = markProjectFinished;
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const notifications_1 = require("../../utils/notifications");
const paymentLedger_1 = require("../../utils/paymentLedger");
const wallet_1 = require("../../utils/wallet");
const ban_service_1 = require("../messages/ban.service");
const project_status_1 = require("./project.status");
async function getEngineerProfile(engineerUserId) {
    const profile = await db_1.default.engineerProfile.findUnique({
        where: { userId: engineerUserId },
    });
    if (!profile)
        throw new ApiError_1.default(404, "Engineer profile not found");
    return profile;
}
async function assertAssignedEngineer(projectId, engineerProfileId) {
    const bid = await db_1.default.bid.findFirst({
        where: { projectId, engineerId: engineerProfileId, status: "ACCEPTED" },
    });
    if (!bid) {
        throw new ApiError_1.default(403, "You are not the assigned engineer for this project");
    }
    return bid;
}
async function updateProjectProgress(engineerUserId, projectId, data) {
    await (0, ban_service_1.assertUserNotBanned)(engineerUserId, "update project progress");
    const profile = await getEngineerProfile(engineerUserId);
    await assertAssignedEngineer(projectId, profile.id);
    const project = await db_1.default.project.findUnique({ where: { id: projectId } });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    if (project.status !== "IN_PROGRESS" && project.status !== "REVISION_REQUESTED") {
        throw new ApiError_1.default(400, "Progress can only be updated while the project is in progress");
    }
    return db_1.default.project.update({
        where: { id: projectId },
        data: {
            progressNote: data.note,
            progressUpdatedAt: new Date(),
        },
    });
}
async function submitProjectWork(engineerUserId, projectId, data, files = []) {
    await (0, ban_service_1.assertUserNotBanned)(engineerUserId, "submit project work");
    const profile = await getEngineerProfile(engineerUserId);
    await assertAssignedEngineer(projectId, profile.id);
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: { payment: true },
    });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    if (!(0, project_status_1.isSubmittableStatus)(project.status)) {
        throw new ApiError_1.default(400, `Cannot submit work while project is ${project.status.toLowerCase().replace(/_/g, " ")}`);
    }
    if (!project.payment || project.payment.status !== "FUNDED") {
        await (0, notifications_1.createNotification)(project.clientId, "FUND_REMINDER", "Payment required", `The engineer submitted work for "${project.title}" but escrow is not funded yet.`, `/escrow?project=${projectId}`);
        throw new ApiError_1.default(400, "Payment has not been made yet. Ask the client to pay before submitting work.");
    }
    const hasDeliverables = files.length > 0 || (data.links?.length ?? 0) > 0 || !!data.notes?.trim();
    if (!hasDeliverables) {
        throw new ApiError_1.default(400, "Add deliverable files, links, or submission notes before submitting work");
    }
    (0, project_status_1.assertProjectTransition)(project.status, "SUBMITTED_FOR_REVIEW");
    const result = await db_1.default.$transaction(async (tx) => {
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
        const deliverableRows = [];
        for (const file of files) {
            const url = file.path ?? file.filename;
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
    await (0, notifications_1.createNotification)(project.clientId, "WORK_SUBMITTED", "Work ready for review", `The engineer submitted deliverables for "${project.title}". Review and approve or request revisions.`, `/messages?project=${projectId}`);
    return result;
}
async function requestProjectRevision(clientId, projectId, data) {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: {
            payment: true,
            submissions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
    });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    if (project.clientId !== clientId) {
        throw new ApiError_1.default(403, "Only the project owner can request revisions");
    }
    if (!(0, project_status_1.isReviewableStatus)(project.status)) {
        throw new ApiError_1.default(400, "No submitted work is awaiting your review");
    }
    if (!project.payment || project.payment.status !== "FUNDED") {
        throw new ApiError_1.default(400, "Escrow must be funded before requesting revisions");
    }
    (0, project_status_1.assertProjectTransition)(project.status, "REVISION_REQUESTED");
    const latestSubmission = project.submissions[0];
    const updated = await db_1.default.$transaction(async (tx) => {
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
    const engineerProfile = await db_1.default.engineerProfile.findUnique({
        where: { id: project.payment.engineerId },
        select: { userId: true },
    });
    if (engineerProfile) {
        await (0, notifications_1.createNotification)(engineerProfile.userId, "REVISION_REQUESTED", "Revision requested", `The client requested changes on "${project.title}": ${data.note.trim()}`, `/messages?project=${projectId}`);
    }
    return updated;
}
async function approveProjectWork(clientId, projectId) {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: { payment: true },
    });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    if (project.clientId !== clientId) {
        throw new ApiError_1.default(403, "Only the project owner can approve work");
    }
    if (!(0, project_status_1.isReviewableStatus)(project.status)) {
        throw new ApiError_1.default(400, "No submitted work is awaiting your approval");
    }
    if (!project.payment)
        throw new ApiError_1.default(400, "No payment record for this project");
    if (project.payment.status !== "FUNDED") {
        throw new ApiError_1.default(400, "Escrow must be funded before approving work");
    }
    (0, project_status_1.assertProjectTransition)(project.status, "COMPLETED");
    const netAmount = (0, paymentLedger_1.netEngineerAmount)(project.payment.amount, project.payment.commission);
    const engineerProfile = await db_1.default.engineerProfile.findUnique({
        where: { id: project.payment.engineerId },
        select: { userId: true },
    });
    if (!engineerProfile) {
        throw new ApiError_1.default(404, "Engineer profile not found for this payment");
    }
    const projectTitle = project.title;
    const updated = await db_1.default.$transaction(async (tx) => {
        const released = await tx.payment.update({
            where: { id: project.payment.id },
            data: { status: "RELEASED" },
        });
        await tx.project.update({
            where: { id: projectId },
            data: { status: "COMPLETED" },
        });
        await (0, paymentLedger_1.recordPaymentLedger)(tx, project.payment.id, [
            {
                type: "RELEASED",
                amount: netAmount,
                note: "Client approved work — engineer earnings released",
            },
            {
                type: "PLATFORM_COMMISSION",
                amount: project.payment.commission,
                note: "Platform commission retained",
            },
        ]);
        // Credit engineer wallet with pending balance (14-day hold)
        const wallet = await (0, wallet_1.ensureWallet)(tx, engineerProfile.userId);
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
                availableAt: (0, wallet_1.walletHoldReleaseDate)(),
                relatedPaymentId: project.payment.id,
            },
        });
        return released;
    });
    await (0, notifications_1.createNotification)(clientId, "PROJECT_COMPLETED", "Project completed", `You approved work on "${projectTitle}". Payment has been released.`, `/projects?id=${projectId}`);
    await (0, notifications_1.createNotification)(engineerProfile.userId, "WORK_APPROVED", "Work approved", `The client approved your work on "${projectTitle}". Earnings are now pending in your wallet.`, `/balance`);
    await (0, notifications_1.createNotification)(engineerProfile.userId, "FUNDS_RELEASED", "Payment queued to wallet", `Payment for "${projectTitle}" will become available after the 14-day holding period.`, `/balance`);
    return updated;
}
async function getProjectSubmissions(projectId, userId) {
    const project = await db_1.default.project.findUnique({
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
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    const isClient = project.clientId === userId;
    const isEngineer = project.bids[0]?.engineer.user.id === userId;
    if (!isClient && !isEngineer) {
        throw new ApiError_1.default(403, "You do not have access to these submissions");
    }
    return db_1.default.projectSubmission.findMany({
        where: { projectId },
        include: { deliverables: true },
        orderBy: { createdAt: "desc" },
    });
}
/** @deprecated Use submitProjectWork — kept for backward-compatible route */
async function markProjectFinished(engineerUserId, projectId) {
    return submitProjectWork(engineerUserId, projectId, { notes: "Work submitted for review." }, []);
}
