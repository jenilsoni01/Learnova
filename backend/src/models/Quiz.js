import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  lesson: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson' 
  },
  title: { 
    type: String, 
    required: true 
  },
  pointsAttempt1: { 
    type: Number, 
    default: 10 
  },
  pointsAttempt2: { 
    type: Number, 
    default: 7 
  },
  pointsAttempt3: { 
    type: Number, 
    default: 5 
  },
  pointsAttempt4Plus: { 
    type: Number, 
    default: 3 
  }
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
