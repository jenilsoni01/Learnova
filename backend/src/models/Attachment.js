import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  lesson: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['document', 'image', 'video'], 
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

export default mongoose.model('Attachment', attachmentSchema);
