import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Landing.css'

function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      setDropdownOpen(false)
      setIsMenuOpen(false)
      navigate('/')
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  return (
    <div className="landing">
      <header className="header">
        <div className="container">
          <div className="logo">
            <h1>Learnova</h1>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
          <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
            <ul>
              <li><a href="#home" onClick={() => setIsMenuOpen(false)}>Home</a></li>
              <li><a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a></li>
              <li><a href="#about" onClick={() => setIsMenuOpen(false)}>About</a></li>
              <li><a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a></li>
            </ul>
          </nav>
          <div className={`auth-buttons ${isMenuOpen ? 'open' : ''}`} style={{ position: 'relative' }}>
            {user ? (
              <div ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-h)' }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', overflow: 'hidden' }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span style={{ fontWeight: 600 }}>{user.name?.split(' ')[0]}</span>
                </button>
                {dropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: '0', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0.5rem', minWidth: '200px', backdropFilter: 'var(--glass-blur)', zIndex: 100, marginTop: '0.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', textAlign: 'left' }}>
                    <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '0.9rem' }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text)' }}>{user.email}</div>
                    </div>
                    <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.25rem 0' }} />
                    <Link to="/dashboard" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.5rem 0.75rem', color: 'var(--text)', textDecoration: 'none', borderRadius: '8px', fontSize: '0.85rem', transition: 'background 0.2s' }}>
                      🎓 Course Marketplace
                    </Link>
                    <Link to="/my-learning" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.5rem 0.75rem', color: 'var(--text)', textDecoration: 'none', borderRadius: '8px', fontSize: '0.85rem', transition: 'background 0.2s' }}>
                      📚 My Learning
                    </Link>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.5rem 0.75rem', color: 'var(--text)', textDecoration: 'none', borderRadius: '8px', fontSize: '0.85rem', transition: 'background 0.2s' }}>
                      👤 Profile
                    </Link>
                    {(user.role === 'admin' || user.role === 'instructor') && (
                      <Link to="/instructor" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.5rem 0.75rem', color: 'var(--text)', textDecoration: 'none', borderRadius: '8px', fontSize: '0.85rem', transition: 'background 0.2s' }}>
                        📊 Instructor Panel
                      </Link>
                    )}
                    <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.25rem 0' }} />
                    <button 
                      onClick={handleLogout}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '0.5rem 0.75rem', color: '#ef4444', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'background 0.2s' }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => { navigate('/login'); setIsMenuOpen(false); }}>Login</button>
                <button className="btn btn-primary" onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </header>

      <section id="home" className="hero">
        <div className="container">
          <div className="hero-content">
            <h2>Empower Your Learning Journey</h2>
            <p>Discover a comprehensive e-learning platform where students learn at their own pace and professors create engaging content with videos, lessons, and interactive quizzes.</p>
            <div className="hero-buttons">
              {user ? (
                <button className="btn btn-primary" onClick={() => navigate(user.role === 'instructor' || user.role === 'admin' ? '/instructor' : '/dashboard')}>Go to Dashboard</button>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => navigate('/signup')}>Start Learning</button>
                  <button className="btn btn-secondary" onClick={() => navigate('/signup')}>For Professors</button>
                </>
              )}
            </div>
          </div>
          <div className="hero-illustration">
            <div className="illustration">
              <div className="circle circle1"></div>
              <div className="circle circle2"></div>
              <div className="circle circle3"></div>
              <div className="book-icon">📚</div>
              <div className="video-icon">🎥</div>
              <div className="quiz-icon">📝</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <h2>Why Choose Learnova?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>For Students</h3>
              <p>Access high-quality lessons, watch educational videos, and take quizzes to test your knowledge. Learn at your own pace with our interactive platform.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🏫</div>
              <h3>For Professors</h3>
              <p>Create and manage course content effortlessly. Upload videos, design lessons, and create quizzes to engage your students effectively.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎥</div>
              <h3>Video Lessons</h3>
              <p>Engage with dynamic video content that brings complex topics to life. Our platform supports various video formats for optimal learning.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Interactive Quizzes</h3>
              <p>Reinforce learning with comprehensive quizzes. Track progress and receive instant feedback to improve understanding.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your learning journey with detailed analytics and progress reports. Stay motivated and on track.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Responsive Design</h3>
              <p>Learn anywhere, anytime. Our platform is fully responsive and works seamlessly on all devices.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <h2>About Learnova</h2>
            <p>Learnova is revolutionizing education by bridging the gap between traditional learning and modern technology. Our platform empowers both students and educators to create a more engaging and effective learning environment.</p>
            <p>With features like video lessons, interactive quizzes, and comprehensive content management, Learnova makes education accessible, enjoyable, and efficient for everyone involved.</p>
          </div>
          <div className="about-stats">
            <div className="stat">
              <h3>10,000+</h3>
              <p>Students Enrolled</p>
            </div>
            <div className="stat">
              <h3>500+</h3>
              <p>Courses Available</p>
            </div>
            <div className="stat">
              <h3>200+</h3>
              <p>Expert Professors</p>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Learnova</h3>
              <p>Empowering education through innovative technology.</p>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Contact Us</h3>
              <p>Email: info@learnova.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Learnova. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing