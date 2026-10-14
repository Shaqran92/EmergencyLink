import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  Ambulance,
  Bell,
  Building2,
  ClipboardList,
  Database,
  History,
  LayoutDashboard,
  LogOut,
  Server,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  HeartPulse
} from 'lucide-react';
import { Socket } from 'socket.io-client';
import { createEmergencySocket } from '../shared/socket';
import { useAuth } from '../shared/AuthProvider';
import { getToken } from '../shared/api';
import { humanize, shortDate } from '../shared/format';
import type { Role } from '../shared/types';
import OfflineIndicator from './OfflineIndicator';

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  type?: string;
}

const allRoles: Role[] = ['coordinator', 'ambulance_staff', 'hospital_staff', 'hospital_admin', 'system_admin', 'observer'];
const navItems: NavItem[] = [
  { label: 'Overview', to: '/', icon: LayoutDashboard, roles: allRoles },
  { label: 'Citizen Portal', to: '/portal', icon: HeartPulse, roles: allRoles },
  { label: 'Emergencies', to: '/emergencies', icon: Activity, roles: ['coordinator', 'system_admin', 'observer', 'ambulance_staff', 'hospital_staff', 'hospital_admin'] },
  { label: 'Hospitals', to: '/hospitals', icon: Building2, roles: allRoles },
  { label: 'Referrals', to: '/referrals', icon: ClipboardList, roles: ['coordinator', 'system_admin', 'observer', 'hospital_staff', 'hospital_admin'] },
  { label: 'Ambulance fleet', to: '/ambulances', icon: Ambulance, roles: ['coordinator', 'system_admin', 'observer', 'ambulance_staff'] },
  { label: 'Analytics', to: '/analytics', icon: TrendingUp, roles: ['coordinator', 'system_admin', 'observer'] },
  { label: 'Audit trail', to: '/audit', icon: History, roles: ['coordinator', 'hospital_staff', 'hospital_admin', 'system_admin', 'observer'] },
  { label: 'Sync conflicts', to: '/sync/conflicts', icon: Database, roles: ['coordinator', 'hospital_staff', 'hospital_admin', 'system_admin'] },
  { label: 'System health', to: '/health', icon: Server, roles: ['coordinator', 'system_admin', 'observer'] },
  { label: 'Team & access', to: '/team', icon: Users, roles: ['system_admin', 'hospital_admin'] },
];

interface IncomingPatientAlert {
  caseId: string;
  hospitalId?: string;
  condition?: string;
  priority?: string;
  etaMinutes?: number;
  ambulanceId?: string;
  requiredSpecialties?: string[];
  requiredResources?: string[];
}

function playEmergencyTone() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context prevented or unavailable
  }
}

export default function AppShell() {
  const { user, signOut } = useAuth();
  const [socketConnected, setSocketConnected] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState<IncomingPatientAlert | null>(null);

  const visibleItems = useMemo(() => navItems.filter((item) => user && item.roles.includes(user.role)), [user]);
  const displayName = user?.name || user?.email || 'Operator';

  const addNotification = (title: string, body: string, type = 'info') => {
    const item: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      body,
      timestamp: new Date(),
      read: false,
      type
    };

    setNotifications((prev) => [item, ...prev].slice(0, 30));
    setToasts((prev) => [...prev, item]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== item.id));
    }, 4500);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let socket: Socket | null = null;
    try {
      socket = createEmergencySocket({
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        setSocketConnected(true);
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('emergency:incoming_patient', (data: IncomingPatientAlert) => {
        playEmergencyTone();
        setIncomingAlert(data);
        addNotification(
          `🚨 INCOMING CRITICAL PATIENT • ETA ~${data.etaMinutes || 8}m`,
          `Case ${data.caseId}: ${data.condition || 'Emergency'}. Teams alert: ${(data.requiredSpecialties || []).join(', ') || 'Trauma / ER'}`,
          'critical'
        );
      });

      socket.on('emergency:ambulance_dispatched', (data: any) => {
        playEmergencyTone();
        addNotification(
          `🚨 AMBULANCE DISPATCHED • Case ${data.caseId}`,
          `Vehicle ${data.ambulanceId || 'Rescue 1122'} responding to ${data.pickupLocation?.address || 'Incident'} • Destination: ${data.destinationHospitalName || 'Allocated Hospital'}`,
          'critical'
        );
      });

      socket.on('emergency:autonomous_accepted', (data: any) => {
        playEmergencyTone();
        addNotification(
          `⚡ AUTONOMOUS ACCEPTANCE (15s Timeout) • Case ${data.caseId}`,
          `Auto-accepted for ${data.hospitalName}. Bed reserved and trauma teams mobilized autonomously.`,
          'critical'
        );
      });

      socket.on('emergency:hospital_prepared', (data: { caseId: string; hospitalName: string; note?: string }) => {
        addNotification(
          `🏥 Destination Ready: ${data.hospitalName || 'Receiving Facility'}`,
          `Emergency bed reserved & clinical trauma team on standby for Case ${data.caseId}`,
          'success'
        );
      });

      socket.on('emergency:created', (data: { caseId?: string; priorityCategory?: string }) => {
        addNotification(
          'New Emergency Case Registered',
          `Case ${data.caseId || 'Incident'} recorded (${data.priorityCategory || 'priority'})`,
          'emergency'
        );
      });

      socket.on('emergency:status_updated', (data: { caseId?: string; status?: string }) => {
        addNotification(
          'Emergency Status Updated',
          `Case ${data.caseId || 'Incident'} transitioned to ${humanize(data.status)}`,
          'emergency'
        );
      });

      socket.on('referral:requested', (data: { caseId?: string }) => {
        addNotification(
          'Hospital Referral Requested',
          `Hospital coordination requested for ${data.caseId || 'case'}`,
          'referral'
        );
      });

      socket.on('referral:responded', (data: { caseId?: string; requestStatus?: string }) => {
        addNotification(
          'Referral Decision Logged',
          `Referral for ${data.caseId || 'case'} was ${data.requestStatus || 'updated'}`,
          'referral'
        );
      });

      socket.on('resource:updated', () => {
        addNotification(
          'Hospital Resources Updated',
          `Resource capacity report received for facility`,
          'resource'
        );
      });

      socket.on('ambulance:status_updated', (data: { ambulanceId?: string; status?: string }) => {
        addNotification(
          'Ambulance Status Updated',
          `Vehicle ${data.ambulanceId || 'AMB'} reported as ${humanize(data.status)}`,
          'ambulance'
        );
      });
    } catch {
      setSocketConnected(false);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="app-shell">
      {/* Toast Overlay */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast toast-enter">
            <div className="toast-icon">
              <Activity size={16} />
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-body">{toast.body}</div>
            </div>
            <button
              className="toast-close"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="EmergencyLink home">
          <span className="brand-mark"><Activity size={20} strokeWidth={2.5} /></span>
          <span className="brand-text">Emergency<span>Link</span></span>
        </NavLink>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {visibleItems.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="secure-note"><ShieldCheck size={17} /><span>Secure operations<br /><strong>Access is role-scoped</strong></span></div>
          <button className="profile-button" type="button" onClick={signOut}>
            <span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span>
            <span className="profile-copy"><strong>{displayName}</strong><small>{humanize(user?.role)}</small></span>
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">
            <span>EmergencyLink</span>
            <span className="breadcrumb-divider">/</span>
            <strong>Operations center</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="topbar-status">
              <span className={`live-dot ${socketConnected ? '' : 'dot-unknown'}`} style={{ background: socketConnected ? '#30af7b' : '#b3c0bb' }} />
              <span>{socketConnected ? 'Real-Time Connected' : 'Standard Poll'}</span>
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="notification-bell"
                onClick={() => {
                  setShowBellDropdown(!showBellDropdown);
                  if (!showBellDropdown) markAllRead();
                }}
                aria-label="View notifications"
              >
                <Bell size={17} />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>

              {showBellDropdown && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown-header">
                    <strong>Operational Alerts</strong>
                    <button
                      type="button"
                      className="button button-quiet button-small"
                      onClick={() => setNotifications([])}
                      style={{ fontSize: 9 }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="notification-dropdown-list">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div key={n.id} className={`notification-item ${n.read ? '' : 'unread'}`}>
                          <div className="notification-item-icon">
                            <Activity size={14} />
                          </div>
                          <div className="notification-item-content">
                            <strong>{n.title}</strong>
                            <p>{n.body}</p>
                            <small>{shortDate(n.timestamp.toISOString())}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state" style={{ padding: '24px 12px' }}>
                        No unread coordination alerts.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          <OfflineIndicator />
          {incomingAlert && (
            <div
              style={{
                background: 'linear-gradient(90deg, #991b1b 0%, #dc2626 100%)',
                color: 'white',
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(220,38,38,0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>🚨</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.02em' }}>
                    INCOMING CRITICAL PATIENT • ETA ~{incomingAlert.etaMinutes || 8} MINS
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.95, marginTop: '2px' }}>
                    <strong>Case {incomingAlert.caseId}:</strong> {incomingAlert.condition}
                    {incomingAlert.requiredSpecialties && incomingAlert.requiredSpecialties.length > 0
                      ? ` • Required: ${incomingAlert.requiredSpecialties.join(', ')}`
                      : ''}
                    {incomingAlert.ambulanceId ? ` • Responding Unit: ${incomingAlert.ambulanceId}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <NavLink
                  to="/referrals"
                  style={{
                    background: 'white',
                    color: '#991b1b',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '12px',
                    textDecoration: 'none'
                  }}
                >
                  ⚡ Review & Reserve Bed
                </NavLink>
                <button
                  type="button"
                  onClick={() => setIncomingAlert(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <Outlet />
          <footer className="app-footer">
            EmergencyLink is an operational coordination tool, not a clinical decision system.
          </footer>
        </main>
      </div>
    </div>
  );
}
