const EndMessage = ({ message = "You've seen all results" }) => (
  <p style={{
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-muted, #9ca3af)',
    padding: '1rem 0',
    borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
    marginTop: '1rem'
  }}>
    ✓ {message}
  </p>
);

export default EndMessage;
