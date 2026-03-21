import express from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get reviews for a course
router.get('/course/:courseId', reviewController.getCourseReviews);

// Create review (learner only)
router.post('/course/:courseId', protect, reviewController.createReview);

// Update review
router.put('/:id', protect, reviewController.updateReview);

// Delete review
router.delete('/:id', protect, reviewController.deleteReview);

export default router;
