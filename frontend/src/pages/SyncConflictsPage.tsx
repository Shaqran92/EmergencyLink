import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Database, RefreshCw } from 'lucide-react';
import { apiRequest } from '../shared/api';
import { shortDate } from '../shared/format';
import StatePill from '../components/StatePill';
import { ErrorState, LoadingState } from '../components/LoadState';

interface SyncConflict {
  _id: string;
  eventType: string;
  recordType: string;
  recordId: string;
  status: 'pending' | 'resolved';
  conflictDetails?: {
    serverTimestamp?: string;
    clientTimestamp?: string;
    serverState?: Record<string, any>;
    clientState?: Record<string, any>;
    message?: string;
  };
  resolution?: {
    resolvedAt?: string;
    resolvedBy?: string;
    strategy?: string;
    note?: string;
  };
  createdAt: string;
}

export default function SyncConflictsPage() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [selectedResolution, setSelectedResolution] = useState<'server_wins' | 'client_wins'>('server_wins');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<SyncConflict[]>('/sync/conflicts');
      setConflicts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve offline sync conflicts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResolve = async (conflictId: string) => {
    setBusy(true);
    try {
      await apiRequest(`/sync/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolution: selectedResolution,
          note: resolutionNote || `Resolved via manual dashboard action (${selectedResolution})`
        })
      });
      setNotice('Conflict resolved successfully.');
      setResolvingId(null);
      setResolutionNote('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve conflict.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading sync conflicts…" />;

  const pending = conflicts.filter((c) => c.status === 'pending');
  const resolved = conflicts.filter((c) => c.status === 'resolved');

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">OFFLINE RESILIENCE</div>
          <h1>Data Sync & Conflict Resolution</h1>
          <p>Audit and arbitrate divergent mutations submitted by offline or reconnecting field units.</p>
        </div>
        <button className="button button-secondary" onClick={() => void load()}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <ErrorState message={error} />}
      {notice && (
        <div className="notice-banner" role="status">
          {notice}
          <button onClick={() => setNotice('')}>×</button>
        </div>
      )}

      {/* Summary KPI grid */}
      <section className="stats-grid">
        <article className="metric-card">
          <div className="metric-icon tint-amber"><AlertTriangle size={18} /></div>
          <span className="metric-label">Pending Conflicts</span>
          <strong className="metric-value">{pending.length}</strong>
          <span className="metric-foot">Requiring manual arbitration</span>
        </article>
        <article className="metric-card">
          <div className="metric-icon tint-mint"><CheckCircle size={18} /></div>
          <span className="metric-label">Resolved Conflicts</span>
          <strong className="metric-value">{resolved.length}</strong>
          <span className="metric-foot">Successfully reconciled</span>
        </article>
        <article className="metric-card">
          <div className="metric-icon tint-blue"><Database size={18} /></div>
          <span className="metric-label">Total Sync Events</span>
          <strong className="metric-value">{conflicts.length}</strong>
          <span className="metric-foot">Recorded conflict audit log</span>
        </article>
      </section>

      {/* Pending conflicts table / list */}
      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <h2>Active Synchronization Discrepancies</h2>
            <p>Field mutations that collided with concurrent server updates</p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px', textAlign: 'center' }}>
            <CheckCircle size={32} style={{ color: 'var(--green, #10b981)', marginBottom: '8px' }} />
            <div style={{ fontWeight: 600, color: '#334155' }}>All records synchronized</div>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              No offline synchronization collisions currently detected across hospitals and ambulances.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Target Record</th>
                  <th>Discrepancy Details</th>
                  <th>Detected At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.eventType}</strong>
                      <small style={{ color: '#64748b', display: 'block' }}>{item.recordType}</small>
                    </td>
                    <td>
                      <code>{item.recordId}</code>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#334155' }}>
                        {item.conflictDetails?.message || 'Concurrent modification detected during offline sync queue drain.'}
                      </div>
                      {item.conflictDetails?.serverTimestamp && (
                        <small style={{ color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                          Server: {shortDate(item.conflictDetails.serverTimestamp)} · Client: {shortDate(item.conflictDetails.clientTimestamp || item.createdAt)}
                        </small>
                      )}
                    </td>
                    <td>{shortDate(item.createdAt)}</td>
                    <td>
                      <button
                        className="button button-primary button-small"
                        onClick={() => setResolvingId(item._id)}
                      >
                        Arbitrate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Resolution Modal */}
      {resolvingId && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setResolvingId(null); }}>
          <div className="modal-card form-modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">ARBITRATION</div>
                <h2>Resolve Sync Discrepancy</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setResolvingId(null)}>×</button>
            </div>
            <p className="modal-copy">
              Choose the authoritative state for this record. The decision will be recorded in the immutable audit trail.
            </p>

            <label className="field-label" htmlFor="resolution-strategy">Resolution Policy</label>
            <select
              id="resolution-strategy"
              className="select"
              value={selectedResolution}
              onChange={(e) => setSelectedResolution(e.target.value as any)}
            >
              <option value="server_wins">Accept Server Version (Discard Offline Change)</option>
              <option value="client_wins">Override with Client Version (Force Offline Update)</option>
            </select>

            <label className="field-label" htmlFor="resolution-note">Justification Note</label>
            <input
              id="resolution-note"
              className="input"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Verified by telemetry coordinator over radio"
            />

            <div className="modal-actions">
              <button className="button button-secondary" type="button" onClick={() => setResolvingId(null)}>
                Cancel
              </button>
              <button
                className="button button-primary"
                type="button"
                disabled={busy}
                onClick={() => void handleResolve(resolvingId)}
              >
                {busy ? 'Reconciling…' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Resolved Conflicts */}
      {resolved.length > 0 && (
        <section className="panel-card">
          <div className="panel-heading">
            <div>
              <h2>Reconciled Event History</h2>
              <p>Previously resolved synchronization conflicts and audit justification</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Target Record</th>
                  <th>Resolution Policy</th>
                  <th>Note</th>
                  <th>Resolved At</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((item) => (
                  <tr key={item._id}>
                    <td><strong>{item.eventType}</strong></td>
                    <td><code>{item.recordId}</code></td>
                    <td><StatePill value={item.resolution?.strategy || 'resolved'} /></td>
                    <td><span style={{ fontSize: '12px' }}>{item.resolution?.note || '—'}</span></td>
                    <td>{shortDate(item.resolution?.resolvedAt || item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
