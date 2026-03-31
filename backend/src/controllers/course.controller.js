// FILE: server/controllers/course.controller.js
// STATUS: MODIFIED
// PURPOSE: Serve learner/admin course data with publish/access validations.
// ⚠️ WARNING: This file was modified. Review changes carefully before merging.

import jwt from 'jsonwebtoken';
import path from 'path';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';



const buildCourseStatsMap = async (courseIds) => {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    return new Map();
  }

  const rows = await Lesson.aggregate([
    { $match: { course: { $in: courseIds } } },
    {
      $group: {
        _id: '$course',
        lessonsCount: { $sum: 1 },
        totalDurationMins: { $sum: { $ifNull: ['$durationMins', 0] } },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [String(row._id), {
      lessonsCount: row.lessonsCount || 0,
      totalDurationMins: row.totalDurationMins || 0,
    }])
  );
};

const resolveAuthUserFromHeader = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id role');
    return user || null;
  } catch {
    return null;
  }
};

export const getPublicCourses = async (req, res) => {
  try {
    const { search } = req.query;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip  = (page - 1) * limit;
    const authUser = req.user;

    const filter = { isPublished: true };
    if (!authUser) {
      filter.visibility = 'everyone';
    }

    if (search?.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const [courses, totalItems] = await Promise.all([
      Course.find(filter)
        .select('title coverImage description tags accessRule price visibility')
        .populate({ path: 'lessonsCount' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter)
    ]);

    const statsMap = await buildCourseStatsMap(courses.map((course) => course._id));

    const result = courses.map((course) => {
      const stats = statsMap.get(String(course._id));
      const lessonsCount =
        typeof course.lessonsCount === 'number'
          ? course.lessonsCount
          : stats?.lessonsCount || 0;

      return {
        _id: course._id,
        title: course.title,
        coverImage: course.coverImage,
        description: course.description,
        tags: course.tags || [],
        accessRule: course.accessRule,
        price: course.price,
        lessonsCount,
        totalDurationMins: stats?.totalDurationMins || 0,
      };
    });

    const totalPages  = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;

    return res.json({
      data: result,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAdminCourses = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip  = (page - 1) * limit;
    const { search } = req.query;

    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
    if (search?.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const [courses, totalItems] = await Promise.all([
      Course.find(filter)
        .populate('responsible createdBy', 'name avatar')
        .populate({ path: 'lessonsCount' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter)
    ]);

    const totalPages  = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;

    const statsMap = await buildCourseStatsMap(courses.map((course) => course._id));

    const coursesWithDuration = courses.map((course) => ({
      ...course,
      totalDurationMins: statsMap.get(String(course._id))?.totalDurationMins || 0,
    }));

    return res.json({
      data: coursesWithDuration,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.accessRule !== 'payment') {
      payload.price = 0;
    }

    const course = await Course.create({ ...payload, createdBy: req.user._id });
    return res.status(201).json(course);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadCourseCover = async (req, res) => {
  try {
    if (!req.file?.location) {
      return res.status(400).json({ message: 'Cover image file is required' });
    }

    return res.status(201).json({
      url: req.file.location,
      fileName: req.file.key || req.file.filename,
      mimeType: req.file.contentType || req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('responsible createdBy', 'name avatar email')
      .populate({ path: 'lessonsCount' })
      .lean();

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const [stats] = await Lesson.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: '$course',
          lessonsCount: { $sum: 1 },
          totalDurationMins: { $sum: { $ifNull: ['$durationMins', 0] } },
        },
      },
    ]);

    return res.json({
      ...course,
      lessonsCount: stats?.lessonsCount ?? (typeof course.lessonsCount === 'number' ? course.lessonsCount : 0),
      totalDurationMins: stats?.totalDurationMins || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    const payload = { ...req.body };
    if (payload.accessRule !== 'payment') {
      payload.price = 0;
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const togglePublish = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to publish this course' });
    }

    course.isPublished = !course.isPublished;
    await course.save();

    return res.json({ isPublished: course.isPublished });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await Lesson.deleteMany({ course: req.params.id });
    await Course.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Course deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
