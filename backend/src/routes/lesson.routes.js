// FILE: server/routes/lesson.routes.js
// STATUS: MODIFIED
// PURPOSE: Route learner lesson fetch and admin lesson management endpoints.
// Note: Added course access check for paid courses.

import { Router } from 'express';
import { getLessons, createLesson, updateLesson, deleteLesson } from '../controllers/lesson.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { checkCourseAccess } from '../middleware/courseAccess.middleware.js';

const router = Router();

// Learner lesson access (with payment verification for paid courses)
router.get('/course/:courseId', protect, checkCourseAccess, getLessons);

// Admin/Instructor lesson management
router.post('/course/:courseId', protect, authorize('admin', 'instructor'), createLesson);
router.put('/:id', protect, authorize('admin', 'instructor'), updateLesson);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteLesson);

export default router;
