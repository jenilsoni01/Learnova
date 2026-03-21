// FILE: server/routes/progress.routes.js
// STATUS: MODIFIED
// PURPOSE: Route learner progress fetch, lesson updates, and course completion.
// Note: Added course access check for paid courses.

import { Router } from 'express';
import { getCourseProgress, updateLessonProgress, completeCourse } from '../controllers/progress.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { checkCourseAccess } from '../middleware/courseAccess.middleware.js';

const router = Router();

// All progress routes require course access (enrollment + payment for paid courses)
router.get('/:courseId', protect, authorize('learner'), checkCourseAccess, getCourseProgress);
router.patch('/:courseId/lesson', protect, authorize('learner'), checkCourseAccess, updateLessonProgress);
router.patch('/:courseId/complete', protect, authorize('learner'), checkCourseAccess, completeCourse);

export default router;
