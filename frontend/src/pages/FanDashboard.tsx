import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../services/api';
import { Calendar, Compass, Train, UserCheck, Accessibility, ShieldAlert, Bell } from 'lucide-react';

export const FanDashboard: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [transit, setTransit] = useState<any[]>([]);
  const [gates, setGates] = useState<any[]>([]);
  const [recommendedGate, setRecommendedGate] = useState<any>(null);
  const [preferredSide, setPreferredSide] = useState('');
  const [waitTime, setWaitTime] = useState<number | null>(null);
  
  // Incident states
  const [myIncidents, setMyIncidents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: 'success' | 'info' }[]>([]);
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [reporting, setReporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [loading, setLoading] = useState(true);
  const [gateLoading, setGateLoading] = useState(false);

  const userJson = localStorage.getItem('stadiumiq_user');
  const user = userJson ? JSON.parse(userJson) : null;

  // Keep reference of previous incidents state to detect status changes
  const lastIncidentsRef = useRef<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (user && user.email) {
      fetchMyIncidents(user.email, true);
      const interval = setInterval(() => {
        fetchMyIncidents(user.email, false);
      }, 5000); // Poll incident status every 5 seconds
      return () => clearInterval(interval);
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [matchesRes, transitRes] = await Promise.all([
        apiFetch('/api/matches?limit=5'),
        apiFetch('/api/transit/schedules')
      ]);
      setMatches(matchesRes.matches || []);
      setTransit(transitRes || []);
      
      const gatesRes = await apiFetch('/api/stadiums/1/gates');
      setGates(gatesRes || []);
    } catch (err) {
      console.error('Failed to load fan dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyIncidents = async (userEmail: string, isInitial = false) => {
    try {
      const allIncidents = await apiFetch('/api/incidents');
      const filtered = allIncidents.filter((i: any) => i.reportedBy === userEmail);
      
      if (!isInitial && lastIncidentsRef.current.length > 0) {
        filtered.forEach((newInc: any) => {
          const oldInc = lastIncidentsRef.current.find((o) => o.id === newInc.id);
          if (oldInc) {
            // Case 1: Status changed from open to resolved
            if (oldInc.status === 'open' && newInc.status === 'resolved') {
              addNotification(`🎉 Your assistance request ticket #${newInc.id} has been resolved by Admin!`, 'success');
            }
            // Case 2: Volunteer dispatched (response action changed)
            else if (oldInc.responseAction !== newInc.responseAction && newInc.responseAction) {
              addNotification(`🔔 Update on ticket #${newInc.id}: ${newInc.responseAction}`, 'info');
            }
          }
        });
      }
      
      lastIncidentsRef.current = filtered;
      setMyIncidents(filtered);
    } catch (err) {
      console.error('Error fetching fan incidents:', err);
    }
  };

  const addNotification = (text: string, type: 'success' | 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setNotifications((prev) => [...prev, { id, text, type }]);
    
    // Auto clear notification after 8 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 8000);
  };

  const getGateRecommendation = async () => {
    setGateLoading(true);
    try {
      const url = `/api/stadiums/1/gates?recommend=true${preferredSide ? `&side=${preferredSide}` : ''}`;
      const res = await apiFetch(url);
      setGates(res.gates || []);
      setRecommendedGate(res.recommended);
      setWaitTime(res.waitTimeMinutes);
    } catch (err) {
      console.error('Failed to fetch gate recommendation:', err);
    } finally {
      setGateLoading(false);
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDesc.trim() || !user) return;
    setReporting(true);
    setSuccessMsg('');

    try {
      await apiFetch('/api/incidents', {
        method: 'POST',
        body: JSON.stringify({ description: incidentDesc, severity: incidentSeverity })
      });
      setIncidentDesc('');
      setIncidentSeverity('low');
      setSuccessMsg('✅ Incident reported successfully. Operations Command has received your request.');
      
      // Immediately pull fresh incidents
      await fetchMyIncidents(user.email, false);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(`Error submitting request: ${err.message}`);
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading StadiumIQ Fan Portal...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }} className="animated-fade">
      
      {/* Toast notifications container */}
      <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '380px', width: '100%' }}>
        {notifications.map((n) => (
          <div
            key={n.id}
            className="glass-card animated-fade"
            style={{
              background: n.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(59, 130, 246, 0.95)',
              borderColor: n.type === 'success' ? 'var(--accent-green)' : 'var(--accent-blue)',
              color: '#ffffff',
              padding: '1rem',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid #ffffff'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={16} aria-hidden="true" />
              <span>{n.text}</span>
            </div>
            <button
              onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== n.id))}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '1.15rem', fontWeight: 'bold', marginLeft: '0.5rem' }}
              aria-label="Close notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {/* Welcome Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(13, 148, 136, 0.1))', padding: '2.5rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }} className="text-gradient">Welcome to FIFA 2026 Operations</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
          Real-time navigation, transit schedules, and accessibility services at your fingertips.
        </p>
      </div>

      {/* Top Grid: Matches & Routing vs Transit & Accessibility */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Matches Panel */}
          <div className="glass-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
              <Calendar className="text-blue" size={20} aria-hidden="true" /> Upcoming Stadium Matches
            </h2>
            {matches.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No matches scheduled at the moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {matches.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem' }}>{m.homeTeam} vs {m.awayTeam}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        🏟️ {m.stadium?.name} | {new Date(m.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <span className={`badge ${m.status === 'live' ? 'badge-danger' : m.status === 'completed' ? 'badge-info' : 'badge-success'}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Smart Gate Navigation */}
          <div className="glass-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
              <Compass className="text-teal" size={20} aria-hidden="true" /> AI Smart Gate Recommendation
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Avoid bottlenecks! Choose your arrival side, and our routing engine will direct you to the fastest entry gate.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <select
                id="preferred-side-select"
                value={preferredSide}
                onChange={(e) => setPreferredSide(e.target.value)}
                className="input-field"
                style={{ flex: 1 }}
                aria-label="Select arrival side"
              >
                <option value="">Preferred side (Any)</option>
                <option value="North">North Concourse</option>
                <option value="South">South Concourse</option>
                <option value="East">East Concourse</option>
                <option value="West">West Concourse</option>
              </select>
              <button onClick={getGateRecommendation} className="btn btn-primary" style={{ padding: '0 1.5rem' }} disabled={gateLoading}>
                {gateLoading ? 'Analyzing...' : 'Get Route'}
              </button>
            </div>

            {recommendedGate && (
              <div className="glass-card" style={{ borderColor: 'var(--accent-teal)', background: 'rgba(13, 148, 136, 0.05)', marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <UserCheck size={16} aria-hidden="true" /> Recommended Entry Point
                </h4>
                <h3 style={{ margin: '0.5rem 0 0.25rem 0' }}>{recommendedGate.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Estimated Wait Time: <strong style={{ color: 'var(--text-primary)' }}>{waitTime} minutes</strong> (Current queue: {recommendedGate.currentQueueSize} fans).
                </p>
              </div>
            )}

            {/* List Gates Status */}
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Live Gates Overview</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {gates.map((g) => (
                  <div key={g.id} style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{g.name}</span>
                      <span className={`badge ${g.status === 'open' ? 'badge-success' : g.status === 'bottleneck' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                        {g.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                      Queue: {g.currentQueueSize} | flow: {g.flowRate}/min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Transit Schedules */}
          <div className="glass-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
              <Train className="text-gold" size={20} aria-hidden="true" /> Real-Time Transit Options
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {transit.map((t) => (
                <div key={t.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem' }}>{t.routeName}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        Type: {t.transportType} | Frequency: Every {t.frequencyMinutes} mins
                      </span>
                    </div>
                    <span className={`badge ${t.status === 'delayed' ? 'badge-warning' : 'badge-success'}`}>
                      {t.status}
                    </span>
                  </div>
                  {t.status === 'delayed' && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', borderLeft: '3px solid var(--accent-gold)', padding: '0.5rem', marginTop: '0.5rem', borderRadius: '2px', fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                      ⚠️ {t.delayDetails}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Accessibility Guide */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-teal)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
              <Accessibility className="text-teal" size={20} aria-hidden="true" /> Accessibility Concierge Services
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 1rem 0' }}>
              StadiumIQ is dedicated to providing an inclusive environment for all football fans.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                ♿ <strong>Wheelchair Routing</strong>: Elevators are located on the main concourse near section 105 and 120. Accessible entry lanes are open at all gates.
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                🧘 <strong>Sensory Quiet Zones</strong>: A designated quiet space for fans with sensory needs is situated near Section 202. Noise-canceling headphones can be checked out at Guest Services.
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                🎙️ <strong>Assisted Listening</strong>: Audio description devices for visually impaired fans are available at guest desks near Gate A and Gate C.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Middle Grid: Assistance Cards Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Incident Form Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1rem' }}>
            <ShieldAlert className="text-red" size={20} aria-hidden="true" /> Report an Issue / Request Help
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Encountered a problem or security hazard? Report it directly so a command administrator can dispatch volunteers to assist you.
          </p>

          {successMsg && (
            <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--accent-green)', padding: '0.75rem', marginBottom: '1rem', color: 'var(--accent-green)', fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleReportIncident}>
            <div className="form-group">
              <label htmlFor="incident-desc-textarea" className="form-label">Describe the Issue</label>
              <textarea
                id="incident-desc-textarea"
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                className="input-field"
                placeholder="e.g. Broken seat at Section 105 Row C, or liquid spill..."
                style={{ minHeight: '90px', resize: 'vertical' }}
                required
                aria-label="Describe issue"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="incident-severity-select" className="form-label">Urgency Level</label>
              <select
                id="incident-severity-select"
                value={incidentSeverity}
                onChange={(e: any) => setIncidentSeverity(e.target.value)}
                className="input-field"
                aria-label="Select urgency level"
              >
                <option value="low">Low (Spills, minor repairs)</option>
                <option value="medium">Medium (Sensory quiet rooms access, general helper)</option>
                <option value="high">High (Medical emergencies, safety hazards)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={reporting}>
              {reporting ? 'Submitting Report...' : 'Submit Assistance Request'}
            </button>
          </form>
        </div>

        {/* User's Assistance Requests Log */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1rem' }}>
            📋 Your Assistance Requests & Status
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Track details, responses, and volunteer assignments for your logged issues.
          </p>

          {myIncidents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
              You have not submitted any assistance requests yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '310px', overflowY: 'auto' }}>
              {myIncidents.map((i) => (
                <div key={i.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TICKET #{i.id}</span>
                    <span className={`badge ${i.status === 'open' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
                      {i.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0.5rem 0' }}>{i.description}</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '4px', borderLeft: '3px solid var(--accent-teal)' }}>
                    🛠️ <strong>Dispatch Action:</strong> {i.responseAction || 'Operations has received your ticket and is preparing assistance.'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Container: Operations Contacts alone */}
      <div className="glass-card" style={{ borderTop: '4px solid var(--accent-gold)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.25rem' }}>
          📞 Stadium Operations Contacts
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Need urgent assistance? Reach out directly to the operations command room:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Operations Hotline</span>
            <strong>+1 (800) 555-FIFA</strong>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', textAlign: 'center', borderLeft: '3px solid var(--accent-red)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Medical & Emergency</span>
            <strong style={{ color: 'var(--accent-red)' }}>Ext. 911-SOFI</strong>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Guest Services Desk</span>
            <strong>Ext. 100</strong>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Lost & Found Logistics</span>
            <strong>Ext. 404-LOST</strong>
          </div>
        </div>
      </div>

    </div>
  );
};
export default FanDashboard;
