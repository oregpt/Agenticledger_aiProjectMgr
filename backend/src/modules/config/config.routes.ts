/**
 * Config Routes
 * Route definitions for configuration endpoints
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireOrgContext } from '../../middleware/orgContext';
import * as configController from './config.controller';

const router = Router();

// All routes require authentication and org context
router.use(authenticate);
router.use(requireOrgContext);

// ============ Plan Item Types ============

/**
 * @swagger
 * /config/plan-item-types:
 *   get:
 *     summary: List plan item types
 *     description: Get all plan item types (workstream, milestone, activity, task, subtask, custom)
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of plan item types
 */
router.get('/plan-item-types', configController.listPlanItemTypes);

/**
 * @swagger
 * /config/plan-item-types/{id}:
 *   get:
 *     summary: Get a plan item type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Plan item type details
 */
router.get('/plan-item-types/:id', configController.getPlanItemType);

/**
 * @swagger
 * /config/plan-item-types:
 *   post:
 *     summary: Create a custom plan item type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - level
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Epic"
 *               level:
 *                 type: integer
 *                 description: Hierarchy level (1-5)
 *               color:
 *                 type: string
 *                 example: "#3B82F6"
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plan item type created
 */
router.post('/plan-item-types', configController.createPlanItemType);

/**
 * @swagger
 * /config/plan-item-types/{id}:
 *   put:
 *     summary: Update a plan item type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Plan item type updated
 */
router.put('/plan-item-types/:id', configController.updatePlanItemType);

/**
 * @swagger
 * /config/plan-item-types/{id}:
 *   delete:
 *     summary: Delete a custom plan item type
 *     description: Only custom types can be deleted. System types are protected.
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Plan item type deleted
 *       403:
 *         description: Cannot delete system types
 */
router.delete('/plan-item-types/:id', configController.deletePlanItemType);

// ============ Content Types ============

/**
 * @swagger
 * /config/content-types:
 *   get:
 *     summary: List content types
 *     description: Get all content types (meeting, note, transcript, etc.)
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of content types
 */
router.get('/content-types', configController.listContentTypes);

/**
 * @swagger
 * /config/content-types/{id}:
 *   get:
 *     summary: Get a content type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Content type details
 */
router.get('/content-types/:id', configController.getContentType);

/**
 * @swagger
 * /config/content-types:
 *   post:
 *     summary: Create a custom content type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Interview"
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Content type created
 */
router.post('/content-types', configController.createContentType);

/**
 * @swagger
 * /config/content-types/{id}:
 *   put:
 *     summary: Update a content type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Content type updated
 */
router.put('/content-types/:id', configController.updateContentType);

/**
 * @swagger
 * /config/content-types/{id}:
 *   delete:
 *     summary: Delete a custom content type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Content type deleted
 */
router.delete('/content-types/:id', configController.deleteContentType);

// ============ Activity Types ============

/**
 * @swagger
 * /config/activity-types:
 *   get:
 *     summary: List activity types
 *     description: Get all activity item types (action item, blocker, decision, risk, etc.)
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of activity types
 */
router.get('/activity-types', configController.listActivityTypes);

/**
 * @swagger
 * /config/activity-types/{id}:
 *   get:
 *     summary: Get an activity type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Activity type details
 */
router.get('/activity-types/:id', configController.getActivityType);

/**
 * @swagger
 * /config/activity-types:
 *   post:
 *     summary: Create a custom activity type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dependency"
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Activity type created
 */
router.post('/activity-types', configController.createActivityType);

/**
 * @swagger
 * /config/activity-types/{id}:
 *   put:
 *     summary: Update an activity type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Activity type updated
 */
router.put('/activity-types/:id', configController.updateActivityType);

/**
 * @swagger
 * /config/activity-types/{id}:
 *   delete:
 *     summary: Delete a custom activity type
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Activity type deleted
 */
router.delete('/activity-types/:id', configController.deleteActivityType);

export default router;
