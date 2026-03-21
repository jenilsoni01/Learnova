import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  learner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  reviewText: { 
    type: String, 
    required: true, 
    minlength: 10 
  }
}, { timestamps: true });

reviewSchema.index({ course: 1, learner: 1 }, { unique: true });

// Unique review per learner per course
reviewSchema.index({ course: 1, learner: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
