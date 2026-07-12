import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { ShieldAlert, LogIn, UserPlus, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && (!name || !confirmPassword))) {
      setError('Please fill in all fields.');
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegistering 
        ? { name, email, password, confirmPassword }
        : { email, password };

      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (isRegistering) {
        // Sign-up flow: Switch to login form, notify user
        setSuccessMessage('Registration successful! Please sign in with your credentials.');
        setIsRegistering(false);
        setName('');
        setPassword('');
        setConfirmPassword('');
      } else {
        // Sign-in flow: Log user in
        localStorage.setItem('stadiumiq_token', data.token);
        localStorage.setItem('stadiumiq_user', JSON.stringify(data.user));

        if (data.user.role === 'organizer') {
          navigate('/organizer');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at 10% 20%, rgba(26, 32, 74, 0.9) 0%, rgba(10, 11, 16, 1) 90%)', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
      <div className="glass-card animated-fade" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '3rem' }}>🏟️</span>
          <h2 style={{ fontSize: '2rem', marginTop: '0.5rem', fontWeight: 800 }}>
            Stadium<span style={{ color: 'var(--accent-blue)' }}>IQ</span> AI
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            FIFA World Cup 2026 Operations & Experience Terminal
          </p>
        </div>

        {error && (
          <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'var(--accent-red)', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
            <ShieldAlert className="text-red" size={20} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--accent-green)', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
            <CheckCircle className="text-green" size={20} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group className='animated-fade'">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="e.g. Jane Doe"
                required
                aria-label="Full name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="e.g. fan@stadiumiq.com"
              required
              aria-label="Email address"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              aria-label="Password"
            />
          </div>

          {isRegistering && (
            <div className="form-group animated-fade">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                aria-label="Confirm Password"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', gap: '0.5rem', height: '46px', marginBottom: '1.5rem', marginTop: '1.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
            ) : (
              <>
                {isRegistering ? (
                  <><UserPlus size={18} /> Register Fan Account</>
                ) : (
                  <><LogIn size={18} /> Sign In to Terminal</>
                )}
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setSuccessMessage('');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            {isRegistering 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up as a Fan"}
          </button>
        </div>

        <div className="glass-card" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.15)', fontSize: '0.75rem', padding: '0.75rem', color: 'var(--text-secondary)' }}>
          🔒 **Security Notice**: Standard login is open to authorized Organizer command accounts and registered Fans. Custom organizer registration is disabled.
        </div>
      </div>
    </div>
  );
};
export default Login;
