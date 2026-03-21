const ErrorRetry = ({ onRetry }) => (
  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
    <p style={{ fontSize: '0.875rem', color: '#f87171', marginBottom: '0.5rem' }}>Something went wrong.</p>
    <button
      onClick={onRetry}
      style={{
        fontSize: '0.875rem',
        color: '#6366f1',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 500,
        textDecoration: 'underline'
      }}
    >
      Retry
    </button>
  </div>
);

export default ErrorRetry;
