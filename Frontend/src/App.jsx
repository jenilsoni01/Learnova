import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Landing from './pages/Landing'
import Auth from './pages/auth/LoginRegister'
import CoursesDashboard from './pages/learner/CoursesDashboard'
import CourseDetail from './pages/learner/CourseDetail'
import MyLearning from './pages/learner/MyLearning'
import LessonPlayer from './pages/learner/LessonPlayer'
import QuizPage from './pages/learner/QuizPage'
import InstructorDashboard from './pages/instructor/InstructorDashboard'
import CourseBuilder from './pages/instructor/CourseBuilder'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import ProtectedRoute from './components/common/ProtectedRoute'
import './App.css'

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/dashboard" element={<CoursesDashboard />} />
            <Route path="/courses/:id" element={<CourseDetail />} />

            {/* Learner (protected) */}
            <Route path="/my-learning" element={
              <ProtectedRoute><MyLearning /></ProtectedRoute>
            } />
            <Route path="/learn/:courseId" element={
              <ProtectedRoute><LessonPlayer /></ProtectedRoute>
            } />
            <Route path="/quiz/:courseId/:quizId" element={
              <ProtectedRoute><QuizPage /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute><Leaderboard /></ProtectedRoute>
            } />

            {/* Instructor (protected + role) */}
            <Route path="/instructor" element={
              <ProtectedRoute roles={['instructor', 'admin']}><InstructorDashboard /></ProtectedRoute>
            } />
            <Route path="/instructor/create" element={
              <ProtectedRoute roles={['instructor', 'admin']}><CourseBuilder /></ProtectedRoute>
            } />
            <Route path="/instructor/edit/:id" element={
              <ProtectedRoute roles={['instructor', 'admin']}><CourseBuilder /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Landing />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  )
}

export default App
