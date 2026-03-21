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
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
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

// Virtual: Check if course requires payment
courseSchema.virtual('isPaid').get(function() {
  return this.accessRule === 'payment' && this.price > 0;
});

// Virtual: Check if course is free
courseSchema.virtual('isFree').get(function() {
  return this.accessRule === 'open' || this.price === 0;
});

// Ensure virtuals are included in JSON output
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

export default mongoose.model('Course', courseSchema);
