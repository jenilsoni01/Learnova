import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: null 
  },
  pointsAttempt1: { 
    type: Number, 
    required: true,
    default: 10 
  },
  pointsAttempt2: { 
    type: Number, 
    required: true,
    default: 7 
  },
  pointsAttempt3: { 
    type: Number, 
    required: true,
    default: 5 
  },
  pointsAttempt4Plus: { 
    type: Number, 
    required: true,
    default: 3 
  }
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
