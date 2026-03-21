// FILE: server/routes/enrollment.routes.js
// STATUS: MODIFIED
// PURPOSE: Route learner enrollment actions with integrated Razorpay payment flow.

import { Router } from 'express';
import {
  getMyEnrollments,
  enrollCourse,
  getCourseEnrollments,
  checkEnrollmentStatus,
  verifyPaymentAndEnroll
} from '../controllers/enrollment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// Learner routes
router.get('/me', protect, authorize('learner'), getMyEnrollments);
router.post('/:courseId', protect, authorize('learner'), enrollCourse);
router.post('/:courseId/verify-payment', protect, authorize('learner'), verifyPaymentAndEnroll);
router.get('/status/:courseId', protect, authorize('learner'), checkEnrollmentStatus);

// Admin/Instructor routes
router.get('/course/:courseId', protect, authorize('admin', 'instructor'), getCourseEnrollments);

export default router;
