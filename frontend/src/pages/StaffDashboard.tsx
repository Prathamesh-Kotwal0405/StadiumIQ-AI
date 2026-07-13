import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { Trash2, Settings, Activity } from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const [bins, setBins] = useState<any[]>([]);
  const [route, setRoute] = useState<any[]>([]);
  const [routeSummary, setRouteSummary] = useState('');
  const [gates, setGates] = useState<any[]>([]);
  const [selectedGate, setSelectedGate] = useState<any>(null);
  
  // Gate edit states
  const [flowRate, setFlowRate] = useState(0);
  const [queueSize, setQueueSize] = useState(0);
  const [gateStatus, setGateStatus] = useState<'open' | 'bottleneck' | 'closed'>('open');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const userJson = localStorage.getItem('stadiumiq_user');
  const user = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    fetchStaffMetrics();
  }, []);

  const fetchStaffMetrics = async () => {
    try {
      setLoading(true);
      const [binsRes, gatesRes] = await Promise.all([
        apiFetch('/api/stadiums/1/bins'),
        apiFetch('/api/stadiums/1/gates')
      ]);
      setBins(binsRes || []);
      setGates(gatesRes || []);
    } catch (err) {
      console.error('Failed to load staff metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getOptimizedRoutes = async () => {
    try {
      const res = await apiFetch('/api/stadiums/1/bins/routes');
      setRoute(res.route || []);
      setRouteSummary(res.summary || '');
    } catch (err) {
      console.error('Failed to generate optimized collection route:', err);
    }
  };

  const emptyBin = async (binId: number) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/stadiums/1/bins/${binId}/level`, {
        method: 'PATCH',
        body: JSON.stringify({ fillLevel: 0 })
      });
      // Refresh
      const binsRes = await apiFetch('/api/stadiums/1/bins');
      setBins(binsRes || []);
      // Refresh optimized route if active
      if (route.length > 0) {
        const res = await apiFetch('/api/stadiums/1/bins/routes');
        setRoute(res.route || []);
        setRouteSummary(res.summary || '');
      }
    } catch (err) {
      console.error('Failed to empty bin:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditGateSelect = (gate: any) => {
    setSelectedGate(gate);
    setFlowRate(gate.flowRate);
    setQueueSize(gate.currentQueueSize);
    setGateStatus(gate.status);
  };

  const saveGateSettings = async () => {
    if (!selectedGate) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/stadiums/1/gates/${selectedGate.id}/flow`, {
        method: 'PATCH',
        body: JSON.stringify({
          flowRate,
          currentQueueSize: queueSize,
          status: gateStatus
        })
      });
      // Refresh gates
      const gatesRes = await apiFetch('/api/stadiums/1/gates');
      setGates(gatesRes || []);
      setSelectedGate(null);
    } catch (err: any) {
      alert(`Error updating gate flow: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Simulated IoT sensor helper to increment bin fill levels for testing
  const triggerSensorIncrement = async (binId: number, currentLevel: number) => {
    const nextLevel = Math.min(100, currentLevel + 15);
    try {
      await apiFetch(`/api/stadiums/1/bins/${binId}/level`, {
        method: 'PATCH',
        body: JSON.stringify({ fillLevel: nextLevel })
      });
      const binsRes = await apiFetch('/api/stadiums/1/bins');
      setBins(binsRes || []);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Staff Terminal...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }} className="animated-fade">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Operations Terminal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage waste levels, crowd control gates, and incident responses.</p>
        </div>
        <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>Active Session: {user?.role.toUpperCase()}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
        {/* Left Column: Waste Management (Smart Bins) & Volunteers Route */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', margin: 0 }}>
                <Trash2 className="text-teal" size={20} aria-hidden="true" /> Smart Bins (Sustainability)
              </h2>
              <button onClick={getOptimizedRoutes} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                Optimize Routing
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {bins.map((b) => (
                <div key={b.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{b.zoneName}</span>
                    <span className={`badge ${b.status === 'full' ? 'badge-danger' : 'badge-success'}`}>
                      {b.fillLevel}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                    <div style={{ width: `${b.fillLevel}%`, height: '100%', background: b.fillLevel >= 80 ? 'var(--accent-red)' : b.fillLevel >= 50 ? 'var(--accent-gold)' : 'var(--accent-green)' }}></div>
                  </div>
                  
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    📍 {b.locationDetails}
                  </span>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => emptyBin(b.id)} className="btn btn-secondary" style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem' }} disabled={actionLoading}>
                      Mark Empty
                    </button>
                    <button onClick={() => triggerSensorIncrement(b.id, b.fillLevel)} className="btn btn-secondary" style={{ padding: '0.25rem', fontSize: '0.75rem' }} title="Simulate IoT sensor update" aria-label="Simulate IoT sensor update">
                      ⚡ Sensor Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Optimization result */}
          {route.length > 0 && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>📋 Optimized Collection Sequence</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{routeSummary}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {route.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                    <span style={{ background: 'var(--accent-blue)', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.zoneName}</span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.locationDetails} (fill: {item.fillLevel}%)</p>
                    </div>
                    <button onClick={() => emptyBin(item.id)} className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                      Clear
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Gate Flow Configuration */}
        <div>
          <div className="glass-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1rem' }}>
              <Activity className="text-blue" size={20} aria-hidden="true" /> Gates Queue Control
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Real-time gate configurations. Select a gate to update flow rates, queue size thresholds, or status updates.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {gates.map((g) => (
                <div key={g.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{g.name}</span>
                    <span className={`badge ${g.status === 'open' ? 'badge-success' : g.status === 'bottleneck' ? 'badge-warning' : 'badge-danger'}`}>
                      {g.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', margin: '0.25rem 0 0.75rem 0' }}>
                    Queue: {g.currentQueueSize} fans | Flow rate: {g.flowRate} people/min
                  </span>
                  
                  {user?.role === 'staff' || user?.role === 'organizer' ? (
                    <button onClick={() => handleEditGateSelect(g)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.25rem' }}>
                      <Settings size={12} aria-hidden="true" /> Edit Flow Settings
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>*Editing requires staff permissions</span>
                  )}
                </div>
              ))}
            </div>

            {/* Gate Configuration Modal/Panel */}
            {selectedGate && (
              <div className="glass-card" style={{ marginTop: '2rem', borderTop: '4px solid var(--accent-blue)' }}>
                <h3>Configure: {selectedGate.name}</h3>
                
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="gate-flow-rate-input" className="form-label">Flow Rate (people/min)</label>
                  <input
                    id="gate-flow-rate-input"
                    type="number"
                    value={flowRate}
                    onChange={(e) => setFlowRate(parseInt(e.target.value) || 0)}
                    className="input-field"
                    aria-label="Flow rate"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gate-queue-size-input" className="form-label">Current Queue (people)</label>
                  <input
                    id="gate-queue-size-input"
                    type="number"
                    value={queueSize}
                    onChange={(e) => setQueueSize(parseInt(e.target.value) || 0)}
                    className="input-field"
                    aria-label="Queue size"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gate-status-select" className="form-label">Status</label>
                  <select
                    id="gate-status-select"
                    value={gateStatus}
                    onChange={(e: any) => setGateStatus(e.target.value)}
                    className="input-field"
                    aria-label="Gate status"
                  >
                    <option value="open">Open</option>
                    <option value="bottleneck">Bottleneck</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button onClick={saveGateSettings} className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading}>
                    Save Changes
                  </button>
                  <button onClick={() => setSelectedGate(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
export default StaffDashboard;
