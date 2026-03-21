import express from 'express';
import * as courseController from '../controllers/course.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/public', courseController.getPublicCourses);

// Protected routes (auth required)
// Admin/Instructor dashboard - get all their courses
router.get('/admin', protect, authorize('admin', 'instructor'), courseController.getAdminCourses);

// Create new course
router.post('/', protect, authorize('admin', 'instructor'), courseController.createCourse);

// Get specific course by ID
router.get('/:id', courseController.getCourseById);

// Update course
router.put('/:id', protect, authorize('admin', 'instructor'), courseController.updateCourse);

// Toggle publish/unpublish course
router.patch('/:id/publish', protect, authorize('admin', 'instructor'), courseController.togglePublish);

// Generate shareable link
router.get('/:id/share', protect, authorize('admin', 'instructor'), courseController.generateShareLink);

// Delete course
router.delete('/:id', protect, authorize('admin', 'instructor'), courseController.deleteCourse);

export default router;
