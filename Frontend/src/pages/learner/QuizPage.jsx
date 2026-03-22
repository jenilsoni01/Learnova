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
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadAttempts = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get(`/quizzes/${quizId}/attempts/me`);
      setAttemptHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAttemptHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

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
    loadAttempts();
  }, [courseId, quizId]);

  const questions = quiz?.questions || [];
  const totalAttempts = attemptHistory.length;

  const formatAttemptPct = (attempt) => {
    if (!attempt?.totalQuestions) return 0;
    return Math.round((attempt.score / attempt.totalQuestions) * 100);
  };

  const formatAttemptDate = (value) => {
    if (!value) return 'Unknown time';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown time';
    return date.toLocaleString();
  };

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
      await loadAttempts();
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
              {pct === 100 ? (
                <span>Perfect Score! <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></span>
              ) : pct >= 60 ? (
                <span>Great job! <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }}><path d="M7 3V1.5a.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5V3"/><path d="M20 8h1.5a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.5H20"/><path d="M7 8H5.5a.5.5 0 0 1-.5-.5.5.5 0 0 1 .5-.5H7"/><path d="M7 14v1.5a.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5V14"/><path d="M20 15h1.5a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.5H20"/><path d="M14 4h1.5a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.5H14"/><path d="M10 7v5.5a2.5 2.5 0 0 0 5 0V7.1"/></svg></span>
              ) : (
                <span>Keep practicing! <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }}><path d="M6 2v20M18 7v13M6 9l12 4"/><circle cx="12" cy="12" r="3"/></svg></span>
              )}
            </div>

            <div className="results-meta">Attempt #{result.attemptNumber} • Total attempts: {totalAttempts}</div>

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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M8 16H3v5"/>
                </svg>
                Retry Quiz
              </button>
            </div>

            <div className="attempts-panel results-attempts">
              <h3>Previous Attempts</h3>
              {historyLoading ? (
                <p className="attempts-empty">Loading attempt history...</p>
              ) : attemptHistory.length === 0 ? (
                <p className="attempts-empty">No attempts yet.</p>
              ) : (
                <div className="attempts-list">
                  {attemptHistory.map((attempt) => {
                    const attemptPct = formatAttemptPct(attempt);
                    return (
                      <div className="attempt-row" key={attempt._id}>
                        <div className="attempt-left">
                          <div className="attempt-title">Attempt #{attempt.attemptNumber}</div>
                          <div className="attempt-time">{formatAttemptDate(attempt.completedAt || attempt.createdAt)}</div>
                        </div>
                        <div className="attempt-right">
                          <div className="attempt-score">{attempt.score}/{attempt.totalQuestions}</div>
                          <div className="attempt-pct">{attemptPct}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
          <p>{questions.length} questions • {historyLoading ? 'Loading attempts...' : `${totalAttempts} previous attempts`}</p>
        </div>

        <div className="attempts-panel">
          <h3>Previous Attempts</h3>
          {historyLoading ? (
            <p className="attempts-empty">Loading attempt history...</p>
          ) : attemptHistory.length === 0 ? (
            <p className="attempts-empty">You have not attempted this quiz yet.</p>
          ) : (
            <div className="attempts-list">
              {attemptHistory.slice(0, 5).map((attempt) => {
                const attemptPct = formatAttemptPct(attempt);
                return (
                  <div className="attempt-row" key={attempt._id}>
                    <div className="attempt-left">
                      <div className="attempt-title">Attempt #{attempt.attemptNumber}</div>
                      <div className="attempt-time">{formatAttemptDate(attempt.completedAt || attempt.createdAt)}</div>
                    </div>
                    <div className="attempt-right">
                      <div className="attempt-score">{attempt.score}/{attempt.totalQuestions}</div>
                      <div className="attempt-pct">{attemptPct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              {submitting ? 'Submitting...' : (
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Submit Quiz
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default QuizPage;
