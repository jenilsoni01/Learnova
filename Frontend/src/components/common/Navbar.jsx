import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">Learnova</Link>

        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>

        <ul className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
          <li><NavLink to="/dashboard" onClick={() => setMobileOpen(false)}>Courses</NavLink></li>
          {user && (
            <li><NavLink to="/my-learning" onClick={() => setMobileOpen(false)}>My Learning</NavLink></li>
          )}
          {user && (
            <li><NavLink to="/leaderboard" onClick={() => setMobileOpen(false)}>Leaderboard</NavLink></li>
          )}
          {isInstructor && (
            <li><NavLink to="/instructor" onClick={() => setMobileOpen(false)}>Instructor</NavLink></li>
          )}
        </ul>

        <div className="nav-right">
          {user ? (
            <div className="nav-user" ref={dropdownRef}>
              <button 
                className="nav-avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="nav-avatar-circle">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    user.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <span>{user.name?.split(' ')[0]}</span>
              </button>
              {dropdownOpen && (
                <div className="nav-dropdown">
                  <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '0.9rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text)' }}>{user.email}</div>
                  </div>
                  <div className="nav-dropdown-divider" />
                  <Link
                    to="/profile"
                    className="nav-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/my-learning"
                    className="nav-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    <span>My Learning</span>
                  </Link>
                  <Link
                    to="/leaderboard"
                    className="nav-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                    <span>Leaderboard</span>
                  </Link>
                  {isInstructor && (
                    <Link
                      to="/instructor"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                      </svg>
                      <span>Dashboard</span>
                    </Link>
                  )}
                  <div className="nav-dropdown-divider" />
                  <button
                    className="nav-dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
