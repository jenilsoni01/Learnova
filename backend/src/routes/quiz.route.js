import express from 'express';
import * as quizController from '../controllers/quiz.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Get quizzes for a course
router.get('/course/:courseId', quizController.getQuizzes);

// Get specific quiz with questions
router.get('/:id', quizController.getQuizById);

// Create quiz (admin/instructor only)
router.post('/course/:courseId', protect, authorize('admin', 'instructor'), quizController.createQuiz);

// Update quiz (admin/instructor only)
router.put('/:id', protect, authorize('admin', 'instructor'), quizController.updateQuiz);

// Delete quiz (admin/instructor only)
router.delete('/:id', protect, authorize('admin', 'instructor'), quizController.deleteQuiz);

export default router;
