// FILE: server/models/User.js
// STATUS: MODIFIED
// PURPOSE: Define user schema with auth credentials, role, and gamification fields.
// ⚠️ WARNING: This file was modified. Review changes carefully before merging.

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 8 
  },
  role: { 
    type: String, 
    enum: ['admin', 'instructor', 'learner'], 
    default: 'learner' 
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  totalPoints: { 
    type: Number, 
    default: 0 
  },
  badgeLevel: { 
    type: String, 
    enum: ['Newbie', 'Explorer', 'Achiever', 'Specialist', 'Expert', 'Master'], 
    default: 'Newbie' 
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
