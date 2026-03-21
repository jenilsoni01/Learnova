import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

// Get user enrollments
export const getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ learner: req.user._id })
      .populate('course', 'title coverImage')
      .sort('-enrolledAt');

    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get course enrollments (instructor/admin)
export const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('learner', 'name email avatar')
      .sort('-enrolledAt');

    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Enroll user in course
export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ course: courseId, learner: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const enrollment = await Enrollment.create({
      course: courseId,
      learner: req.user._id,
      status: 'yet_to_start'
    });

    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update enrollment status
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['yet_to_start', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === 'in_progress' && { startedAt: new Date() }),
        ...(status === 'completed' && { completedAt: new Date() })
      },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Track time spent
export const trackTimeSpent = async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    enrollment.timeSpentMins = (enrollment.timeSpentMins || 0) + minutes;
    await enrollment.save();

    res.json({ timeSpentMins: enrollment.timeSpentMins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
