import { CreateProjectInput, UpdateProjectInput } from "./project.validation";
import db from "../../config/db";
import ApiError from "../../utils/ApiError";

export async function createProject(
  clientId: number,
  data: CreateProjectInput,
) {
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

export async function getProjects() {
  const projects = await db.project.findMany({
    where: { status: "OPEN" },
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
