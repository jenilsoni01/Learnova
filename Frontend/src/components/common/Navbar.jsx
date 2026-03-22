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
          {mobileOpen ? '✕' : '☰'}
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
                    👤 Profile
                  </Link>
                  <Link 
                    to="/my-learning" 
                    className="nav-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    📚 My Learning
                  </Link>
                  <Link 
                    to="/leaderboard" 
                    className="nav-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    🏆 Leaderboard
                  </Link>
                  {isInstructor && (
                    <Link 
                      to="/instructor" 
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      📊 Dashboard
                    </Link>
                  )}
                  <div className="nav-dropdown-divider" />
                  <button 
                    className="nav-dropdown-item danger"
                    onClick={handleLogout}
                  >
                    🚪 Logout
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
