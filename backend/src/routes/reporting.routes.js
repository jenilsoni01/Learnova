import express from 'express';
import * as reportingController from '../controllers/reporting.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Get reporting dashboard for specific course
router.get('/course/:courseId', protect, authorize('admin', 'instructor'), reportingController.getReportingDashboard);

// Get all reporting data (admin sees all, instructor sees own)
router.get('/', protect, authorize('admin', 'instructor'), reportingController.getAllReporting);

// Export course report as CSV
router.get('/:courseId/export', protect, authorize('admin', 'instructor'), reportingController.exportCourseReport);

export default router;
