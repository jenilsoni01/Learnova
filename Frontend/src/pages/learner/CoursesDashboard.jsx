import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import CourseCard from '../../components/common/CourseCard';
import { SkeletonCard } from '../../components/common/Skeleton';
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
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const params = {};
        if (search.trim()) params.search = search.trim();
        const res = await api.get('/courses/public', { params });
        setCourses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchCourses, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const userPoints = user?.totalPoints || 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (Math.min(userPoints, 120) / 120) * circumference;

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-hero">
        <div className="container">
          <h1 className="gradient-text">Explore Courses</h1>
          <p>Discover courses crafted by top instructors and start learning today.</p>
          <div className="dashboard-search">
            <span className="search-icon">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses by title..."
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="container dashboard-layout">
        <div className="main-content">
          {loading ? (
            <div className="courses-grid">
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No courses found</h3>
              <p>{search ? 'Try a different search term.' : 'Check back later for new courses!'}</p>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map((course, i) => (
                <div key={course._id} style={{ animationDelay: `${i * 0.08}s` }} className="animate-fade-in-up">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          )}
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
                <svg className="progress-circle" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} className="bg-ring" />
                  <circle
                    cx="50" cy="50" r={radius}
                    className="fg-ring"
                    style={{ strokeDasharray: circumference, strokeDashoffset: strokeOffset }}
                  />
                </svg>
                <div className="progress-text">
                  <p className="total-points">Total {userPoints} Points</p>
                  <p className="current-badge">{user.badgeLevel || 'Newbie'}</p>
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
