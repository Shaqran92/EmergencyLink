import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, Cpu, Database, HardDrive, Map, RefreshCw, Server, Shield } from 'lucide-react';
import { apiRequest } from '../shared/api';
import StatePill from '../components/StatePill';
import { ErrorState, LoadingState } from '../components/LoadState';

interface SystemDiagnostics {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  database: {
    status: string;
    host: string;
    name: string;
  };
  aiMicroservice: {
    status: string;
    url: string;
    mode: string;
    details?: {
      engineVersion?: string;
      scoreVersion?: string;
      calculations?: number;
      latencyMsMedian?: string | number;
    };
  };
  externalIntegrations: {
    openRouteService: {
      configured: boolean;
      provider: string;
    };
    mapbox: {
      configured: boolean;
      provider: string;
    };
  };
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
}

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest<SystemDiagnostics>('/health/system');
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve system health metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Inspecting system services & telemetry…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return null;

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">OBSERVABILITY & ARCHITECTURE</div>
          <h1>System Health & Infrastructure</h1>
          <p>Real-time telemetry across Node.js backend, Python AI/ML microservice, and external APIs.</p>
        </div>
        <button className="button button-secondary" onClick={() => void load()}>
          <RefreshCw size={16} /> Refresh diagnostics
        </button>
      </div>

      {/* Main KPI Status Overview */}
      <section className="stats-grid">
        <article className="metric-card">
          <div className="metric-icon tint-mint"><CheckCircle2 size={18} /></div>
          <span className="metric-label">System Status</span>
          <strong className="metric-value">{data.status.toUpperCase()}</strong>
          <span className="metric-foot">Environment: {data.environment}</span>
        </article>
        <article className="metric-card">
          <div className="metric-icon tint-blue"><Server size={18} /></div>
          <span className="metric-label">Backend Uptime</span>
          <strong className="metric-value">{formatUptime(data.uptimeSeconds)}</strong>
          <span className="metric-foot">Process PID active</span>
        </article>
        <article className="metric-card">
          <div className="metric-icon tint-violet"><Cpu size={18} /></div>
          <span className="metric-label">AI/ML Service</span>
          <strong className="metric-value">{data.aiMicroservice.status.toUpperCase()}</strong>
          <span className="metric-foot">FastAPI Engine {data.aiMicroservice.details?.engineVersion || '1.0.0'}</span>
        </article>
        <article className="metric-card">
          <div className="metric-icon tint-amber"><HardDrive size={18} /></div>
          <span className="metric-label">Heap Memory</span>
          <strong className="metric-value">{data.memory.heapUsedMb} MB</strong>
          <span className="metric-foot">Total: {data.memory.heapTotalMb} MB</span>
        </article>
      </section>

      {/* Subsystem Inspection Cards */}
      <section className="content-grid">
        {/* Database & Storage */}
        <div className="panel-card panel-main">
          <div className="panel-heading">
            <div>
              <h2>Core Infrastructure Services</h2>
              <p>Primary transactional datastore and distributed engines</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Database size={24} color="#0284c7" />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>MongoDB Primary Datastore</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Cluster Host: {data.database.host}</span>
                </div>
              </div>
              <StatePill value={data.database.status} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Cpu size={24} color="#7c3aed" />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>Python AI/ML Microservice</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Endpoint: {data.aiMicroservice.url} (Mode: {data.aiMicroservice.mode})</span>
                </div>
              </div>
              <StatePill value={data.aiMicroservice.status} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Activity size={24} color="#059669" />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>Real-time WebSockets</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Socket.IO cluster listening on port 5000</span>
                </div>
              </div>
              <StatePill value="connected" />
            </div>
          </div>
        </div>

        {/* External Integrations */}
        <div className="panel-card freshness-card">
          <div className="panel-heading">
            <div>
              <h2>External API Integrations</h2>
              <p>Geospatial and routing provider configuration</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Map size={16} color="#0284c7" /> Mapbox GL Geographics
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: data.externalIntegrations.mapbox.configured ? '#059669' : '#d97706' }}>
                  {data.externalIntegrations.mapbox.configured ? 'ACTIVE KEY' : 'FALLBACK MODE'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Powers client-side interactive incident maps, hospital geolocation, and fleet markers.
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={16} color="#059669" /> OpenRouteService API
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: data.externalIntegrations.openRouteService.configured ? '#059669' : '#d97706' }}>
                  {data.externalIntegrations.openRouteService.configured ? 'ACTIVE KEY' : 'HAVERSINE FALLBACK'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Provides dynamic real-world road network driving durations, traffic detour factors, and ETA ranges.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
