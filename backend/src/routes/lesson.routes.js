// FILE: server/routes/lesson.routes.js
// STATUS: NEW
// PURPOSE: Route learner lesson fetch and admin lesson management endpoints.

import { Router } from 'express';
import { getLessons, createLesson, updateLesson, deleteLesson } from '../controllers/lesson.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/course/:courseId', protect, getLessons);
router.post('/course/:courseId', protect, authorize('admin', 'instructor'), createLesson);
router.put('/:id', protect, authorize('admin', 'instructor'), updateLesson);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteLesson);

export default router;
