import mongoose from 'mongoose';

const lessonProgressSchema = new mongoose.Schema({
  enrollment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enrollment', 
    required: true 
  },
  lesson: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson', 
    required: true 
  },
  started: { 
    type: Boolean, 
    default: false 
  },
  completed: { 
    type: Boolean, 
    default: false 
  },
  completedAt: { 
    type: Date,
    default: null
  }
}, { timestamps: true });

// Unique lesson progress per enrollment
lessonProgressSchema.index({ enrollment: 1, lesson: 1 }, { unique: true });

export default mongoose.model('LessonProgress', lessonProgressSchema);
