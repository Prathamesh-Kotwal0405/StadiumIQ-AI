import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('stadiumiq_token');
  const userJson = localStorage.getItem('stadiumiq_user');
  const user = userJson ? JSON.parse(userJson) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'organizer') {
    return (
      <div className="glass-card animated-fade" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <h2 className="text-red" style={{ marginBottom: '1rem' }}>⚠️ Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Your account role ({user.role}) is not authorized to access this operational terminal.
        </p>
        <button 
          onClick={() => window.history.back()} 
          className="btn btn-secondary" 
          style={{ marginTop: '1.5rem' }}
        >
          Return to previous page
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
