import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

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
          <div className={`auth-buttons ${isMenuOpen ? 'open' : ''}`}>
            <button className="btn btn-secondary" onClick={() => { navigate('/login'); setIsMenuOpen(false); }}>Login</button>
            <button className="btn btn-primary" onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}>Sign Up</button>
          </div>
        </div>
      </header>

      <section id="home" className="hero">
        <div className="container">
          <div className="hero-content">
            <h2>Empower Your Learning Journey</h2>
            <p>Discover a comprehensive e-learning platform where students learn at their own pace and professors create engaging content with videos, lessons, and interactive quizzes.</p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={() => navigate('/signup')}>Start Learning</button>
              <button className="btn btn-secondary" onClick={() => navigate('/signup')}>For Professors</button>
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