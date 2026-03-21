// FILE: server/controllers/review.controller.js
// STATUS: MODIFIED
// PURPOSE: Expose course reviews and enrolled learner upsert review submission.
// ⚠️ WARNING: This file was modified. Review changes carefully before merging.

import Review from '../models/Review.js';
import Enrollment from '../models/Enrollment.js';

export const getCourseReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId })
      .populate('learner', 'name avatar')
      .sort('-createdAt');

    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const upsertReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, reviewText } = req.body;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating must be an integer between 1 and 5' });
    }

    if (typeof reviewText !== 'string' || reviewText.trim().length < 10) {
      return res.status(400).json({ message: 'reviewText must be at least 10 characters' });
    }

    const enrollment = await Enrollment.findOne({
      course: courseId,
      learner: req.user._id,
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled to review this course' });
    }

    const review = await Review.findOneAndUpdate(
      { course: courseId, learner: req.user._id },
      {
        rating,
        reviewText: reviewText.trim(),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('learner', 'name avatar');

    return res.status(201).json(review);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
