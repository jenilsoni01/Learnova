import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Question' 
  },
  selectedOptions: [ 
    { type: mongoose.Schema.Types.ObjectId } 
  ],
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
  attemptNumber: { 
    type: Number, 
    required: true 
  },
  answers: [answerSchema],
  score: { 
    type: Number, 
    default: 0 
  },
  totalQuestions: { 
    type: Number, 
    required: true 
  },
  pointsEarned: { 
    type: Number, 
    default: 0 
  },
  completedAt: { 
    type: Date 
  }
}, { timestamps: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
