import express from 'express';
import * as enrollmentController from '../controllers/enrollment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Get user's enrollments
router.get('/', protect, enrollmentController.getUserEnrollments);

// Get course enrollments (instructor/admin)
router.get('/course/:courseId', protect, authorize('admin', 'instructor'), enrollmentController.getCourseEnrollments);

// Enroll in course
router.post('/course/:courseId', protect, enrollmentController.enrollCourse);

// Update enrollment status
router.patch('/:id/status', protect, enrollmentController.updateEnrollmentStatus);

// Track time spent
router.patch('/:id/time-spent', protect, enrollmentController.trackTimeSpent);

export default router;
