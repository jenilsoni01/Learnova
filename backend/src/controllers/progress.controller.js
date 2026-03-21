// FILE: server/controllers/progress.controller.js
// STATUS: MODIFIED
// PURPOSE: Compute and update learner course progress and completion lifecycle.
// ⚠️ WARNING: This file was modified. Review changes carefully before merging.

import Enrollment from '../models/Enrollment.js';
import LessonProgress from '../models/LessonProgress.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import { computeCompletionPct } from '../utils/progress.utils.js';

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      course: courseId,
      learner: req.user._id,
    });

    if (!enrollment) {
      const course = await Course.findById(courseId).select('accessRule').lean();

      if (course?.accessRule === 'invitation') {
        return res.status(403).json({ message: 'Access denied. This course is by invitation only.' });
      }

      const lessons = await Lesson.find({ course: courseId })
        .select('title type order')
        .sort('order')
        .lean();

      return res.json({
        enrolled: false,
        enrollment: null,
        lessons: lessons.map((lesson) => ({ ...lesson, status: 'not_started' })),
        completionPct: 0,
        completedCount: 0,
        totalLessons: lessons.length,
      });
    }

    const lessons = await Lesson.find({ course: courseId })
      .select('title type order')
      .sort('order')
      .lean();

    const progressRows = await LessonProgress.find({ enrollment: enrollment._id }).lean();
    const progressMap = new Map(progressRows.map((row) => [String(row.lesson), row.status]));

    const lessonsWithStatus = lessons.map((lesson) => ({
      ...lesson,
      status: progressMap.get(String(lesson._id)) || 'not_started',
    }));

    const completion = await computeCompletionPct(enrollment._id, courseId);

    return res.json({
      enrolled: true,
      enrollment,
      lessons: lessonsWithStatus,
      completionPct: completion.completionPct,
      completedCount: completion.completedCount,
      totalLessons: completion.totalLessons,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateLessonProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId, status } = req.body;

    const allowedStatuses = ['not_started', 'in_progress', 'completed'];

    if (!lessonId || !status || !allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: 'Invalid status. Must be one of: not_started, in_progress, completed' });
    }

    const enrollment = await Enrollment.findOne({
      course: courseId,
      learner: req.user._id,
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found for this course' });
    }

    const updatePayload = { status };

    if (status === 'completed') {
      updatePayload.completedAt = new Date();
    } else if (status === 'not_started') {
      updatePayload.completedAt = null;
    }

    await LessonProgress.findOneAndUpdate(
      { enrollment: enrollment._id, lesson: lessonId },
      updatePayload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (enrollment.status === 'yet_to_start') {
      enrollment.status = 'in_progress';
      enrollment.startedAt = enrollment.startedAt || new Date();
      await enrollment.save();
    }

    const completion = await computeCompletionPct(enrollment._id, courseId);

    return res.json({
      completionPct: completion.completionPct,
      completedCount: completion.completedCount,
      totalLessons: completion.totalLessons,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      course: courseId,
      learner: req.user._id,
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    if (!enrollment.startedAt) {
      enrollment.startedAt = new Date();
    }

    await enrollment.save();

    return res.json(enrollment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
