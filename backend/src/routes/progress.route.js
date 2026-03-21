import express from 'express';
import * as progressController from '../controllers/progress.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get enrollment progress
router.get('/:enrollmentId', protect, progressController.getEnrollmentProgress);

// Initialize lesson progress for new enrollment
router.post('/:enrollmentId/init', protect, progressController.initializeLessonProgress);

// Update lesson progress
router.patch('/:id', protect, progressController.updateLessonProgress);

export default router;
