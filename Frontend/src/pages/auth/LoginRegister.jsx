import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Auth.css'
import Toast from '../../components/common/Toast'

function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLogin, setIsLogin] = useState(true)
  const [toast, setToast] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: null
  })

  useEffect(() => {
    setIsLogin(location.pathname === '/login')
  }, [location.pathname])

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'avatar') {
      const file = files[0]
      if (file && file.size > 2 * 1024 * 1024) { // 2MB
        setToast({ message: 'File is too large (Max 2MB)', type: 'error' })
        return
      }
      setFormData(prev => ({ ...prev, [name]: file }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  const toggleMode = () => {
    navigate(isLogin ? '/signup' : '/login')
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      avatar: null
    })
  }

  return (
    <div className="auth">
      <div className="auth-container">
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to your account' : 'Join our learning community'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                  placeholder="Confirm your password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="avatar">Profile Picture</label>
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  onChange={handleInputChange}
                  accept="image/*"
                />
              </div>
            </>
          )}

          <button type="submit" className="auth-btn">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button type="button" onClick={toggleMode} className="toggle-btn">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Home
        </button>

        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </div>
    </div>
  )
}

export default Auth