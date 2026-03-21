// FILE: server/routes/review.routes.js
// STATUS: NEW
// PURPOSE: Route public review fetch and learner review upsert endpoints.

import { Router } from 'express';
import { getCourseReviews, upsertReview } from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/course/:courseId', getCourseReviews);
router.post('/course/:courseId', protect, authorize('learner'), upsertReview);

export default router;
