// FILE: server/routes/progress.routes.js
// STATUS: NEW
// PURPOSE: Route learner progress fetch, lesson updates, and course completion.

import { Router } from 'express';
import { getCourseProgress, updateLessonProgress, completeCourse } from '../controllers/progress.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/:courseId', protect, authorize('learner'), getCourseProgress);
router.patch('/:courseId/lesson', protect, authorize('learner'), updateLessonProgress);
router.patch('/:courseId/complete', protect, authorize('learner'), completeCourse);

export default router;
