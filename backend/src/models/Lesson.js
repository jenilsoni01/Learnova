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
    default: 0 
  },
  description: { 
    type: String, 
    default: '' 
  },
  videoUrl: { 
    type: String, 
    default: '' 
  },
  fileUrl: { 
    type: String, 
    default: '' 
  },
  imageUrl: { 
    type: String, 
    default: '' 
  },
  durationMins: { 
    type: Number, 
    default: 0 
  },
  allowDownload: { 
    type: Boolean, 
    default: false 
  },
  responsible: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

export default mongoose.model('Lesson', lessonSchema);
