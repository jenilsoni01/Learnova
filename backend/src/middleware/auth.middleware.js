// FILE: server/middleware/auth.middleware.js
// STATUS: MODIFIED
// PURPOSE: Enforce/optionally parse JWT auth and attach authenticated user to request.
// ⚠️ WARNING: This file was modified. Review changes carefully before merging.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const resolveToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.split(' ')[1];
  
  if (req.cookies && req.cookies.token) return req.cookies.token; 
  
  return null;
};

const protect = async (req, res, next) => {
  try {
    const token = resolveToken(req);

    if (!token) {
      throw new ApiError(401, 'Not authorized, no token');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError(401, 'Not authorized, user not found');
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(new ApiError(401, 'Token invalid or expired'));
  }
};

const optionalProtect = async (req, _res, next) => {
  try {
    const token = resolveToken(req);
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;

    return next();
  } catch {
    return next();
  }
};

export { protect, optionalProtect };
