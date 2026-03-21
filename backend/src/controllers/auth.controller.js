// FILE: server/controllers/auth.controller.js
// STATUS: MODIFIED
// FUNCTION CHANGED: getMe()
// ⚠️ WARNING: Only getMe() was changed. register() and login() are untouched.

import jwt from 'jsonwebtoken';
import fs from 'fs';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import LessonProgress from '../models/LessonProgress.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const cleanupTempFile = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors to avoid breaking auth flow.
  }
};

// Global Cookie Options
const cookieOptions = {
  httpOnly: true, // Prevents client-side JS from reading the cookie
  secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' allows cross-origin on Vercel
  maxAge: 10 * 60 * 1000, // 7 days in milliseconds
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  let avatar = '';

  // Early validations - if these fail, we MUST delete the file if it was uploaded
  if (!name || !email || !password) {
    if (req.file) cleanupTempFile(req.file.path);
    throw new ApiError(400, 'Name, email, and password are required');
  }

  if (password.length < 8) {
    if (req.file) cleanupTempFile(req.file.path);
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (req.file) cleanupTempFile(req.file.path);
    throw new ApiError(400, 'Email already exists');
  }

  // Handle File Upload
  if (req.file) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);

    if (!cloudinaryResponse) {
      // uploadOnCloudinary already deletes the file on failure, so we don't need to do it here
      throw new ApiError(500, 'Avatar upload failed');
    }

    // Successful upload - cleanup is safe even if utility already removed the file.
    cleanupTempFile(req.file.path);
    avatar = cloudinaryResponse.secure_url || cloudinaryResponse.url || '';
  }

  // Create User
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    avatar,
  });

  const token = signToken(user._id);
  
  // Set the cookie using the global options
  res.cookie('token', token, cookieOptions); 

  return res
    .status(201)
    .json(
      new ApiResponse(201, {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
      }, 'User registered successfully')
    );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user._id);
  
  // Set the cookie using the global options
  res.cookie('token', token, cookieOptions); 

  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          totalPoints: user.totalPoints,
          badgeLevel: user.badgeLevel,
        },
      }, 'User logged in successfully')
    );
});

const getMe = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    let courses = [];

    if (req.user.role === 'admin' || req.user.role === 'instructor') {
      const createdCourses = await Course.find({ createdBy: req.user._id })
        .populate('responsible', 'name');

      courses = await Promise.all(
        createdCourses.map(async (course) => {
          const lessonsCount = await Lesson.countDocuments({ course: course._id });
          return {
            _id: course._id,
            title: course.title,
            coverImage: course.coverImage,
            tags: course.tags,
            isPublished: course.isPublished,
            lessonsCount,
            responsible: course.responsible,
          };
        })
      );
    } else if (req.user.role === 'learner') {
      const enrollments = await Enrollment.find({ learner: req.user._id })
        .populate('course', 'title coverImage description tags accessRule price isPublished');

      courses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const totalLessons = await Lesson.countDocuments({ course: enrollment.course._id });
          const completedCount = await LessonProgress.countDocuments({
            enrollment: enrollment._id,
            status: 'completed',
          });

          const completionPct = totalLessons > 0
            ? Math.round((completedCount / totalLessons) * 100)
            : 0;

          return {
            _id: enrollment._id,
            status: enrollment.status,
            completionPct,
            course: enrollment.course,
          };
        })
      );
    }

    return res.status(200).json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        totalPoints: req.user.totalPoints,
        badgeLevel: req.user.badgeLevel,
        avatar: req.user.avatar,
      },
      courses,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

const logout = asyncHandler(async (req, res) => {
  // Clear the cookie using the exact same global options
  res.clearCookie('token', cookieOptions);
  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, 'Logged out successfully')
    );
});

export { signToken, register, login, getMe, logout };