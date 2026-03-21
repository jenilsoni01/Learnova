import Lesson from '../models/Lesson.js';
import Attachment from '../models/Attachment.js';

// Get all lessons for a course
export const getLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const lessons = await Lesson.find({ course: courseId })
      .sort('order')
      .populate('responsible', 'name avatar');

    // Attach attachments for each lesson
    const withAttachments = await Promise.all(
      lessons.map(async (lesson) => {
        const attachments = await Attachment.find({ lesson: lesson._id });
        return {
          ...lesson.toObject(),
          attachments
        };
      })
    );

    res.json(withAttachments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create lesson
export const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, type, order, description, videoUrl, fileUrl, imageUrl, durationMins, allowDownload, attachments } = req.body;

    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required' });
    }

    const lesson = await Lesson.create({
      course: courseId,
      title,
      type,
      order: order || 0,
      description: description || '',
      videoUrl: videoUrl || '',
      fileUrl: fileUrl || '',
      imageUrl: imageUrl || '',
      durationMins: durationMins || 0,
      allowDownload: allowDownload || false,
      responsible: req.user._id
    });

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      await Attachment.insertMany(
        attachments.map((att) => ({
          ...att,
          lesson: lesson._id
        }))
      );
    }

    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update lesson
export const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { attachments, ...lessonData } = req.body;

    const lesson = await Lesson.findByIdAndUpdate(id, lessonData, {
      new: true,
      runValidators: true
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Handle attachments
    if (attachments) {
      await Attachment.deleteMany({ lesson: id });
      if (attachments.length > 0) {
        await Attachment.insertMany(
          attachments.map((att) => ({
            ...att,
            lesson: id
          }))
        );
      }
    }

    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete lesson
export const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await Lesson.findByIdAndDelete(id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Delete associated attachments
    await Attachment.deleteMany({ lesson: id });

    res.json({ message: 'Lesson deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
