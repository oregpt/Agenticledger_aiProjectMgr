import { Router } from 'express';
import * as planItemsController from './plan-items.controller.js';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import {
  createPlanItemSchema,
  updatePlanItemSchema,
  listPlanItemsQuerySchema,
  bulkUpdateSchema,
} from './plan-items.schema.js';

const router = Router();

// All routes require authentication and organization context
router.use(authenticate);
router.use(requireOrgContext);

/**
 * @swagger
 * /plan-items/import/template:
 *   get:
 *     summary: Get CSV import template
 *     description: Download a CSV template for importing plan items
 *     tags: [Plan Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: CSV template file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get(
  '/import/template',
  planItemsController.getCsvTemplate
);

/**
 * @swagger
 * /plan-items/bulk-update:
 *   post:
 *     summary: Bulk update plan items
 *     description: Update multiple plan items at once (status, dates, etc.)
 *     tags: [Plan Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Plan item UUID
 *                     status:
 *                       type: string
 *                       enum: [not_started, in_progress, completed, blocked]
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *     responses:
 *       200:
 *         description: Items updated successfully
 */
router.post(
  '/bulk-update',
  validateBody(bulkUpdateSchema),
  planItemsController.bulkUpdatePlanItems
);

/**
 * @swagger
 * /plan-items/{id}:
 *   get:
 *     summary: Get a plan item
 *     description: Retrieve a single plan item with its children
 *     tags: [Plan Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan item UUID
 *     responses:
 *       200:
 *         description: Plan item details with children
 *       404:
 *         description: Plan item not found
 */
router.get(
  '/:id',
  planItemsController.getPlanItem
);

/**
 * @swagger
 * /plan-items/{id}/history:
 *   get:
 *     summary: Get plan item history
 *     description: Retrieve the change history for a plan item
 *     tags: [Plan Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan item UUID
 *     responses:
 *       200:
 *         description: List of history entries
 */
router.get(
  '/:id/history',
  planItemsController.getPlanItemHistory
);

/**
 * @swagger
 * /plan-items/{id}:
 *   put:
 *     summary: Update a plan item
 *     description: Update an existing plan item's properties
 *     tags: [Plan Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan item UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [not_started, in_progress, completed, blocked]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               parentId:
 *                 type: string
 *                 description: New parent plan item UUID
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Plan item updated
 *       404:
 *         description: Plan item not found
 */
router.put(
  '/:id',
  validateBody(updatePlanItemSchema),
  planItemsController.updatePlanItem
);

/**
 * @swagger
 * /plan-items/{id}:
 *   delete:
 *     summary: Delete a plan item
 *     description: Delete a plan item and optionally its children
 *     tags: [Plan Items]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan item UUID
 *     responses:
 *       200:
 *         description: Plan item deleted
 *       404:
 *         description: Plan item not found
 */
router.delete(
  '/:id',
  planItemsController.deletePlanItem
);

export default router;
