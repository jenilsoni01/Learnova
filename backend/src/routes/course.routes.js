// FILE: server/routes/course.routes.js
// STATUS: NEW
// PURPOSE: Map public and admin course endpoints with proper access controls.

import { Router } from 'express';
import {
  getPublicCourses,
  getAdminCourses,
  createCourse,
  getCourseById,
  updateCourse,
  togglePublish,
  deleteCourse,
} from '../controllers/course.controller.js';
import { protect, optionalProtect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/public', optionalProtect, getPublicCourses);
router.get('/admin', protect, authorize('admin', 'instructor'), getAdminCourses);
router.post('/', protect, authorize('admin', 'instructor'), createCourse);
router.get('/:id', getCourseById);
router.put('/:id', protect, authorize('admin', 'instructor'), updateCourse);
router.patch('/:id/publish', protect, authorize('admin', 'instructor'), togglePublish);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteCourse);

export default router;
