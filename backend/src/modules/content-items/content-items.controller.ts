import { Request, Response, NextFunction, RequestHandler } from 'express';
import { successResponse, paginatedResponse, ErrorCodes } from '../../utils/responses';
import { AppError } from '../../middleware/errorHandler';
import * as contentItemsService from './content-items.service';
import * as analyzeService from './analyze.service';
import { processUploadedFile } from '../../services/file-processing/index.js';
import type {
  CreateContentItemInput,
  UpdateContentItemInput,
  ListContentItemsQuery,
  AnalyzeContentInput,
  SaveAnalyzedContentInput,
} from './content-items.schema';

// GET /api/projects/:projectId/content - List content items for a project
export const getProjectContent: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { projectId } = req.params;
    const query = req.query as unknown as ListContentItemsQuery;

    const result = await contentItemsService.getProjectContent(projectId, organizationId, query);
    paginatedResponse(
      res,
      result.items,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/content-items - List all content items with filters
export const listContentItems: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const query = req.query as unknown as ListContentItemsQuery;

    const result = await contentItemsService.listContentItems(organizationId, query);
    paginatedResponse(
      res,
      result.items,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/content-items/:id - Get a single content item
export const getContentItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const item = await contentItemsService.getContentItem(req.params.id, organizationId);
    successResponse(res, item);
  } catch (error) {
    next(error);
  }
};

// POST /api/content-items - Create a new content item
export const createContentItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const input = req.body as CreateContentItemInput;
    const userId = req.user?.id;

    const item = await contentItemsService.createContentItem(organizationId, input, userId);
    successResponse(res, item, 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/content-items/:id - Update a content item
export const updateContentItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const input = req.body as UpdateContentItemInput;

    const item = await contentItemsService.updateContentItem(req.params.id, organizationId, input);
    successResponse(res, item);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/content-items/:id - Delete a content item
export const deleteContentItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const result = await contentItemsService.deleteContentItem(req.params.id, organizationId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

// GET /api/content-types - Get all content types
export const getContentTypes: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const types = await contentItemsService.getContentTypes(organizationId);
    successResponse(res, types);
  } catch (error) {
    next(error);
  }
};

// GET /api/activity-item-types - Get all activity item types
export const getActivityItemTypes: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const types = await contentItemsService.getActivityItemTypes(organizationId);
    successResponse(res, types);
  } catch (error) {
    next(error);
  }
};

// POST /api/content-items/analyze - Analyze content using AI
export const analyzeContent: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const input = req.body as AnalyzeContentInput;

    const result = await analyzeService.analyzeContent(input, organizationId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

// POST /api/content-items/save-analyzed - Save analyzed content with AI suggestions
export const saveAnalyzedContent: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const userId = req.user!.id;
    const input = req.body as SaveAnalyzedContentInput;

    const result = await analyzeService.saveAnalyzedContent(input, userId, organizationId);
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

// POST /api/content-items/upload - Upload a file and create content item
export const uploadFile: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const userId = req.user?.id;

    // Check for uploaded file
    if (!req.file) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'No file uploaded', 400);
    }

    // Parse form fields
    const { projectId, title, dateOccurred, planItemIds, contentTypeIds, activityTypeIds, tags } = req.body;

    if (!projectId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'projectId is required', 400);
    }

    // Process the uploaded file (extract text, save to disk)
    const processedFile = await processUploadedFile(req.file.buffer, req.file.originalname);

    // Create content item input
    const input: CreateContentItemInput = {
      projectId,
      sourceType: 'file',
      title: title || req.file.originalname,
      dateOccurred: dateOccurred ? new Date(dateOccurred) : new Date(),
      planItemIds: planItemIds ? JSON.parse(planItemIds) : [],
      contentTypeIds: contentTypeIds ? JSON.parse(contentTypeIds) : [],
      activityTypeIds: activityTypeIds ? JSON.parse(activityTypeIds) : [],
      tags: tags ? JSON.parse(tags) : [],
      rawContent: processedFile.rawContent,
      fileReference: processedFile.fileReference,
      fileName: processedFile.fileName,
      fileSize: processedFile.fileSize,
      mimeType: processedFile.mimeType,
    };

    // Create the content item
    const item = await contentItemsService.createContentItem(organizationId, input, userId);
    successResponse(res, item, 201);
  } catch (error) {
    next(error);
  }
};
