import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  instructor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  category: { 
    type: String, 
    required: true, 
    trim: true 
  },
  thumbnail: { 
    type: String, 
    default: null 
  },
  visibility: { 
    type: String, 
    enum: ['private', 'public', 'link-shared'], 
    default: 'private' 
  },
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'draft' 
  },
  viewsCount: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Virtual: total lessons count
courseSchema.virtual('lessonsCount', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'course',
  count: true
});

export default mongoose.model('Course', courseSchema);
