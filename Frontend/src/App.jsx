import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Landing from './pages/Landing'
import Auth from './pages/auth/LoginRegister'
import CoursesDashboard from './pages/learner/CoursesDashboard'
import './App.css'

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/dashboard" element={<CoursesDashboard />} />
            {/* Fallback */}
            <Route path="*" element={<Landing />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  )
}

export default App
