import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';

// Get quizzes for a course
export const getQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizzes = await Quiz.find({ course: courseId })
      .populate('lesson', 'title')
      .sort('createdAt');

    // Get question count for each quiz
    const withQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await Question.countDocuments({ quiz: quiz._id });
        return {
          ...quiz.toObject(),
          questionCount
        };
      })
    );

    res.json(withQuestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get quiz with questions
export const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate('lesson', 'title');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const questions = await Question.find({ quiz: id }).sort('order');

    res.json({
      ...quiz.toObject(),
      questions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create quiz
export const createQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, lesson, pointsAttempt1, pointsAttempt2, pointsAttempt3, pointsAttempt4Plus } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Quiz title is required' });
    }

    const quiz = await Quiz.create({
      course: courseId,
      lesson: lesson || null,
      title,
      pointsAttempt1: pointsAttempt1 || 10,
      pointsAttempt2: pointsAttempt2 || 7,
      pointsAttempt3: pointsAttempt3 || 5,
      pointsAttempt4Plus: pointsAttempt4Plus || 3
    });

    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update quiz
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedUpdates = ['title', 'lesson', 'pointsAttempt1', 'pointsAttempt2', 'pointsAttempt3', 'pointsAttempt4Plus'];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const quiz = await Quiz.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findByIdAndDelete(id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Delete questions associated with quiz
    await Question.deleteMany({ quiz: id });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
