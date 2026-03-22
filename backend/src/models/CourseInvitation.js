import mongoose from 'mongoose';

const courseInvitationSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'revoked'],
    default: 'pending',
  },
  acceptedAt: {
    type: Date,
  },
}, { timestamps: true });

courseInvitationSchema.index({ course: 1, email: 1 }, { unique: true });

const CourseInvitation = mongoose.model('CourseInvitation', courseInvitationSchema);

export { CourseInvitation };
export default CourseInvitation;