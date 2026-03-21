import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
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
  type: { 
    type: String, 
    enum: ['video', 'document', 'image', 'quiz'], 
    required: true 
  },
  order: { 
    type: Number, 
    required: true 
  },
  content: { 
    type: String, 
    default: null 
  },
  attachments: [ 
    { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Attachment' 
    } 
  ],
  responsible: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

export default mongoose.model('Lesson', lessonSchema);
