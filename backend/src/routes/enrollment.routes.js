// FILE: server/routes/enrollment.routes.js
// STATUS: NEW
// PURPOSE: Route learner enrollment actions and course enrollment reporting.

import { Router } from 'express';
import { getMyEnrollments, enrollCourse, getCourseEnrollments } from '../controllers/enrollment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/me', protect, authorize('learner'), getMyEnrollments);
router.post('/:courseId', protect, authorize('learner'), enrollCourse);
router.get('/course/:courseId', protect, authorize('admin', 'instructor'), getCourseEnrollments);

export default router;
