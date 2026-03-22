import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import LessonProgress from '../models/LessonProgress.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';

export const getGeneralLeaderboard = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;
    const search = String(req.query.search || '').trim();

    const filter = { role: 'learner' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [totalItems, learners] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('name email avatar totalPoints badgeLevel createdAt')
        .sort({ totalPoints: -1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    return res.json({
      data: learners.map((learner, idx) => ({
        rank: skip + idx + 1,
        ...learner,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get course reporting dashboard
export const getReportingDashboard = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate('createdBy', 'name');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get all enrollments for course
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('learner', 'name email avatar badgeLevel totalPoints');

    // Get lessons for course
    const lessons = await Lesson.find({ course: courseId }).sort('order');

    // Calculate progress for each learner
    const learnerProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progressRecords = await LessonProgress.find({ enrollment: enrollment._id });
        const completedCount = progressRecords.filter((p) => p.status === 'completed').length;
        const progressPercentage = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

        return {
          _id: enrollment._id,
          learnerName: enrollment.learner.name,
          learnerEmail: enrollment.learner.email,
          learnerAvatar: enrollment.learner.avatar,
          learnerBadge: enrollment.learner.badgeLevel,
          learnerPoints: enrollment.learner.totalPoints,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status,
          progress: progressPercentage,
          lessonCompleted: completedCount,
          totalLessons: lessons.length,
          timeSpent: enrollment.timeSpentMins,
          lastActive: progressRecords[progressRecords.length - 1]?.updatedAt || enrollment.enrolledAt
        };
      })
    );

    // Summary stats
    const completedCount = enrollments.filter((e) => e.status === 'completed').length;
    const inProgressCount = enrollments.filter((e) => e.status === 'in_progress').length;
    const totalTimeSpent = enrollments.reduce((sum, e) => sum + (e.timeSpentMins || 0), 0);

    res.json({
      course: {
        _id: course._id,
        title: course.title,
        createdBy: course.createdBy.name,
        lessonsCount: lessons.length,
        enrollmentsCount: enrollments.length
      },
      stats: {
        totalEnrolled: enrollments.length,
        completed: completedCount,
        inProgress: inProgressCount,
        yetToStart: enrollments.filter((e) => e.status === 'yet_to_start').length,
        totalTimeSpent
      },
      learners: learnerProgress
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get reporting data for all courses (admin) or own courses (instructor)
export const getAllReporting = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // Get courses based on role
    const courseFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
    const totalItems = await Course.countDocuments(courseFilter);
    const courses = await Course.find(courseFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const reportingData = await Promise.all(
      courses.map(async (course) => {
        const enrollments = await Enrollment.find({ course: course._id });
        const lessons = await Lesson.find({ course: course._id });

        const completedCount = enrollments.filter((e) => e.status === 'completed').length;
        const inProgressCount = enrollments.filter((e) => e.status === 'in_progress').length;
        const totalTimeSpent = enrollments.reduce((sum, e) => sum + (e.timeSpentMins || 0), 0);

        return {
          courseId: course._id,
          courseTitle: course.title,
          lessonsCount: lessons.length,
          enrollmentsCount: enrollments.length,
          completed: completedCount,
          inProgress: inProgressCount,
          yetToStart: enrollments.filter((e) => e.status === 'yet_to_start').length,
          totalTimeSpent
        };
      })
    );

    // Overview stats across ALL courses (not just current page)
    const allCourses = await Course.find(courseFilter).select('_id').lean();
    const allCourseIds = allCourses.map(c => c._id);
    const allEnrollments = await Enrollment.find({ course: { $in: allCourseIds } });

    const overview = {
      totalCourses: allCourses.length,
      totalEnrolled: allEnrollments.length,
      completed: allEnrollments.filter(e => e.status === 'completed').length,
      inProgress: allEnrollments.filter(e => e.status === 'in_progress').length,
      yetToStart: allEnrollments.filter(e => e.status === 'yet_to_start').length,
    };

    const totalPages  = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;

    res.json({
      data: reportingData,
      overview,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Export course report
export const exportCourseReport = async (req, res) => {
  try {
    const { courseId } = req.params;

    const reportData = await getCoursReport(courseId);

    // Generate CSV
    const csv = generateCSV(reportData);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="course-report-${courseId}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to generate CSV
const generateCSV = (data) => {
  const { learners } = data;

  let csv = 'Learner Name,Email,Status,Progress %,Lessons Completed,Time Spent (mins),Badge Level,Points\n';

  learners.forEach((learner) => {
    csv += `"${learner.learnerName}","${learner.learnerEmail}","${learner.status}","${learner.progress}%","${learner.lessonCompleted}/${learner.totalLessons}","${learner.timeSpent}","${learner.learnerBadge}","${learner.learnerPoints}"\n`;
  });

  return csv;
};

// Helper function to get course report
const getCoursReport = async (courseId) => {
  const course = await Course.findById(courseId);
  const enrollments = await Enrollment.find({ course: courseId }).populate('learner', 'name email avatar badgeLevel totalPoints');
  const lessons = await Lesson.find({ course: courseId }).sort('order');

  const learnerProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const progressRecords = await LessonProgress.find({ enrollment: enrollment._id });
      const completedCount = progressRecords.filter((p) => p.status === 'completed').length;
      const progressPercentage = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

      return {
        learnerName: enrollment.learner.name,
        learnerEmail: enrollment.learner.email,
        status: enrollment.status,
        progress: progressPercentage,
        lessonCompleted: completedCount,
        totalLessons: lessons.length,
        timeSpent: enrollment.timeSpentMins,
        learnerBadge: enrollment.learner.badgeLevel,
        learnerPoints: enrollment.learner.totalPoints
      };
    })
  );

  return {
    course,
    learners: learnerProgress
  };
};
