import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
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
  enrolledAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['enrolled', 'completed'], 
    default: 'enrolled' 
  },
  progress: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  },
  timeSpentMins: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Unique enrollment per learner per course
enrollmentSchema.index({ course: 1, learner: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
