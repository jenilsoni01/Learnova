// FILE: server/controllers/enrollment.controller.js
// STATUS: MODIFIED
// PURPOSE: Handle learner enrollments, computed completion, and instructor visibility.
// ⚠️ WARNING: This file was modified. Review changes carefully before merging.

import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { computeCompletionPct } from '../utils/progress.utils.js';

export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ learner: req.user._id })
      .populate('course', 'title coverImage description tags accessRule price')
      .sort('-enrolledAt');

    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        const completion = await computeCompletionPct(enrollment._id, enrollment.course._id);
        return {
          _id: enrollment._id,
          status: enrollment.status,
          completionPct: completion.completionPct,
          course: enrollment.course,
        };
      })
    );

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const existing = await Enrollment.findOne({
      course: courseId,
      learner: req.user._id,
    });

    if (existing) {
      return res.json(existing);
    }

    const enrollment = await Enrollment.create({
      course: courseId,
      learner: req.user._id,
      status: 'yet_to_start',
    });

    return res.status(201).json(enrollment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && String(course.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this course enrollments' });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('learner', 'name email avatar totalPoints badgeLevel')
      .sort('-enrolledAt');

    return res.json(enrollments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
