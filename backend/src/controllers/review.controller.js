import Review from '../models/Review.js';
import Enrollment from '../models/Enrollment.js';

// Get course reviews
export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;

    const reviews = await Review.find({ course: courseId })
      .populate('learner', 'name avatar')
      .sort('-createdAt');

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      courseId,
      totalReviews: reviews.length,
      averageRating: parseFloat(avgRating),
      reviews
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create review
export const createReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, reviewText } = req.body;

    // Validation
    if (!rating || !reviewText) {
      return res.status(400).json({ message: 'Rating and review text are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (reviewText.length < 10) {
      return res.status(400).json({ message: 'Review must be at least 10 characters' });
    }

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({ course: courseId, learner: req.user._id });
    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled in this course to review it' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ course: courseId, learner: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this course' });
    }

    const review = await Review.create({
      course: courseId,
      learner: req.user._id,
      rating,
      reviewText
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.learner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }

    if (reviewText) {
      if (reviewText.length < 10) {
        return res.status(400).json({ message: 'Review must be at least 10 characters' });
      }
      review.reviewText = reviewText;
    }

    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.learner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(id);
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
