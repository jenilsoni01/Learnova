// FILE: server/controllers/auth.controller.js
// STATUS: MODIFIED
// PURPOSE: Handle registration, login, token issuance, and authenticated profile retrieval.

import jwt from 'jsonwebtoken';
import fs from 'fs';
import User from '../models/User.js';
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
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
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
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, 'Current user fetched successfully')
    );
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