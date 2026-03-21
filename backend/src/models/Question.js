import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  isCorrect: { 
    type: Boolean, 
    default: false 
  }
});

const questionSchema = new mongoose.Schema({
  quiz: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  order: { 
    type: Number, 
    required: true 
  },
  options: [optionSchema]
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);
