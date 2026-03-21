import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  coverImage: { 
    type: String, 
    default: '' 
  },
  tags: [ 
    { type: String } 
  ],
  websiteUrl: { 
    type: String, 
    default: '' 
  },
  isPublished: { 
    type: Boolean, 
    default: false 
  },
  visibility: { 
    type: String, 
    enum: ['everyone', 'signed_in'], 
    default: 'everyone' 
  },
  accessRule: { 
    type: String, 
    enum: ['open', 'invitation', 'payment'], 
    default: 'open' 
  },
  price: { 
    type: Number, 
    default: 0 
  },
  responsible: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
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
