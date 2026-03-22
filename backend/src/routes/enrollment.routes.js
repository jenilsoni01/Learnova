// FILE: server/routes/enrollment.routes.js
// STATUS: MODIFIED
// PURPOSE: Route learner enrollment actions with integrated Razorpay payment flow.

import { Router } from 'express';
import {
  getMyEnrollments,
  enrollCourse,
  getCourseEnrollments,
  checkEnrollmentStatus,
  verifyPaymentAndEnroll,
  inviteLearnersToCourse,
  getCourseInvitations,
  revokeCourseInvitation,
  resendCourseInvitation,
  getMyInvitations,
  acceptMyInvitation
} from '../controllers/enrollment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// Learner routes
router.get('/me', protect, authorize('learner'), getMyEnrollments);
router.get('/invitations/me', protect, authorize('learner'), getMyInvitations);
router.post('/invitations/:invitationId/accept', protect, authorize('learner'), acceptMyInvitation);
router.post('/:courseId', protect, authorize('learner'), enrollCourse);
router.post('/:courseId/verify-payment', protect, authorize('learner'), verifyPaymentAndEnroll);
router.get('/status/:courseId', protect, authorize('learner'), checkEnrollmentStatus);

// Admin/Instructor routes
router.get('/course/:courseId', protect, authorize('admin', 'instructor'), getCourseEnrollments);
router.post('/:courseId/invite', protect, authorize('admin', 'instructor'), inviteLearnersToCourse);
router.get('/course/:courseId/invitations', protect, authorize('admin', 'instructor'), getCourseInvitations);
router.patch('/course/:courseId/invitations/:invitationId/revoke', protect, authorize('admin', 'instructor'), revokeCourseInvitation);
router.patch('/course/:courseId/invitations/:invitationId/resend', protect, authorize('admin', 'instructor'), resendCourseInvitation);

export default router;
