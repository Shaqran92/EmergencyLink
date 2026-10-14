import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Percent,
  Play,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { apiRequest } from '../shared/api';
import { humanize } from '../shared/format';
import { ErrorState, LoadingState } from '../components/LoadState';

interface ShortageWarning {
  hospitalId: string;
  hospitalName?: string;
  resourceType: string;
  availableCount: number;
  totalCapacity?: number;
  warningLevel?: string;
  message?: string;
}

interface SurgeResult {
  simulatedCases: number;
  resourceType: string;
  facilityImpact: Array<{
    hospitalId: string;
    hospitalName: string;
    simulatedIncoming: number;
    projectedStrain: string;
    recommendedAction: string;
  }>;
}

interface OperationalMetrics {
  period?: {
    from?: string;
    to?: string;
  };
  avgReferralResponseSeconds?: number;
  avgTimeToDestinationConfirmSeconds?: number;
  pendingReferrals?: number;
  rejectedReferrals?: number;
  resourceFreshnessRate?: number;
  workflowCompletionRate?: number;
  syncSummary?: Record<string, number>;
  note?: string;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [shortages, setShortages] = useState<ShortageWarning[]>([]);
  const [surgeCases, setSurgeCases] = useState(12);
  const [surgeResult, setSurgeResult] = useState<SurgeResult | null>(null);
  const [surgeBusy, setSurgeBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, shortageData] = await Promise.all([
        apiRequest<OperationalMetrics>('/analytics/metrics'),
        apiRequest<{ warnings: ShortageWarning[] }>('/recommendations/shortage-warnings').catch(() => ({ warnings: [] }))
      ]);
      setMetrics(data);
      setShortages(shortageData.warnings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to calculate operational analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  const runSurgeSimulation = async () => {
    setSurgeBusy(true);
    try {
      const res = await apiRequest<SurgeResult>('/recommendations/simulate-surge', {
        method: 'POST',
        body: JSON.stringify({ casesCount: surgeCases, resourceType: 'icu_bed' })
      });
      setSurgeResult(res);
    } catch (err: any) {
      console.warn('Surge simulation failed', err);
    } finally {
      setSurgeBusy(false);
    }
  };

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  if (loading) return <LoadingState label="Computing operational workflow performance analytics…" />;
  if (error) return <ErrorState message={error} onRetry={() => void loadMetrics()} />;
  if (!metrics) return null;

  const respMinutes = metrics.avgReferralResponseSeconds
    ? (metrics.avgReferralResponseSeconds / 60).toFixed(1)
    : '0.0';
  const confirmMinutes = metrics.avgTimeToDestinationConfirmSeconds
    ? (metrics.avgTimeToDestinationConfirmSeconds / 60).toFixed(1)
    : '0.0';

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">REGIONAL PERFORMANCE & SLA</div>
          <h1>Operational analytics</h1>
          <p>Coordination turnaround latency, resource freshness coverage, and dispatch SLA compliance.</p>
        </div>
        <button className="button button-secondary" onClick={() => void loadMetrics()}>
          <RefreshCw size={15} /> Recalculate
        </button>
      </div>

      <section className="stats-grid">
        <article className="metric-card">
          <div className="metric-icon tint-mint">
            <Clock size={19} />
          </div>
          <span className="metric-label">Avg Referral Turnaround</span>
          <strong className="metric-value">{respMinutes}m</strong>
          <span className="metric-foot">Request-to-response duration</span>
        </article>

        <article className="metric-card">
          <div className="metric-icon tint-blue">
            <TrendingUp size={19} />
          </div>
          <span className="metric-label">Time to Confirmed Destination</span>
          <strong className="metric-value">{confirmMinutes}m</strong>
          <span className="metric-foot">Incident intake to hospital acceptance</span>
        </article>

        <article className="metric-card">
          <div className="metric-icon tint-amber">
            <Percent size={19} />
          </div>
          <span className="metric-label">Resource Freshness Coverage</span>
          <strong className="metric-value">{metrics.resourceFreshnessRate || 0}%</strong>
          <span className="metric-foot">Confirmed current hospital reports</span>
        </article>

        <article className="metric-card">
          <div className="metric-icon tint-violet">
            <CheckCircle size={19} />
          </div>
          <span className="metric-label">End-to-End Handover Rate</span>
          <strong className="metric-value">{metrics.workflowCompletionRate || 0}%</strong>
          <span className="metric-foot">Cases completed through handover</span>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel-card panel-main">
          <div className="panel-heading">
            <div>
              <h2>Turnaround & SLA Benchmarks</h2>
              <p>Regional dispatch goals vs. simulated operational performance</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18, marginTop: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                <span><strong>Referral Response Latency</strong> (Target: &lt; 5 mins)</span>
                <span style={{ fontWeight: 700, color: Number(respMinutes) <= 5 ? 'var(--green)' : '#c05621' }}>
                  {respMinutes} min actual
                </span>
              </div>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{
                    width: `${Math.min(100, Math.max(10, (Number(respMinutes) / 10) * 100))}%`,
                    background: Number(respMinutes) <= 5 ? 'var(--green)' : '#dd6b20'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                <span><strong>Hospital Data Freshness Rate</strong> (Target: &gt; 80%)</span>
                <span style={{ fontWeight: 700, color: (metrics.resourceFreshnessRate || 0) >= 80 ? 'var(--green)' : '#c05621' }}>
                  {metrics.resourceFreshnessRate || 0}% actual
                </span>
              </div>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{ width: `${metrics.resourceFreshnessRate || 0}%` }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                <span><strong>Workflow Completion Compliance</strong> (Target: &gt; 85%)</span>
                <span style={{ fontWeight: 700, color: (metrics.workflowCompletionRate || 0) >= 85 ? 'var(--green)' : '#c05621' }}>
                  {metrics.workflowCompletionRate || 0}% actual
                </span>
              </div>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{ width: `${metrics.workflowCompletionRate || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="panel-card freshness-card">
          <div className="panel-heading">
            <div>
              <h2>Referral Queue Health</h2>
              <p>Status breakdown across active coordination requests</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div className="freshness-row">
              <span className="freshness-dot dot-unconfirmed" />
              <span>Pending Referral Decisions</span>
              <strong>{metrics.pendingReferrals || 0}</strong>
            </div>

            <div className="freshness-row">
              <span className="freshness-dot dot-stale" />
              <span>Rejected Referral Count</span>
              <strong>{metrics.rejectedReferrals || 0}</strong>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <span className="metric-label">Offline Sync Telemetry</span>
              <div style={{ marginTop: 8, display: 'grid', gap: 6, fontSize: 11 }}>
                {metrics.syncSummary && Object.keys(metrics.syncSummary).length > 0 ? (
                  Object.entries(metrics.syncSummary).map(([status, count]) => (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>{humanize(status)}</span>
                      <strong>{count}</strong>
                    </div>
                  ))
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 10 }}>Zero synchronization conflicts detected.</span>
                )}
              </div>
            </div>
          </div>

          <div className="confidence-note" style={{ marginTop: 14 }}>
            Metrics are computed continuously from the MongoDB event log and audit records.
          </div>
        </div>
      </section>

      {/* Predictive Shortage Warnings (§7.15) */}
      <section className="panel-card" style={{ padding: '16px' }}>
        <div className="panel-heading" style={{ marginBottom: '12px' }}>
          <div>
            <div className="eyebrow" style={{ color: '#d97706' }}>AI/ML EARLY WARNING</div>
            <h2>Resource Shortage Predictive Horizon (§7.15)</h2>
            <p>Heuristic threshold and consumption forecasting powered by the Python AI/ML microservice</p>
          </div>
        </div>

        {shortages.length === 0 ? (
          <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>All monitored critical resources (ICU beds, ER beds, ventilators) report adequate operational headroom across facilities.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {shortages.map((item, idx) => (
              <div key={idx} style={{ padding: '12px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13px', color: '#92400e' }}>{item.hospitalName || 'Hospital'}</strong>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <AlertTriangle size={11} /> POTENTIAL SHORTAGE
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#78350f' }}>
                  {item.message || (item as any).reasons?.join('; ') || (item as any).warning || `${item.resourceType}: low availability`}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mass Casualty Surge Simulator (§7.4) */}
      <section className="panel-card" style={{ padding: '16px' }}>
        <div className="panel-heading" style={{ marginBottom: '12px' }}>
          <div>
            <div className="eyebrow" style={{ color: '#dc2626' }}>AI SURGE SIMULATOR</div>
            <h2>Mass Casualty Influx Simulator (§7.4)</h2>
            <p>Stress-test regional capacity distribution against simulated multi-casualty incidents</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Simulate Influx:</label>
            <select
              className="select"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
              value={surgeCases}
              onChange={(e) => setSurgeCases(Number(e.target.value))}
            >
              <option value={6}>6 Emergency Cases</option>
              <option value={12}>12 Emergency Cases</option>
              <option value={24}>24 Emergency Cases</option>
              <option value={48}>48 Emergency Cases (Disaster)</option>
            </select>
            <button
              className="button button-primary button-small"
              disabled={surgeBusy}
              onClick={() => void runSurgeSimulation()}
            >
              <Play size={14} /> {surgeBusy ? 'Simulating…' : 'Run Surge Simulation'}
            </button>
          </div>
        </div>

        {surgeResult && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
              Simulated {surgeResult.simulatedCases} arrivals sequentially routed to optimal facilities:
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>Simulated Influx</th>
                    <th>Projected Strain</th>
                    <th>Recommended Operational Policy</th>
                  </tr>
                </thead>
                <tbody>
                  {surgeResult.facilityImpact.map((h) => (
                    <tr key={h.hospitalId}>
                      <td><strong>{h.hospitalName}</strong></td>
                      <td>+{h.simulatedIncoming} patients</td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: h.projectedStrain === 'High' ? '#fee2e2' : h.projectedStrain === 'Moderate' ? '#fef3c7' : '#ecfdf5',
                          color: h.projectedStrain === 'High' ? '#991b1b' : h.projectedStrain === 'Moderate' ? '#92400e' : '#065f46'
                        }}>
                          {h.projectedStrain} Strain
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{h.recommendedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
