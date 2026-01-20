import { Request, Response, NextFunction } from 'express';
import * as promptTemplatesService from './prompt-templates.service.js';
import { successResponse } from '../../utils/responses.js';

/**
 * Get all prompt templates
 */
export const getAllTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const templates = await promptTemplatesService.getAllTemplates();
    successResponse(res, templates);
  } catch (error) {
    next(error);
  }
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = async (
  req: Request<{ category: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const templates = await promptTemplatesService.getTemplatesByCategory(req.params.category);
    successResponse(res, templates);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single template by slug
 */
export const getTemplate = async (
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await promptTemplatesService.getTemplate(req.params.slug);
    successResponse(res, template);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a template
 */
export const updateTemplate = async (
  req: Request<
    { slug: string },
    {},
    {
      systemPrompt?: string;
      userPromptTemplate?: string;
      name?: string;
      description?: string;
    }
  >,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { systemPrompt, userPromptTemplate, name, description } = req.body;

    // Get user info from request (set by auth middleware)
    const updatedBy = {
      userId: (req as any).user?.id,
      email: (req as any).user?.email,
    };

    const template = await promptTemplatesService.updateTemplate(
      req.params.slug,
      { systemPrompt, userPromptTemplate, name, description },
      updatedBy
    );

    successResponse(res, template);
  } catch (error) {
    next(error);
  }
};

/**
 * Reset a template to defaults
 */
export const resetTemplate = async (
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user info from request (set by auth middleware)
    const updatedBy = {
      userId: (req as any).user?.id,
      email: (req as any).user?.email,
    };

    const template = await promptTemplatesService.resetTemplate(req.params.slug, updatedBy);
    successResponse(res, template);
  } catch (error) {
    next(error);
  }
};

/**
 * Get default prompts for a template (without saving)
 */
export const getDefaultPrompts = async (
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const defaults = promptTemplatesService.getDefaultPrompts(req.params.slug);
    if (!defaults) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `No default prompts for '${req.params.slug}'` },
      });
      return;
    }
    successResponse(res, defaults);
  } catch (error) {
    next(error);
  }
};

/**
 * Seed default templates (admin utility)
 */
export const seedTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const results = await promptTemplatesService.seedDefaultTemplates();
    successResponse(res, { message: 'Templates seeded', results });
  } catch (error) {
    next(error);
  }
};
