import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/auth/LoginRegister'
import './App.css'

function App() {
  return (
    <div className="app">
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          {/* Fallback */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
