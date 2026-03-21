import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/common/Navbar';
import Toast from '../../components/common/Toast';
import './CourseBuilder.css';

const EMPTY_LESSON = { title: '', type: 'video', description: '', videoUrl: '', durationMins: 0 };
const EMPTY_QUESTION = { text: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] };
const EMPTY_QUIZ = { title: '', questions: [{ ...EMPTY_QUESTION }] };

const CourseBuilder = () => {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(editId);
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState(editId || null);

  // Course data
  const [courseData, setCourseData] = useState({
    title: '', description: '', coverImage: '', tags: '',
    accessRule: 'open', visibility: 'everyone', price: 0, websiteUrl: ''
  });

  // Lessons
  const [lessons, setLessons] = useState([]);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ ...EMPTY_LESSON });
  const [editLessonId, setEditLessonId] = useState(null);

  // Quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizForm, setQuizForm] = useState({ ...EMPTY_QUIZ, questions: [{ ...EMPTY_QUESTION, options: [...EMPTY_QUESTION.options.map(o => ({...o}))] }] });

  // Load existing course data if editing
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const [courseRes, lessonsRes, quizzesRes] = await Promise.all([
          api.get(`/courses/${editId}`),
          api.get(`/lessons/course/${editId}`).catch(() => ({ data: [] })),
          api.get(`/quizzes/course/${editId}`).catch(() => ({ data: [] }))
        ]);
        const c = courseRes.data;
        setCourseData({
          title: c.title || '', description: c.description || '', coverImage: c.coverImage || '',
          tags: (c.tags || []).join(', '), accessRule: c.accessRule || 'open',
          visibility: c.visibility || 'everyone', price: c.price || 0, websiteUrl: c.websiteUrl || ''
        });
        setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
        setQuizzes(Array.isArray(quizzesRes.data) ? quizzesRes.data : []);
      } catch {
        setToast({ message: 'Failed to load course data', type: 'error' });
      }
    };
    load();
  }, [editId, isEdit]);

  // Step 1: Save/update course
  const handleSaveCourse = async () => {
    if (!courseData.title.trim()) {
      setToast({ message: 'Course title is required', type: 'error' });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...courseData,
        tags: courseData.tags.split(',').map(t => t.trim()).filter(Boolean),
        price: Number(courseData.price) || 0
      };
      if (isEdit || courseId) {
        await api.put(`/courses/${courseId}`, payload);
        setToast({ message: 'Course updated!', type: 'success' });
      } else {
        const res = await api.post('/courses', payload);
        setCourseId(res.data._id);
        setToast({ message: 'Course created!', type: 'success' });
      }
      setStep(2);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save course', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Step 2: Lessons
  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      setToast({ message: 'Lesson title is required', type: 'error' });
      return;
    }
    try {
      setSaving(true);
      const payload = { ...lessonForm, order: lessons.length + 1, durationMins: Number(lessonForm.durationMins) || 0 };
      if (editLessonId) {
        const res = await api.put(`/lessons/${editLessonId}`, payload);
        setLessons(prev => prev.map(l => l._id === editLessonId ? res.data : l));
        setToast({ message: 'Lesson updated', type: 'success' });
      } else {
        const res = await api.post(`/lessons/course/${courseId}`, payload);
        setLessons(prev => [...prev, res.data]);
        setToast({ message: 'Lesson added', type: 'success' });
      }
      setLessonForm({ ...EMPTY_LESSON });
      setShowLessonForm(false);
      setEditLessonId(null);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save lesson', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      await api.delete(`/lessons/${lessonId}`);
      setLessons(prev => prev.filter(l => l._id !== lessonId));
      setToast({ message: 'Lesson deleted', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to delete lesson', type: 'error' });
    }
  };

  const handleEditLesson = (lesson) => {
    setLessonForm({
      title: lesson.title || '', type: lesson.type || 'video',
      description: lesson.description || '', videoUrl: lesson.videoUrl || '',
      durationMins: lesson.durationMins || 0
    });
    setEditLessonId(lesson._id);
    setShowLessonForm(true);
  };

  // Step 3: Quizzes
  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim()) {
      setToast({ message: 'Quiz title is required', type: 'error' });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: quizForm.title,
        questions: quizForm.questions.map((q, i) => ({
          text: q.text,
          order: i + 1,
          options: q.options
        }))
      };
      const res = await api.post(`/quizzes/course/${courseId}`, payload);
      setQuizzes(prev => [...prev, { ...res.data, questions: payload.questions }]);
      setQuizForm({ ...EMPTY_QUIZ, questions: [{ ...EMPTY_QUESTION, options: [...EMPTY_QUESTION.options.map(o => ({...o}))] }] });
      setShowQuizForm(false);
      setToast({ message: 'Quiz added', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save quiz', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      await api.delete(`/quizzes/${quizId}`);
      setQuizzes(prev => prev.filter(q => q._id !== quizId));
      setToast({ message: 'Quiz deleted', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete quiz', type: 'error' });
    }
  };

  // Quiz form helpers
  const addQuestion = () => {
    setQuizForm(p => ({
      ...p,
      questions: [...p.questions, { text: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }]
    }));
  };

  const updateQuestion = (qi, field, val) => {
    setQuizForm(p => ({
      ...p,
      questions: p.questions.map((q, i) => i === qi ? { ...q, [field]: val } : q)
    }));
  };

  const addOption = (qi) => {
    setQuizForm(p => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === qi ? { ...q, options: [...q.options, { text: '', isCorrect: false }] } : q
      )
    }));
  };

  const updateOption = (qi, oi, field, val) => {
    setQuizForm(p => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === qi ? {
          ...q,
          options: q.options.map((o, j) => j === oi ? { ...o, [field]: val } : o)
        } : q
      )
    }));
  };

  const removeQuestion = (qi) => {
    setQuizForm(p => ({
      ...p,
      questions: p.questions.filter((_, i) => i !== qi)
    }));
  };

  return (
    <div className="course-builder">
      <Navbar />
      <div className="builder-container">
        <div className="builder-header">
          <h1 className="gradient-text">{isEdit ? 'Edit Course' : 'Create Course'}</h1>
          <p>Build your course step by step.</p>
        </div>

        {/* Stepper */}
        <div className="builder-stepper">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`} onClick={() => step > 1 && setStep(1)}>
            <span className="step-number">{step > 1 ? '✓' : '1'}</span>
            <span>Course Info</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`} onClick={() => courseId && step > 2 && setStep(2)}>
            <span className="step-number">{step > 2 ? '✓' : '2'}</span>
            <span>Lessons</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step >= 3 ? 'active' : ''}`} onClick={() => courseId && setStep(3)}>
            <span className="step-number">3</span>
            <span>Quizzes</span>
          </div>
        </div>

        {/* Step 1: Course info */}
        {step === 1 && (
          <div className="builder-form-section">
            <h2>📚 Course Details</h2>
            <div className="builder-form-grid">
              <div className="form-group full-width">
                <label>Title *</label>
                <input className="form-input" placeholder="Course title" value={courseData.title}
                  onChange={e => setCourseData(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea className="form-input" placeholder="Course description" value={courseData.description}
                  onChange={e => setCourseData(p => ({ ...p, description: e.target.value }))} rows={4} />
              </div>
              <div className="form-group full-width">
                <label>Cover Image URL</label>
                <input className="form-input" placeholder="https://..." value={courseData.coverImage}
                  onChange={e => setCourseData(p => ({ ...p, coverImage: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input className="form-input" placeholder="React, JavaScript" value={courseData.tags}
                  onChange={e => setCourseData(p => ({ ...p, tags: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input className="form-input" type="number" min="0" value={courseData.price}
                  onChange={e => setCourseData(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Access Rule</label>
                <select className="form-input" value={courseData.accessRule}
                  onChange={e => setCourseData(p => ({ ...p, accessRule: e.target.value }))}>
                  <option value="open">Open</option>
                  <option value="invitation">Invitation Only</option>
                  <option value="payment">Payment Required</option>
                </select>
              </div>
              <div className="form-group">
                <label>Visibility</label>
                <select className="form-input" value={courseData.visibility}
                  onChange={e => setCourseData(p => ({ ...p, visibility: e.target.value }))}>
                  <option value="everyone">Everyone</option>
                  <option value="signed_in">Signed In Users</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Website URL</label>
                <input className="form-input" placeholder="https://..." value={courseData.websiteUrl}
                  onChange={e => setCourseData(p => ({ ...p, websiteUrl: e.target.value }))} />
              </div>
            </div>
            <div className="builder-nav" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/instructor')}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveCourse} disabled={saving}>
                {saving ? 'Saving...' : 'Save & Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Lessons */}
        {step === 2 && (
          <div className="builder-form-section">
            <h2>📖 Lessons</h2>
            {lessons.length > 0 && (
              <div className="lesson-items">
                {lessons.map((lesson, i) => (
                  <div key={lesson._id} className="lesson-item">
                    <div className="lesson-item-left">
                      <span className="drag-handle">☰</span>
                      <div className="item-details">
                        <div className="item-title">{lesson.title}</div>
                        <div className="item-meta">{lesson.type} {lesson.durationMins ? `• ${lesson.durationMins}m` : ''}</div>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditLesson(lesson)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLesson(lesson._id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showLessonForm && (
              <div className="add-form">
                <div className="form-group">
                  <label>Lesson Title *</label>
                  <input className="form-input" placeholder="Lesson title" value={lessonForm.title}
                    onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="builder-form-grid">
                  <div className="form-group">
                    <label>Type</label>
                    <select className="form-input" value={lessonForm.type}
                      onChange={e => setLessonForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Duration (min)</label>
                    <input className="form-input" type="number" min="0" value={lessonForm.durationMins}
                      onChange={e => setLessonForm(p => ({ ...p, durationMins: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Video URL</label>
                  <input className="form-input" placeholder="YouTube or Vimeo URL" value={lessonForm.videoUrl}
                    onChange={e => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" rows={2} placeholder="Lesson description" value={lessonForm.description}
                    onChange={e => setLessonForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="add-form-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => { setShowLessonForm(false); setEditLessonId(null); }}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveLesson} disabled={saving}>
                    {saving ? 'Saving...' : editLessonId ? 'Update Lesson' : 'Add Lesson'}
                  </button>
                </div>
              </div>
            )}

            {!showLessonForm && (
              <button className="btn btn-secondary" onClick={() => { setShowLessonForm(true); setLessonForm({ ...EMPTY_LESSON }); setEditLessonId(null); }}>
                ➕ Add Lesson
              </button>
            )}

            <div className="builder-nav" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Continue to Quizzes →</button>
            </div>
          </div>
        )}

        {/* Step 3: Quizzes */}
        {step === 3 && (
          <div className="builder-form-section">
            <h2>📝 Quizzes</h2>

            {quizzes.length > 0 && (
              <div className="quiz-items" style={{ marginBottom: '1rem' }}>
                {quizzes.map(quiz => (
                  <div key={quiz._id} className="lesson-item">
                    <div className="lesson-item-left">
                      <div className="item-details">
                        <div className="item-title">{quiz.title}</div>
                        <div className="item-meta">{quiz.questions?.length || 0} questions</div>
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuiz(quiz._id)}>🗑️</button>
                  </div>
                ))}
              </div>
            )}

            {showQuizForm && (
              <div className="add-form">
                <div className="form-group">
                  <label>Quiz Title *</label>
                  <input className="form-input" placeholder="Quiz title" value={quizForm.title}
                    onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))} />
                </div>

                {quizForm.questions.map((q, qi) => (
                  <div key={qi} className="question-builder">
                    <div className="q-header">
                      <span className="q-number">Question {qi + 1}</span>
                      {quizForm.questions.length > 1 && (
                        <button className="btn btn-danger btn-sm" onClick={() => removeQuestion(qi)}>Remove</button>
                      )}
                    </div>
                    <input className="form-input" placeholder="Question text" value={q.text}
                      onChange={e => updateQuestion(qi, 'text', e.target.value)} />
                    <div className="question-options-list">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="question-option-input">
                          <input className="form-input" placeholder={`Option ${oi + 1}`} value={opt.text}
                            style={{ flex: 1 }}
                            onChange={e => updateOption(qi, oi, 'text', e.target.value)} />
                          <button
                            type="button"
                            className={`correct-toggle ${opt.isCorrect ? 'active' : ''}`}
                            onClick={() => updateOption(qi, oi, 'isCorrect', !opt.isCorrect)}
                          >
                            {opt.isCorrect ? '✓ Correct' : 'Mark Correct'}
                          </button>
                        </div>
                      ))}
                      <button className="btn btn-secondary btn-sm" onClick={() => addOption(qi)} style={{ alignSelf: 'flex-start' }}>
                        + Option
                      </button>
                    </div>
                  </div>
                ))}

                <button className="btn btn-secondary btn-sm" onClick={addQuestion}>
                  + Add Question
                </button>

                <div className="add-form-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowQuizForm(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveQuiz} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Quiz'}
                  </button>
                </div>
              </div>
            )}

            {!showQuizForm && (
              <button className="btn btn-secondary" onClick={() => setShowQuizForm(true)}>
                ➕ Add Quiz
              </button>
            )}

            <div className="builder-nav" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/instructor')}>
                ✅ Finish
              </button>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CourseBuilder;
