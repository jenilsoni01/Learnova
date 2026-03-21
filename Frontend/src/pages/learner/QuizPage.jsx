import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/common/Navbar';
import Toast from '../../components/common/Toast';
import './QuizPage.css';

const QuizPage = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quizzes/course/${courseId}`);
        const quizzes = Array.isArray(res.data) ? res.data : [];
        const found = quizzes.find(q => q._id === quizId);
        if (found) setQuiz(found);
        else setToast({ message: 'Quiz not found', type: 'error' });
      } catch (err) {
        setToast({ message: 'Failed to load quiz', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [courseId, quizId]);

  const questions = quiz?.questions || [];

  const handleOptionSelect = (questionId, optionId) => {
    if (result) return; // Don't allow changes after submit
    setAnswers(prev => {
      const current = prev[questionId] || [];
      const isSelected = current.includes(optionId);
      return {
        ...prev,
        [questionId]: isSelected
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
      };
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const answersPayload = questions.map(q => ({
        questionId: q._id,
        selectedOptions: answers[q._id] || []
      }));

      const res = await api.post(`/quizzes/${quizId}/attempt`, { answers: answersPayload });
      setResult(res.data);
      setToast({ message: 'Quiz submitted! 🎉', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to submit quiz', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="quiz-page">
        <Navbar />
        <div className="loading-container"><div className="spinner" /></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-page">
        <Navbar />
        <div className="quiz-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h2>Quiz not found</h2>
          <button className="btn btn-primary" onClick={() => navigate(`/learn/${courseId}`)} style={{ marginTop: '1rem' }}>
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  // Results view
  if (result) {
    const pct = questions.length > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;
    const scoreClass = pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'needs-work';

    return (
      <div className="quiz-page">
        <Navbar />
        <div className="quiz-container quiz-results">
          <div className="results-card">
            <div className={`results-score ${scoreClass}`}>{pct}%</div>
            <div className="results-label">
              {pct === 100 ? 'Perfect Score! 🏆' : pct >= 60 ? 'Great job! 👏' : 'Keep practicing! 💪'}
            </div>

            <div className="results-stats">
              <div className="results-stat">
                <div className="stat-val">{result.score}/{result.totalQuestions}</div>
                <div className="stat-lbl">Correct</div>
              </div>
              <div className="results-stat">
                <div className="stat-val">+{result.pointsEarned}</div>
                <div className="stat-lbl">Points Earned</div>
              </div>
              <div className="results-stat">
                <div className="stat-val">{result.badgeLevel}</div>
                <div className="stat-lbl">Badge Level</div>
              </div>
            </div>

            <div className="results-actions">
              <button className="btn btn-secondary" onClick={() => navigate(`/learn/${courseId}`)}>
                ← Back to Course
              </button>
              <button className="btn btn-primary" onClick={() => { setResult(null); setAnswers({}); setCurrentQ(0); }}>
                🔄 Retry Quiz
              </button>
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  const question = questions[currentQ];

  return (
    <div className="quiz-page">
      <Navbar />
      <div className="quiz-container">
        <div className="quiz-header">
          <h1>{quiz.title}</h1>
          <p>{questions.length} questions</p>
        </div>

        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>

        {question && (
          <div className="question-card" key={question._id}>
            <div className="question-number">Question {currentQ + 1} of {questions.length}</div>
            <div className="question-text">{question.text}</div>

            <div className="options-list">
              {question.options?.map(option => {
                const selected = (answers[question._id] || []).includes(option._id);
                return (
                  <div
                    key={option._id}
                    className={`option-item ${selected ? 'selected' : ''}`}
                    onClick={() => handleOptionSelect(question._id, option._id)}
                  >
                    <div className="option-radio" />
                    <span className="option-text">{option.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="quiz-nav">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentQ(p => Math.max(0, p - 1))}
            disabled={currentQ === 0}
          >
            ← Previous
          </button>
          <span className="quiz-counter">{currentQ + 1} / {questions.length}</span>
          {currentQ < questions.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentQ(p => p + 1)}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : '✓ Submit Quiz'}
            </button>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default QuizPage;
