// FILE: server/utils/progress.utils.js
// STATUS: NEW
// PURPOSE: Reusable progress calculator for enrollment completion metrics.

import Lesson from '../models/Lesson.js';
import LessonProgress from '../models/LessonProgress.js';

const computeCompletionPct = async (enrollmentId, courseId) => {
  const totalLessons = await Lesson.countDocuments({ course: courseId });
  const completedCount = await LessonProgress.countDocuments({
    enrollment: enrollmentId,
    status: 'completed',
  });

  const completionPct =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return { completionPct, completedCount, totalLessons };
};

export { computeCompletionPct };
