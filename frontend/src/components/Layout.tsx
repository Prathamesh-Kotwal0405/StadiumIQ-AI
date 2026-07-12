import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return document.body.classList.contains('light-theme') ? 'light' : 'dark';
  });

  const userJson = localStorage.getItem('stadiumiq_user');
  const user = userJson ? JSON.parse(userJson) : null;

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.body.classList.add('light-theme');
      setTheme('light');
    } else {
      document.body.classList.remove('light-theme');
      setTheme('dark');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('stadiumiq_token');
    localStorage.removeItem('stadiumiq_user');
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header 
        className="glass-card" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderRadius: '0', 
          borderLeft: '0', 
          borderRight: '0', 
          borderTop: '0', 
          height: '70px', 
          padding: '0 2rem', 
          zIndex: 10 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>🏟️</span>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.025em' }}>
              Stadium<span style={{ color: 'var(--accent-blue)' }}>IQ</span> <span style={{ color: 'var(--accent-teal)', fontSize: '0.75rem', verticalAlign: 'middle', background: 'rgba(13, 148, 136, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>AI</span>
            </h3>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              FIFA World Cup 2026 Platform
            </span>
          </div>
        </div>

        {user && user.role === 'organizer' && (
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
            <Link to="/organizer" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', border: 'none' }}>
              🚩 Command
            </Link>
            <Link to="/staff" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', border: 'none' }}>
              💼 Staff/Volunteers
            </Link>
            <Link to="/" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', border: 'none' }}>
              ⚽ Fan View
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'var(--bg-tertiary)', 
                padding: '0.35rem 0.75rem', 
                borderRadius: '20px', 
                border: '1px solid var(--card-border)' 
              }}
            >
              <span 
                className={`badge ${
                  user.role === 'organizer' 
                    ? 'badge-danger' 
                    : user.role === 'staff' 
                    ? 'badge-warning' 
                    : user.role === 'volunteer' 
                    ? 'badge-info' 
                    : 'badge-success'
                }`} 
                style={{ textTransform: 'capitalize' }}
              >
                {user.role}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name}
              </span>
            </div>
          )}

          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', borderRadius: '50%', width: '38px', height: '38px' }} 
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', borderRadius: '50%', width: '38px', height: '38px', color: 'var(--accent-red)' }} 
            aria-label="Log out session"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
};
export default Layout;
