import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/common/Navbar';
import Toast from '../../components/common/Toast';
import './LessonPlayer.css';

const getEmbedUrl = (url) => {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Direct URL
  return url;
};

const LessonPlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [lessonsRes, progressRes] = await Promise.all([
          api.get(`/lessons/course/${courseId}`),
          api.get(`/progress/${courseId}`)
        ]);

        const lessonsData = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];
        setLessons(lessonsData);

        const progressData = progressRes.data;
        setProgress(progressData);

        // Auto-select first lesson or first incomplete lesson
        if (lessonsData.length > 0) {
          const progressLessons = progressData?.lessons || [];
          const firstIncomplete = lessonsData.find(l => {
            const p = progressLessons.find(pl => pl._id === l._id);
            return !p || p.status !== 'completed';
          });
          setActiveLesson(firstIncomplete || lessonsData[0]);
        }

        // Fetch quizzes
        try {
          const quizzesRes = await api.get(`/quizzes/course/${courseId}`);
          setQuizzes(Array.isArray(quizzesRes.data) ? quizzesRes.data : []);
        } catch {}
      } catch (err) {
        setToast({ message: 'Failed to load lessons', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  const getLessonStatus = (lessonId) => {
    const pl = progress?.lessons?.find(l => l._id === lessonId);
    return pl?.status || 'not_started';
  };

  const handleMarkComplete = async () => {
    if (!activeLesson) return;
    try {
      const res = await api.patch(`/progress/${courseId}/lesson`, {
        lessonId: activeLesson._id,
        status: 'completed'
      });
      // Update local progress
      setProgress(prev => ({
        ...prev,
        completionPct: res.data.completionPct,
        completedCount: res.data.completedCount,
        totalLessons: res.data.totalLessons,
        lessons: prev?.lessons?.map(l =>
          l._id === activeLesson._id ? { ...l, status: 'completed' } : l
        ) || []
      }));
      setToast({ message: 'Lesson completed! 🎉', type: 'success' });

      // Auto-advance to next lesson
      const currentIdx = lessons.findIndex(l => l._id === activeLesson._id);
      if (currentIdx < lessons.length - 1) {
        setActiveLesson(lessons[currentIdx + 1]);
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update progress', type: 'error' });
    }
  };

  const completionPct = progress?.completionPct || 0;
  const completedCount = progress?.completedCount || 0;
  const totalLessons = progress?.totalLessons || lessons.length;

  if (loading) {
    return (
      <div className="lesson-player">
        <Navbar />
        <div className="loading-container"><div className="spinner" /></div>
      </div>
    );
  }

  const hasEmbeddableVideo = Boolean(activeLesson?.videoUrl && /(youtube\.com|youtu\.be|vimeo\.com)/i.test(activeLesson.videoUrl));
  const embedUrl = hasEmbeddableVideo ? getEmbedUrl(activeLesson?.videoUrl) : null;

  return (
    <div className="lesson-player">
      <Navbar />

      <button
        className="lesson-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <path d="M12 11h4"/>
          <path d="M12 16h4"/>
          <path d="M8 11h.01"/>
          <path d="M8 16h.01"/>
        </svg>
        Lessons
      </button>

      {sidebarOpen && (
        <div className="lesson-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lesson-player-layout">
        {/* Sidebar */}
        <div className={`lesson-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="lesson-sidebar-header">
            <h3>Course Lessons</h3>
            <div className="sidebar-progress">
              <div className="sidebar-progress-bar">
                <div className="sidebar-progress-fill" style={{ width: `${completionPct}%` }} />
              </div>
              <span className="sidebar-progress-text">{completedCount}/{totalLessons}</span>
            </div>
          </div>

          <ul className="lesson-list">
            {lessons.map((lesson, i) => {
              const status = getLessonStatus(lesson._id);
              return (
                <li
                  key={lesson._id}
                  className={`lesson-list-item ${activeLesson?._id === lesson._id ? 'active' : ''}`}
                  onClick={() => { setActiveLesson(lesson); setSidebarOpen(false); }}
                >
                  <div className={`lesson-status-icon ${status}`}>
                    {status === 'completed' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <div className="lesson-item-info">
                    <div className="lesson-item-title">{lesson.title}</div>
                    <div className="lesson-item-meta">
                      {lesson.type} {lesson.durationMins ? `• ${lesson.durationMins}m` : ''}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Main content */}
        <div className="lesson-main">
          {activeLesson ? (
            <>
              {/* Video player */}
              <div className="video-player-wrapper">
                {activeLesson.type === 'video' && embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={activeLesson.title}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : activeLesson.type === 'video' && activeLesson.videoUrl ? (
                  <video
                    controls
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                  >
                    <source src={activeLesson.videoUrl} />
                    Your browser does not support the video tag.
                  </video>
                ) : activeLesson.type === 'image' && activeLesson.imageUrl ? (
                  <img
                    src={activeLesson.imageUrl}
                    alt={activeLesson.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : activeLesson.type === 'document' && activeLesson.fileUrl ? (
                  <iframe
                    src={activeLesson.fileUrl}
                    title={activeLesson.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                ) : (
                  <div className="video-placeholder">
                    <div className="placeholder-icon">
                      {activeLesson.type === 'document' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px' }}>
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      ) : activeLesson.type === 'image' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px' }}>
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px' }}>
                          <polygon points="23 7 16 12 23 17 23 7"/>
                          <rect width="14" height="14" x="1" y="5" rx="2" ry="2"/>
                        </svg>
                      )}
                    </div>
                    <p>{activeLesson.type === 'document' ? 'Document Lesson' : 'No video available for this lesson'}</p>
                  </div>
                )}
              </div>

              {/* Lesson details */}
              <div className="lesson-content-details">
                <h2>{activeLesson.title}</h2>
                <div className="lesson-content-meta">
                  <span style={{ textTransform: 'capitalize' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
                    </svg>
                    {activeLesson.type}
                  </span>
                  {activeLesson.durationMins > 0 && (
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {activeLesson.durationMins} min
                    </span>
                  )}
                </div>
                {activeLesson.description && (
                  <p className="lesson-description">{activeLesson.description}</p>
                )}
                {activeLesson.type === 'document' && activeLesson.fileUrl && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <a
                      href={activeLesson.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      download={activeLesson.allowDownload ? '' : undefined}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download Document
                    </a>
                  </div>
                )}
                {activeLesson.type === 'image' && activeLesson.imageUrl && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <a href={activeLesson.imageUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" download>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download Image
                    </a>
                  </div>
                )}
                {activeLesson.type === 'video' && activeLesson.videoUrl && !hasEmbeddableVideo && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <a href={activeLesson.videoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" download>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download Video
                    </a>
                  </div>
                )}
                {Array.isArray(activeLesson.attachments) && activeLesson.attachments.length > 0 && (
                  <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Attachments</strong>
                    {activeLesson.attachments.map((att) => (
                      <a key={att._id || att.url} href={att.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" download>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
                        </svg>
                        {att.name || 'Attachment'}
                      </a>
                    ))}
                  </div>
                )}
                <div className="lesson-actions">
                  {getLessonStatus(activeLesson._id) !== 'completed' ? (
                    <button className="btn btn-primary" onClick={handleMarkComplete}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Mark as Complete
                    </button>
                  ) : (
                    <span className="tag" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Completed
                    </span>
                  )}
                </div>
              </div>

              {/* Quiz section */}
              {quizzes.length > 0 && (
                <div className="quiz-section">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    Course Quizzes
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {quizzes.map(quiz => (
                      <button
                        key={quiz._id}
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/quiz/${courseId}/${quiz._id}`)}
                        style={{ justifyContent: 'flex-start' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                          <path d="M9 11l3 3L22 4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                        {quiz.title} ({quiz.questions?.length || 0} questions)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="lesson-empty">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px' }}>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <h3>No lessons available</h3>
              <p>This course doesn't have any lessons yet.</p>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default LessonPlayer;
