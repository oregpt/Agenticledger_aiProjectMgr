import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as projectsService from './projects.service.js';
import { successResponse, paginatedResponse } from '../../utils/responses.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
} from './projects.schema.js';

export const listProjects: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const query = req.query as unknown as ListProjectsQuery;
    const result = await projectsService.getProjectsByOrganization(organizationId, query);
    paginatedResponse(res, result.projects, result.page, result.limit, result.total);
  } catch (error) {
    next(error);
  }
};

export const getProject = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const project = await projectsService.getProjectById(req.params.id, organizationId);
    successResponse(res, project);
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: Request<{}, {}, CreateProjectInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const project = await projectsService.createProject(organizationId, req.body);
    successResponse(res, project, 201);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request<{ id: string }, {}, UpdateProjectInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const project = await projectsService.updateProject(req.params.id, organizationId, req.body);
    successResponse(res, project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const result = await projectsService.deleteProject(req.params.id, organizationId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getProjectDashboard = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const result = await projectsService.getProjectDashboard(req.params.projectId, organizationId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};
