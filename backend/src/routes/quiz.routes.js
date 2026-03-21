// FILE: server/routes/quiz.routes.js
// STATUS: NEW
// PURPOSE: Route quiz retrieval/admin CRUD and learner attempt operations.

import { Router } from 'express';
import {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  startAttempt,
  getMyAttempts,
} from '../controllers/quiz.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/course/:courseId', protect, getQuizzes);
router.post('/course/:courseId', protect, authorize('admin', 'instructor'), createQuiz);
router.put('/:id', protect, authorize('admin', 'instructor'), updateQuiz);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteQuiz);
router.post('/:id/attempt', protect, authorize('learner'), startAttempt);
router.get('/:id/attempts/me', protect, authorize('learner'), getMyAttempts);

export default router;
