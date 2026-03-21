// FILE: server/controllers/quiz.controller.js
// STATUS: MODIFIED
// PURPOSE: Manage quiz CRUD and learner attempt grading, rewards, and history.
// ⚠️ WARNING: This file was modified. Review changes carefully before merging.

import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import { computeBadge } from '../utils/badge.utils.js';

const getPointsForAttempt = (quiz, attemptNumber) => {
  if (attemptNumber === 1) return quiz.pointsAttempt1;
  if (attemptNumber === 2) return quiz.pointsAttempt2;
  if (attemptNumber === 3) return quiz.pointsAttempt3;
  return quiz.pointsAttempt4Plus;
};

export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ course: req.params.courseId }).sort('createdAt').lean();

    const result = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await Question.find({ quiz: quiz._id }).sort('order').lean();
        return { ...quiz, questions };
      })
    );

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createQuiz = async (req, res) => {
  try {
    const { questions = [], ...quizData } = req.body;

    const quiz = await Quiz.create({
      ...quizData,
      course: req.params.courseId,
    });

    if (Array.isArray(questions) && questions.length > 0) {
      await Question.insertMany(
        questions.map((q, index) => ({
          ...q,
          quiz: quiz._id,
          order: q.order ?? index + 1,
        }))
      );
    }

    return res.status(201).json(quiz);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { questions, ...quizData } = req.body;

    const quiz = await Quiz.findByIdAndUpdate(req.params.id, quizData, {
      new: true,
      runValidators: true,
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (Array.isArray(questions)) {
      await Question.deleteMany({ quiz: req.params.id });
      if (questions.length > 0) {
        await Question.insertMany(
          questions.map((q, index) => ({
            ...q,
            quiz: req.params.id,
            order: q.order ?? index + 1,
          }))
        );
      }
    }

    return res.json(quiz);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await Question.deleteMany({ quiz: req.params.id });
    await QuizAttempt.deleteMany({ quiz: req.params.id });

    return res.json({ message: 'Quiz deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const startAttempt = async (req, res) => {
  try {
    const { answers } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'answers array is required' });
    }

    const questions = await Question.find({ quiz: quiz._id }).sort('order');
    const previousAttemptsCount = await QuizAttempt.countDocuments({
      quiz: quiz._id,
      learner: req.user._id,
    });
    const attemptNumber = previousAttemptsCount + 1;

    let score = 0;
    const evaluatedAnswers = [];

    for (const question of questions) {
      const userAnswer = answers.find(
        (item) => String(item.questionId) === String(question._id)
      );

      const selectedOptions = (userAnswer?.selectedOptions || []).map(String).sort();
      const correctOptionIds = question.options
        .filter((option) => option.isCorrect)
        .map((option) => String(option._id))
        .sort();

      const isCorrect =
        selectedOptions.length === correctOptionIds.length &&
        selectedOptions.every((id, idx) => id === correctOptionIds[idx]);

      if (isCorrect) score += 1;

      evaluatedAnswers.push({
        question: question._id,
        selectedOptions,
        isCorrect,
      });
    }

    const pointsEarned = getPointsForAttempt(quiz, attemptNumber);

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      learner: req.user._id,
      attemptNumber,
      answers: evaluatedAnswers,
      score,
      totalQuestions: questions.length,
      pointsEarned,
      completedAt: new Date(),
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalPoints: pointsEarned } });
    const updatedUser = await User.findById(req.user._id);
    const badgeLevel = computeBadge(updatedUser.totalPoints);
    if (updatedUser.badgeLevel !== badgeLevel) {
      updatedUser.badgeLevel = badgeLevel;
      await updatedUser.save();
    }
 
     return res.json({
       attemptNumber,
       score,
       totalQuestions: questions.length,
       pointsEarned,
       totalPoints: updatedUser.totalPoints,
       badgeLevel: updatedUser.badgeLevel,
       attempt,
     });
   } catch (error) {
     return res.status(500).json({ message: error.message });
   }
 };
 
 export const getMyAttempts = async (req, res) => {
   try {
     const attempts = await QuizAttempt.find({
       quiz: req.params.id,
       learner: req.user._id,
     }).sort('-createdAt');
 
     return res.json(attempts);
   } catch (error) {
     return res.status(500).json({ message: error.message });
   }
 };
