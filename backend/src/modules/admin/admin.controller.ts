import { NextFunction, Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  banUserManually,
  getAdminStats,
  getAllBans,
  getAllConversations,
  getConversationMessages,
  getPendingVerifications,
  lookupUser,
  unbanUser,
  updateEngineerVerification,
  impersonateUser,
  updateEngineerProfileByAdmin,
  getAllProjects,
  updateProjectByAdmin,
  getAllReviews,
  deleteReviewByAdmin,
  getPlatformSettings,
  updatePlatformSettings,
  getAllPayments,
  overridePaymentStatus,
  getAnalyticsData,
  getEscrowOverview,
  getActiveDisputes,
  getSystemHealth,
  getSystemLogs,
  getSupportTickets,
  updateSupportTicket,
  getWithdrawalRequests,
  updateWithdrawalRequestStatus,
  getWithdrawalAuditTrail,
  adminCancelWithdrawal,
  adminResolveWithdrawal,
  adminTriggerPayoutReconciliation,
  getPayoutStats,
  revealWithdrawalBankDetails,
  approveInternationalWithdrawal,
  rejectInternationalWithdrawal,
  initiateTransfer,
  recordCompletion,
} from "./admin.service";
import {
  banUserSchema,
  updateVerificationSchema,
  updateProfileSchema,
  updateProjectSchema,
  updateSettingsSchema,
  updatePaymentOverrideSchema,
  updateSupportTicketSchema,
  updateWithdrawalRequestSchema,
  resolveWithdrawalSchema,
  cancelWithdrawalSchema,
  withdrawalListQuerySchema,
  approveWithdrawalSchema,
  rejectWithdrawalSchema,
  initiateTransferSchema,
  recordCompletionSchema,
} from "./admin.validation";

export async function getAdminStatsController(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await getAdminStats();
    res.status(200).json(ApiResponse(200, "Admin stats fetched", stats));
  } catch (error) {
    next(error);
  }
}

export async function getPendingVerificationsController(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const list = await getPendingVerifications();
    res
      .status(200)
      .json(ApiResponse(200, "Pending verifications fetched", list));
  } catch (error) {
    next(error);
  }
}

export async function updateVerificationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = updateVerificationSchema.parse(req.body);
    const user = await updateEngineerVerification(
      Number(req.params.profileId),
      input,
    );
    res.status(200).json(ApiResponse(200, "Verification updated", user));
  } catch (error) {
    next(error);
  }
}

export async function getAllBansController(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const bans = await getAllBans();
    res.status(200).json(ApiResponse(200, "Bans fetched", bans));
  } catch (error) {
    next(error);
  }
}

export async function banUserController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = banUserSchema.parse(req.body);
    const result = await banUserManually(
      req.user!.userId,
      Number(req.params.userId),
      input.note,
    );
    res.status(201).json(ApiResponse(201, "User banned for 30 days", result));
  } catch (error) {
    next(error);
  }
}

export async function unbanUserController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await unbanUser(req.user!.userId, Number(req.params.userId));
    res.status(200).json(ApiResponse(200, "User unbanned", result));
  } catch (error) {
    next(error);
  }
}

export async function lookupUserController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const identifier = String(req.query.identifier ?? "");
    if (!identifier.trim()) {
      res.status(400).json(ApiResponse(400, "identifier query is required"));
      return;
    }
    const user = await lookupUser(identifier);
    res.status(200).json(ApiResponse(200, "User found", user));
  } catch (error) {
    next(error);
  }
}

export async function getAllConversationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await getAllConversations(page, limit);
    res.status(200).json(ApiResponse(200, "Conversations fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function getConversationMessagesController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const conversationId = Number(req.params.conversationId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const data = await getConversationMessages(conversationId, page, limit);
    res.status(200).json(ApiResponse(200, "Messages fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function impersonateUserController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const targetUserId = Number(req.params.userId);
    const { user, token } = await impersonateUser(targetUserId);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json(ApiResponse(200, "Impersonation successful", user));
  } catch (error) {
    next(error);
  }
}

export async function updateProfileByAdminController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = updateProfileSchema.parse(req.body);
    const targetUserId = Number(req.params.userId);
    const user = await updateEngineerProfileByAdmin(targetUserId, input);
    res.status(200).json(ApiResponse(200, "Profile updated successfully", user));
  } catch (error) {
    next(error);
  }
}

export async function getAllProjectsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await getAllProjects(page, limit);
    res.status(200).json(ApiResponse(200, "Projects fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function updateProjectStatusController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = updateProjectSchema.parse(req.body);
    const projectId = Number(req.params.projectId);
    const project = await updateProjectByAdmin(projectId, input);
    res.status(200).json(ApiResponse(200, "Project updated", project));
  } catch (error) {
    next(error);
  }
}

export async function getAllReviewsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await getAllReviews(page, limit);
    res.status(200).json(ApiResponse(200, "Reviews fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function deleteReviewController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const reviewId = Number(req.params.reviewId);
    await deleteReviewByAdmin(reviewId);
    res.status(200).json(ApiResponse(200, "Review deleted"));
  } catch (error) {
    next(error);
  }
}

export async function getSettingsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getPlatformSettings();
    res.status(200).json(ApiResponse(200, "Settings fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function updateSettingsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = updateSettingsSchema.parse(req.body);
    const data = await updatePlatformSettings(input);
    res.status(200).json(ApiResponse(200, "Settings updated", data));
  } catch (error) {
    next(error);
  }
}

export async function getAllPaymentsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await getAllPayments(page, limit);
    res.status(200).json(ApiResponse(200, "Payments fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function overridePaymentController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = updatePaymentOverrideSchema.parse(req.body);
    const paymentId = Number(req.params.paymentId);
    const data = await overridePaymentStatus(paymentId, input.status);
    res.status(200).json(ApiResponse(200, "Payment overridden", data));
  } catch (error) {
    next(error);
  }
}

export async function getAnalyticsController(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getAnalyticsData();
    res.status(200).json(ApiResponse(200, "Analytics data fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function getSystemLogsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const limit = Number(req.query.limit) || 50;
    const logs = await getSystemLogs(limit);
    res.status(200).json(ApiResponse(200, "System logs fetched", logs));
  } catch (error) {
    next(error);
  }
}

export async function getEscrowOverviewController(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getEscrowOverview();
    res.status(200).json(ApiResponse(200, "Escrow overview fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function getActiveDisputesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const limit = Number(req.query.limit) || 10;
    const data = await getActiveDisputes(limit);
    res.status(200).json(ApiResponse(200, "Active disputes fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function getSystemHealthController(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getSystemHealth();
    res.status(200).json(ApiResponse(200, "System health fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function getSupportTicketsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await getSupportTickets(page, limit);
    res.status(200).json(ApiResponse(200, "Support tickets fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function updateSupportTicketController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = updateSupportTicketSchema.parse(req.body);
    const ticketId = Number(req.params.ticketId);
    const data = await updateSupportTicket(
      ticketId,
      req.user!.userId,
      input,
    );
    res.status(200).json(ApiResponse(200, "Support ticket updated", data));
  } catch (error) {
    next(error);
  }
}

export async function getWithdrawalRequestsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = withdrawalListQuerySchema.parse(req.query);
    const data = await getWithdrawalRequests(query.page, query.limit, {
      status: query.status,
      payoutType: query.payoutType,
    });
    res.status(200).json(ApiResponse(200, "Withdrawal requests fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function updateWithdrawalRequestStatusController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = updateWithdrawalRequestSchema.parse(req.body);
    const withdrawalId = Number(req.params.withdrawalId);
    const data = await updateWithdrawalRequestStatus(
      withdrawalId,
      req.user!.userId,
      input,
    );
    res.status(200).json(ApiResponse(200, "Withdrawal request updated", data));
  } catch (error) {
    next(error);
  }
}

export async function getWithdrawalAuditTrailController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const withdrawalId = Number(req.params.withdrawalId);
    const data = await getWithdrawalAuditTrail(withdrawalId);
    res.status(200).json(ApiResponse(200, "Payout audit trail fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function adminCancelWithdrawalController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = cancelWithdrawalSchema.parse(req.body ?? {});
    const withdrawalId = Number(req.params.withdrawalId);
    const data = await adminCancelWithdrawal(
      withdrawalId,
      req.user!.userId,
      input.reason,
    );
    res.status(200).json(ApiResponse(200, "Withdrawal cancelled", data));
  } catch (error) {
    next(error);
  }
}

export async function adminResolveWithdrawalController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = resolveWithdrawalSchema.parse(req.body);
    const withdrawalId = Number(req.params.withdrawalId);
    const data = await adminResolveWithdrawal(
      withdrawalId,
      req.user!.userId,
      input.action,
      input.reason,
    );
    res.status(200).json(ApiResponse(200, "Withdrawal resolved", data));
  } catch (error) {
    next(error);
  }
}

export async function adminReconcilePayoutsController(
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await adminTriggerPayoutReconciliation();
    res.status(200).json(ApiResponse(200, "Payout reconciliation triggered", data));
  } catch (error) {
    next(error);
  }
}

export async function getPayoutStatsController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getPayoutStats();
    res.status(200).json(ApiResponse(200, "Payout stats fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function adminRevealBankDetailsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const withdrawalId = Number(req.params.withdrawalId);
    const data = await revealWithdrawalBankDetails(
      withdrawalId,
      req.user!.userId,
      req.ip,
      req.headers["user-agent"],
    );
    res.status(200).json(ApiResponse(200, "Bank details revealed", data));
  } catch (error) {
    next(error);
  }
}

export async function adminApproveWithdrawalController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = approveWithdrawalSchema.parse(req.body ?? {});
    const withdrawalId = Number(req.params.withdrawalId);
    const data = await approveInternationalWithdrawal(withdrawalId, req.user!.userId, input.notes);
    res.status(200).json(ApiResponse(200, "Withdrawal approved", data));
  } catch (error) {
    next(error);
  }
}

export async function adminRejectWithdrawalController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = rejectWithdrawalSchema.parse(req.body);
    const withdrawalId = Number(req.params.withdrawalId);
    const data = await rejectInternationalWithdrawal(withdrawalId, req.user!.userId, input.reason, input.notes);
    res.status(200).json(ApiResponse(200, "Withdrawal rejected", data));
  } catch (error) {
    next(error);
  }
}

export async function adminInitiateTransferController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = initiateTransferSchema.parse(req.body);
    const withdrawalId = Number(req.params.withdrawalId);
    const data = await initiateTransfer(withdrawalId, req.user!.userId, input.externalReference, input.notes);
    res.status(200).json(ApiResponse(200, "Transfer initiated", data));
  } catch (error) {
    next(error);
  }
}

export async function adminRecordCompletionController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = recordCompletionSchema.parse(req.body ?? {});
    const withdrawalId = Number(req.params.withdrawalId);
    const data = await recordCompletion(
      withdrawalId, 
      req.user!.userId, 
      input.notes,
      input.transferMethod,
      input.transferReference
    );
    res.status(200).json(ApiResponse(200, "Transfer marked as completed", data));
  } catch (error) {
    next(error);
  }
}

