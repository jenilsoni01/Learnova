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

  const embedUrl = activeLesson?.videoUrl ? getEmbedUrl(activeLesson.videoUrl) : null;

  return (
    <div className="lesson-player">
      <Navbar />

      <button
        className="lesson-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        📋 Lessons
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
                    {status === 'completed' ? '✓' : i + 1}
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
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={activeLesson.title}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : activeLesson.imageUrl ? (
                  <img
                    src={activeLesson.imageUrl}
                    alt={activeLesson.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="video-placeholder">
                    <div className="placeholder-icon">
                      {activeLesson.type === 'document' ? '📄' : activeLesson.type === 'image' ? '🖼️' : '🎬'}
                    </div>
                    <p>{activeLesson.type === 'document' ? 'Document Lesson' : 'No video available for this lesson'}</p>
                  </div>
                )}
              </div>

              {/* Lesson details */}
              <div className="lesson-content-details">
                <h2>{activeLesson.title}</h2>
                <div className="lesson-content-meta">
                  <span style={{ textTransform: 'capitalize' }}>📎 {activeLesson.type}</span>
                  {activeLesson.durationMins > 0 && <span>⏱️ {activeLesson.durationMins} min</span>}
                </div>
                {activeLesson.description && (
                  <p className="lesson-description">{activeLesson.description}</p>
                )}
                <div className="lesson-actions">
                  {getLessonStatus(activeLesson._id) !== 'completed' ? (
                    <button className="btn btn-primary" onClick={handleMarkComplete}>
                      ✅ Mark as Complete
                    </button>
                  ) : (
                    <span className="tag" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)' }}>
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>

              {/* Quiz section */}
              {quizzes.length > 0 && (
                <div className="quiz-section">
                  <h3>📝 Course Quizzes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {quizzes.map(quiz => (
                      <button
                        key={quiz._id}
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/quiz/${courseId}/${quiz._id}`)}
                        style={{ justifyContent: 'flex-start' }}
                      >
                        📝 {quiz.title} ({quiz.questions?.length || 0} questions)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="lesson-empty">
              <div className="empty-icon">📚</div>
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
