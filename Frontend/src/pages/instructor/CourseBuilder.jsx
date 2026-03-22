import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/common/Navbar';
import Toast from '../../components/common/Toast';
import './CourseBuilder.css';

const EMPTY_LESSON = {
  title: '',
  type: 'video',
  description: '',
  videoUrl: '',
  fileUrl: '',
  imageUrl: '',
  allowDownload: false,
  durationMins: 0,
  attachments: []
};
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
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invitationList, setInvitationList] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  // Course data
  const [courseData, setCourseData] = useState({
    title: '', description: '', coverImage: '', tags: '',
    accessRule: 'open', visibility: 'everyone', price: 0
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
          visibility: c.visibility || 'everyone', price: c.price || 0
        });
        setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
        setQuizzes(Array.isArray(quizzesRes.data) ? quizzesRes.data : []);
      } catch {
        setToast({ message: 'Failed to load course data', type: 'error' });
      }
    };
    load();
  }, [editId, isEdit]);

  const activeCourseId = courseId || editId;

  const fetchInvitations = async (targetCourseId) => {
    if (!targetCourseId) return;
    try {
      setLoadingInvites(true);
      const { data } = await api.get(`/enrollments/course/${targetCourseId}/invitations`);
      setInvitationList(Array.isArray(data) ? data : []);
    } catch {
      setInvitationList([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    if (courseData.accessRule === 'invitation' && activeCourseId) {
      fetchInvitations(activeCourseId);
    }
  }, [courseData.accessRule, activeCourseId]);

  const uploadCourseCover = async (file) => {
    const fd = new FormData();
    fd.append('coverImage', file);
    const { data } = await api.post('/courses/upload/cover', fd);
    return data.url;
  };

  const uploadLessonAsset = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/lessons/upload', fd);
    return data;
  };

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const url = await uploadCourseCover(file);
      setCourseData(p => ({ ...p, coverImage: url }));
      setToast({ message: 'Cover image uploaded', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to upload cover image', type: 'error' });
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleLessonFileUpload = async (e, targetField) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const uploaded = await uploadLessonAsset(file);
      setLessonForm(p => ({
        ...p,
        [targetField]: uploaded.url,
        ...(targetField === 'videoUrl' && Number.isFinite(uploaded.durationMins)
          ? { durationMins: uploaded.durationMins }
          : {})
      }));
      setToast({ message: 'Lesson file uploaded', type: 'success' });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message || 'Failed to upload lesson file';
      setToast({ message: status ? `Upload failed (${status}): ${message}` : message, type: 'error' });
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const uploaded = await uploadLessonAsset(file);
      const newAttachment = {
        type: 'file',
        name: uploaded.originalName || uploaded.fileName,
        url: uploaded.url
      };
      setLessonForm(p => ({ ...p, attachments: [...(p.attachments || []), newAttachment] }));
      setToast({ message: 'Attachment uploaded', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to upload attachment', type: 'error' });
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index) => {
    setLessonForm(p => ({
      ...p,
      attachments: (p.attachments || []).filter((_, i) => i !== index)
    }));
  };

  const handleSendInvites = async () => {
    if (!activeCourseId) {
      setToast({ message: 'Save course first before sending invites', type: 'error' });
      return;
    }

    const emails = inviteEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      setToast({ message: 'Enter at least one email', type: 'error' });
      return;
    }

    try {
      setInviting(true);
      const { data } = await api.post(`/enrollments/${activeCourseId}/invite`, { emails });
      const invitedCount = Array.isArray(data.invited) ? data.invited.length : 0;
      const skippedCount = Array.isArray(data.skipped) ? data.skipped.length : 0;
      setToast({
        message: `Invites sent: ${invitedCount}${skippedCount ? `, skipped: ${skippedCount}` : ''}`,
        type: 'success'
      });
      if (invitedCount > 0) setInviteEmails('');
      fetchInvitations(activeCourseId);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to send invites', type: 'error' });
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    if (!activeCourseId) return;
    try {
      await api.patch(`/enrollments/course/${activeCourseId}/invitations/${invitationId}/revoke`);
      setToast({ message: 'Invitation revoked', type: 'success' });
      fetchInvitations(activeCourseId);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to revoke invitation', type: 'error' });
    }
  };

  const handleResendInvitation = async (invitationId) => {
    if (!activeCourseId) return;
    try {
      await api.patch(`/enrollments/course/${activeCourseId}/invitations/${invitationId}/resend`);
      setToast({ message: 'Invitation marked as re-sent', type: 'success' });
      fetchInvitations(activeCourseId);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to resend invitation', type: 'error' });
    }
  };

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
        price: courseData.accessRule === 'payment' ? (Number(courseData.price) || 0) : 0
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
      const payload = {
        ...lessonForm,
        order: editLessonId ? lessonForm.order || 1 : lessons.length + 1,
        durationMins: Number(lessonForm.durationMins) || 0,
        attachments: Array.isArray(lessonForm.attachments) ? lessonForm.attachments : []
      };
      if (editLessonId) {
        const res = await api.put(`/lessons/${editLessonId}`, payload);
        setLessons(prev => prev.map(l => l._id === editLessonId ? { ...l, ...res.data, attachments: payload.attachments } : l));
        setToast({ message: 'Lesson updated', type: 'success' });
      } else {
        const res = await api.post(`/lessons/course/${courseId}`, payload);
        setLessons(prev => [...prev, { ...res.data, attachments: payload.attachments }]);
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
      fileUrl: lesson.fileUrl || '', imageUrl: lesson.imageUrl || '',
      allowDownload: Boolean(lesson.allowDownload),
      durationMins: lesson.durationMins || 0,
      order: lesson.order || 1,
      attachments: Array.isArray(lesson.attachments) ? lesson.attachments : []
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
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              Course Details
            </h2>
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
                <input
                  className="form-input"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  style={{ marginTop: '0.5rem' }}
                />
                {courseData.coverImage && (
                  <img
                    src={courseData.coverImage}
                    alt="Course cover preview"
                    style={{ marginTop: '0.5rem', maxWidth: '220px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}
                  />
                )}
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input className="form-input" placeholder="React, JavaScript" value={courseData.tags}
                  onChange={e => setCourseData(p => ({ ...p, tags: e.target.value }))} />
              </div>
              {courseData.accessRule === 'payment' && (
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input className="form-input" type="number" min="0" value={courseData.price}
                    onChange={e => setCourseData(p => ({ ...p, price: e.target.value }))} />
                </div>
              )}
              <div className="form-group">
                <label>Access Rule</label>
                <select className="form-input" value={courseData.accessRule}
                  onChange={e => {
                    const newRule = e.target.value;
                    setCourseData(p => ({
                      ...p,
                      accessRule: newRule,
                      price: newRule !== 'payment' ? 0 : p.price
                    }));
                  }}>
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
            </div>
            <div className="builder-nav" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/instructor')}>Cancel</button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {activeCourseId && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => window.open(`/courses/${activeCourseId}`, '_blank')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Preview
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleSaveCourse} disabled={saving}>
                  {saving ? 'Saving...' : 'Save & Continue →'}
                </button>
              </div>
            </div>

            {courseData.accessRule === 'invitation' && (courseId || isEdit) && (
              <div className="add-form" style={{ marginTop: '1rem' }}>
                <h3 style={{ margin: 0 }}>Send Course Invites</h3>
                <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.85rem' }}>
                  Add learner emails separated by comma or new line.
                </p>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="learner1@example.com, learner2@example.com"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                />
                <div className="add-form-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleSendInvites} disabled={inviting}>
                    {inviting ? 'Sending...' : 'Send Invites'}
                  </button>
                </div>

                <div style={{ marginTop: '0.8rem' }}>
                  <h4 style={{ margin: '0 0 0.4rem 0' }}>Invited Learners</h4>
                  {loadingInvites ? (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>Loading invites...</p>
                  ) : invitationList.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>No invites sent yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {invitationList.map((inv) => (
                        <div
                          key={inv._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.6rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            padding: '0.5rem 0.65rem'
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.email}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text)', textTransform: 'capitalize' }}>
                              Status: {inv.status}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleResendInvitation(inv._id)}>Resend</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleRevokeInvitation(inv._id)}>Revoke</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Lessons */}
        {step === 2 && (
          <div className="builder-form-section">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <line x1="10" y1="6" x2="16" y2="6"/>
                <line x1="10" y1="10" x2="16" y2="10"/>
                <line x1="10" y1="14" x2="14" y2="14"/>
              </svg>
              Lessons
            </h2>
            {lessons.length > 0 && (
              <div className="lesson-items">
                {lessons.map((lesson, i) => (
                  <div key={lesson._id} className="lesson-item">
                    <div className="lesson-item-left">
                      <span className="drag-handle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <line x1="3" y1="12" x2="21" y2="12"/>
                          <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                      </span>
                      <div className="item-details">
                        <div className="item-title">{lesson.title}</div>
                        <div className="item-meta">{lesson.type} {lesson.durationMins ? `• ${lesson.durationMins}m` : ''}</div>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditLesson(lesson)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLesson(lesson._id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
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
                  <label>Lesson Asset</label>
                  {lessonForm.type === 'video' && (
                    <>
                      <input className="form-input" placeholder="YouTube, Vimeo or direct video URL" value={lessonForm.videoUrl}
                        onChange={e => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))} />
                      <input
                        className="form-input"
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleLessonFileUpload(e, 'videoUrl')}
                        style={{ marginTop: '0.5rem' }}
                      />
                      {lessonForm.videoUrl && (
                        <a href={lessonForm.videoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '0.4rem' }}>
                          Preview uploaded video
                        </a>
                      )}
                    </>
                  )}
                  {lessonForm.type === 'document' && (
                    <>
                      <input className="form-input" placeholder="Document URL" value={lessonForm.fileUrl}
                        onChange={e => setLessonForm(p => ({ ...p, fileUrl: e.target.value }))} />
                      <input
                        className="form-input"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                        onChange={(e) => handleLessonFileUpload(e, 'fileUrl')}
                        style={{ marginTop: '0.5rem' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={lessonForm.allowDownload}
                          onChange={(e) => setLessonForm(p => ({ ...p, allowDownload: e.target.checked }))}
                        />
                        Allow document download
                      </label>
                      {lessonForm.fileUrl && (
                        <a href={lessonForm.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '0.4rem' }}>
                          Preview document
                        </a>
                      )}
                    </>
                  )}
                  {lessonForm.type === 'image' && (
                    <>
                      <input className="form-input" placeholder="Image URL" value={lessonForm.imageUrl}
                        onChange={e => setLessonForm(p => ({ ...p, imageUrl: e.target.value }))} />
                      <input
                        className="form-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLessonFileUpload(e, 'imageUrl')}
                        style={{ marginTop: '0.5rem' }}
                      />
                      {lessonForm.imageUrl && (
                        <img
                          src={lessonForm.imageUrl}
                          alt="Lesson preview"
                          style={{ display: 'block', marginTop: '0.5rem', maxWidth: '260px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}
                        />
                      )}
                    </>
                  )}
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" rows={2} placeholder="Lesson description" value={lessonForm.description}
                    onChange={e => setLessonForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Attachments (optional)</label>
                  <input
                    className="form-input"
                    type="file"
                    onChange={handleAttachmentUpload}
                  />
                  {(lessonForm.attachments || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.6rem' }}>
                      {lessonForm.attachments.map((att, index) => (
                        <div key={`${att.url}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', fontSize: '0.82rem' }}>
                          <a href={att.url} target="_blank" rel="noreferrer" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.name || `Attachment ${index + 1}`}
                          </a>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeAttachment(index)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Lesson
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
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              Quizzes
            </h2>

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
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuiz(quiz._id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Quiz
              </button>
            )}

            <div className="builder-nav" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/instructor')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Finish
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
