import { FormEvent, useCallback, useEffect, useState, useRef } from 'react';
import {
  Ambulance as AmbulanceIcon,
  CheckCircle2,
  Compass,
  Hospital as HospitalIcon,
  MapPin,
  Navigation,
  Plus,
  Radio,
  Save,
  Stethoscope,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';
import { Socket } from 'socket.io-client';
import { createEmergencySocket } from '../shared/socket';
import { apiRequest, getToken } from '../shared/api';
import { useAuth } from '../shared/AuthProvider';
import { userScope } from '../shared/format';
import type { Ambulance, Hospital } from '../shared/types';
import StatePill from '../components/StatePill';
import { ErrorState, LoadingState } from '../components/LoadState';
import MapboxMap from '../components/MapboxMap';

const transitions: Record<string, string[]> = {
  available: ['unavailable'],
  assigned: ['en_route', 'unavailable'],
  en_route: ['arrived', 'unavailable'],
  arrived: ['available', 'unavailable'],
  unavailable: ['available'],
};

function getHospitalName(base: any): string {
  if (!base) return 'Base hospital not specified';
  if (typeof base === 'object') return base.name || base._id || 'Base hospital';
  return userScope(base) || 'Base hospital not specified';
}

interface MissionAssignment {
  _id: string;
  caseId: string;
  status: string;
  ambulanceId: any;
  destinationHospitalId: any;
  emergency?: {
    caseId: string;
    summary?: string;
    priorityCategory: string;
    status: string;
    pickupLocation?: { lat: number; lng: number; address?: string };
    requiredSpecialties?: string[];
  };
  timestamps?: {
    assignedAt?: string;
    enRouteAt?: string;
    arrivedAt?: string;
    handedOverAt?: string;
  };
}

export default function AmbulancesPage() {
  const { user } = useAuth();
  const [fleet, setFleet] = useState<Ambulance[]>([]);
  const [assignments, setAssignments] = useState<MissionAssignment[]>([]);
  const [selectedMission, setSelectedMission] = useState<MissionAssignment | null>(null);
  const [routeType, setRouteType] = useState<'to_patient' | 'to_hospital'>('to_patient');
  const [missionRoute, setMissionRoute] = useState<{
    durationMinutes: number;
    distanceKm: number;
    geometry: any;
  } | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [streamingGps, setStreamingGps] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastStreamedCoord, setLastStreamedCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitalPrepared, setHospitalPrepared] = useState<{
    caseId: string;
    hospitalName: string;
    bedReserved?: boolean;
    teamAlerted?: boolean;
    note?: string;
  } | null>(null);

  const [patientCondition, setPatientCondition] = useState('Severe Head Injury / Trauma');
  const [autoSelectingHosp, setAutoSelectingHosp] = useState(false);
  const [autoSelectedHospitalInfo, setAutoSelectedHospitalInfo] = useState<any>(null);

  const [nextStatus, setNextStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const canUpdate = ['coordinator', 'ambulance_staff', 'system_admin'].includes(user?.role || '');
  const ownAmbulance = userScope(user?.ambulanceId);

  const visibleFleet =
    user?.role === 'ambulance_staff'
      ? fleet.filter((vehicle) => [vehicle._id, vehicle.ambulanceId].includes(ownAmbulance))
      : fleet;

  const relevantAssignments =
    user?.role === 'ambulance_staff'
      ? assignments.filter((a) =>
          [a.ambulanceId?._id, a.ambulanceId?.ambulanceId, a.ambulanceId].includes(ownAmbulance)
        )
      : assignments;

  // Live WebSocket listener for hospital preparation
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let socket: Socket | null = null;
    try {
      socket = createEmergencySocket({ auth: { token } });
      socket.on('emergency:hospital_prepared', (data: any) => {
        setHospitalPrepared(data);
        setNotice(`🚨 Destination Hospital (${data.hospitalName}) has accepted & reserved ER bed!`);
      });
      socket.on('emergency:ambulance_dispatched', (data: any) => {
        setNotice(`🚨 NEW EMERGENCY DISPATCH: Case ${data.caseId} assigned! Patient: ${data.condition}. Destination: ${data.destinationHospitalName}. Navigate immediately!`);
        void load();
      });
      socket.on('emergency:patient_location_updated', (data: any) => {
        if (data?.pickupLocation) {
          setSelectedMission((prev) => {
            if (!prev || !prev.emergency) return prev;
            if (prev.caseId && data.caseId && prev.caseId !== data.caseId) return prev;
            return {
              ...prev,
              emergency: {
                ...prev.emergency,
                pickupLocation: data.pickupLocation
              }
            };
          });
          setNotice(`📍 Patient GPS location updated in real-time (${data.pickupLocation.lat.toFixed(4)}, ${data.pickupLocation.lng.toFixed(4)})`);
        }
      });
      socket.on('ambulance:location_updated', (data: any) => {
        if (data?.id && data.lastKnownLocation) {
          setFleet((prev) =>
            prev.map((v) =>
              v._id === data.id || v.ambulanceId === data.ambulanceId
                ? { ...v, lastKnownLocation: data.lastKnownLocation }
                : v
            )
          );
        }
      });
    } catch {
      // ignore
    }
    return () => {
      socket?.disconnect();
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [fleetResult, assignResult] = await Promise.all([
        apiRequest<Ambulance[]>('/ambulances'),
        apiRequest<MissionAssignment[]>('/assignments').catch(() => [])
      ]);
      setFleet(Array.isArray(fleetResult) ? fleetResult : []);
      const activeAssignments = (Array.isArray(assignResult) ? assignResult : []).filter(
        (a) => a.status !== 'handed_over'
      );
      setAssignments(activeAssignments);

      // Auto-select first active assignment for ambulance crew if present
      if (activeAssignments.length > 0 && !selectedMission) {
        setSelectedMission(activeAssignments[0]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load ambulance fleet.');
    } finally {
      setLoading(false);
    }
  }, [selectedMission]);

  useEffect(() => {
    void load();
  }, [load]);

  // Calculate Mapbox driving route whenever selected mission or routeType changes
  useEffect(() => {
    if (!selectedMission) {
      setMissionRoute(null);
      return;
    }

    const token =
      import.meta.env.VITE_MAPBOX_TOKEN ||
      'pk.eyJ1Ijoic2hhcXJhbiIsImEiOiJjbXY2c2pvaXIwaGFmMnhzZmozaWJhbXEyIn0.yw7huxs7cE_VJuJJ0q909g';

    // Pakistan fallback coordinates (Lahore Center) instead of foreign defaults
    const ambLoc = selectedMission.ambulanceId?.lastKnownLocation || { lat: 31.5204, lng: 74.3587 };
    const patientLoc = selectedMission.emergency?.pickupLocation || { lat: 31.5204, lng: 74.3587 };
    const hospLoc = selectedMission.destinationHospitalId?.location || { lat: 31.5372, lng: 74.3392 };

    const start = routeType === 'to_patient' ? ambLoc : patientLoc;
    const end = routeType === 'to_patient' ? patientLoc : hospLoc;

    if (!start?.lat || !start?.lng || !end?.lat || !end?.lng) return;

    setCalculatingRoute(true);
    fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${token}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          setMissionRoute({
            durationMinutes: Math.max(1, Math.round(r.duration / 60)),
            distanceKm: Math.round((r.distance / 1000) * 10) / 10,
            geometry: r.geometry
          });
        } else {
          setMissionRoute({
            durationMinutes: 10,
            distanceKm: 5.5,
            geometry: {
              type: 'LineString',
              coordinates: [
                [start.lng, start.lat],
                [end.lng, end.lat]
              ]
            }
          });
        }
      })
      .catch(() => {
        setMissionRoute({
          durationMinutes: 10,
          distanceKm: 5.5,
          geometry: {
            type: 'LineString',
            coordinates: [
              [start.lng, start.lat],
              [end.lng, end.lat]
            ]
          }
        });
      })
      .finally(() => setCalculatingRoute(false));
  }, [selectedMission, routeType]);

  // Automatically select nearest & best hospital based on patient condition
  async function triggerAutoSelectDestination() {
    if (!selectedMission) return;
    setAutoSelectingHosp(true);
    setError('');
    try {
      const ambId =
        selectedMission.ambulanceId?._id ||
        selectedMission.ambulanceId?.ambulanceId ||
        selectedMission.ambulanceId;
      const resp = await apiRequest<{
        autoSelectedHospital: any;
        selectionReason: string;
        selectionRationale: string[];
        etaMinutes: number;
        distanceKm: number;
        routeGeometry: any;
      }>(`/ambulances/${ambId}/auto-select-destination`, {
        method: 'POST',
        body: JSON.stringify({
          caseId: selectedMission.caseId,
          condition: patientCondition,
          currentLocation:
            selectedMission.emergency?.pickupLocation ||
            selectedMission.ambulanceId?.lastKnownLocation
        })
      });

      if (resp && resp.autoSelectedHospital) {
        setAutoSelectedHospitalInfo(resp);
        setNotice(
          `🎯 System Auto-Selected Best Hospital: ${resp.autoSelectedHospital.name} (${resp.etaMinutes} mins). Destination confirmed & receiving staff alerted!`
        );
        setSelectedMission({
          ...selectedMission,
          destinationHospitalId: resp.autoSelectedHospital
        });
        setRouteType('to_hospital');
        await load();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to auto-select best hospital.');
    } finally {
      setAutoSelectingHosp(false);
    }
  }

  // Update Ambulance status
  async function update(ambulance: Ambulance) {
    const status = nextStatus[ambulance._id];
    if (!status) return;
    setBusyId(ambulance._id);
    setError('');
    try {
      await apiRequest(`/ambulances/${ambulance._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setNotice(`${ambulance.ambulanceId} updated to ${status.replaceAll('_', ' ')}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update ambulance status.');
    } finally {
      setBusyId('');
    }
  }

  // Update Mission Assignment status
  async function advanceAssignment(assignmentId: string, newStatus: string) {
    setBusyId(assignmentId);
    setError('');
    try {
      await apiRequest(`/assignments/${assignmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setNotice(`Mission status progressed to ${newStatus.replaceAll('_', ' ')}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to update mission status.');
    } finally {
      setBusyId('');
    }
  }

  const syncLocation = useCallback(async (ambId: string, coords: { lat: number; lng: number }) => {
    try {
      await apiRequest(`/ambulances/${ambId}/location`, {
        method: 'PATCH',
        body: JSON.stringify(coords),
      });
      setLastStreamedCoord(coords);
      setFleet((prev) =>
        prev.map((v) =>
          v._id === ambId || v.ambulanceId === ambId
            ? { ...v, lastKnownLocation: coords }
            : v
        )
      );
      setSelectedMission((prev) => {
        if (!prev) return null;
        const curAmbId = prev.ambulanceId?._id || prev.ambulanceId?.ambulanceId || prev.ambulanceId;
        if (curAmbId === ambId || prev.ambulanceId?._id === ambId || prev.ambulanceId?.ambulanceId === ambId) {
          return {
            ...prev,
            ambulanceId: {
              ...(typeof prev.ambulanceId === 'object' ? prev.ambulanceId : { _id: prev.ambulanceId }),
              lastKnownLocation: coords,
            },
          };
        }
        return prev;
      });
    } catch (e) {
      console.error('Failed to sync ambulance location', e);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const [simulatingDrive, setSimulatingDrive] = useState(false);
  const simIndexRef = useRef(0);

  // Auto-start continuous GPS tracking when ambulance is selected or assigned
  useEffect(() => {
    const amb =
      selectedMission?.ambulanceId?._id ||
      selectedMission?.ambulanceId?.ambulanceId ||
      visibleFleet[0]?._id;

    if (amb && !streamingGps && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          void syncLocation(amb, coords);
          setStreamingGps(true);
        },
        (err) => {
          console.warn('Ambulance background GPS notice:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
      );
      setWatchId(id);
    }
  }, [selectedMission, visibleFleet]);

  // Real-time Road Route Driving Simulation (step along Mapbox route coordinates every 2.5s)
  useEffect(() => {
    if (!simulatingDrive || !missionRoute?.geometry?.coordinates) return;
    const coords = missionRoute.geometry.coordinates;
    if (!coords || coords.length === 0) return;

    const amb =
      selectedMission?.ambulanceId?._id ||
      selectedMission?.ambulanceId?.ambulanceId ||
      visibleFleet[0]?._id;
    if (!amb) return;

    const interval = setInterval(() => {
      simIndexRef.current = (simIndexRef.current + 1) % coords.length;
      const pt = coords[simIndexRef.current];
      if (pt && pt.length >= 2) {
        const newCoords = { lat: pt[1], lng: pt[0] };
        void syncLocation(amb, newCoords);
        setNotice(`🚗 Vehicle moving: Live GPS (${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)})`);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [simulatingDrive, missionRoute, selectedMission, visibleFleet, syncLocation]);

  const toggleGpsStreaming = (targetAmbId?: string) => {
    const amb =
      targetAmbId ||
      selectedMission?.ambulanceId?._id ||
      selectedMission?.ambulanceId?.ambulanceId ||
      visibleFleet[0]?._id;

    if (!amb) {
      setError('Please select or assign an ambulance before starting GPS streaming.');
      return;
    }

    if (streamingGps) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setStreamingGps(false);
      setNotice('Ambulance live GPS streaming stopped.');
    } else {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        return;
      }
      setNotice('Connecting live GPS device stream…');
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          void syncLocation(amb, coords);
          setStreamingGps(true);
        },
        (err) => {
          console.warn('Geolocation watch error:', err.message);
          setError(`GPS signal issue: ${err.message}. You can also use preset locations.`);
          setStreamingGps(false);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
      );
      setWatchId(id);
    }
  };

  async function createAmbulance(ambulanceId: string, baseHospitalId: string) {
    setCreateBusy(true);
    setError('');
    try {
      await apiRequest('/ambulances', {
        method: 'POST',
        body: JSON.stringify({ ambulanceId, baseHospitalId: baseHospitalId || undefined }),
      });
      setShowCreate(false);
      setNotice(`${ambulanceId} added to the fleet.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to add ambulance.');
    } finally {
      setCreateBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading ambulance fleet and emergency assignments…" />;


  return (
    <div className="page-stack">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">TRANSPORT & RESPONSE OPERATIONS</div>
          <h1>Ambulance Fleet & Emergency Dispatch</h1>
          <p>
            Monitor live fleet readiness, accept emergency callouts, navigate to patients, and transport to the best suited hospital with verified specialist availability.
          </p>
        </div>
        <div className="heading-actions">
          <span className="toolbar-count">{visibleFleet.length} vehicles</span>
          {['coordinator', 'system_admin'].includes(user?.role || '') && (
            <button className="button button-primary" onClick={() => setShowCreate(true)}>
              <Plus size={17} /> Add vehicle
            </button>
          )}
        </div>
      </div>

      {error && <ErrorState message={error} />}
      {notice && (
        <div className="notice-banner" role="status">
          {notice}
          <button aria-label="Dismiss" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      )}

      {/* ACTIVE EMERGENCY MISSIONS SECTION (FOR DRIVERS & COORDINATORS) */}
      {relevantAssignments.length > 0 && (
        <section
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '2px solid #dc2626',
            boxShadow: '0 4px 16px rgba(220,38,38,0.1)',
            padding: '24px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#dc2626',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(220,38,38,0.4)'
                }}
              >
                <Radio size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Active Emergency Dispatch Mission ({relevantAssignments.length})
                </h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Live response protocol: Navigate to patient location, stabilize, and transport to hospital with verified specialist.
                </p>
              </div>
            </div>

            {/* Mission Selector Tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {relevantAssignments.map((a) => (
                <button
                  key={a._id}
                  type="button"
                  onClick={() => setSelectedMission(a)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: selectedMission?._id === a._id ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    background: selectedMission?._id === a._id ? '#fee2e2' : '#f8fafc',
                    color: selectedMission?._id === a._id ? '#991b1b' : '#475569'
                  }}
                >
                  {a.ambulanceId?.ambulanceId || 'Vehicle'} • {a.caseId}
                </button>
              ))}
            </div>
          </div>

          {selectedMission && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', alignItems: 'start' }}>
              {/* Mission Details & Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        Case {selectedMission.caseId}
                      </span>
                      <StatePill value={selectedMission.status} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#dc2626' }}>
                      Priority: {selectedMission.emergency?.priorityCategory || 'Critical'}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                    {selectedMission.emergency?.summary || 'Emergency call received.'}
                  </p>

                  {/* Specialist Match Badge */}
                  {selectedMission.emergency?.requiredSpecialties && selectedMission.emergency.requiredSpecialties.length > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                      <Stethoscope size={14} /> Required Specialist: {selectedMission.emergency.requiredSpecialties.join(', ')}
                    </div>
                  )}

                  {/* Pickup & Hospital Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', marginTop: '6px' }}>
                    <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <MapPin size={13} /> 1. Patient Pickup Location
                      </div>
                      <div style={{ color: '#1e293b', fontWeight: 600 }}>
                        {selectedMission.emergency?.pickupLocation?.address || 'Reported street location'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                        GPS: {selectedMission.emergency?.pickupLocation?.lat?.toFixed(4)}, {selectedMission.emergency?.pickupLocation?.lng?.toFixed(4)}
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <HospitalIcon size={13} /> 2. Receiving Facility
                      </div>
                      <div style={{ color: '#1e293b', fontWeight: 600 }}>
                        {selectedMission.destinationHospitalId?.name || 'Allocated Hospital'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                        {selectedMission.destinationHospitalId?.location?.address || 'Medical Center ER'}
                      </div>
                    </div>
                  </div>

                  {/* Hospital Preparation Live Alert Confirmation */}
                  {hospitalPrepared && (
                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '2px solid #10b981',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#065f46',
                        marginTop: '12px',
                        boxShadow: '0 2px 8px rgba(16,185,129,0.15)'
                      }}
                    >
                      <div
                        style={{
                          background: '#10b981',
                          color: '#ffffff',
                          borderRadius: '50%',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <CheckCircle2 size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🟢 HOSPITAL PREPARED: {hospitalPrepared.hospitalName || selectedMission.destinationHospitalId?.name || 'Destination Hospital'}
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '2px', color: '#047857', lineHeight: 1.4 }}>
                          Emergency bed reserved & Trauma/Specialist team notified! Proceed directly with priority transport.
                          {hospitalPrepared.note ? ` Notes: "${hospitalPrepared.note}"` : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AUTOMATED HOSPITAL SELECTION & SPECIALIST MATCHING MODULE */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '2px solid #0284c7',
                      borderRadius: '10px',
                      padding: '16px',
                      marginTop: '12px',
                      boxShadow: '0 2px 10px rgba(2,132,199,0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            padding: '6px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Compass size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                            Automatic Hospital Selector & Specialist Routing
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Auto-selects nearest hospital with verified specialist, ER bed, and fastest route
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={triggerAutoSelectDestination}
                        disabled={autoSelectingHosp}
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(2,132,199,0.3)'
                        }}
                      >
                        <HospitalIcon size={14} />
                        {autoSelectingHosp ? 'Finding Optimal Hospital…' : '⚡ Auto-Select Best Hospital'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                        Patient Condition:
                      </span>
                      {[
                        'Severe Head Injury / Trauma',
                        'Cardiac Arrest / Heart Attack',
                        'Stroke / Neurological Paralysis',
                        'Severe Respiratory Distress',
                        'Pediatric Critical Care'
                      ].map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => setPatientCondition(cond)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: patientCondition === cond ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            background: patientCondition === cond ? '#e0f2fe' : '#f8fafc',
                            color: patientCondition === cond ? '#0369a1' : '#475569'
                          }}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>

                    {autoSelectedHospitalInfo && (
                      <div
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #86efac',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: '#166534',
                          lineHeight: 1.4
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} color="#16a34a" /> Auto-Selected Destination: {autoSelectedHospitalInfo.autoSelectedHospital?.name} ({autoSelectedHospitalInfo.etaMinutes} mins ETA)
                        </div>
                        <div style={{ color: '#15803d' }}>
                          {autoSelectedHospitalInfo.selectionReason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Route Toggle & Distance Summary */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Compass size={16} /> Select Navigation Route to Follow:
                    </div>
                    {missionRoute && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#15803d' }}>
                          {missionRoute.durationMinutes} min
                        </span>
                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                          ({missionRoute.distanceKm} km drive)
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setRouteType('to_patient')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: routeType === 'to_patient' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                        background: routeType === 'to_patient' ? '#dc2626' : '#ffffff',
                        color: routeType === 'to_patient' ? '#ffffff' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Navigation size={14} /> 🚗 1. Navigate to Patient
                    </button>

                    <button
                      type="button"
                      onClick={() => setRouteType('to_hospital')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: routeType === 'to_hospital' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: routeType === 'to_hospital' ? '#0284c7' : '#ffffff',
                        color: routeType === 'to_hospital' ? '#ffffff' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <HospitalIcon size={14} /> 🏥 2. Navigate to Best Hospital
                    </button>
                  </div>
                </div>

                {/* Live GPS Broadcast & Sync Module */}
                <div
                  style={{
                    background: streamingGps ? '#f0fdf4' : '#f8fafc',
                    border: streamingGps ? '2px solid #22c55e' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: streamingGps ? '#16a34a' : '#94a3b8',
                          boxShadow: streamingGps ? '0 0 10px #16a34a' : 'none',
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                        Live Ambulance GPS Telemetry Stream
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSimulatingDrive((s) => !s)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: `1px solid ${simulatingDrive ? '#7c3aed' : '#cbd5e1'}`,
                          background: simulatingDrive ? '#7c3aed' : '#ffffff',
                          color: simulatingDrive ? '#ffffff' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: simulatingDrive ? '0 0 10px rgba(124,58,237,0.4)' : 'none'
                        }}
                      >
                        <Navigation size={14} />
                        {simulatingDrive ? '⏹️ Stop Live Simulation' : '▶️ Auto-Simulate Road Driving'}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleGpsStreaming()}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                          background: streamingGps ? '#dc2626' : '#16a34a',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {streamingGps ? <WifiOff size={14} /> : <Wifi size={14} />}
                        {streamingGps ? 'Stop Live GPS Stream' : '📡 Stream Live GPS Location'}
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#64748b' }}>
                    {streamingGps
                      ? `Broadcasting real-time GPS coordinates (${lastStreamedCoord ? `${lastStreamedCoord.lat.toFixed(4)}, ${lastStreamedCoord.lng.toFixed(4)}` : 'acquiring live fix…'}) to Patient Portal and Command Center.`
                      : 'Stream continuous GPS from this vehicle or test with Pakistan road presets below:'}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                      Simulate Location:
                    </span>
                    {[
                      { label: 'Liberty Market Lahore', lat: 31.5102, lng: 74.3441 },
                      { label: 'Mall Road Lahore', lat: 31.5580, lng: 74.3270 },
                      { label: 'Kalma Chowk Lahore', lat: 31.5033, lng: 74.3318 },
                      { label: 'Blue Area Islamabad', lat: 33.7100, lng: 73.0600 },
                      { label: 'Clifton Karachi', lat: 24.8138, lng: 67.0299 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          const ambId =
                            selectedMission?.ambulanceId?._id ||
                            selectedMission?.ambulanceId?.ambulanceId ||
                            visibleFleet[0]?._id;
                          if (ambId) {
                            void syncLocation(ambId, { lat: preset.lat, lng: preset.lng });
                            setNotice(`Ambulance position updated to ${preset.label}`);
                          }
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        📍 {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ambulance Driver Workflow Action Progression */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                    Mission Journey Progression:
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedMission.status === 'assigned' && (
                      <button
                        type="button"
                        className="button button-primary"
                        style={{ background: '#d97706', borderColor: '#d97706', flex: 1, padding: '10px' }}
                        disabled={busyId === selectedMission._id}
                        onClick={() => void advanceAssignment(selectedMission._id, 'en_route')}
                      >
                        <AmbulanceIcon size={16} /> Depart: En Route to Patient
                      </button>
                    )}

                    {selectedMission.status === 'en_route' && (
                      <button
                        type="button"
                        className="button button-primary"
                        style={{ background: '#2563eb', borderColor: '#2563eb', flex: 1, padding: '10px' }}
                        disabled={busyId === selectedMission._id}
                        onClick={() => void advanceAssignment(selectedMission._id, 'arrived')}
                      >
                        <MapPin size={16} /> Arrived at Patient (Loading)
                      </button>
                    )}

                    {selectedMission.status === 'arrived' && (
                      <button
                        type="button"
                        className="button button-primary"
                        style={{ background: '#16a34a', borderColor: '#16a34a', flex: 1, padding: '10px' }}
                        disabled={busyId === selectedMission._id}
                        onClick={() => void advanceAssignment(selectedMission._id, 'handed_over')}
                      >
                        <CheckCircle2 size={16} /> Complete Handover at Hospital ER
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Mapbox Live Road Map */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                    Road Path & Driving Geometry ({routeType === 'to_patient' ? 'To Patient' : 'To Best Hospital'})
                  </span>
                  {calculatingRoute && <span style={{ fontSize: '11px', color: '#0284c7' }}>Updating route…</span>}
                </div>

                <MapboxMap
                  height="340px"
                  hospitals={selectedMission.destinationHospitalId ? [selectedMission.destinationHospitalId] : []}
                  routeGeometry={missionRoute?.geometry}
                  routeColor={routeType === 'to_patient' ? '#dc2626' : '#0284c7'}
                />

                {missionRoute && (
                  <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>
                    Estimated travel time: <strong style={{ color: '#0f172a' }}>{missionRoute.durationMinutes} minutes</strong> across <strong style={{ color: '#0f172a' }}>{missionRoute.distanceKm} km</strong>.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ALL FLEET VEHICLES OVERVIEW */}
      <div style={{ marginTop: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
          All Fleet Vehicles ({visibleFleet.length})
        </h2>

        <section className="fleet-grid">
          {visibleFleet.map((vehicle) => {
            const availableTransitions = transitions[vehicle.status] || [];
            return (
              <article className="fleet-card" key={vehicle._id}>
                <div className="fleet-card-top">
                  <span className="fleet-icon">
                    <AmbulanceIcon size={19} />
                  </span>
                  <StatePill value={vehicle.status} />
                </div>
                <h2>{vehicle.ambulanceId}</h2>
                <p className="fleet-base">
                  <MapPin size={14} /> {getHospitalName(vehicle.baseHospitalId)}
                </p>
                {canUpdate && availableTransitions.length > 0 && (
                  <div className="fleet-controls" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {availableTransitions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className="button button-secondary button-small"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          disabled={busyId === vehicle._id}
                          onClick={() => {
                            nextStatus[vehicle._id] = status;
                            void update(vehicle);
                          }}
                        >
                          Set {status.replaceAll('_', ' ')}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        id={`status-${vehicle._id}`}
                        className="select"
                        value={nextStatus[vehicle._id] || ''}
                        onChange={(event) => setNextStatus((prev) => ({ ...prev, [vehicle._id]: event.target.value }))}
                      >
                        <option value="">Select status…</option>
                        {availableTransitions.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <button
                        className="button button-primary button-small"
                        disabled={!nextStatus[vehicle._id] || busyId === vehicle._id}
                        onClick={() => void update(vehicle)}
                      >
                        <Save size={14} /> Apply
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          {!visibleFleet.length && (
            <div className="empty-state panel-card">No ambulance records are visible for this account.</div>
          )}
        </section>
      </div>

      <div className="info-banner">
        Status changes are checked by the backend against workflow transitions and account scope.
      </div>

      {showCreate && (
        <CreateAmbulanceDialog
          busy={createBusy}
          onClose={() => setShowCreate(false)}
          onSubmit={(id, hospitalId) => void createAmbulance(id, hospitalId)}
        />
      )}
    </div>
  );
}

function CreateAmbulanceDialog({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (ambulanceId: string, baseHospitalId: string) => void;
}) {
  const [ambulanceId, setAmbulanceId] = useState('');
  const [baseHospitalId, setBaseHospitalId] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<Hospital[]>('/hospitals')
      .then((result) => setHospitals(Array.isArray(result) ? result : []))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load base hospitals.'))
      .finally(() => setLoadingHospitals(false));
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(ambulanceId.trim(), baseHospitalId);
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="modal-card form-modal"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ambulance-title"
      >
        <div className="modal-heading">
          <div>
            <div className="eyebrow">TRANSPORT OPERATIONS</div>
            <h2 id="create-ambulance-title">Add fleet vehicle</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        <p className="modal-copy">
          The vehicle will be registered as available. Assignments remain subject to case destination confirmation.
        </p>
        <label className="field-label" htmlFor="ambulance-id">
          Vehicle ID
        </label>
        <input
          className="input"
          id="ambulance-id"
          required
          minLength={2}
          maxLength={40}
          value={ambulanceId}
          onChange={(event) => setAmbulanceId(event.target.value)}
          placeholder="e.g. AMB-05"
        />
        <label className="field-label" htmlFor="ambulance-base">
          Base hospital (optional)
        </label>
        <select
          className="select"
          id="ambulance-base"
          disabled={loadingHospitals}
          value={baseHospitalId}
          onChange={(event) => setBaseHospitalId(event.target.value)}
        >
          <option value="">{loadingHospitals ? 'Loading hospitals…' : 'No base hospital'}</option>
          {hospitals.map((hospital) => (
            <option key={hospital._id} value={hospital._id}>
              {hospital.name}
            </option>
          ))}
        </select>
        {error && (
          <div className="form-alert" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button className="button button-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button button-primary" type="submit" disabled={busy || loadingHospitals}>
            {busy ? 'Saving…' : 'Add vehicle'} <Plus size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
