import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import ApiResponse from "../../utils/ApiResponse";
import {
  cancelInvitation,
  getMyInvitations,
  getProjectInvitations,
  inviteEngineerToProject,
  markInvitationViewed,
  respondToInvitation,
} from "./invitation.service";
import { inviteEngineerSchema, respondInvitationSchema } from "./invitation.validation";

export async function inviteEngineerController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const validated = inviteEngineerSchema.parse(req.body);
    const projectId = Number(req.params.id);
    const invitation = await inviteEngineerToProject(
      req.user!.userId,
      projectId,
      validated.engineerId,
    );
    res.status(201).json(ApiResponse(201, "Invitation sent", invitation));
  } catch (error) {
    next(error);
  }
}

export async function respondInvitationController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const validated = respondInvitationSchema.parse(req.body);
    const invitationId = Number(req.params.id);
    const metadata = {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      source: "web",
    };
    const updated = await respondToInvitation(
      req.user!.userId,
      invitationId,
      validated.action,
      metadata
    );
    res.status(200).json(ApiResponse(200, `Invitation ${validated.action.toLowerCase()}ed`, updated));
  } catch (error) {
    next(error);
  }
}

export async function cancelInvitationController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const invitationId = Number(req.params.invitationId);
    const metadata = {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      source: "web",
    };
    const updated = await cancelInvitation(req.user!.userId, invitationId, metadata);
    res.status(200).json(ApiResponse(200, "Invitation cancelled", updated));
  } catch (error) {
    next(error);
  }
}

export async function getMyInvitationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const invitations = await getMyInvitations(req.user!.userId);
    res.status(200).json(ApiResponse(200, "Invitations fetched", invitations));
  } catch (error) {
    next(error);
  }
}

export async function getProjectInvitationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projectId = Number(req.params.id);
    const invitations = await getProjectInvitations(req.user!.userId, projectId);
    res.status(200).json(ApiResponse(200, "Project invitations fetched", invitations));
  } catch (error) {
    next(error);
  }
}

export async function markInvitationViewedController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const invitationId = Number(req.params.id);
    await markInvitationViewed(req.user!.userId, invitationId, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.status(200).json(ApiResponse(200, "Invitation marked as viewed"));
  } catch (error) {
    next(error);
  }
}
