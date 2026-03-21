import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Question' 
  },
  selectedOption: { 
    type: String, 
    default: null 
  },
  isCorrect: { 
    type: Boolean, 
    default: false 
  }
});

const quizAttemptSchema = new mongoose.Schema({
  quiz: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  learner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  answers: [answerSchema],
  score: { 
    type: Number, 
    default: 0 
  },
  totalQuestions: { 
    type: Number, 
    default: 0 
  },
  correctAnswers: { 
    type: Number, 
    default: 0 
  },
  attemptNumber: { 
    type: Number, 
    default: 1 
  },
  completedAt: { 
    type: Date 
  }
}, { timestamps: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
