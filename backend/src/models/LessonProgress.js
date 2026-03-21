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
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed'], 
    default: 'not_started' 
  },
  completedAt: { 
    type: Date 
  }
}, { timestamps: true });

// Unique lesson progress per enrollment
lessonProgressSchema.index({ enrollment: 1, lesson: 1 }, { unique: true });

export default mongoose.model('LessonProgress', lessonProgressSchema);
