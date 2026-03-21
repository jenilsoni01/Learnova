import React, { useState } from 'react';
import './CoursesDashboard.css';

const MOCK_USER = {
  name: 'Alex',
  points: 20,
  badgeLevel: 'Newbie'
};

const BADGES = [
  { name: 'Newbie', points: 20 },
  { name: 'Explorer', points: 40 },
  { name: 'Achiever', points: 60 },
  { name: 'Specialist', points: 80 },
  { name: 'Expert', points: 100 },
  { name: 'Master', points: 120 }
];

const MOCK_COURSES = [
  {
    _id: '1',
    title: 'Basics of Odoo CRM',
    description: 'Learn the fundamentals of managing customer relations under Odoo dashboards.',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60',
    tags: ['Odoo', 'CRM'],
    price: 0, 
    lessonsCount: 12,
    status: 'Start' // or 'Continue'
  },
  {
    _id: '2',
    title: 'Advance course of Odoo CRM',
    description: 'Deep dive into advanced sales pipelines, routing setups, and custom automations.',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60',
    tags: ['Odoo', 'Advance'],
    price: 500, // INR 500
    lessonsCount: 24,
    status: 'Buy'
  }
];

const CoursesDashboard = () => {
  const [search, setSearch] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Mobile toggle

  const filtered = MOCK_COURSES.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // Circular progress calculation (Assume max points 120)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (MOCK_USER.points / 120) * circumference;

  return (
    <div className="dashboard">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="logo">Company Name</div>
          
          <div className="nav-toolbar">
            <div className="search-bar">
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search courses..." 
              />
            </div>
            
            <button 
              className="mobile-bio-btn"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              👤 Bio
            </button>

            <div className="user-profile">
              <div className="avatar-stub">{MOCK_USER.name[0]}</div>
              <span>{MOCK_USER.name}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout Grid */}
      <div className="container dashboard-layout">
        
        {/* Main Content: Courses */}
        <div className="main-content">
          <div className="grid-header">
            <h3>My Courses</h3>
          </div>

          <div className="courses-grid">
            {filtered.map(course => (
              <div key={course._id} className="course-card">
                <div 
                  className="course-banner" 
                  style={{ backgroundImage: `url(${course.coverImage})` }}
                >
                  {course.price > 0 && <span className="badge paid">Paid</span>}
                </div>
                <div className="course-content">
                  <div className="tags">
                    {course.tags.map((t, idx) => <span key={idx} className="tag">{t}</span>)}
                  </div>
                  <h4>{course.title}</h4>
                  <p>{course.description}</p>
                  <div className="course-footer">
                    <button className={`action-btn ${course.status === 'Buy' ? 'buy' : 'join'}`}>
                      {course.status === 'Buy' ? `Buy Course` : course.status === 'Continue' ? 'Continue' : 'Join Course'}
                    </button>
                    {course.price > 0 && <div className="price-tag">INR {course.price}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backdrop overlay for mobile sidebar */}
        {isProfileOpen && (
          <div className="profile-overlay" onClick={() => setIsProfileOpen(false)}></div>
        )}

        {/* Sidebar: Profile Details */}
        <aside className={`profile-sidebar ${isProfileOpen ? 'open' : ''}`}>
          <div className="profile-section">
            <h4>My Profile</h4>
            
            <div className="progress-container">
              <svg className="progress-circle" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} className="bg-ring" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r={radius} 
                  className="fg-ring" 
                  style={{ strokeDasharray: circumference, strokeDashoffset: strokeOffset }}
                />
              </svg>
              <div className="progress-text">
                <p className="total-points">Total {MOCK_USER.points} Points</p>
                <p className="current-badge">{MOCK_USER.badgeLevel}</p>
              </div>
            </div>
          </div>

          <div className="badges-section">
            <h4>Badges</h4>
            <ul className="badges-list">
              {BADGES.map((b, idx) => (
                <li key={idx} className={`badge-item ${MOCK_USER.points >= b.points ? 'unlocked' : 'locked'}`}>
                  <span className="badge-name">{b.name}</span>
                  <span className="badge-points">{b.points} Points</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Note from wireframe only visible inside sidebar frame to assist layouts */}
          <p className="sidebar-footer-note">This profile displays badges earned on point tiers gained.</p>
        </aside>

      </div>
    </div>
  );
};

export default CoursesDashboard;
