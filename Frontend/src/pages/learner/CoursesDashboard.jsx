import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import CourseCard from '../../components/common/CourseCard';
import { SkeletonCard } from '../../components/common/Skeleton';
import ErrorRetry from '../../components/common/ErrorRetry';
import Toast from '../../components/common/Toast';
import './CoursesDashboard.css';

const BADGES = [
  { name: 'Newbie', points: 20 },
  { name: 'Explorer', points: 40 },
  { name: 'Achiever', points: 60 },
  { name: 'Specialist', points: 80 },
  { name: 'Expert', points: 100 },
  { name: 'Master', points: 120 }
];

const CoursesDashboard = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [myInvitations, setMyInvitations] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Debounce search by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const getBadge = (points) => {
    const eligibleBadges = BADGES.filter(b => points >= b.points);
    return eligibleBadges.length
      ? eligibleBadges[eligibleBadges.length - 1].name
      : BADGES[0].name;
  };

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = { page: currentPage, limit };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const { data } = await api.get('/courses/public', { params });
      setCourses(Array.isArray(data?.data) ? data.data : []);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch (err) {
      setError('Failed to load courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, limit]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const fetchInvitations = useCallback(async () => {
    if (!user || user.role !== 'learner') {
      setMyInvitations([]);
      return;
    }
    try {
      setInvitesLoading(true);
      const { data } = await api.get('/enrollments/invitations/me');
      setMyInvitations(Array.isArray(data) ? data : []);
    } catch {
      setMyInvitations([]);
    } finally {
      setInvitesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await api.post(`/enrollments/invitations/${invitationId}/accept`);
      setToast({ message: 'Invitation accepted! You are now enrolled.', type: 'success' });
      fetchInvitations();
      setCurrentPage(1);
      fetchCourses();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to accept invitation', type: 'error' });
    }
  };

  const userPoints = user?.totalPoints || 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (Math.min(userPoints, 120) / 120) * circumference;

  // Extract unique tags for filtering (from loaded items)
  const allTags = Array.from(new Set(courses.flatMap(c => c.tags || []))).sort();

  // Apply client-side category filter
  const filteredCourses = courses.filter(course => {
    if (categoryFilter && !course.tags?.includes(categoryFilter)) return false;
    return true;
  });

  // Show skeleton only on very first load (page 1 with no items yet)
  const showSkeleton = isLoading && courses.length === 0;

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-hero">
        <div className="container">
          <h1 className="gradient-text">Explore Courses</h1>
          <p>Discover courses crafted by top instructors and start learning today.</p>
          <div className="dashboard-controls">
            <div className="dashboard-search">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses by title..."
                className="form-input"
              />
            </div>
            
            <div className="dashboard-filters">
              <select 
                className="form-input category-select"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

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
        </div>
      </div>

      <div className="container dashboard-layout">
        <div className="main-content">
          {user?.role === 'learner' && (
            <div className="empty-state" style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <h3 style={{ marginBottom: '0.4rem' }}>Invitations</h3>
              {invitesLoading ? (
                <p>Loading invitations...</p>
              ) : myInvitations.length === 0 ? (
                <p>No invitations right now.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {myInvitations.map((inv) => (
                    <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{inv.course?.title || 'Course'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Status: {inv.status}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {inv.status !== 'accepted' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleAcceptInvitation(inv._id)}>
                            Accept
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = `/courses/${inv.course?._id}`}>
                          View Course
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showSkeleton ? (
            <div className={`courses-${viewMode}`}>
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredCourses.length === 0 && !isLoading ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <h3>No courses found</h3>
              <p>{search || categoryFilter ? 'Try a different search term or category.' : 'Check back later for new courses!'}</p>
            </div>
          ) : (
            <div className={`courses-${viewMode}`}>
              {filteredCourses.map((course, i) => (
                <div key={course._id} style={{ animationDelay: `${i * 0.08}s` }} className="animate-fade-in-up">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          )}

          {error && <ErrorRetry onRetry={fetchCourses} />}

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

        {/* Mobile toggle */}
        {user && (
          <button
            className="mobile-bio-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profile</span>
          </button>
        )}

        {isProfileOpen && (
          <div className="profile-overlay" onClick={() => setIsProfileOpen(false)} />
        )}

        {user && (
          <aside className={`profile-sidebar ${isProfileOpen ? 'open' : ''}`}>
            <div className="profile-section">
              <h4>My Profile</h4>
              <div className="progress-container">
                <div className="progress-ring-wrapper">
                  <svg className="progress-circle" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} className="bg-ring" />
                    <circle
                      cx="50" cy="50" r={radius}
                      className="fg-ring"
                      style={{ strokeDasharray: circumference, strokeDashoffset: strokeOffset }}
                    />
                  </svg>
                  <div className="circle-avatar">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      user?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <div className="progress-text">
                  <p className="total-points">Total {userPoints} Points</p>
                  <p className="current-badge">{getBadge(userPoints)}</p>
                </div>
              </div>
            </div>

            <div className="badges-section">
              <h4>Badges</h4>
              <ul className="badges-list">
                {BADGES.map((b, idx) => (
                  <li key={idx} className={`badge-item ${userPoints >= b.points ? 'unlocked' : 'locked'}`}>
                    <span className="badge-name">{b.name}</span>
                    <span className="badge-points">{b.points} Points</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CoursesDashboard;
