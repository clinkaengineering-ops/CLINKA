import { NextFunction, Request, Response } from "express";
import { createProjectSchema, updateProjectSchema } from "./project.validation";
import {
  createProject,
  deleteProject,
  getMyProjects,
  getProjectById,
  getProjects,
  updateProject,
} from "./project.service";
import ApiResponse from "../../utils/ApiResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";

export async function createProjectController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedData = createProjectSchema.parse(req.body);
    const project = await createProject(req.user!.userId, validatedData);
    res
      .status(201)
      .json(ApiResponse(201, "Project created successfully", project));
  } catch (error) {
    next(error);
  }
}

export async function getProjectsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const projects = await getProjects();

    res
      .status(200)
      .json(ApiResponse(200, "Projects fetched successfully", projects));
  } catch (error) {
    next(error);
  }
}

export async function getProjectByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const project = await getProjectById(Number(req.params.id));
    res
      .status(200)
      .json(ApiResponse(200, "Project fetched successfully", project));
  } catch (error) {
    next(error);
  }
}

export async function getMyProjectsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projects = await getMyProjects(req.user!.userId);
    res
      .status(200)
      .json(ApiResponse(200, "My projects fetched successfully", projects));
  } catch (error) {
    next(error);
  }
}

export async function updateProjectController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedData = updateProjectSchema.parse(req.body);

    const updatedProject = await updateProject(
      req.user!.userId,
      Number(req.params.id),
      validatedData,
    );
    res
      .status(200)
      .json(ApiResponse(200, "Project updated successfully", updatedProject));
  } catch (error) {
    next(error);
  }
}


export async function deleteProjectController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await deleteProject(req.user!.userId, Number(req.params.id));
    res.status(200).json(ApiResponse(200, "Project deleted successfully"));
  } catch (error) {
    next(error);
  }
}

