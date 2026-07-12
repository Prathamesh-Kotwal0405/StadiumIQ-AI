import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { ShieldAlert, Sparkles, MessageSquare, Plus, CheckCircle, Send } from 'lucide-react';

const renderFormattedMessage = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let isBullet = false;
    let content = line;
    if (line.trim().startsWith('- ')) {
      isBullet = true;
      content = line.substring(line.indexOf('- ') + 2);
    }

    const parts = content.split('**');
    const renderedParts = parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i}>{part}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <ul key={idx} style={{ marginLeft: '1.25rem', marginBottom: '0.25rem', listStyleType: 'disc' }}>
          <li>{renderedParts}</li>
        </ul>
      );
    }

    return (
      <div key={idx} style={{ marginBottom: line.trim() === '' ? '0.5rem' : '0.25rem' }}>
        {renderedParts}
      </div>
    );
  });
};

export const OpsDashboard: React.FC = () => {
  // Metric counts
  const [incidents, setIncidents] = useState<any[]>([]);
  const [activeIncidentCount, setActiveIncidentCount] = useState(0);
  const [bottleneckCount, setBottleneckCount] = useState(0);
  const [fullBinCount, setFullBinCount] = useState(0);
  const [delayedTransitCount, setDelayedTransitCount] = useState(0);

  // Incident report form
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high'>('low');

  // Volunteer dispatch text per incident
  const [dispatchTexts, setDispatchTexts] = useState<{[key: number]: string}>({});

  // AI Copilot Chat
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOpsCommand();
  }, []);

  const fetchOpsCommand = async () => {
    try {
      setLoading(true);
      const [incidentsRes, gatesRes, binsRes, transitRes] = await Promise.all([
        apiFetch('/api/incidents'),
        apiFetch('/api/stadiums/1/gates'),
        apiFetch('/api/stadiums/1/bins'),
        apiFetch('/api/transit/schedules')
      ]);

      setIncidents(incidentsRes || []);
      setActiveIncidentCount(incidentsRes.filter((i: any) => i.status === 'open').length);
      setBottleneckCount(gatesRes.filter((g: any) => g.status === 'bottleneck').length);
      setFullBinCount(binsRes.filter((b: any) => b.fillLevel >= 80).length);
      setDelayedTransitCount(transitRes.filter((t: any) => t.status === 'delayed').length);
    } catch (err) {
      console.error('Failed to load operations metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    setActionLoading(true);

    try {
      await apiFetch('/api/incidents', {
        method: 'POST',
        body: JSON.stringify({ description: newDesc, severity: newSeverity })
      });
      setNewDesc('');
      setNewSeverity('low');
      await fetchOpsCommand();
    } catch (err: any) {
      alert(`Failed to report incident: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchVolunteer = async (incidentId: number) => {
    const text = dispatchTexts[incidentId];
    if (!text || !text.trim()) return;
    setActionLoading(true);

    try {
      await apiFetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'open',
          responseAction: `Dispatched Volunteers: ${text}`
        })
      });
      setDispatchTexts(prev => ({ ...prev, [incidentId]: '' }));
      await fetchOpsCommand();
    } catch (err: any) {
      alert(`Failed to dispatch volunteer: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const resolveIncident = async (incidentId: number) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'resolved',
          responseAction: 'Resolved and cleared by command dispatcher.'
        })
      });
      await fetchOpsCommand();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const submitAIQuery = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse('');

    try {
      const data = await apiFetch('/api/ai/ops-query', {
        method: 'POST',
        body: JSON.stringify({ query: aiQuery })
      });
      setAiResponse(data.response);
    } catch (err: any) {
      setAiResponse(`❌ Error: ${err.message || 'Failed to generate operational analysis.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Syncing Operations Command Room...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }} className="animated-fade">
      
      {/* Top Banner Overview */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(59, 130, 246, 0.05))', padding: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }} className="text-gradient">🏟️ Operations Command & Control center</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Real-time incident dispatch logs, crowd monitoring indices, and GenAI-assisted command queries.
        </p>

        {/* Highlight Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginTop: '1.5rem' }}>
          <div className="glass-card" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderLeft: '4px solid var(--accent-red)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Safety Incidents</span>
            <h2 style={{ fontSize: '2rem', margin: '0.25rem 0 0 0', color: activeIncidentCount > 0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{activeIncidentCount}</h2>
          </div>
          <div className="glass-card" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderLeft: '4px solid var(--accent-gold)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Gate Bottlenecks</span>
            <h2 style={{ fontSize: '2rem', margin: '0.25rem 0 0 0', color: bottleneckCount > 0 ? 'var(--accent-gold)' : 'var(--text-primary)' }}>{bottleneckCount}</h2>
          </div>
          <div className="glass-card" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderLeft: '4px solid var(--accent-teal)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Full Smart Bins (&gt;80%)</span>
            <h2 style={{ fontSize: '2rem', margin: '0.25rem 0 0 0', color: 'var(--accent-teal)' }}>{fullBinCount}</h2>
          </div>
          <div className="glass-card" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderLeft: '4px solid var(--accent-blue)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Delayed Transit Lines</span>
            <h2 style={{ fontSize: '2rem', margin: '0.25rem 0 0 0', color: 'var(--accent-blue)' }}>{delayedTransitCount}</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Command AI & Incidents Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Operations Copilot */}
          <div className="glass-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1rem' }}>
              <Sparkles className="text-teal" size={20} /> GenAI Local Operations Copilot
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Query the local context engine for crowd mitigation tactics, smart bin routes, or incident resolution checklists.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="e.g. Provide a checklist to clear gate bottlenecks, or optimize smart bins route..."
                className="input-field"
                style={{ flex: 1 }}
                aria-label="Query AI Copilot"
              />
              <button 
                onClick={submitAIQuery} 
                className="btn btn-primary" 
                style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0 1.5rem' }}
                disabled={aiLoading}
              >
                {aiLoading ? 'Analyzing...' : <><MessageSquare size={16} /> Query AI</>}
              </button>
            </div>

            {aiResponse && (
              <div 
                className="glass-card animated-fade" 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  maxHeight: '350px', 
                  overflowY: 'auto', 
                  fontSize: '0.875rem', 
                  lineHeight: '1.6', 
                  padding: '1.25rem' 
                }}
              >
                <div>{renderFormattedMessage(aiResponse)}</div>
              </div>
            )}
          </div>

          {/* Active Incident List */}
          <div className="glass-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1rem' }}>
              <ShieldAlert className="text-red" size={20} /> Incident Dispatch logs
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {incidents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No incidents logged in the database.</p>
              ) : (
                incidents.map((i) => (
                  <div key={i.id} style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', borderLeft: `4px solid ${i.severity === 'high' ? 'var(--accent-red)' : i.severity === 'medium' ? 'var(--accent-gold)' : 'var(--accent-green)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, marginRight: '1rem' }}>
                        <span className={`badge ${i.severity === 'high' ? 'badge-danger' : i.severity === 'medium' ? 'badge-warning' : 'badge-success'}`} style={{ marginRight: '0.5rem' }}>
                          {i.severity.toUpperCase()}
                        </span>
                        <span className={`badge ${i.status === 'open' ? 'badge-warning' : 'badge-success'}`} style={{ textTransform: 'capitalize' }}>
                          {i.status}
                        </span>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.5rem', marginBottom: '0.25rem' }}>{i.description}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Reported by: {i.reportedBy} | {new Date(i.createdAt).toLocaleString()}
                        </p>
                        
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', display: 'inline-block' }}>
                          🔧 Action: {i.responseAction || 'No action assigned yet.'}
                        </p>

                        {/* Dispatch Volunteer Input Panel */}
                        {i.status === 'open' && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center', maxWidth: '500px' }}>
                            <input
                              type="text"
                              value={dispatchTexts[i.id] || ''}
                              onChange={(e) => setDispatchTexts(prev => ({ ...prev, [i.id]: e.target.value }))}
                              placeholder="e.g. Dispatch volunteer Bob with first-aid, or Trash crew..."
                              className="input-field"
                              style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: '34px', minHeight: 'unset' }}
                              aria-label="Dispatch volunteer instruction"
                            />
                            <button
                              onClick={() => handleDispatchVolunteer(i.id)}
                              className="btn btn-primary"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: '34px', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                              disabled={actionLoading || !(dispatchTexts[i.id] || '').trim()}
                            >
                              <Send size={12} /> Send Volunteer
                            </button>
                          </div>
                        )}
                      </div>

                      {i.status === 'open' && (
                        <button onClick={() => resolveIncident(i.id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--accent-green)', gap: '0.25rem', whiteSpace: 'nowrap' }} disabled={actionLoading}>
                          <CheckCircle size={14} /> Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Report Incident Form */}
        <div>
          <div className="glass-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.25rem' }}>
              <Plus className="text-blue" size={20} /> Report Safety Incident
            </h2>
            
            <form onSubmit={handleReportIncident}>
              <div className="form-group">
                <label className="form-label">Incident Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Crowd congestion at main metro escalator..."
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  required
                  aria-label="Incident description"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Severity Level</label>
                <select
                  value={newSeverity}
                  onChange={(e: any) => setNewSeverity(e.target.value)}
                  className="input-field"
                  aria-label="Select severity level"
                >
                  <option value="low">Low (Spills, minor repairs)</option>
                  <option value="medium">Medium (Crowd bottlenecks, assistance)</option>
                  <option value="high">High (Medical help, structural hazards)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={actionLoading || !newDesc.trim()}
              >
                {actionLoading ? 'Logging Incident...' : 'Log & Dispatch Incident'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
export default OpsDashboard;
