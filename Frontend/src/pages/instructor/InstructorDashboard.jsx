import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/common/Navbar';
import Toast from '../../components/common/Toast';
import './InstructorDashboard.css';



const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reportRes, coursesRes] = await Promise.all([
          api.get('/reporting'),
          api.get('/courses/admin')
        ]);
        setReportData(Array.isArray(reportRes.data) ? reportRes.data : []);
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      } catch (err) {
        setToast({ message: 'Failed to load dashboard data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTogglePublish = async (courseId) => {
    try {
      const res = await api.patch(`/courses/${courseId}/publish`);
      setCourses(prev => prev.map(c =>
        c._id === courseId ? { ...c, isPublished: res.data.isPublished } : c
      ));
      setToast({ message: `Course ${res.data.isPublished ? 'published' : 'unpublished'}!`, type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to toggle publish', type: 'error' });
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses(prev => prev.filter(c => c._id !== courseId));
      setToast({ message: 'Course deleted', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete course', type: 'error' });
    }
  };

  // Aggregate stats
  const totalStudents = reportData.reduce((s, r) => s + (r.enrollmentsCount || 0), 0);
  const totalCompleted = reportData.reduce((s, r) => s + (r.completed || 0), 0);
  const totalInProgress = reportData.reduce((s, r) => s + (r.inProgress || 0), 0);

  if (loading) {
    return (
      <div className="instructor-dashboard">
        <Navbar />
        <div className="loading-container"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="instructor-dashboard">
      <Navbar />

      <div className="container">
        <div className="instructor-header">
          <h1 className="gradient-text">Instructor Dashboard</h1>
          <p>Manage your courses and track student progress.</p>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => navigate('/instructor/create')}>
              ➕ Create Course
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="instructor-stats">
          <div className="inst-stat-card animate-fade-in-up" style={{ animationDelay: '0s' }}>
            <div className="stat-icon">📚</div>
            <div className="stat-number">{courses.length}</div>
            <div className="stat-label">Total Courses</div>
          </div>
          <div className="inst-stat-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon">👥</div>
            <div className="stat-number">{totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="inst-stat-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon">✅</div>
            <div className="stat-number">{totalCompleted}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="inst-stat-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon">📈</div>
            <div className="stat-number">{totalInProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        {/* Courses table */}
        <div className="instructor-table-section">
          <h2>Your Courses</h2>
          {courses.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <h3>No courses yet</h3>
              <p>Create your first course to get started!</p>
            </div>
          ) : (
            <table className="instructor-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Lessons</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => {
                  const report = reportData.find(r => r.courseId === course._id);
                  return (
                    <tr key={course._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{course.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
                          {course.tags?.join(', ')}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${course.isPublished ? 'published' : 'draft'}`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>{course.lessonsCount ?? 0}</td>
                      <td>{report?.enrollmentsCount ?? 0}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/instructor/edit/${course._id}`)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleTogglePublish(course._id)}
                          >
                            {course.isPublished ? '📤 Unpublish' : '📢 Publish'}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(course._id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InstructorDashboard;
