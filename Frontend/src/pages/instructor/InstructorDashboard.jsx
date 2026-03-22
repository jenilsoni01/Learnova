import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/common/Navbar';
import Toast from '../../components/common/Toast';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    tags: '',
    websiteUrl: '',
    visibility: 'everyone',
    accessRule: 'open',
    price: 0,
    currency: 'INR',
  });

  // Debounce search by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch reporting stats (not paginated — aggregates)
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const reportRes = await api.get('/reporting');
        // New shape: { data: [...], overview: {...}, pagination: {...} }
        const resData = reportRes.data;
        if (resData.overview) {
          setReportData(resData.overview);
        } else if (Array.isArray(resData)) {
          // Fallback for old shape
          const totalStudents = resData.reduce((s, r) => s + (r.enrollmentsCount || 0), 0);
          const totalCompleted = resData.reduce((s, r) => s + (r.completed || 0), 0);
          const totalInProgress = resData.reduce((s, r) => s + (r.inProgress || 0), 0);
          setReportData({ totalEnrolled: totalStudents, completed: totalCompleted, inProgress: totalInProgress, totalCourses: resData.length });
        }
      } catch (err) {
        setToast({ message: 'Failed to load reporting data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const fetchAdminCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const params = { page: currentPage, limit };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const { data } = await api.get('/courses/admin', { params });
      setCourses(Array.isArray(data?.data) ? data.data : []);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch {
      setToast({ message: 'Failed to load courses', type: 'error' });
    } finally {
      setCoursesLoading(false);
    }
  }, [currentPage, debouncedSearch, limit]);

  useEffect(() => {
    fetchAdminCourses();
  }, [fetchAdminCourses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, limit]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handleTogglePublish = async (courseId) => {
    try {
      const res = await api.patch(`/courses/${courseId}/publish`);
      setToast({ message: `Course ${res.data.isPublished ? 'published' : 'unpublished'}!`, type: 'success' });
      fetchAdminCourses();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to toggle publish', type: 'error' });
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      setToast({ message: 'Course deleted', type: 'success' });
      fetchAdminCourses();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete course', type: 'error' });
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      description: '',
      tags: '',
      websiteUrl: '',
      visibility: 'everyone',
      accessRule: 'open',
      price: 0,
      currency: 'INR',
    });
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();

    const trimmedTitle = createForm.title.trim();
    if (!trimmedTitle) {
      setToast({ message: 'Course title is required', type: 'error' });
      return;
    }

    try {
      setIsCreatingCourse(true);
      const payload = {
        title: trimmedTitle,
        description: createForm.description.trim(),
        websiteUrl: createForm.websiteUrl.trim(),
        visibility: createForm.visibility,
        accessRule: createForm.accessRule,
        currency: (createForm.currency || 'INR').trim().toUpperCase(),
        price:
          createForm.accessRule === 'payment'
            ? Math.max(0, Number(createForm.price) || 0)
            : 0,
        tags: createForm.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const { data } = await api.post('/courses', payload);
      setToast({ message: 'Course created successfully', type: 'success' });
      setIsCreateModalOpen(false);
      resetCreateForm();
      fetchAdminCourses();

      if (data?._id) {
        navigate(`/instructor/edit/${data._id}`);
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to create course', type: 'error' });
    } finally {
      setIsCreatingCourse(false);
    }
  };

  // Aggregate stats from reportData
  const totalStudents = reportData?.totalEnrolled || 0;
  const totalCompleted = reportData?.completed || 0;
  const totalInProgress = reportData?.inProgress || 0;
  const totalCourses = reportData?.totalCourses || courses.length;

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
            <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Course
            </button>
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="instructor-stats">
          <div className="inst-stat-card animate-fade-in-up" style={{ animationDelay: '0s' }}>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div className="stat-number">{totalCourses}</div>
            <div className="stat-label">Total Courses</div>
          </div>
          <div className="inst-stat-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-number">{totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="inst-stat-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="stat-number">{totalCompleted}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="inst-stat-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div className="stat-number">{totalInProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        {/* Search bar for courses */}
        <div className="instructor-table-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Your Courses</h2>
            <div style={{ position: 'relative', width: '260px' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '2rem', fontSize: '0.85rem' }}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }}>
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
          </div>

          {courses.length === 0 && !coursesLoading ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <h3>No courses yet</h3>
              <p>Create your first course to get started!</p>
            </div>
          ) : viewMode === 'list' ? (
            <table className="instructor-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Lessons</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
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
                    <td>{course.totalDurationMins ?? 0} min</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/courses/${course._id}`)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Preview
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/instructor/edit/${course._id}`)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                          </svg>
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleTogglePublish(course._id)}
                        >
                          {course.isPublished ? (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="17 1 21 5 17 9"/>
                                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                <polyline points="7 23 3 19 7 15"/>
                                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                              </svg>
                              Unpublish
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                              </svg>
                              Publish
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(course._id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="instructor-courses-grid">
              {courses.map(course => (
                <div key={course._id} className="inst-course-card">
                  <div className="card-header">
                    <div className="title-wrapper">
                      <h4>{course.title}</h4>
                      <span className={`status-badge ${course.isPublished ? 'published' : 'draft'}`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="tags">
                      {course.tags?.map(tag => <span key={tag} className="tag">{tag}</span>)}
                    </div>
                  </div>
                  <div className="card-stats">
                    <div className="stat">
                      <span className="value">{course.lessonsCount ?? 0}</span>
                      <span className="label">Lessons</span>
                    </div>
                    <div className="stat">
                      <span className="value">{course.totalDurationMins ?? 0}</span>
                      <span className="label">Minutes</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/courses/${course._id}`)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Preview
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/instructor/edit/${course._id}`)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                      Edit
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleTogglePublish(course._id)}>
                      {course.isPublished ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="17 1 21 5 17 9"/>
                            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                            <polyline points="7 23 3 19 7 15"/>
                            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                          </svg>
                          Unpublish
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Publish
                        </>
                      )}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course._id)}>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem' }}>Per page</span>
              <select
                className="form-input"
                style={{ width: '80px', padding: '0.45rem' }}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</button>
              <span style={{ fontSize: '0.85rem' }}>Page {currentPage} / {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input
                className="form-input"
                style={{ width: '70px', padding: '0.45rem' }}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const page = Math.max(1, Math.min(totalPages, Number(pageInput) || 1));
                  setCurrentPage(page);
                }}
              >
                Go
              </button>
            </div>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => !isCreatingCourse && setIsCreateModalOpen(false)}>
          <div className="create-course-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Course</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => !isCreatingCourse && setIsCreateModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  className="form-input"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Visibility</label>
                  <select
                    className="form-input"
                    value={createForm.visibility}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, visibility: e.target.value }))}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="signed_in">Signed in users</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Access Rule</label>
                  <select
                    className="form-input"
                    value={createForm.accessRule}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        accessRule: e.target.value,
                        price: e.target.value === 'payment' ? prev.price : 0,
                      }))
                    }
                  >
                    <option value="open">Open</option>
                    <option value="invitation">Invitation</option>
                    <option value="payment">Payment</option>
                  </select>
                </div>
              </div>

              {createForm.accessRule === 'payment' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Price</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="1"
                      value={createForm.price}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, price: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Currency</label>
                    <input
                      className="form-input"
                      value={createForm.currency}
                      maxLength={5}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Website URL</label>
                <input
                  className="form-input"
                  value={createForm.websiteUrl}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  className="form-input"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="javascript, react, backend"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (!isCreatingCourse) {
                      setIsCreateModalOpen(false);
                      resetCreateForm();
                    }
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingCourse}>
                  {isCreatingCourse ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InstructorDashboard;
