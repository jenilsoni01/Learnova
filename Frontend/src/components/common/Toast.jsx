import { useEffect } from 'react'
import './Toast.css'

function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className={`toast-container ${type}`}>
      <div className="toast-icon">
        {type === 'success' ? '✓' : '✕'}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>&times;</button>
    </div>
  )
}

export default Toast
