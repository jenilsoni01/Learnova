import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import CourseCard from '../../components/common/CourseCard';
import { SkeletonCard } from '../../components/common/Skeleton';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EndMessage from '../../components/common/EndMessage';
import ErrorRetry from '../../components/common/ErrorRetry';
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

  const fetchCourses = useCallback(async (page) => {
    const params = { page, limit: 10 };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    const { data } = await api.get('/courses/public', { params });
    return data; // { data: [...], pagination: {...} }
  }, [debouncedSearch]);

  const { items: courses, isLoading, hasMore, error, sentinelRef, loadMore } =
    useInfiniteScroll(fetchCourses, [debouncedSearch]);

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
              <span className="search-icon">🔍</span>
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
          {showSkeleton ? (
            <div className={`courses-${viewMode}`}>
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredCourses.length === 0 && !isLoading ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
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

          {/* Sentinel + infinite scroll states */}
          <div ref={sentinelRef} style={{ height: '1rem' }} />
          {isLoading && courses.length > 0 && <LoadingSpinner />}
          {!hasMore && courses.length > 0 && <EndMessage />}
          {error && <ErrorRetry onRetry={() => loadMore(1)} />}
        </div>

        {/* Mobile toggle */}
        {user && (
          <button
            className="mobile-bio-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            👤 Profile
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
    </div>
  );
};

export default CoursesDashboard;
