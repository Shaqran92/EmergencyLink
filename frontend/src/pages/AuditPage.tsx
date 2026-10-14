import { useCallback, useEffect, useState } from 'react';
import {
  Filter,
  RefreshCw,
  Search,
  User
} from 'lucide-react';
import { apiRequest } from '../shared/api';
import { humanize, shortDate } from '../shared/format';
import { ErrorState, LoadingState } from '../components/LoadState';
import StatePill from '../components/StatePill';

interface AuditEventItem {
  _id: string;
  actorId?: string | { _id?: string; name?: string; email?: string };
  actorRole?: string;
  eventType: string;
  recordType: string;
  recordId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  details?: Record<string, unknown>;
  timestamp?: string;
  createdAt?: string;
}

const EVENT_TYPES = [
  'all',
  'emergency_created',
  'emergency_status_changed',
  'resource_updated',
  'resource_confirmed',
  'referral_requested',
  'referral_responded',
  'referral_clarified',
  'ambulance_status_changed',
  'assignment_created',
  'assignment_status_changed',
  'user_created',
  'user_status_changed'
];

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 15;

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (selectedEventType !== 'all') {
        queryParams.append('eventType', selectedEventType);
      }
      queryParams.append('page', String(page));
      queryParams.append('limit', String(limit));

      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await apiRequest<AuditEventItem[] | { items: AuditEventItem[] }>(`/audit-events${queryStr}`);
      const list = Array.isArray(res) ? res : (res && Array.isArray((res as { items: AuditEventItem[] }).items) ? (res as { items: AuditEventItem[] }).items : []);
      setEvents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve system audit logs');
    } finally {
      setLoading(false);
    }
  }, [selectedEventType, page]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const filteredEvents = events.filter((ev) => {
    const actorText = typeof ev.actorId === 'object' && ev.actorId ? (ev.actorId.name || ev.actorId.email || '') : String(ev.actorId || '');
    const fullText = `${ev.eventType} ${ev.recordType} ${ev.recordId} ${actorText} ${ev.actorRole || ''}`.toLowerCase();
    return fullText.includes(search.toLowerCase());
  });

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SYSTEM INTEGRITY & GOVERNANCE</div>
          <h1>Operational audit trail</h1>
          <p>Immutable append-only log of case updates, triage decisions, and access modifications.</p>
        </div>
        <button className="button button-secondary" onClick={() => void loadEvents()}>
          <RefreshCw size={15} /> Refresh logs
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={() => void loadEvents()} />}

      <div className="audit-filters">
        <label className="search-box">
          <Search size={16} />
          <input
            placeholder="Search by record ID, actor name, or action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color="var(--muted)" />
          <select
            className="select"
            value={selectedEventType}
            onChange={(e) => {
              setSelectedEventType(e.target.value);
              setPage(1);
            }}
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Event Types' : humanize(type)}
              </option>
            ))}
          </select>
        </div>

        <span className="toolbar-count" style={{ marginLeft: 'auto' }}>
          {filteredEvents.length} events logged
        </span>
      </div>

      <div className="panel-card">
        {loading ? (
          <LoadingState label="Loading audit logs…" />
        ) : filteredEvents.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Action</th>
                  <th>Record Scope</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Audit Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev) => {
                  const actorName = typeof ev.actorId === 'object' && ev.actorId ? (ev.actorId.name || ev.actorId.email || 'System') : (ev.actorId || 'System');
                  const time = ev.timestamp || ev.createdAt;
                  return (
                    <tr key={ev._id}>
                      <td style={{ fontSize: 10, color: 'var(--muted)' }}>
                        {shortDate(time)}
                      </td>
                      <td>
                        <StatePill value={ev.eventType} />
                      </td>
                      <td>
                        <strong>{ev.recordType}</strong>
                        <small style={{ color: 'var(--muted)', display: 'block' }}>{ev.recordId}</small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={13} color="var(--muted)" />
                          <span>{actorName}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 10, color: '#4a5b56', background: '#eef3f0', padding: '2px 7px', borderRadius: 4 }}>
                          {ev.actorRole ? humanize(ev.actorRole) : 'System'}
                        </span>
                      </td>
                      <td>
                        <details style={{ fontSize: 10, cursor: 'pointer' }}>
                          <summary style={{ color: 'var(--green)', fontWeight: 600 }}>Inspect state</summary>
                          <pre style={{ margin: '6px 0 0', padding: 8, background: '#f5f7f6', borderRadius: 6, fontSize: 9, maxWidth: 320, overflowX: 'auto' }}>
                            {JSON.stringify(ev.after || ev.details || ev.before || {}, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No audit events match the current filter criteria.</div>
        )}

        <div className="pagination">
          <span>Page {page}</span>
          <div className="pagination-controls">
            <button
              className="button button-secondary button-small"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="button button-secondary button-small"
              disabled={filteredEvents.length < limit}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
