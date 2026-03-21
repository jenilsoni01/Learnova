const LoadingSpinner = () => (
  <div className="flex justify-center py-6" style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
    <div style={{
      width: '1.5rem',
      height: '1.5rem',
      border: '4px solid rgba(99, 102, 241, 0.2)',
      borderTop: '4px solid #6366f1',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default LoadingSpinner;
