import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { FanDashboard } from './pages/FanDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { OpsDashboard } from './pages/OpsDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ChatWindow } from './components/ChatWindow';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Fan Portal */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedRoles={['fan', 'organizer']}>
              <Layout>
                <FanDashboard />
                <ChatWindow />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Staff & Volunteers Portal */}
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <Layout>
                <StaffDashboard />
                <ChatWindow />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Organizer Command Portal */}
        <Route 
          path="/organizer" 
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <Layout>
                <OpsDashboard />
                <ChatWindow />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Fallback Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
