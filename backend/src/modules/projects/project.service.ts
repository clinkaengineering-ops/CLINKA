import { CreateProjectInput, UpdateProjectInput } from "./project.validation";
import db from "../../config/db";
import ApiError from "../../utils/ApiError";


import { createNotification } from "../../utils/notifications";
import { assertUserNotBanned } from "../messages/ban.service";

export async function markProjectFinished(engineerUserId: number, projectId: number) {
  await assertUserNotBanned(engineerUserId, "update project status");

  // Resolve engineer profile from user id
  const profile = await db.engineerProfile.findUnique({
    where: { userId: engineerUserId },
  });
  if (!profile) throw new ApiError(404, "Engineer profile not found");
 
  // Load project with payment + accepted bid
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      payment: true,
      bids: {
        where: { status: "ACCEPTED", engineerId: profile.id },
        take: 1,
      },
    },
  });
 
  if (!project) throw new ApiError(404, "Project not found");
 
  // Must be the assigned engineer
  if (project.bids.length === 0) {
    throw new ApiError(403, "You are not the assigned engineer for this project");
  }
 
  // Project must be active
  if (project.status !== "IN_PROGRESS") {
    throw new ApiError(
      400,
      `Project is already ${project.status.toLowerCase().replace("_", " ")}`,
    );
  }
 
  // Escrow must be funded before engineer can mark done
  if (!project.payment || project.payment.status !== "FUNDED") {
    throw new ApiError(
      400,
      "Escrow has not been funded yet. Ask the client to pay first.",
    );
  }
 
  // Update project status
  const updated = await db.project.update({
    where: { id: projectId },
    data: { status: "AWAITING_APPROVAL" },
  });
 
  // Notify the client
  await createNotification(
    project.clientId,
    "WORK_DELIVERED",
    "Work delivered",
    `The engineer has marked "${project.title}" as finished. Please review and confirm.`,
    `/messages?project=${projectId}`,
  );
 
  return updated;
}



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
    },
  });

  if (!project) throw new ApiError(404, "Project not found");
  return project;
}

export async function updateProject(
  clientId: number,
  projectId: number,
  data: UpdateProjectInput,
) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, "Project not found");

  if (project.clientId !== clientId) {
    throw new ApiError(403, "Not your project");
  }

  if (project.status !== "OPEN") {
    throw new ApiError(400, "Cannot edit a project that is no longer open");
  }

  const updated = await db.project.update({
    where: { id: projectId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.budget && { budget: data.budget }),
      ...(data.serviceType && { serviceType: data.serviceType }),
    },
  });
  return updated;
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
