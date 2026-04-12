import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>
            Fin<span style={{ color: 'var(--accent)' }}>Track</span>
          </div>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>Reset your password</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            {/* Success icon */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(52,211,153,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>Check your inbox</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
              If <strong>{email}</strong> is registered, you'll receive a reset link within a minute.
            </p>
            <Link to="/login" style={{ color: 'var(--accent)', fontSize: 13 }}>← Back to Sign In</Link>
          </div>
        ) : (
          <>
            {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
              Enter the email you registered with and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
              <Link to="/login" style={{ color: 'var(--accent)' }}>← Back to Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}