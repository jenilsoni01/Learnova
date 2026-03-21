/**
 * Course Access Middleware
 *
 * Middleware to verify user has proper access to course content
 * Checks enrollment status and payment verification for paid courses
 */

import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Check if user can access course content (lessons, quizzes, etc.)
 *
 * This middleware should be used on routes that serve course content
 * It extracts courseId from req.params.courseId or req.body.courseId
 *
 * Access is granted if:
 * - User is admin
 * - User is the course creator/instructor
 * - User is enrolled AND (course is free OR user has paid)
 */
export const checkCourseAccess = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;

    if (!courseId) {
      return next(new ApiError(400, 'Course ID is required'));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ApiError(404, 'Course not found'));
    }

    // Admin has full access
    if (req.user.role === 'admin') {
      req.course = course;
      req.accessType = 'admin';
      return next();
    }

    // Course creator/instructor has full access
    if (String(course.createdBy) === String(req.user._id)) {
      req.course = course;
      req.accessType = 'instructor';
      return next();
    }

    // Responsible person has full access
    if (course.responsible && String(course.responsible) === String(req.user._id)) {
      req.course = course;
      req.accessType = 'responsible';
      return next();
    }

    // For learners, check enrollment
    const enrollment = await Enrollment.findOne({
      course: courseId,
      learner: req.user._id
    });

    if (!enrollment) {
      return next(new ApiError(403, 'You are not enrolled in this course'));
    }

    // For paid courses, verify payment
    if (course.accessRule === 'payment' && course.price > 0) {
      const hasPaid = await Payment.hasUserPaidForCourse(req.user._id, courseId);

      if (!hasPaid) {
        return next(new ApiError(402, 'Payment required to access this course content'));
      }
    }

    // User has valid access
    req.course = course;
    req.enrollment = enrollment;
    req.accessType = 'learner';
    return next();

  } catch (error) {
    return next(new ApiError(500, `Access check failed: ${error.message}`));
  }
};

/**
 * Check if user can view course details (not content)
 *
 * Course details (title, description, etc.) can be viewed by:
 * - Anyone if visibility is 'everyone'
 * - Signed-in users if visibility is 'signed_in'
 * - Content access still requires enrollment + payment
 */
export const checkCourseVisibility = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;

    if (!courseId) {
      return next(new ApiError(400, 'Course ID is required'));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ApiError(404, 'Course not found'));
    }

    // Check visibility rules
    if (course.visibility === 'signed_in' && !req.user) {
      return next(new ApiError(401, 'Sign in required to view this course'));
    }

    // Attach enrollment info if user is logged in
    if (req.user) {
      const enrollment = await Enrollment.findOne({
        course: courseId,
        learner: req.user._id
      });

      req.isEnrolled = !!enrollment;
      req.enrollment = enrollment;

      // Check payment status for paid courses
      if (course.accessRule === 'payment' && course.price > 0) {
        req.hasPaid = await Payment.hasUserPaidForCourse(req.user._id, courseId);
      } else {
        req.hasPaid = true; // Free course, no payment needed
      }
    }

    req.course = course;
    return next();

  } catch (error) {
    return next(new ApiError(500, `Visibility check failed: ${error.message}`));
  }
};

/**
 * Verify enrollment exists (simpler check without payment verification)
 * Use this for actions that just need enrollment, like tracking progress
 */
export const requireEnrollment = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;

    if (!courseId) {
      return next(new ApiError(400, 'Course ID is required'));
    }

    // Admin/Instructor bypass
    if (req.user.role === 'admin' || req.user.role === 'instructor') {
      return next();
    }

    const enrollment = await Enrollment.findOne({
      course: courseId,
      learner: req.user._id
    });

    if (!enrollment) {
      return next(new ApiError(403, 'Enrollment required'));
    }

    req.enrollment = enrollment;
    return next();

  } catch (error) {
    return next(new ApiError(500, `Enrollment check failed: ${error.message}`));
  }
};
