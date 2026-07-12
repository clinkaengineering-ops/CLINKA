import { NextFunction, Request, Response } from "express";
import {
  createProjectSchema,
  requestRevisionSchema,
  submitWorkSchema,
  updateProgressSchema,
  updateProjectSchema,
} from "./project.validation";
import {
  createProject,
  deleteProject,
  getAssignedProjects,
  getMyProjects,
  getProjectById,
  getProjects,
  markProjectFinished,
  updateProject,
  getMyOpenProjects,
} from "./project.service";
import {
  approveProjectWork,
  getProjectSubmissions,
  requestProjectRevision,
  submitProjectWork,
  updateProjectProgress,
} from "./project.workflow.service";
import ApiResponse from "../../utils/ApiResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { assertUserNotBanned } from "../messages/ban.service";

export async function markProjectFinishedController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projectId = Number(req.params.id);
    const project = await markProjectFinished(req.user!.userId, projectId);
    res
      .status(200)
      .json(ApiResponse(200, "Project marked as finished", project));
  } catch (error) {
    next(error);
  }
}

export async function submitProjectWorkController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projectId = Number(req.params.id);
    let links: { url: string; name?: string }[] | undefined;
    if (typeof req.body.links === "string" && req.body.links.trim()) {
      links = JSON.parse(req.body.links);
    } else if (Array.isArray(req.body.links)) {
      links = req.body.links;
    }
    const validated = submitWorkSchema.parse({
      notes: req.body.notes,
      links,
    });
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const result = await submitProjectWork(
      req.user!.userId,
      projectId,
      validated,
      files,
    );
    res
      .status(200)
      .json(ApiResponse(200, "Work submitted for review", result));
  } catch (error) {
    next(error);
  }
}

export async function requestProjectRevisionController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const validated = requestRevisionSchema.parse(req.body);
    const project = await requestProjectRevision(
      req.user!.userId,
      Number(req.params.id),
      validated,
    );
    res
      .status(200)
      .json(ApiResponse(200, "Revision requested", project));
  } catch (error) {
    next(error);
  }
}

export async function approveProjectWorkController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const payment = await approveProjectWork(
      req.user!.userId,
      Number(req.params.id),
    );
    res
      .status(200)
      .json(ApiResponse(200, "Work approved and payment released", payment));
  } catch (error) {
    next(error);
  }
}

export async function updateProjectProgressController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const validated = updateProgressSchema.parse(req.body);
    const project = await updateProjectProgress(
      req.user!.userId,
      Number(req.params.id),
      validated,
    );
    res
      .status(200)
      .json(ApiResponse(200, "Progress updated", project));
  } catch (error) {
    next(error);
  }
}

export async function getProjectSubmissionsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const submissions = await getProjectSubmissions(
      Number(req.params.id),
      req.user!.userId,
    );
    res
      .status(200)
      .json(ApiResponse(200, "Submissions fetched", submissions));
  } catch (error) {
    next(error);
  }
}

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
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.user?.role === "ENGINEER") {
      await assertUserNotBanned(req.user.userId, "browse projects");
    }

    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const serviceType =
      typeof req.query.serviceType === "string"
        ? req.query.serviceType
        : undefined;
    const projects = await getProjects({ q, serviceType });

    res
      .status(200)
      .json(ApiResponse(200, "Projects fetched successfully", projects));
  } catch (error) {
    next(error);
  }
}

export async function getProjectByIdController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.user?.role === "ENGINEER") {
      await assertUserNotBanned(req.user.userId, "view project details");
    }

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

export async function getMyOpenProjectsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projects = await getMyOpenProjects(req.user!.userId);
    res
      .status(200)
      .json(ApiResponse(200, "My open projects fetched successfully", projects));
  } catch (error) {
    next(error);
  }
}

export async function getAssignedProjectsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projects = await getAssignedProjects(req.user!.userId);
    res
      .status(200)
      .json(
        ApiResponse(200, "Assigned projects fetched successfully", projects),
      );
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
