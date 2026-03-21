// FILE: server/controllers/lesson.controller.js
// STATUS: MODIFIED
// PURPOSE: Manage lessons and attachment payloads for learner player and admin tools.
// ⚠️ WARNING: This file was modified. Review changes carefully before merging.

import Lesson from '../models/Lesson.js';
import Attachment from '../models/Attachment.js';
import path from 'path';

const toPublicFileUrl = (req, absoluteFilePath) => {
  const publicRoot = path.resolve('public');
  const relativeFilePath = path.relative(publicRoot, absoluteFilePath);
  const publicPath = `/${relativeFilePath.replace(/\\/g, '/')}`;
  return `${req.protocol}://${req.get('host')}${publicPath}`;
};

const inferKind = (mimeType = '') => {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  return 'document';
};

export const getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId })
      .sort('order')
      .lean();

    const withAttachments = await Promise.all(
      lessons.map(async (lesson) => {
        const attachments = await Attachment.find({ lesson: lesson._id }).lean();
        return { ...lesson, attachments };
      })
    );

    return res.json(withAttachments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createLesson = async (req, res) => {
  try {
    const { attachments, ...lessonData } = req.body;
    const lesson = await Lesson.create({
      ...lessonData,
      course: req.params.courseId,
      responsible: req.user._id,
    });

    if (Array.isArray(attachments) && attachments.length > 0) {
      await Attachment.insertMany(
        attachments.map((item) => ({
          ...item,
          lesson: lesson._id,
        }))
      );
    }

    return res.status(201).json(lesson);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const { attachments, ...lessonData } = req.body;

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, lessonData, {
      new: true,
      runValidators: true,
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (Array.isArray(attachments)) {
      await Attachment.deleteMany({ lesson: req.params.id });
      if (attachments.length > 0) {
        await Attachment.insertMany(
          attachments.map((item) => ({
            ...item,
            lesson: req.params.id,
          }))
        );
      }
    }

    return res.json(lesson);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    await Attachment.deleteMany({ lesson: req.params.id });

    return res.json({ message: 'Lesson deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadLessonAsset = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: 'File is required' });
    }

    return res.status(201).json({
      url: toPublicFileUrl(req, req.file.path),
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      kind: inferKind(req.file.mimetype),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
