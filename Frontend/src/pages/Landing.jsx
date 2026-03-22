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

              {/* Modern Dashboard Mockup */}
              <div className="dashboard-mockup">
                <div className="mockup-header">
                  <div className="mockup-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <div className="mockup-tabs">
                    <div className="tab active"></div>
                    <div className="tab"></div>
                    <div className="tab"></div>
                  </div>
                </div>
                <div className="mockup-content">
                  <div className="mockup-sidebar">
                    <div className="sidebar-item active"></div>
                    <div className="sidebar-item"></div>
                    <div className="sidebar-item"></div>
                    <div className="sidebar-item"></div>
                  </div>
                  <div className="mockup-main">
                    <div className="mockup-card">
                      <div className="card-visual">
                        <svg viewBox="0 0 100 60" className="progress-chart">
                          <defs>
                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.8"/>
                            </linearGradient>
                          </defs>
                          <path d="M0,50 Q25,45 40,30 T70,20 T100,10" fill="none" stroke="var(--primary)" strokeWidth="2"/>
                          <path d="M0,50 Q25,45 40,30 T70,20 T100,10 L100,60 L0,60 Z" fill="url(#chartGradient)"/>
                        </svg>
                      </div>
                      <div className="card-lines">
                        <div className="line long"></div>
                        <div className="line medium"></div>
                      </div>
                    </div>
                    <div className="mockup-stats">
                      <div className="stat-box">
                        <div className="stat-icon"></div>
                        <div className="stat-lines">
                          <div className="line"></div>
                          <div className="line short"></div>
                        </div>
                      </div>
                      <div className="stat-box">
                        <div className="stat-icon"></div>
                        <div className="stat-lines">
                          <div className="line"></div>
                          <div className="line short"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Accent Elements */}
              <div className="floating-badge badge-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
              <div className="floating-badge badge-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="floating-badge badge-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2>Why Choose Learnova?</h2>
            <p className="section-subtitle">Everything you need to create an exceptional learning experience</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  <line x1="12" y1="6" x2="12" y2="10"/>
                  <line x1="12" y1="14" x2="12" y2="14"/>
                </svg>
              </div>
              <h3>For Students</h3>
              <p>Access high-quality lessons, watch educational videos, and take quizzes to test your knowledge. Learn at your own pace with our interactive platform.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>For Professors</h3>
              <p>Create and manage course content effortlessly. Upload videos, design lessons, and create quizzes to engage your students effectively.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <h3>Video Lessons</h3>
              <p>Engage with dynamic video content that brings complex topics to life. Our platform supports various video formats for optimal learning.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <h3>Interactive Quizzes</h3>
              <p>Reinforce learning with comprehensive quizzes. Track progress and receive instant feedback to improve understanding.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                  <line x1="2" y1="20" x2="22" y2="20"/>
                </svg>
              </div>
              <h3>Progress Tracking</h3>
              <p>Monitor your learning journey with detailed analytics and progress reports. Stay motivated and on track.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12" y2="18"/>
                </svg>
              </div>
              <h3>Responsive Design</h3>
              <p>Learn anywhere, anytime. Our platform is fully responsive and works seamlessly on all devices.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <span className="section-badge">About Us</span>
            <h2>About Learnova</h2>
            <p>Learnova is revolutionizing education by bridging the gap between traditional learning and modern technology. Our platform empowers both students and educators to create a more engaging and effective learning environment.</p>
            <p>With features like video lessons, interactive quizzes, and comprehensive content management, Learnova makes education accessible, enjoyable, and efficient for everyone involved.</p>
            <div className="about-features">
              <div className="about-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Trusted by educators worldwide</span>
              </div>
              <div className="about-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>24/7 customer support</span>
              </div>
              <div className="about-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Regular platform updates</span>
              </div>
            </div>
          </div>
          <div className="about-stats">
            <div className="stat">
              <div className="stat-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>10,000+</h3>
              <p>Students Enrolled</p>
            </div>
            <div className="stat">
              <div className="stat-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <h3>500+</h3>
              <p>Courses Available</p>
            </div>
            <div className="stat">
              <div className="stat-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
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