import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Route
} from 'lucide-react';
import { apiRequest } from '../shared/api';
import { useAuth } from '../shared/AuthProvider';
import { humanize, shortDate } from '../shared/format';
import type { Emergency, Referral } from '../shared/types';
import StatePill from '../components/StatePill';
import { ErrorState, LoadingState } from '../components/LoadState';
import MapboxMap from '../components/MapboxMap';

interface Candidate {
  hospitalId: string;
  hospitalName?: string;
  score: number;
  etaMinutes?: number;
  freshnessStatus?: string;
  breakdown?: {
    travel?: number;
    freshness?: number;
    capacity?: number;
    capability?: number;
  };
  explanation?: string[];
  warnings?: string[];
}

interface RecommendationResult {
  eligible?: Candidate[];
  ineligible?: Array<{ hospitalId?: string; hospitalName?: string; reasons?: string[] }>;
  disclaimer?: string;
}

const LIFECYCLE_STEPS = [
  { key: 'registered', label: 'Registered' },
  { key: 'referral_pending', label: 'Referral' },
  { key: 'destination_confirmed', label: 'Confirmed' },
  { key: 'ambulance_assigned', label: 'Assigned' },
  { key: 'en_route', label: 'En Route' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'handed_over', label: 'Handover' },
  { key: 'closed', label: 'Closed' }
];

export default function CaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Emergency | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadCase = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [caseRes, refRes] = await Promise.allSettled([
        apiRequest<Emergency>(`/emergencies/${id}`),
        apiRequest<Referral[]>('/referrals')
      ]);

      if (caseRes.status === 'fulfilled') {
        setCaseData(caseRes.value);
      } else {
        throw new Error('Failed to load emergency case details');
      }

      if (refRes.status === 'fulfilled') {
        const related = (Array.isArray(refRes.value) ? refRes.value : []).filter(
          (r) => r.caseId === caseRes.value.caseId || (caseRes.value._id && r.caseId === caseRes.value._id)
        );
        setReferrals(related);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load case details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  async function fetchRecommendations() {
    if (!caseData) return;
    setRecLoading(true);
    setError('');
    try {
      const result = await apiRequest<RecommendationResult>('/recommendations', {
        method: 'POST',
        body: JSON.stringify({ caseId: caseData.caseId })
      });
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve recommendations');
    } finally {
      setRecLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    if (!caseData) return;
    setStatusUpdating(true);
    setError('');
    try {
      await apiRequest(`/emergencies/${caseData._id || caseData.caseId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setNotice(`Case status updated to ${humanize(newStatus)}.`);
      await loadCase();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transition case status');
    } finally {
      setStatusUpdating(false);
    }
  }

  async function createReferral(hospitalId: string) {
    if (!caseData) return;
    try {
      await apiRequest('/referrals', {
        method: 'POST',
        body: JSON.stringify({ caseId: caseData.caseId, hospitalId })
      });
      setNotice('Referral request submitted successfully.');
      await loadCase();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit referral');
    }
  }

  if (loading) return <LoadingState label="Loading emergency case details…" />;
  if (error && !caseData) return <ErrorState message={error} onRetry={() => void loadCase()} />;
  if (!caseData) return <div className="empty-state panel-card">Emergency case not found.</div>;

  const currentStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === caseData.status);
  const canManage = ['coordinator', 'system_admin'].includes(user?.role || '');

  return (
    <div className="page-stack case-detail">
      <div className="page-heading">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Link to="/emergencies" className="text-link">
              <ArrowLeft size={14} /> Back to cases
            </Link>
          </div>
          <div className="eyebrow">EMERGENCY CASE RECORD</div>
          <h1>{caseData.caseId}</h1>
          <p>{caseData.summary || 'Emergency operational coordination record'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatePill value={caseData.priorityCategory} />
          <StatePill value={caseData.status} />
          <button className="button button-secondary" onClick={() => void loadCase()}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div className="notice-banner" role="status">
          {notice}
          <button onClick={() => setNotice('')} aria-label="Dismiss">×</button>
        </div>
      )}
      {error && <ErrorState message={error} />}

      {/* Progress Timeline */}
      <section className="panel-card" style={{ padding: '16px 20px' }}>
        <div className="panel-heading" style={{ marginBottom: 4 }}>
          <div>
            <h2>Operational Lifecycle</h2>
            <p>Step-by-step coordination progression</p>
          </div>
        </div>
        <div className="timeline">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isActive = currentStepIndex === idx;
            return (
              <div
                key={step.key}
                className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="timeline-step-dot">
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className="timeline-step-label">{step.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Operational Overview Grid */}
      <section className="content-grid">
        <div className="panel-card panel-main">
          <div className="panel-heading">
            <div>
              <h2>Incident & Clinical Requirements</h2>
              <p>Operational constraints reported at dispatch registration</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <span className="metric-label">Pickup Location</span>
              <p style={{ margin: '4px 0', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} color="var(--green)" />
                {caseData.pickupLocation?.address || 'Address not recorded'}
              </p>
              {caseData.pickupLocation?.lat != null && caseData.pickupLocation?.lng != null && (
                <>
                  <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginBottom: 8 }}>
                    Coordinates: {caseData.pickupLocation.lat.toFixed(4)}, {caseData.pickupLocation.lng.toFixed(4)}
                  </small>
                  <MapboxMap
                    emergencies={[caseData]}
                    selectedEmergency={caseData}
                    height="240px"
                  />
                </>
              )}
            </div>

            <div>
              <span className="metric-label">Required Operational Resources</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {caseData.requiredResources && caseData.requiredResources.length > 0 ? (
                  caseData.requiredResources.map((res, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        background: '#f2f7f5',
                        borderRadius: 6,
                        border: '1px solid #dce8e3',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      {humanize(res.resourceType)}: min {res.minCount}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>Standard facility intake</span>
                )}
              </div>
            </div>

            <div>
              <span className="metric-label">Required Specialties</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {caseData.requiredSpecialties && caseData.requiredSpecialties.length > 0 ? (
                  caseData.requiredSpecialties.map((spec, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        background: '#edf4f8',
                        color: '#2a5b82',
                        borderRadius: 6,
                        border: '1px solid #d2e4f0',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      {spec}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>General emergency medicine</span>
                )}
              </div>
            </div>

            {/* Data Completeness (§7.14) */}
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="metric-label" style={{ margin: 0 }}>Clinical Record Completeness (§7.14)</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                  {((caseData.summary ? 20 : 0) +
                    (caseData.priorityCategory ? 20 : 0) +
                    (caseData.pickupLocation?.address ? 20 : 0) +
                    (caseData.requiredSpecialties?.length ? 20 : 0) +
                    (caseData.requiredResources?.length ? 20 : 0))}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${((caseData.summary ? 20 : 0) +
                      (caseData.priorityCategory ? 20 : 0) +
                      (caseData.pickupLocation?.address ? 20 : 0) +
                      (caseData.requiredSpecialties?.length ? 20 : 0) +
                      (caseData.requiredResources?.length ? 20 : 0))}%`,
                    height: '100%',
                    background: '#059669',
                    borderRadius: '3px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px', color: '#64748b', flexWrap: 'wrap' }}>
                <span>✓ Summary: {caseData.summary ? 'Yes' : 'Missing'}</span>
                <span>✓ Triage: {caseData.priorityCategory ? 'Categorized' : 'None'}</span>
                <span>✓ Geo: {caseData.pickupLocation?.lat ? 'Verified' : 'Manual'}</span>
                <span>✓ Specialties: {caseData.requiredSpecialties?.length ? `${caseData.requiredSpecialties.length} set` : 'General'}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', gap: 24, fontSize: 11, color: 'var(--muted)' }}>
              <div>
                <Calendar size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                Created: {shortDate(caseData.createdAt)}
              </div>
              <div>
                <Clock size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                Updated: {shortDate(caseData.updatedAt || caseData.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Status Actions & Associated Referrals */}
        <div className="panel-card freshness-card">
          <div className="panel-heading">
            <div>
              <h2>Coordination Actions</h2>
              <p>Execute next safe operational transition</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {canManage && (
              <div style={{ display: 'grid', gap: 8 }}>
                <button
                  className="button button-primary"
                  onClick={() => void fetchRecommendations()}
                  disabled={recLoading}
                >
                  <Route size={15} /> {recLoading ? 'Calculating…' : 'Find Best Hospitals'}
                </button>

                {caseData.status === 'registered' && (
                  <button
                    className="button button-secondary"
                    onClick={() => void updateStatus('referral_pending')}
                    disabled={statusUpdating}
                  >
                    Mark Referral Pending
                  </button>
                )}

                {caseData.status === 'en_route' && (
                  <button
                    className="button button-secondary"
                    onClick={() => void updateStatus('arrived')}
                    disabled={statusUpdating}
                  >
                    Mark Ambulance Arrived
                  </button>
                )}

                {caseData.status === 'arrived' && (
                  <button
                    className="button button-secondary"
                    onClick={() => void updateStatus('handed_over')}
                    disabled={statusUpdating}
                  >
                    Mark Patient Handed Over
                  </button>
                )}

                {caseData.status === 'handed_over' && (
                  <button
                    className="button button-secondary"
                    onClick={() => void updateStatus('closed')}
                    disabled={statusUpdating}
                  >
                    Close Emergency Case
                  </button>
                )}

                {!['closed', 'cancelled'].includes(caseData.status) && (
                  <button
                    className="button button-danger"
                    onClick={() => void updateStatus('cancelled')}
                    disabled={statusUpdating}
                  >
                    Cancel Case
                  </button>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <span className="metric-label">Associated Referrals ({referrals.length})</span>
              {referrals.length > 0 ? (
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  {referrals.map((ref) => {
                    const hospName = typeof ref.hospitalId === 'object' && ref.hospitalId ? (ref.hospitalId as { name?: string }).name : 'Hospital';
                    return (
                      <div
                        key={ref._id}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: '#f9fbfa',
                          border: '1px solid #e5ece8',
                          fontSize: 11
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{hospName}</strong>
                          <StatePill value={ref.requestStatus} />
                        </div>
                        <small style={{ color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                          Sent: {shortDate(ref.requestedAt)}
                        </small>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  No referrals requested yet. Click 'Find Best Hospitals' to rank eligible facilities.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations Results Panel */}
      {recommendations && (
        <section className="panel-card" style={{ padding: '20px 22px' }}>
          <div className="panel-heading">
            <div>
              <div className="eyebrow">AI DECISION SUPPORT</div>
              <h2>Candidate Hospital Recommendations</h2>
              <p>{recommendations.disclaimer || 'Multi-criteria operational ranking. Requires human review and hospital confirmation.'}</p>
            </div>
          </div>

          {recommendations.eligible && recommendations.eligible.length > 0 ? (
            <div className="candidate-list">
              {recommendations.eligible.map((candidate) => (
                <article className="candidate-card" key={candidate.hospitalId}>
                  <div className="candidate-main">
                    <div>
                      <strong style={{ fontSize: 14 }}>{candidate.hospitalName || 'Hospital'}</strong>
                      <p>
                        {candidate.etaMinutes != null ? `${candidate.etaMinutes} min ETA` : 'ETA unavailable'} ·{' '}
                        {humanize(candidate.freshnessStatus)} data reliability
                      </p>
                    </div>
                    <strong className="candidate-score">
                      {Math.round(candidate.score)}
                      <small> / 100</small>
                    </strong>
                  </div>

                  {/* Factor Score Breakdown Grid */}
                  {candidate.breakdown && (
                    <div className="breakdown-grid">
                      <div className="score-component">
                        <div className="score-component-label">
                          <span>Travel Suitability (40%)</span>
                          <strong>{Math.round(candidate.breakdown.travel || 0)}/100</strong>
                        </div>
                        <div className="breakdown-bar">
                          <div className="score-fill" style={{ width: `${candidate.breakdown.travel || 0}%` }} />
                        </div>
                      </div>

                      <div className="score-component">
                        <div className="score-component-label">
                          <span>Resource Freshness (30%)</span>
                          <strong>{Math.round(candidate.breakdown.freshness || 0)}/100</strong>
                        </div>
                        <div className="breakdown-bar">
                          <div className="score-fill" style={{ width: `${candidate.breakdown.freshness || 0}%` }} />
                        </div>
                      </div>

                      <div className="score-component">
                        <div className="score-component-label">
                          <span>Capacity Headroom (20%)</span>
                          <strong>{Math.round(candidate.breakdown.capacity || 0)}/100</strong>
                        </div>
                        <div className="breakdown-bar">
                          <div className="score-fill" style={{ width: `${candidate.breakdown.capacity || 0}%` }} />
                        </div>
                      </div>

                      <div className="score-component">
                        <div className="score-component-label">
                          <span>Capability Match (10%)</span>
                          <strong>{Math.round(candidate.breakdown.capability || 0)}/100</strong>
                        </div>
                        <div className="breakdown-bar">
                          <div className="score-fill" style={{ width: `${candidate.breakdown.capability || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {candidate.explanation && candidate.explanation.length > 0 && (
                    <ul className="explanation-list">
                      {candidate.explanation.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {canManage && (
                    <button
                      className="button button-primary button-small"
                      onClick={() => void createReferral(candidate.hospitalId)}
                    >
                      Request Referral to {candidate.hospitalName}
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">No eligible hospitals met the operational constraints.</div>
          )}

          {recommendations.ineligible && recommendations.ineligible.length > 0 && (
            <details className="ineligible-details" style={{ marginTop: 16 }}>
              <summary>{recommendations.ineligible.length} hospitals excluded by hard operational constraints</summary>
              <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                {recommendations.ineligible.map((item, idx) => (
                  <div key={idx} style={{ fontSize: 11, color: '#7a8c85' }}>
                    <strong>{item.hospitalName || 'Hospital'}:</strong> {item.reasons?.join(', ') || 'Excluded'}
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
