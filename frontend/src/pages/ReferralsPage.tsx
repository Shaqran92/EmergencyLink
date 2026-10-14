import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, Clock, ExternalLink, MessageSquareText, X } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { createEmergencySocket } from '../shared/socket';
import { apiRequest, getToken } from '../shared/api';
import { useAuth } from '../shared/AuthProvider';
import { humanize, shortDate } from '../shared/format';
import type { Referral } from '../shared/types';
import StatePill from '../components/StatePill';
import { ErrorState, LoadingState } from '../components/LoadState';

function hospitalName(value: Referral['hospitalId']): string {
  return typeof value === 'object' && value ? value.name || 'Hospital' : value || 'Hospital';
}

function calculateElapsedMinutes(requestedAt?: string): number {
  if (!requestedAt) return 0;
  const reqTime = new Date(requestedAt).getTime();
  const diff = Date.now() - reqTime;
  return Math.max(0, Math.floor(diff / 60000));
}

export default function ReferralsPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [hospitalsList, setHospitalsList] = useState<{ _id: string; name: string; city?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [activeModal, setActiveModal] = useState<{
    referral: Referral;
    decision: 'rejected' | 'clarification_requested';
  } | null>(null);
  const [modalNote, setModalNote] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Inter-Hospital Transfer State
  const [transferModal, setTransferModal] = useState<Referral | null>(null);
  const [transferTargetHosp, setTransferTargetHosp] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const canRespond = ['hospital_staff', 'hospital_admin', 'system_admin'].includes(user?.role || '');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<Referral[]>('/referrals');
      setReferrals(Array.isArray(result) ? result : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load referrals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    apiRequest<{ _id: string; name: string; city?: string }[]>('/hospitals')
      .then((res) => {
        if (Array.isArray(res)) setHospitalsList(res);
      })
      .catch(() => {});

    const token = getToken();
    if (!token) return;
    let socket: Socket | null = null;
    try {
      socket = createEmergencySocket({ auth: { token } });
      socket.on('emergency:incoming_patient', () => {
        void load();
      });
      socket.on('referral:requested', () => {
        void load();
      });
      socket.on('emergency:autonomous_accepted', (data: any) => {
        setNotice(`⚡ Case ${data.caseId} was autonomously accepted for ${data.hospitalName} after 15s unattended timeout! ER Bed reserved.`);
        void load();
      });
    } catch {
      // ignore
    }
    return () => {
      socket?.disconnect();
    };
  }, [load]);

  async function handlePrepare(referral: Referral) {
    setBusyId(referral._id);
    setError('');
    try {
      await apiRequest(`/referrals/${referral._id}/prepare`, {
        method: 'POST',
        body: JSON.stringify({
          bedReserved: true,
          teamAlerted: true,
          note: 'Trauma ER team standing by; Bed reserved.'
        })
      });
      setNotice(`Clinical team alerted and bed reserved for Case ${referral.caseId}. Ambulance crew notified!`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to confirm preparation.');
    } finally {
      setBusyId('');
    }
  }

  async function handleTransferSubmit(e: FormEvent) {
    e.preventDefault();
    if (!transferModal || !transferTargetHosp) return;
    setTransferSubmitting(true);
    setError('');
    try {
      const fromHospitalId =
        typeof transferModal.hospitalId === 'object' && transferModal.hospitalId
          ? (transferModal.hospitalId as any)._id
          : transferModal.hospitalId;

      await apiRequest('/referrals/transfer', {
        method: 'POST',
        body: JSON.stringify({
          caseId: transferModal.caseId,
          fromHospitalId,
          targetHospitalId: transferTargetHosp,
          transferReason
        })
      });

      setNotice(`Emergency transfer initiated for case ${transferModal.caseId}. Receiving facility alerted!`);
      setTransferModal(null);
      setTransferReason('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to initiate transfer.');
    } finally {
      setTransferSubmitting(false);
    }
  }

  async function executeResponse(referral: Referral, decision: 'accepted' | 'rejected' | 'clarification_requested', customNote?: string) {
    const note = customNote || (decision === 'accepted' ? 'Accepted via EmergencyLink operations workspace' : '');
    setBusyId(referral._id);
    setError('');
    try {
      await apiRequest(`/referrals/${referral._id}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision,
          requestStatus: decision,
          note,
          responseNote: note
        })
      });
      setNotice(`Referral for case ${referral.caseId} marked ${humanize(decision).toLowerCase()}.`);
      setActiveModal(null);
      setModalNote('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to respond to this referral.');
    } finally {
      setBusyId('');
      setModalSubmitting(false);
    }
  }

  function handleModalSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeModal) return;
    setModalSubmitting(true);
    void executeResponse(activeModal.referral, activeModal.decision, modalNote);
  }

  if (loading) return <LoadingState label="Loading referral queue…" />;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">HOSPITAL COORDINATION</div>
          <h1>Referral queue</h1>
          <p>Referral requests remain unconfirmed until the receiving hospital accepts.</p>
        </div>
        <span className="toolbar-count">
          {referrals.filter((item) => item.requestStatus === 'pending').length} pending decision
        </span>
      </div>

      {error && <ErrorState message={error} />}
      {notice && (
        <div className="notice-banner" role="status">
          {notice}
          <button aria-label="Dismiss" onClick={() => setNotice('')}><X size={16} /></button>
        </div>
      )}

      <div className="panel-card">
        {referrals.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Receiving Hospital</th>
                  <th>Requested Time</th>
                  <th>Elapsed Waiting</th>
                  <th>Status</th>
                  {canRespond && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {referrals.map((item) => {
                  const elapsed = calculateElapsedMinutes(item.requestedAt);
                  const isLongPending = item.requestStatus === 'pending' && elapsed >= 10;

                  return (
                    <tr key={item._id} className={isLongPending ? 'elapsed-warning-row' : ''}>
                      <td>
                        <Link to={`/emergencies/${item.caseId}`} className="text-link" style={{ fontSize: 11 }}>
                          <strong>{item.caseId}</strong> <ExternalLink size={11} />
                        </Link>
                      </td>
                      <td>{hospitalName(item.hospitalId)}</td>
                      <td>{item.requestedAt ? shortDate(item.requestedAt) : '—'}</td>
                      <td>
                        {item.requestStatus === 'pending' ? (
                          isLongPending ? (
                            <span className="elapsed-warning">
                              <AlertCircle size={12} /> {elapsed} min (Escalation due)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: 10 }}>
                              <Clock size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                              {elapsed} min
                            </span>
                          )
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td><StatePill value={item.requestStatus} /></td>
                      {canRespond && (
                        <td>
                          {item.requestStatus === 'pending' ? (
                            <div className="table-actions">
                              <button
                                className="button button-primary button-small"
                                disabled={busyId === item._id}
                                onClick={() => void executeResponse(item, 'accepted')}
                              >
                                <Check size={14} /> Accept
                              </button>
                              <button
                                className="button button-danger button-small"
                                disabled={busyId === item._id}
                                onClick={() => setActiveModal({ referral: item, decision: 'rejected' })}
                              >
                                <X size={14} /> Reject
                              </button>
                              <button
                                className="icon-button"
                                title="Request clarification"
                                disabled={busyId === item._id}
                                onClick={() => setActiveModal({ referral: item, decision: 'clarification_requested' })}
                              >
                                <MessageSquareText size={16} />
                              </button>
                            </div>
                          ) : item.requestStatus === 'accepted' ? (
                            <div className="table-actions">
                              <button
                                className="button button-small"
                                style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 700 }}
                                disabled={busyId === item._id}
                                onClick={() => void handlePrepare(item)}
                                title="Reserve Emergency Bed and alert clinical trauma team"
                              >
                                ⚡ Prepare Bed & Team
                              </button>
                              <button
                                className="button button-quiet button-small"
                                style={{ fontSize: 11 }}
                                title="Transfer to another connected facility"
                                onClick={() => {
                                  setTransferModal(item);
                                  const currentHospId = typeof item.hospitalId === 'object' && item.hospitalId ? (item.hospitalId as any)._id : item.hospitalId;
                                  const other = hospitalsList.find((h) => h._id !== currentHospId);
                                  if (other) setTransferTargetHosp(other._id);
                                }}
                              >
                                🔄 Transfer
                              </button>
                            </div>
                          ) : (
                            <span className="muted">Decision logged</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No referrals are visible for your account.</div>
        )}
      </div>

      <div className="info-banner">
        <strong>Human confirmation required.</strong> A recommendation is not an acceptance or a confirmed destination.
      </div>

      {/* Decision Note Modal */}
      {activeModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}>
          <form className="modal-card form-modal" onSubmit={handleModalSubmit} role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">
                  {activeModal.decision === 'rejected' ? 'REJECT REFERRAL' : 'REQUEST CLARIFICATION'}
                </div>
                <h2>Case {activeModal.referral.caseId}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setActiveModal(null)} aria-label="Close">
                <X size={19} />
              </button>
            </div>
            <p className="modal-copy">
              {activeModal.decision === 'rejected'
                ? 'Please record the operational reason for rejecting this case (e.g. bed surge, specialist in emergency theatre, equipment outage).'
                : 'State the specific clinical or operational clarification requested from the dispatch team.'}
            </p>

            <label className="field-label" htmlFor="response-note">Operational Note / Reason</label>
            <textarea
              id="response-note"
              className="input"
              style={{ minHeight: 80, padding: 10, resize: 'vertical' }}
              required
              maxLength={400}
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder={activeModal.decision === 'rejected' ? 'e.g. ICU at capacity; no ventilator available.' : 'e.g. Requesting field ECG confirmation; confirm patient vitals.'}
            />

            <div className="modal-actions">
              <button type="button" className="button button-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button
                type="submit"
                className={`button ${activeModal.decision === 'rejected' ? 'button-danger' : 'button-primary'}`}
                disabled={modalSubmitting || !modalNote.trim()}
              >
                {modalSubmitting ? 'Recording…' : activeModal.decision === 'rejected' ? 'Confirm Rejection' : 'Send Clarification Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inter-Hospital Emergency Transfer Modal */}
      {transferModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setTransferModal(null); }}>
          <form className="modal-card form-modal" onSubmit={handleTransferSubmit} role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">EMERGENCY NETWORK TRANSFER</div>
                <h2>Transfer Case {transferModal.caseId}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setTransferModal(null)} aria-label="Close">
                <X size={19} />
              </button>
            </div>
            <p className="modal-copy">
              Transfer this patient to another connected hospital in the emergency network (e.g., when neurosurgery, catheterization lab, or pediatric ICU is required).
            </p>

            <label className="field-label" htmlFor="target-hospital">Destination Hospital</label>
            <select
              id="target-hospital"
              className="input"
              style={{ padding: 10, marginBottom: 12 }}
              required
              value={transferTargetHosp}
              onChange={(e) => setTransferTargetHosp(e.target.value)}
            >
              <option value="">Select connected facility…</option>
              {hospitalsList
                .filter((h) => h._id !== (typeof transferModal.hospitalId === 'object' && transferModal.hospitalId ? (transferModal.hospitalId as any)._id : transferModal.hospitalId))
                .map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} {h.city ? `(${h.city})` : ''}
                  </option>
                ))}
            </select>

            <label className="field-label" htmlFor="transfer-reason">Clinical Transfer Rationale</label>
            <textarea
              id="transfer-reason"
              className="input"
              style={{ minHeight: 80, padding: 10, resize: 'vertical' }}
              required
              maxLength={400}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Patient requires immediate neurosurgery; CT confirms subdural hematoma; transferring to tertiary neuro trauma center."
            />

            <div className="modal-actions">
              <button type="button" className="button button-secondary" onClick={() => setTransferModal(null)}>Cancel</button>
              <button
                type="submit"
                className="button button-primary"
                disabled={transferSubmitting || !transferTargetHosp || !transferReason.trim()}
              >
                {transferSubmitting ? 'Transferring…' : 'Initiate Emergency Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

