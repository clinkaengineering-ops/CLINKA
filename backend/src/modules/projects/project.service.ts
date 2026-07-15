import { CreateProjectInput, UpdateProjectInput } from "./project.validation";
import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { assertProjectTransition } from "./project.status";
import {
  assertCanEditContent,
  assertCanToggleStatus,
  computePermissions,
  CONTENT_FIELDS,
} from "./project.editlock";

import { createNotification } from "../../utils/notifications";
import { assertUserNotBanned } from "../messages/ban.service";

export { markProjectFinished } from "./project.workflow.service";

export async function createProject(
  clientId: number,
  data: CreateProjectInput,
) {
  const client = await db.user.findUnique({ where: { id: clientId } });
  if (!client || client.role !== "CLIENT") {
    throw new ApiError(403, "Only clients can post projects");
  }

  const { title, description, budget, serviceType } = data;

  const project = await db.project.create({
    data: {
      clientId,
      title,
      description,
      budget,
      serviceType,
    },
  });

  return project;
}

export async function getProjects(query?: { q?: string; serviceType?: string }) {
  const q = query?.q?.trim();
  const projects = await db.project.findMany({
    where: {
      status: "OPEN",
      ...(query?.serviceType
        ? { serviceType: query.serviceType as "DESIGN" | "SUPERVISION" | "REVIEW" }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      client: {
        select: { id: true, name: true },
      },
      _count: {
        select: { bids: true },
      },
    },
  });
  return projects;
}

export async function getMyProjects(clientId: number) {
  const projects = await db.project.findMany({
    where: { clientId },
    include: {
      bids: {
        include: {
          engineer: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { bids: true },
      },
    },
  });
  return projects;
}

export async function getMyOpenProjects(clientId: number) {
  const projects = await db.project.findMany({
    where: { clientId, status: "OPEN" },
    include: {
      _count: {
        select: { bids: true, invitations: true },
      },
    },
    orderBy: { createdAt: "desc" }
  });
  return projects;
}

export async function getProjectById(projectId: number) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      client: {
        select: { id: true, name: true },
      },
      bids: {
        include: {
          engineer: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
      review: {
        include: {
          client: { select: { id: true, name: true } },
        },
      },
      payment: true,
      submissions: {
        include: { deliverables: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!project) throw new ApiError(404, "Project not found");

  // Compute permissions in response mapper — Prisma model stays pure
  const bidCount = project.bids?.length ?? 0;
  const hasAcceptedBid =
    project.bids?.some((b) => b.status === "ACCEPTED") ?? false;
  const permissions = computePermissions(
    bidCount,
    hasAcceptedBid,
    project.status,
  );

  return { ...project, permissions };
}

export async function updateProject(
  clientId: number,
  projectId: number,
  data: UpdateProjectInput,
) {
  return db.$transaction(async (tx) => {
    // 1. AUTHORIZE: Fetch project, verify ownership
    const project = await tx.project.findUnique({ where: { id: projectId } });
    if (!project) throw new ApiError(404, "Project not found");
    if (project.clientId !== clientId) {
      throw new ApiError(403, "Not your project");
    }

    // 2. FRESH STATE: Count bids + check for accepted bid (optimistic concurrency)
    const [bidCount, acceptedBid] = await Promise.all([
      tx.bid.count({ where: { projectId } }),
      tx.bid.findFirst({ where: { projectId, status: "ACCEPTED" } }),
    ]);

    // 3. COMPUTE PERMISSIONS from latest DB state
    const permissions = computePermissions(
      bidCount,
      !!acceptedBid,
      project.status,
    );

    // 4. VALIDATE: Check if request contains content fields
    //    Uses hasOwnProperty to safely handle budget:0 or title:""
    const hasContentFields = CONTENT_FIELDS.some((field) =>
      Object.prototype.hasOwnProperty.call(data, field),
    );
    if (hasContentFields) {
      // Fails loudly with 409 — never silently drops forbidden fields
      assertCanEditContent(permissions);
    }

    // 5. VALIDATE: Check if request contains status change
    if (data.status) {
      assertCanToggleStatus(permissions);
      assertProjectTransition(project.status, data.status);
    }

    // 6. APPLY: Build update payload based on permissions
    const updateData: Record<string, unknown> = {};

    if (permissions.canEditContent) {
      // FULL tier — apply content fields if present
      if (Object.prototype.hasOwnProperty.call(data, "title")) updateData.title = data.title;
      if (Object.prototype.hasOwnProperty.call(data, "description"))
        updateData.description = data.description;
      if (Object.prototype.hasOwnProperty.call(data, "budget")) updateData.budget = data.budget;
      if (Object.prototype.hasOwnProperty.call(data, "serviceType"))
        updateData.serviceType = data.serviceType;
    }

    if (data.status) {
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No valid changes provided");
    }

    return tx.project.update({
      where: { id: projectId },
      data: updateData,
    });
  });
}

export async function deleteProject(clientId: number, projectId: number) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, "Project not found");

  if (project.clientId !== clientId) {
    throw new ApiError(403, "Not your project");
  }

  if (project.status !== "OPEN") {
    throw new ApiError(400, "Cannot delete a project that is no longer open");
  }

  await db.project.delete({ where: { id: projectId } });
}

/** Projects where the engineer has an accepted bid (active contracts). */
export async function getAssignedProjects(engineerUserId: number) {
  await assertUserNotBanned(engineerUserId, "view assigned projects");

  const profile = await db.engineerProfile.findUnique({
    where: { userId: engineerUserId },
  });
  if (!profile) throw new ApiError(404, "Engineer profile not found");

  const acceptedBids = await db.bid.findMany({
    where: { engineerId: profile.id, status: "ACCEPTED" },
    include: {
      project: {
        include: {
          client: { select: { id: true, name: true } },
          payment: true,
          bids: {
            where: { status: "ACCEPTED" },
            take: 1,
            include: {
              engineer: {
                include: { user: { select: { id: true, name: true } } },
              },
            },
          },
          _count: { select: { bids: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return acceptedBids.map((b) => b.project);
}
