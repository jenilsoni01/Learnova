import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Auth.css'
import Toast from '../../components/common/Toast'
import { useAuth } from '../../context/AuthContext'

function Auth() {
  const { login, register: apiRegister } = useAuth()
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

  const validateForm = () => {
    const { name, email, password, confirmPassword } = formData;
    
    if (!isLogin && (!name || !name.trim())) {
      setToast({ message: 'Name is required', type: 'error' });
      return false;
    }
    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      setToast({ message: 'Invalid email address', type: 'error' });
      return false;
    }
    if (!password || password.length < 8) {
      setToast({ message: 'Password must be at least 8 characters', type: 'error' });
      return false;
    }
    if (!isLogin) {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
      
      if (!hasUpperCase || !hasNumber || !hasSymbol) {
        setToast({ message: 'Password needs an uppercase, number, and symbol', type: 'error' });
        return false;
      }
      if (password !== confirmPassword) {
        setToast({ message: 'Passwords do not match', type: 'error' });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        setToast({ message: 'Welcome back! Login successful', type: 'success' });
      } else {
        await apiRegister(formData.name, formData.email, formData.password);
        setToast({ message: 'Account created successfully!', type: 'success' });
      }
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      setToast({ 
        message: error.response?.data?.message || 'Authentication failed. Please try again.', 
        type: 'error' 
      });
    }
  };

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