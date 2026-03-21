import express from 'express';
import * as lessonController from '../controllers/lesson.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Get lessons for a course
router.get('/course/:courseId', lessonController.getLessons);

// Create lesson (admin/instructor only)
router.post('/course/:courseId', protect, authorize('admin', 'instructor'), lessonController.createLesson);

// Update lesson (admin/instructor only)
router.put('/:id', protect, authorize('admin', 'instructor'), lessonController.updateLesson);

// Delete lesson (admin/instructor only)
router.delete('/:id', protect, authorize('admin', 'instructor'), lessonController.deleteLesson);

export default router;
