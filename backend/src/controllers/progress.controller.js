import LessonProgress from '../models/LessonProgress.js';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';

// Get lesson progress for enrollment
export const getEnrollmentProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId).populate('course', 'title');
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const lessonsProgress = await LessonProgress.find({ enrollment: enrollmentId })
      .populate('lesson', 'title type order');

    // Calculate overall progress percentage
    const totalLessons = await Lesson.countDocuments({ course: enrollment.course._id });
    const completedLessons = lessonsProgress.filter((lp) => lp.status === 'completed').length;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    res.json({
      enrollmentId,
      courseTitle: enrollment.course.title,
      totalLessons,
      completedLessons,
      progressPercentage,
      lessons: lessonsProgress
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update lesson progress
export const updateLessonProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['not_started', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let progress = await LessonProgress.findById(id);

    if (!progress) {
      return res.status(404).json({ message: 'Lesson progress not found' });
    }

    progress.status = status;
    if (status === 'completed') {
      progress.completedAt = new Date();
    }

    await progress.save();
    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Initialize lesson progress for new enrollment
export const initializeLessonProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId).populate('course');
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const lessons = await Lesson.find({ course: enrollment.course._id }).sort('order');

    // Create progress record for each lesson if not already exists
    const progressRecords = [];
    for (const lesson of lessons) {
      const existing = await LessonProgress.findOne({ enrollment: enrollmentId, lesson: lesson._id });
      if (!existing) {
        const progress = await LessonProgress.create({
          enrollment: enrollmentId,
          lesson: lesson._id,
          status: 'not_started'
        });
        progressRecords.push(progress);
      }
    }

    res.json({
      message: 'Lesson progress initialized',
      created: progressRecords.length,
      progress: progressRecords
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
