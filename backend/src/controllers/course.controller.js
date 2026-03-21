import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';

// Get public published courses (for learners/guests)
export const getPublicCourses = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { isPublished: true };

    // If guest (no user), only show 'everyone' visibility courses
    if (!req.user) {
      filter.visibility = 'everyone';
    }

    // Search by title
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const courses = await Course.find(filter)
      .populate('responsible', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 });

    // Attach lesson count and total duration
    const result = await Promise.all(
      courses.map(async (c) => {
        const lessons = await Lesson.find({ course: c._id });
        const lessonsCount = lessons.length;
        const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.durationMins || 0), 0);

        return {
          ...c.toObject(),
          lessonsCount,
          totalDuration
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get admin/instructor courses (dashboard view)
export const getAdminCourses = async (req, res) => {
  try {
    const { search, view = 'list' } = req.query;

    // Admin sees all courses, instructor sees only their courses
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const courses = await Course.find(filter)
      .populate('responsible', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 });

    // Attach lesson count, total duration, and view info
    const result = await Promise.all(
      courses.map(async (c) => {
        const lessons = await Lesson.find({ course: c._id });
        const lessonsCount = lessons.length;
        const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.durationMins || 0), 0);

        return {
          ...c.toObject(),
          lessonsCount,
          totalDuration,
          view
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new course
export const createCourse = async (req, res) => {
  try {
    const { title, description, coverImage, tags, accessRule, price, visibility } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Course title is required' });
    }

    const newCourse = await Course.create({
      title,
      description: description || '',
      coverImage: coverImage || '',
      tags: tags || [],
      accessRule: accessRule || 'open',
      price: price || 0,
      visibility: visibility || 'everyone',
      createdBy: req.user._id,
      isPublished: false
    });

    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get course by ID with full details
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('responsible', 'name avatar email')
      .populate('createdBy', 'name avatar email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get lessons and calculate total duration
    const lessons = await Lesson.find({ course: course._id }).sort('order');
    const lessonsCount = lessons.length;
    const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.durationMins || 0), 0);

    res.json({
      ...course.toObject(),
      lessonsCount,
      totalDuration,
      lessons
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update course details
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check authorization
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    const allowedUpdates = [
      'title',
      'description',
      'coverImage',
      'tags',
      'websiteUrl',
      'visibility',
      'accessRule',
      'price',
      'responsible'
    ];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedCourse = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('responsible createdBy', 'name avatar');

    res.json(updatedCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle course publish status
export const togglePublish = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to publish this course' });
    }

    // Before publishing, check if course has required fields
    if (!course.isPublished) {
      if (!course.title || !course.description) {
        return res.status(400).json({ message: 'Course title and description are required before publishing' });
      }

      // Check if course has at least one lesson
      const lessonsCount = await Lesson.countDocuments({ course: course._id });
      if (lessonsCount === 0) {
        return res.status(400).json({ message: 'Course must have at least one lesson before publishing' });
      }
    }

    course.isPublished = !course.isPublished;
    await course.save();

    res.json({
      message: course.isPublished ? 'Course published successfully' : 'Course unpublished successfully',
      isPublished: course.isPublished
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    // Delete all lessons and attachments associated with course
    const lessons = await Lesson.find({ course: req.params.id });
    const lessonIds = lessons.map((l) => l._id);

    await Lesson.deleteMany({ course: req.params.id });
    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: 'Course and all associated lessons deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Generate shareable link for course
export const generateShareLink = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to share this course' });
    }

    // Generate shareable URL (front-end will construct the full URL)
    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/course/${course._id}`;

    res.json({
      shareUrl,
      courseId: course._id,
      courseTitle: course.title
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
