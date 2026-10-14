import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Activity,
  Ambulance as AmbulanceIcon,
  CheckCircle2,
  Clock,
  Compass,
  HeartPulse,
  Hospital as HospitalIcon,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Users,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Radio,
  LocateFixed,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Socket } from 'socket.io-client';
import { createEmergencySocket } from '../shared/socket';
import MapboxMap from '../components/MapboxMap';
import StatePill from '../components/StatePill';
import { LoadingState } from '../components/LoadState';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

interface HospitalMatch {
  hospitalId: string;
  name: string;
  address: string;
  city?: string;
  province?: string;
  facilityType?: string;
  bedCapacity?: number;
  emergencyHelpline?: string;
  location: { lat: number; lng: number };
  contactPhone: string;
  contactEmail?: string;
  specialties: string[];
  hasRequiredSpecialist: boolean;
  matchedSpecialties: string[];
  distanceKm: number;
  durationMinutes: number;
  geometry: any;
  suitabilityScore: number;
  resources: Array<{
    resourceType: string;
    availableCount: number | null;
    totalCapacity: number | null;
    status: string;
  }>;
}

interface CityInfo {
  name: string;
  province: string;
  lat: number;
  lng: number;
  helpline?: string;
  hospitalCount?: number;
  govtHospitalCount?: number;
  privateHospitalCount?: number;
}

interface TrackingData {
  caseId: string;
  status: string;
  summary: string;
  pickupLocation: { lat: number; lng: number; address: string };
  referralStatus: string;
  referralHospitalName: string;
  destinationHospital: any;
  assignedAmbulance: {
    ambulanceId: string;
    status: string;
    currentLocation?: { lat: number; lng: number };
  } | null;
  route: {
    durationMinutes: number;
    distanceKm: number;
    geometry: any;
  } | null;
  createdAt: string;
}

interface AiTriageResult {
  source: string;
  priority: string;
  specialties: string[];
  resources: string[];
  firstAidInstructions: string[];
  clinicalImpression: string;
}

const SPECIALTY_OPTIONS = [
  { id: 'Cardiology', label: 'Cardiology (Heart / Chest Pain)', icon: HeartPulse, color: '#ef4444' },
  { id: 'Trauma Surgery', label: 'Trauma Surgery (Accident / Bleeding)', icon: ShieldAlert, color: '#dc2626' },
  { id: 'Neurology', label: 'Neurology (Stroke / Brain / Seizure)', icon: Activity, color: '#8b5cf6' },
  { id: 'Pediatrics', label: 'Pediatrics (Children)', icon: Users, color: '#06b6d4' },
  { id: 'Pulmonology', label: 'Pulmonology (Breathing / Asthma)', icon: Stethoscope, color: '#3b82f6' },
  { id: 'Orthopedics', label: 'Orthopedics (Bones / Fractures)', icon: Compass, color: '#f59e0b' },
  { id: 'Emergency Medicine', label: 'General Emergency', icon: HospitalIcon, color: '#10b981' }
];

// Real Pakistan Emergency Hub Locations
const PRESET_LOCATIONS = [
  { name: 'Liberty Roundabout, Gulberg III (Lahore)', lat: 31.5120, lng: 74.3450 },
  { name: 'Mall Road / Charing Cross (Lahore)', lat: 31.5580, lng: 74.3270 },
  { name: 'DHA Phase 5 Commercial (Lahore)', lat: 31.4700, lng: 74.4050 },
  { name: 'Johar Town / Shaukat Khanum (Lahore)', lat: 31.4720, lng: 74.2720 },
  { name: 'Model Town Link Road (Lahore)', lat: 31.4880, lng: 74.3210 },
  { name: 'Blue Area / Jinnah Ave (Islamabad)', lat: 33.7120, lng: 73.0650 },
  { name: 'F-7 Markaz (Islamabad)', lat: 33.7200, lng: 73.0550 },
  { name: 'Murree Road / Saddar (Rawalpindi)', lat: 33.5950, lng: 73.0540 },
  { name: 'Clifton Block 4 (Karachi)', lat: 24.8250, lng: 67.0320 },
  { name: 'Gulshan-e-Iqbal (Karachi)', lat: 24.9180, lng: 67.0970 },
  { name: 'Saddar / JPMC Area (Karachi)', lat: 24.8560, lng: 67.0420 },
  { name: 'University Town (Peshawar)', lat: 33.9980, lng: 71.4920 },
  { name: 'Cantt Mall (Multan)', lat: 30.1980, lng: 71.4550 },
  { name: 'D-Ground Peoples Colony (Faisalabad)', lat: 31.4080, lng: 73.1020 }
];

function findClosestCity(lat: number, lng: number, cities: CityInfo[]): CityInfo | null {
  if (!cities || cities.length === 0) return null;
  let bestCity: CityInfo | null = null;
  let minDist = Infinity;
  for (const c of cities) {
    if (typeof c.lat === 'number' && typeof c.lng === 'number') {
      const d = Math.hypot(c.lat - lat, c.lng - lng);
      if (d < minDist) {
        minDist = d;
        bestCity = c;
      }
    }
  }
  return bestCity;
}

function playEmergencyChime() {
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
    // Audio fallback
  }
}

interface ProgressLog {
  time: string;
  text: string;
  stage: string;
}

interface RequestProgress {
  isOpen: boolean;
  stage: 'idle' | 'sending' | 'registered' | 'dispatched' | 'referred' | 'accepted';
  caseId: string;
  ambulanceId: string;
  hospitalName: string;
  hospitalAddress?: string;
  etaMinutes: number;
  autonomousAccepted: boolean;
  logs: ProgressLog[];
}

export default function PublicPatientPortalPage() {
  const { caseId: routeCaseId } = useParams<{ caseId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const urlTrackingToken = new URLSearchParams(location.hash.slice(1)).get('token') || '';

  // Mode: 'find' or 'track'
  const [activeTab, setActiveTab] = useState<'find' | 'track'>(routeCaseId ? 'track' : 'find');

  // Search state (Default: All Pakistan - automatically picks nearest hospital based on GPS!)
  const [selectedCity, setSelectedCity] = useState('All Pakistan');
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'government' | 'private'>('all');
  const [citiesList, setCitiesList] = useState<CityInfo[]>([]);
  const [conditionText, setConditionText] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['Cardiology']);
  const [pickupLocation, setPickupLocation] = useState({
    lat: 24.8607,
    lng: 67.0011,
    address: 'Detecting Live Location GPS…'
  });
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [liveGpsActive, setLiveGpsActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const hasSearchedWithGpsRef = useRef(false);
  const lastSearchedLocRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  // Live Emergency Dispatch & Multi-Stage Progress Stepper
  const [requestProgress, setRequestProgress] = useState<RequestProgress>({
    isOpen: false,
    stage: 'idle',
    caseId: '',
    ambulanceId: '',
    hospitalName: '',
    etaMinutes: 8,
    autonomousAccepted: false,
    logs: []
  });

  // Gemini AI Triage State
  const [aiTriageLoading, setAiTriageLoading] = useState(false);
  const [aiTriageResult, setAiTriageResult] = useState<AiTriageResult | null>(null);

  // Search results
  const [searching, setSearching] = useState(false);
  const [hospitals, setHospitals] = useState<HospitalMatch[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<HospitalMatch | null>(null);
  const [autoSelectedHospital, setAutoSelectedHospital] = useState<HospitalMatch | null>(null);
  const [autoSelectionReason, setAutoSelectionReason] = useState<string>('');

  // Dispatch modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const dispatchPhone = 'Emergency Citizen Caller';
  const [dispatchEmail, setDispatchEmail] = useState('');
  const [dispatchPriority, setDispatchPriority] = useState('critical');
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [dispatchError, setDispatchError] = useState('');

  // Tracking state
  const [trackingCaseId, setTrackingCaseId] = useState(routeCaseId || '');
  const [trackingToken, setTrackingToken] = useState(urlTrackingToken);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [liveCitizenNotice, setLiveCitizenNotice] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const copyTrackingLink = useCallback(() => {
    if (!trackingData?.caseId) return;
    const url = `${window.location.origin}/portal/track/${trackingData.caseId}${trackingToken ? `#token=${encodeURIComponent(trackingToken)}` : ''}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }).catch(() => {
      // ignore
    });
  }, [trackingData?.caseId, trackingToken]);

  // Initial hospital search
  const performSearch = useCallback(
    async (
      specs: string[],
      loc: { lat: number; lng: number },
      cityName: string = selectedCity,
      facType: string = facilityFilter
    ) => {
      setSearching(true);
      try {
        const resp = await fetch(`${API_BASE}/public/portal/find-hospitals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requiredSpecialties: specs,
            pickupLocation: loc,
            city: cityName !== 'All Pakistan' ? cityName : undefined,
            facilityType: facType
          })
        });
        const data = await resp.json();
        if (data.success && data.data?.hospitals) {
          const list: HospitalMatch[] = data.data.hospitals;
          setHospitals(list);
          const autoBest = data.data.autoSelectedHospital || list[0] || null;
          setAutoSelectedHospital(autoBest);
          setAutoSelectionReason(
            data.data.autoSelectionReason ||
              (autoBest
                ? `Nearest suitable facility (${autoBest.durationMinutes} mins) with ${
                    autoBest.matchedSpecialties && autoBest.matchedSpecialties.length > 0
                      ? autoBest.matchedSpecialties.join('/')
                      : 'Emergency'
                  } specialist and verified ER beds.`
                : '')
          );

          if (list.length > 0) {
            const topHosp = autoBest || list[0];
            setSelectedHospital(topHosp);

            // Fetch live client-side road geometry if backend proxy timed out
            if (!topHosp.geometry && topHosp.location) {
              const mbToken =
                import.meta.env.VITE_MAPBOX_TOKEN ||
                'pk.eyJ1Ijoic2hhcXJhbiIsImEiOiJjbXY2c2pvaXIwaGFmMnhzZmozaWJhbXEyIn0.yw7huxs7cE_VJuJJ0q909g';
              fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${loc.lng},${loc.lat};${topHosp.location.lng},${topHosp.location.lat}?geometries=geojson&overview=full&access_token=${mbToken}`
              )
                .then((r) => r.json())
                .then((dir) => {
                  if (dir.routes && dir.routes[0]) {
                    const r0 = dir.routes[0];
                    topHosp.geometry = r0.geometry;
                    topHosp.durationMinutes = Math.max(1, Math.round(r0.duration / 60));
                    topHosp.distanceKm = Math.round((r0.distance / 1000) * 10) / 10;
                    setSelectedHospital({ ...topHosp });
                    setAutoSelectedHospital({ ...topHosp });
                  }
                })
                .catch(() => {});
            }
          } else {
            setSelectedHospital(null);
            setAutoSelectedHospital(null);
          }
        }
      } catch (err) {
        console.error('Failed to search hospitals:', err);
      } finally {
        setSearching(false);
      }
    },
    [selectedCity, facilityFilter]
  );

  // Dedicated Auto-Select Function
  const autoSelectBestHospital = async () => {
    setSearching(true);
    try {
      const resp = await fetch(`${API_BASE}/public/portal/auto-select-hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLocation,
          condition: conditionText,
          requiredSpecialties: selectedSpecialties,
          city: selectedCity !== 'All Pakistan' ? selectedCity : undefined,
          facilityType: facilityFilter
        })
      });
      const d = await resp.json();
      if (d.success && d.data?.autoSelectedHospital) {
        const best = d.data.autoSelectedHospital;
        setAutoSelectedHospital(best);
        setAutoSelectionReason(d.data.selectionReason || '');
        setSelectedHospital(best);
        if (d.data.rankedCandidates) {
          setHospitals(d.data.rankedCandidates);
        }
      }
    } catch (err) {
      console.error('Auto select error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectHospital = (hosp: HospitalMatch) => {
    setSelectedHospital(hosp);
    if (!hosp.geometry && hosp.location) {
      const mbToken =
        import.meta.env.VITE_MAPBOX_TOKEN ||
        'pk.eyJ1Ijoic2hhcXJhbiIsImEiOiJjbXY2c2pvaXIwaGFmMnhzZmozaWJhbXEyIn0.yw7huxs7cE_VJuJJ0q909g';
      fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupLocation.lng},${pickupLocation.lat};${hosp.location.lng},${hosp.location.lat}?geometries=geojson&overview=full&access_token=${mbToken}`
      )
        .then((r) => r.json())
        .then((dir) => {
          if (dir.routes && dir.routes[0]) {
            const r0 = dir.routes[0];
            hosp.geometry = r0.geometry;
            hosp.durationMinutes = Math.max(1, Math.round(r0.duration / 60));
            hosp.distanceKm = Math.round((r0.distance / 1000) * 10) / 10;
            setSelectedHospital({ ...hosp });
          }
        })
        .catch(() => {});
    }
  };


  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    const matched = citiesList.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
    if (matched) {
      const newLoc = {
        lat: matched.lat,
        lng: matched.lng,
        address: `${matched.name} Emergency Zone (${matched.province})`
      };
      setPickupLocation(newLoc);
      void performSearch(selectedSpecialties, newLoc, cityName, facilityFilter);
    } else {
      void performSearch(selectedSpecialties, pickupLocation, cityName, facilityFilter);
    }
  };

  const handleFacilityFilterChange = (filterType: 'all' | 'government' | 'private') => {
    setFacilityFilter(filterType);
    void performSearch(selectedSpecialties, pickupLocation, selectedCity, filterType);
  };

  // Load cities catalog on mount
  useEffect(() => {
    fetch(`${API_BASE}/public/portal/cities`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.cities) {
          setCitiesList(data.data.cities);
        }
      })
      .catch((err) => console.warn('Failed to load cities:', err));
  }, []);

  // Run initial hospital search IMMEDIATELY on mount (instant display, zero waiting!)
  useEffect(() => {
    void performSearch(selectedSpecialties, pickupLocation, selectedCity, facilityFilter);
  }, []);

  // Continuously track live location on mount & stream to backend if active case exists
  useEffect(() => {
    if (!navigator.geolocation) {
      void performSearch(selectedSpecialties, pickupLocation, 'All Pakistan', facilityFilter);
      return;
    }

    setGpsDetecting(true);
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const closest = findClosestCity(lat, lng, citiesList);
        const liveLoc = {
          lat,
          lng,
          address: closest
            ? `Live GPS: Near ${closest.name}, ${closest.province} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
            : `Live GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        };

        setPickupLocation((prev) => {
          // If moved > 15 meters or was placeholder, update
          const dist = Math.hypot(prev.lat - lat, prev.lng - lng) * 111000;
          if (dist > 15 || prev.address.includes('Detecting')) {
            return liveLoc;
          }
          return prev;
        });

        setGpsDetecting(false);
        setLiveGpsActive(true);

        // Immediately search nearest & best hospital based on real live GPS coordinates
        const distFromLastSearch = Math.hypot(
          lastSearchedLocRef.current.lat - lat,
          lastSearchedLocRef.current.lng - lng
        ) * 111000;
        if (!hasSearchedWithGpsRef.current || distFromLastSearch > 250) {
          hasSearchedWithGpsRef.current = true;
          lastSearchedLocRef.current = { lat, lng };
          void performSearch(selectedSpecialties, liveLoc, selectedCity, facilityFilter);
        }

        // If tracking an active emergency case, continuously sync patient location to backend
        if (trackingCaseId) {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (trackingToken) {
            headers['X-Tracking-Token'] = trackingToken;
          }
          fetch(`${API_BASE}/public/portal/track/${encodeURIComponent(trackingCaseId)}/location`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ lat, lng, address: liveLoc.address })
          }).catch(() => {});
        }
      },
      (err) => {
        console.warn('Continuous GPS watch notice:', err.message);
        setGpsDetecting(false);
        void performSearch(selectedSpecialties, pickupLocation, 'All Pakistan', facilityFilter);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
    );

    watchIdRef.current = wid;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [citiesList, trackingCaseId, trackingToken]);

  // Trigger Gemini AI Triage
  const handleAiTriage = async () => {
    if (!conditionText.trim()) {
      alert('Please enter or describe your symptoms first.');
      return;
    }
    setAiTriageLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/public/portal/ai-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: conditionText })
      });
      const data = await resp.json();
      if (data.success && data.data) {
        const res: AiTriageResult = data.data;
        setAiTriageResult(res);

        // Auto-select specialists from Gemini analysis
        if (res.specialties && res.specialties.length > 0) {
          setSelectedSpecialties(res.specialties);
          void performSearch(res.specialties, pickupLocation);
        }

        // Auto-set priority
        if (res.priority) {
          setDispatchPriority(res.priority);
        }
      }
    } catch (err) {
      console.error('AI Triage request failed:', err);
    } finally {
      setAiTriageLoading(false);
    }
  };

  // Toggle Continuous GPS Live Sync
  const toggleLiveGpsWatch = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    if (liveGpsActive && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setLiveGpsActive(false);
      return;
    }

    setGpsDetecting(true);
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const closest = findClosestCity(lat, lng, citiesList);
        const updated = {
          lat,
          lng,
          address: closest
            ? `Live GPS: Near ${closest.name}, ${closest.province} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
            : `Live GPS Stream (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        };
        setPickupLocation(updated);
        setGpsDetecting(false);
        setLiveGpsActive(true);
        void performSearch(selectedSpecialties, updated, 'All Pakistan', facilityFilter);
      },
      () => {
        setGpsDetecting(false);
        setLiveGpsActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 4000 }
    );
    watchIdRef.current = wid;
  };

  // Poll tracking data if tracking tab is active and caseId is set
  const fetchTracking = useCallback(async (id: string, token = trackingToken) => {
    if (!id) return;
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const trimmed = id.trim();
      const headers: Record<string, string> = {};
      if (token) {
        headers['X-Tracking-Token'] = token;
      }
      const resp = await fetch(`${API_BASE}/public/portal/track/${encodeURIComponent(trimmed)}`, {
        headers
      });
      const data = await resp.json();
      if (data.success && data.data) {
        const track: TrackingData = data.data;

        // If road route geometry is missing, fetch direct driving route from Mapbox
        if (!track.route?.geometry && track.pickupLocation && track.destinationHospital?.location) {
          const mbToken =
            import.meta.env.VITE_MAPBOX_TOKEN ||
            'pk.eyJ1Ijoic2hhcXJhbiIsImEiOiJjbXY2c2pvaXIwaGFmMnhzZmozaWJhbXEyIn0.yw7huxs7cE_VJuJJ0q909g';
          fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${track.pickupLocation.lng},${track.pickupLocation.lat};${track.destinationHospital.location.lng},${track.destinationHospital.location.lat}?geometries=geojson&overview=full&access_token=${mbToken}`
          )
            .then((r) => r.json())
            .then((dir) => {
              if (dir.routes && dir.routes[0]) {
                const r0 = dir.routes[0];
                track.route = {
                  durationMinutes: Math.max(1, Math.round(r0.duration / 60)),
                  distanceKm: Math.round((r0.distance / 1000) * 10) / 10,
                  geometry: r0.geometry
                };
                setTrackingData({ ...track });
              }
            })
            .catch(() => {});
        }

        setTrackingData(track);
      } else {
        setTrackingError(data.error?.message || data.message || 'Emergency case not found.');
      }
    } catch (err) {
      setTrackingError('Unable to connect to live tracking service.');
    } finally {
      setTrackingLoading(false);
    }
  }, [trackingToken]);


  useEffect(() => {
    if (routeCaseId) {
      setTrackingToken(urlTrackingToken);
      setTrackingCaseId(routeCaseId);
      setActiveTab('track');
      void fetchTracking(routeCaseId, urlTrackingToken);
    }
  }, [routeCaseId, urlTrackingToken, fetchTracking]);

  // Periodic polling for live case tracking (every 4s)
  useEffect(() => {
    if (activeTab === 'track' && trackingCaseId && trackingData) {
      const timer = setInterval(() => {
        void fetchTracking(trackingCaseId, trackingToken);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [activeTab, trackingCaseId, trackingToken, trackingData, fetchTracking]);

  // Live WebSocket real-time updates for citizen
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = createEmergencySocket({ transports: ['websocket', 'polling'] });
      socket.on('emergency:citizen_update', (data: any) => {
        if (!trackingCaseId || (data.caseId && data.caseId.toLowerCase() === trackingCaseId.toLowerCase())) {
          if (data.message) setLiveCitizenNotice(data.message);
          if (data.assignedAmbulance?.currentLocation) {
            setTrackingData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                assignedAmbulance: {
                  ...(prev.assignedAmbulance || { ambulanceId: 'Rescue 1122', status: 'en_route' }),
                  currentLocation: data.assignedAmbulance.currentLocation
                }
              };
            });
          }
          if (trackingCaseId) void fetchTracking(trackingCaseId);
        }
      });

      socket.on('ambulance:location_updated', (data: any) => {
        const ambCoords = data.lastKnownLocation || data.currentLocation;
        if (ambCoords) {
          setTrackingData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              assignedAmbulance: {
                ...(prev.assignedAmbulance || { ambulanceId: data.ambulanceId || 'Rescue 1122', status: 'en_route' }),
                currentLocation: ambCoords,
                status: data.status || prev.assignedAmbulance?.status || 'en_route'
              }
            };
          });
        }
      });

      socket.on('emergency:ambulance_dispatched', (data: any) => {
        if (!trackingCaseId || (data.caseId && data.caseId.toLowerCase() === trackingCaseId.toLowerCase())) {
          setLiveCitizenNotice(`🚑 Ambulance ${data.ambulanceId || 'Rescue 1122'} dispatched & en route to your location!`);
          if (trackingCaseId) void fetchTracking(trackingCaseId);
        }
        setRequestProgress((prev) => {
          if (!prev.isOpen) return prev;
          if (prev.caseId && data.caseId && prev.caseId.toLowerCase() !== data.caseId.toLowerCase()) return prev;
          playEmergencyChime();
          return {
            ...prev,
            stage: 'dispatched',
            ambulanceId: data.ambulanceId || prev.ambulanceId,
            logs: [
              ...prev.logs,
              {
                time: new Date().toLocaleTimeString(),
                text: `🚑 Rescue 1122 Unit ${data.ambulanceId || 'Assigned'} en route to GPS coordinates.`,
                stage: 'dispatched'
              }
            ]
          };
        });
      });

      socket.on('emergency:incoming_patient', (data: any) => {
        if (!trackingCaseId || (data.caseId && data.caseId.toLowerCase() === trackingCaseId.toLowerCase())) {
          if (trackingCaseId) void fetchTracking(trackingCaseId);
        }
        setRequestProgress((prev) => {
          if (!prev.isOpen) return prev;
          if (prev.caseId && data.caseId && prev.caseId.toLowerCase() !== data.caseId.toLowerCase()) return prev;
          return {
            ...prev,
            stage: prev.stage === 'accepted' ? 'accepted' : 'referred',
            logs: [
              ...prev.logs,
              {
                time: new Date().toLocaleTimeString(),
                text: `🏥 Receiving Hospital Emergency Department confirmed telemetry. Preparing trauma bay.`,
                stage: 'referred'
              }
            ]
          };
        });
      });

      socket.on('emergency:hospital_prepared', (data: any) => {
        playEmergencyChime();
        if (!trackingCaseId || (data.caseId && data.caseId.toLowerCase() === trackingCaseId.toLowerCase())) {
          setLiveCitizenNotice(`🟢 Hospital Ready: ${data.hospitalName} has accepted patient and reserved an ER Bed!`);
          if (trackingCaseId) void fetchTracking(trackingCaseId);
        }
        setRequestProgress((prev) => {
          if (!prev.isOpen) return prev;
          if (prev.caseId && data.caseId && prev.caseId.toLowerCase() !== data.caseId.toLowerCase()) return prev;
          return {
            ...prev,
            stage: 'accepted',
            hospitalName: data.hospitalName || prev.hospitalName,
            logs: [
              ...prev.logs,
              {
                time: new Date().toLocaleTimeString(),
                text: `🟢 HOSPITAL ACCEPTED & BED RESERVED: ${data.hospitalName} ER staff approved admission and reserved emergency trauma bed!`,
                stage: 'accepted'
              }
            ]
          };
        });
      });

      socket.on('emergency:autonomous_accepted', (data: any) => {
        playEmergencyChime();
        if (!trackingCaseId || (data.caseId && data.caseId.toLowerCase() === trackingCaseId.toLowerCase())) {
          setLiveCitizenNotice(`⚡ ${data.hospitalName} Emergency Department auto-confirmed admission! ER Bed reserved.`);
          if (trackingCaseId) void fetchTracking(trackingCaseId);
        }
        setRequestProgress((prev) => {
          if (!prev.isOpen) return prev;
          if (prev.caseId && data.caseId && prev.caseId.toLowerCase() !== data.caseId.toLowerCase()) return prev;
          return {
            ...prev,
            stage: 'accepted',
            autonomousAccepted: true,
            hospitalName: data.hospitalName || prev.hospitalName,
            logs: [
              ...prev.logs,
              {
                time: new Date().toLocaleTimeString(),
                text: `⚡ AUTONOMOUS ADMISSION CONFIRMED: ${data.hospitalName} auto-accepted after 15s unattended protocol. ER Bed reserved!`,
                stage: 'accepted'
              }
            ]
          };
        });
      });
    } catch {
      // ignore
    }
    return () => {
      socket?.disconnect();
    };
  }, [trackingCaseId, fetchTracking]);

  const toggleSpecialty = (spec: string) => {
    const updated = selectedSpecialties.includes(spec)
      ? selectedSpecialties.filter((s) => s !== spec)
      : [...selectedSpecialties, spec];
    setSelectedSpecialties(updated);
    void performSearch(updated, pickupLocation);
  };

  // 1-Click Instant Emergency Dispatch Function
  const sendInstantEmergencyRequest = async (targetHospital?: HospitalMatch | null) => {
    const hosp = targetHospital || autoSelectedHospital || selectedHospital || hospitals[0];
    const initialHospitalName = hosp?.name || 'Nearest Tertiary Hospital';
    const initialEta = hosp?.durationMinutes || 8;

    setRequestProgress({
      isOpen: true,
      stage: 'sending',
      caseId: '',
      ambulanceId: '',
      hospitalName: initialHospitalName,
      hospitalAddress: hosp?.address || '',
      etaMinutes: initialEta,
      autonomousAccepted: false,
      logs: [
        {
          time: new Date().toLocaleTimeString(),
          text: '🚨 Transmitting emergency distress signal to Pakistan Emergency Network…',
          stage: 'sending'
        }
      ]
    });
    playEmergencyChime();

    try {
      const resp = await fetch(`${API_BASE}/public/portal/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition: conditionText || 'Critical Medical Emergency (1-Click Citizen Request)',
          priorityCategory: dispatchPriority || 'critical',
          requiredSpecialties: selectedSpecialties,
          pickupLocation,
          hospitalId: hosp?.hospitalId,
          patientContact: { phone: dispatchPhone, email: dispatchEmail || undefined },
          contactEmail: dispatchEmail || undefined
        })
      });
      const data = await resp.json();
      if (data.success && data.data?.caseId) {
        const cid = data.data.caseId;
        const amb = data.data.assignedAmbulance?.ambulanceId || 'Rescue 1122 Unit';
        const hospName = data.data.destinationHospital?.name || initialHospitalName;
        const token = data.data.trackingToken;

        setTrackingCaseId(cid);
        if (token) {
          setTrackingToken(token);
          window.location.hash = `token=${encodeURIComponent(token)}`;
        }
        playEmergencyChime();

        setRequestProgress((prev) => ({
          ...prev,
          stage: 'dispatched',
          caseId: cid,
          ambulanceId: amb,
          hospitalName: hospName,
          logs: [
            ...prev.logs,
            {
              time: new Date().toLocaleTimeString(),
              text: `✅ Emergency Case Registered: ID #${cid}`,
              stage: 'registered'
            },
            {
              time: new Date().toLocaleTimeString(),
              text: `🚑 Ambulance Dispatched: ${amb} is on the way to your live GPS coordinates!`,
              stage: 'dispatched'
            },
            {
              time: new Date().toLocaleTimeString(),
              text: `🏥 Pre-Arrival Alert Sent: ${hospName} ER staff & specialists notified with patient symptoms.`,
              stage: 'referred'
            }
          ]
        }));
      } else {
        setRequestProgress((prev) => ({
          ...prev,
          stage: 'idle',
          logs: [
            ...prev.logs,
            {
              time: new Date().toLocaleTimeString(),
              text: `❌ Dispatch Error: ${data.error?.message || 'Emergency server could not complete request.'}`,
              stage: 'error'
            }
          ]
        }));
      }
    } catch (err: any) {
      setRequestProgress((prev) => ({
        ...prev,
        stage: 'idle',
        logs: [
          ...prev.logs,
          {
            time: new Date().toLocaleTimeString(),
            text: `❌ Network connection error: ${err?.message || 'Please check connection.'}`,
            stage: 'error'
          }
        ]
      }));
    }
  };

  // Submit Ambulance Dispatch Modal
  const handleDispatchSubmit = async () => {
    setDispatchBusy(true);
    setDispatchError('');
    setShowDispatchModal(false);
    await sendInstantEmergencyRequest(selectedHospital);
    setDispatchBusy(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Emergency Citizen Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '16px 24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(220,38,38,0.5)'
              }}
            >
              <HeartPulse size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  EmergencyLink Pakistan
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(34,197,94,0.2)',
                    color: '#4ade80',
                    border: '1px solid rgba(74,222,128,0.3)'
                  }}
                >
                  Public Citizen Portal • Zero Login Required
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Pakistan Tertiary Hospitals • Live Specialist Verification • Real-Time GPS Tracking & Rescue 1122 Dispatch
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Pakistan Helplines */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#dc2626',
                color: 'white',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '0 2px 8px rgba(220,38,38,0.35)'
              }}
            >
              <Phone size={15} /> Rescue: 1122 | Edhi: 115
            </div>
            <Link
              to="/login"
              style={{
                color: '#94a3b8',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #334155'
              }}
            >
              Staff Portal <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('find')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'find' ? '#0284c7' : '#ffffff',
              color: activeTab === 'find' ? '#ffffff' : '#475569',
              boxShadow: activeTab === 'find' ? '0 2px 6px rgba(2,132,199,0.25)' : 'none'
            }}
          >
            <Search size={16} /> 1. Find Hospital & Best Road Route
          </button>
          <button
            onClick={() => setActiveTab('track')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'track' ? '#0284c7' : '#ffffff',
              color: activeTab === 'track' ? '#ffffff' : '#475569',
              boxShadow: activeTab === 'track' ? '0 2px 6px rgba(2,132,199,0.25)' : 'none'
            }}
          >
            <Radio size={16} /> 2. Live Emergency & Ambulance Tracking {trackingCaseId && `(${trackingCaseId})`}
          </button>
        </div>

        {/* TAB 1: FIND HOSPITALS & ROUTE */}
        {activeTab === 'find' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Left Column: Triage Inputs & Hospital List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Emergency Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(220,38,38,0.08)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b', fontWeight: 700, fontSize: '15px' }}>
                    <ShieldAlert size={18} /> Need Immediate Ambulance Dispatch?
                  </div>
                  <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '2px' }}>
                    Nearest Rescue 1122 or Edhi unit will be routed to your live GPS coordinates.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => sendInstantEmergencyRequest(autoSelectedHospital || selectedHospital)}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 10px rgba(220,38,38,0.3)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <AmbulanceIcon size={16} /> 🚨 1-Click Send Emergency Request
                  </button>
                  <button
                    onClick={() => setShowDispatchModal(true)}
                    style={{
                      background: '#ffffff',
                      color: '#b91c1c',
                      border: '1px solid #fca5a5',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Custom Details…
                  </button>
                </div>
              </div>

              {/* Pakistan City & Regional Sector Selector */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="#0284c7" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                        Pakistan City & Regional Network
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Browse emergency hospitals across Punjab, Sindh, KP, Balochistan, Islamabad, AJK & Gilgit-Baltistan.
                      </div>
                    </div>
                  </div>

                  {/* City Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <select
                      value={selectedCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#0f172a',
                        background: '#f8fafc',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="All Pakistan">🌐 All Pakistan (Nationwide Network)</option>
                      {(citiesList.length > 0
                        ? citiesList
                        : [
                            { name: 'Lahore', province: 'Punjab' },
                            { name: 'Karachi', province: 'Sindh' },
                            { name: 'Islamabad', province: 'ICT' },
                            { name: 'Rawalpindi', province: 'Punjab' },
                            { name: 'Peshawar', province: 'Khyber Pakhtunkhwa' },
                            { name: 'Faisalabad', province: 'Punjab' },
                            { name: 'Multan', province: 'Punjab' },
                            { name: 'Quetta', province: 'Balochistan' },
                            { name: 'Gujranwala', province: 'Punjab' },
                            { name: 'Sialkot', province: 'Punjab' },
                            { name: 'Hyderabad', province: 'Sindh' },
                            { name: 'Bahawalpur', province: 'Punjab' },
                            { name: 'Sargodha', province: 'Punjab' },
                            { name: 'Sukkur', province: 'Sindh' },
                            { name: 'Larkana', province: 'Sindh' },
                            { name: 'Abbottabad', province: 'Khyber Pakhtunkhwa' },
                            { name: 'Swat', province: 'Khyber Pakhtunkhwa' },
                            { name: 'Muzaffarabad', province: 'AJK' },
                            { name: 'Mirpur', province: 'AJK' },
                            { name: 'Gilgit', province: 'Gilgit-Baltistan' },
                            { name: 'Skardu', province: 'Gilgit-Baltistan' },
                            { name: 'Gwadar', province: 'Balochistan' }
                          ]
                      ).map((city: any) => (
                        <option key={city.name} value={city.name}>
                          {city.name} ({city.province}) {city.hospitalCount ? `— ${city.hospitalCount} hospitals` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Facility Sector Filter: All vs Government vs Private */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                    Facility Sector:
                  </span>
                  {[
                    { id: 'all', label: 'All Facilities (Govt & Private)' },
                    { id: 'government', label: '🏛️ Government Hospitals (Rescue 1122 / Free ER)' },
                    { id: 'private', label: '🏥 Private Healthcare Centers' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleFacilityFilterChange(tab.id as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: facilityFilter === tab.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: facilityFilter === tab.id ? '#e0f2fe' : '#ffffff',
                        color: facilityFilter === tab.id ? '#0369a1' : '#475569',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Condition & Gemini AI Triage Box */}
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Stethoscope size={18} color="#0284c7" /> Patient Symptoms (English / Roman Urdu)
                  </h2>
                  <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    ✨ AI Assisted
                  </span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <textarea
                    rows={2}
                    value={conditionText}
                    onChange={(e) => setConditionText(e.target.value)}
                    placeholder="Describe symptoms in English or Urdu: e.g. 'seene me shadeed dard ho raha hai', 'motorcycle accident with head injury', 'difficulty breathing'..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={autoSelectBestHospital}
                      disabled={searching}
                      style={{
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(16,185,129,0.25)'
                      }}
                    >
                      <Compass size={13} /> {searching ? 'Selecting…' : '🎯 Auto-Select Best Hospital'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAiTriage}
                      disabled={aiTriageLoading || !conditionText.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(124,58,237,0.25)'
                      }}
                    >
                      <Sparkles size={13} /> {aiTriageLoading ? 'Analyzing…' : '✨ Gemini AI Clinical Triage'}
                    </button>
                  </div>
                </div>

                {/* Gemini AI Clinical Triage Assessment Card */}
                {aiTriageResult && (
                  <div
                    style={{
                      background: '#fbfbfe',
                      border: '1px solid #c4b5fd',
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} /> AI Clinical Impression:
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: aiTriageResult.priority === 'critical' ? '#fee2e2' : '#fef3c7',
                          color: aiTriageResult.priority === 'critical' ? '#dc2626' : '#d97706'
                        }}
                      >
                        Urgency: {aiTriageResult.priority}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                      {aiTriageResult.clinicalImpression}
                    </p>

                    {/* Pre-hospital First Aid Guidance for Bystanders */}
                    {aiTriageResult.firstAidInstructions.length > 0 && (
                      <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <HelpCircle size={13} /> Immediate Pre-Hospital First Aid (While Ambulance is En Route):
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                          {aiTriageResult.firstAidInstructions.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Specialty Filter Chips */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Required Field Specialist:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {SPECIALTY_OPTIONS.map((item) => {
                      const isSelected = selectedSpecialties.includes(item.id);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleSpecialty(item.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: `1px solid ${isSelected ? item.color : '#e2e8f0'}`,
                            background: isSelected ? item.color : '#f8fafc',
                            color: isSelected ? '#ffffff' : '#334155',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Icon size={14} /> {item.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location Picker & Live GPS Sync */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#dc2626" /> Caller Location in Pakistan:
                    </label>

                    <button
                      type="button"
                      onClick={toggleLiveGpsWatch}
                      style={{
                        background: liveGpsActive ? '#dcfce7' : '#f0f9ff',
                        border: `1px solid ${liveGpsActive ? '#86efac' : '#bae6fd'}`,
                        color: liveGpsActive ? '#15803d' : '#0284c7',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px'
                      }}
                    >
                      <LocateFixed size={12} />
                      {gpsDetecting ? 'Fetching GPS…' : liveGpsActive ? '🟢 Live GPS Streaming' : '📍 Fetch Real Live Location'}
                    </button>
                  </div>

                  <select
                    value={pickupLocation.address}
                    onChange={(e) => {
                      const found = PRESET_LOCATIONS.find((p) => p.name === e.target.value);
                      if (found) {
                        const newLoc = { lat: found.lat, lng: found.lng, address: found.name };
                        setPickupLocation(newLoc);
                        setLiveGpsActive(false);
                        void performSearch(selectedSpecialties, newLoc);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value={pickupLocation.address}>{pickupLocation.address}</option>
                    <optgroup label="Major Pakistan Emergency Hubs">
                      {PRESET_LOCATIONS.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Hospital Match Cards */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                    Ranked Pakistan Hospitals ({hospitals.length})
                  </h3>
                  {searching && (
                    <span style={{ fontSize: '12px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RefreshCw size={12} className="spin" /> Recalculating road routes…
                    </span>
                  )}
                </div>

                {searching && hospitals.length === 0 && (
                  <LoadingState label="Searching Pakistan emergency facilities and calculating road routes…" />
                )}

                {!searching && hospitals.length === 0 && (
                  <div style={{ background: '#ffffff', borderRadius: '10px', padding: '28px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                      No facilities found matching your selected city or filters
                    </div>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px' }}>
                      Try selecting All Pakistan or switching to another major healthcare hub.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCity('All Pakistan');
                        setFacilityFilter('all');
                        setSelectedSpecialties(['Cardiology']);
                        void performSearch(['Cardiology'], pickupLocation, 'All Pakistan', 'all');
                      }}
                      style={{
                        background: '#0284c7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Reset All Filters (Show Nationwide Network)
                    </button>
                  </div>
                )}

                {/* Prominent System Auto-Selected Best Hospital Banner */}
                {autoSelectedHospital && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      marginBottom: '16px',
                      boxShadow: '0 4px 16px rgba(16,185,129,0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            letterSpacing: '0.04em',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Sparkles size={12} /> ⭐ SYSTEM AUTO-SELECTED BEST HOSPITAL
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                          Suitability Score: {autoSelectedHospital.suitabilityScore}/100
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => sendInstantEmergencyRequest(autoSelectedHospital)}
                          style={{
                            background: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(220,38,38,0.35)'
                          }}
                        >
                          <AmbulanceIcon size={16} /> 🚨 1-Click Send Emergency Request
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHospital(autoSelectedHospital);
                            setShowDispatchModal(true);
                          }}
                          style={{
                            background: '#ffffff',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Custom Details…
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#064e3b' }}>
                          {autoSelectedHospital.name}
                        </h4>
                        <div style={{ fontSize: '13px', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} /> {autoSelectedHospital.address}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#059669' }}>
                          {autoSelectedHospital.durationMinutes} min
                        </div>
                        <div style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>
                          {autoSelectedHospital.distanceKm} km fastest road route
                        </div>
                      </div>
                    </div>

                    {autoSelectionReason && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: '#ffffff',
                          border: '1px solid #a7f3d0',
                          fontSize: '12px',
                          color: '#065f46',
                          lineHeight: 1.4,
                          fontWeight: 600
                        }}
                      >
                        🎯 <strong>Automated Clinical Rationale:</strong> {autoSelectionReason}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {hospitals.map((hosp, idx) => {
                    const isSelected = selectedHospital?.hospitalId === hosp.hospitalId;
                    return (
                      <div
                        key={hosp.hospitalId}
                        onClick={() => handleSelectHospital(hosp)}
                        style={{
                          background: '#ffffff',
                          borderRadius: '10px',
                          padding: '16px',
                          border: `2px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(2,132,199,0.15)' : '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>{hosp.name}</span>
                              {idx === 0 && (
                                <span style={{ background: '#10b981', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                                  TOP RECOMMENDATION
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: hosp.facilityType === 'private' ? '#fdf2f8' : hosp.facilityType === 'military' ? '#f0fdf4' : '#eff6ff',
                                  color: hosp.facilityType === 'private' ? '#be185d' : hosp.facilityType === 'military' ? '#15803d' : '#1d4ed8',
                                  border: `1px solid ${hosp.facilityType === 'private' ? '#fbcfe8' : hosp.facilityType === 'military' ? '#bbf7d0' : '#bfdbfe'}`
                                }}
                              >
                                {hosp.facilityType === 'private' ? '🏥 Private Hospital' : hosp.facilityType === 'military' ? '🎖️ Military Hospital' : '🏛️ Government (Free ER)'}
                              </span>
                              {hosp.city && (
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                  📍 {hosp.city}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={13} /> {hosp.address}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>
                              {hosp.durationMinutes} min
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{hosp.distanceKm} km drive</div>
                          </div>
                        </div>

                        {/* Specialist match badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '12px 0 8px' }}>
                          {hosp.hasRequiredSpecialist ? (
                            <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> Specialist Available: {(hosp.matchedSpecialties || []).join(', ') || 'All Fields'}
                            </span>
                          ) : (
                            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={12} /> General Emergency Only
                            </span>
                          )}

                          <span style={{ background: '#f1f5f9', color: '#334155', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px' }}>
                            Match Score: {hosp.suitabilityScore}/100
                          </span>
                        </div>

                        {/* Bed & equipment snapshot */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '11px' }}>
                          {(hosp.resources || []).slice(0, 3).map((r) => (
                            <div key={r.resourceType} style={{ color: '#475569' }}>
                              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                {(r.resourceType || '').replace('_', ' ')}:
                              </span>{' '}
                              <span style={{ fontWeight: 700, color: r.availableCount && r.availableCount > 0 ? '#16a34a' : '#dc2626' }}>
                                {r.availableCount ?? 'Check'}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} /> {hosp.contactPhone}
                            </span>
                            {hosp.contactEmail && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0369a1' }}>
                                <Mail size={12} /> {hosp.contactEmail}
                              </span>
                            )}
                            {hosp.emergencyHelpline && (
                              <span style={{ color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                🚨 {hosp.emergencyHelpline}
                              </span>
                            )}
                            {hosp.bedCapacity && (
                              <span style={{ color: '#475569', fontWeight: 600 }}>
                                🛏️ {hosp.bedCapacity} Total Beds
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectHospital(hosp);
                            }}
                            style={{
                              background: isSelected ? '#0284c7' : '#f8fafc',
                              color: isSelected ? '#ffffff' : '#0284c7',
                              border: `1px solid ${isSelected ? '#0284c7' : '#cbd5e1'}`,
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Navigation size={12} /> Best Road Route
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Mapbox Driving Route & Path Card */}
            <div style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedHospital ? (
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                        Navigation & Best Road Route
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: '#0f172a' }}>
                        To {selectedHospital.name}
                      </h3>
                    </div>
                    <div style={{ textAlign: 'right', background: '#f0f9ff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>
                        {selectedHospital.durationMinutes} Mins
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#0369a1' }}>
                        {selectedHospital.distanceKm} Kilometers
                      </div>
                    </div>
                  </div>

                  {/* Road Summary Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 600 }}>
                      <CheckCircle2 size={15} /> Mapbox Route Active
                    </div>
                    <div style={{ color: '#64748b' }}>•</div>
                    <div style={{ color: '#475569' }}>
                      From: <span style={{ fontWeight: 600 }}>{pickupLocation.address}</span>
                    </div>
                  </div>

                  {/* Interactive Mapbox Map with Road Route Line */}
                  <MapboxMap
                    height="380px"
                    hospitals={hospitals as any}
                    selectedHospital={selectedHospital as any}
                    emergencies={[
                      {
                        _id: 'pickup_loc',
                        caseId: 'Your Location',
                        priorityCategory: 'critical',
                        summary: pickupLocation.address,
                        status: 'created',
                        pickupLocation,
                        requiredResources: [],
                        requiredSpecialties: selectedSpecialties,
                        createdBy: '',
                        version: 1,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      }
                    ]}
                    selectedEmergency={{
                      _id: 'pickup_loc',
                      caseId: 'Your Location',
                      priorityCategory: 'critical',
                      summary: pickupLocation.address,
                      status: 'created',
                      pickupLocation,
                      requiredResources: [],
                      requiredSpecialties: selectedSpecialties,
                      createdBy: '',
                      version: 1,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    }}
                    routeGeometry={selectedHospital.geometry}
                    routeColor="#0284c7"
                  />

                  {/* Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${pickupLocation.lat},${pickupLocation.lng}&destination=${selectedHospital.location?.lat || 31.5204},${selectedHospital.location?.lng || 74.3587}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: '#ffffff',
                        color: '#0284c7',
                        border: '1px solid #0284c7',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={15} /> Turn-by-Turn GPS
                    </a>

                    <button
                      onClick={() => sendInstantEmergencyRequest(selectedHospital)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(220,38,38,0.3)'
                      }}
                    >
                      <AmbulanceIcon size={16} /> 🚨 1-Click Send Request
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
                  Select a hospital on the left to see the driving route and travel time.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE EMERGENCY & AMBULANCE TRACKING */}
        {activeTab === 'track' && (
          <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Search Case ID Box */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={18} color="#0284c7" /> Live Emergency & Rescue 1122 Tracker
              </h2>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b' }}>
                Enter your emergency Case ID (e.g. EL-20261013-0004) to monitor ambulance approach and hospital acceptance in real-time.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (trackingCaseId.trim()) {
                    if (trackingToken.trim()) {
                      window.location.hash = `token=${encodeURIComponent(trackingToken.trim())}`;
                    }
                    void fetchTracking(trackingCaseId.trim(), trackingToken.trim());
                  }
                }}
                style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
              >
                <input
                  type="text"
                  value={trackingCaseId}
                  onChange={(e) => setTrackingCaseId(e.target.value)}
                  placeholder="Case ID (e.g. EL-20261014-0004)"
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                />
                <input
                  type="password"
                  autoComplete="off"
                  value={trackingToken}
                  onChange={(e) => setTrackingToken(e.target.value)}
                  placeholder="Private tracking code"
                  aria-label="Private tracking code"
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="submit"
                  disabled={trackingLoading || !trackingCaseId.trim()}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {trackingLoading ? 'Loading…' : 'Track'}
                </button>
              </form>

              {trackingError && (
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '13px' }}>
                  {trackingError}
                </div>
              )}
            </div>

            {/* Tracking Content */}
            {trackingLoading && !trackingData && <LoadingState label="Fetching live case coordinates and referral status…" />}

            {!trackingData && !trackingLoading && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '36px 24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  <Radio size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                  Real-Time Ambulance & Emergency Case Tracker
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                  Enter your assigned Case ID above to observe live ambulance dispatch telemetry, road route travel times, and real-time hospital referral acceptance.
                </p>

                {/* Quick 1-Click Demo Tracking Case */}
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackingCaseId('EL-20261013-0004');
                      void fetchTracking('EL-20261013-0004');
                    }}
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      color: '#15803d',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(22,163,74,0.15)'
                    }}
                  >
                    <CheckCircle2 size={16} /> Track Active Emergency Case (EL-20261013-0004)
                  </button>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Click to inspect an active emergency with live ambulance telemetry
                  </span>
                </div>

                {/* 4 Step Explainer */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '32px', textAlign: 'left' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#0284c7', marginBottom: '4px' }}>1. Emergency Call</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Case registered with caller GPS coordinates & symptom triage</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#d97706', marginBottom: '4px' }}>2. Rescue 1122 Unit</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Nearest ambulance unit mobilized with live GPS tracking</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#16a34a', marginBottom: '4px' }}>3. Hospital Approval</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Receiving hospital reserves ER bed & specialist before arrival</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#475569', marginBottom: '4px' }}>4. Safe Handover</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Patient arrived and admitted with complete clinical history</div>
                  </div>
                </div>
              </div>
            )}

            {trackingData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Status Hero Card */}
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                          Case {trackingData.caseId}
                        </h1>
                        <StatePill value={trackingData.status || 'referral_pending'} />
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                        {trackingData.summary || 'Emergency Case'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Registered</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                          {trackingData.createdAt ? new Date(trackingData.createdAt).toLocaleTimeString() : 'Recent'}
                        </div>
                      </div>
                      {trackingToken && (
                        <button
                          type="button"
                          onClick={copyTrackingLink}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: copiedLink ? '#dcfce7' : '#f8fafc',
                            color: copiedLink ? '#15803d' : '#334155',
                            border: `1px solid ${copiedLink ? '#86efac' : '#cbd5e1'}`,
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title="Copy secure link with tracking token"
                        >
                          {copiedLink ? '✓ Copied Link!' : '📋 Copy Private Tracking Link'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Real-Time Live Status Notification Banner */}
                  {(liveCitizenNotice || trackingData.referralStatus === 'accepted') && (
                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '2px solid #10b981',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#065f46',
                        margin: '16px 0 4px',
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
                      <div style={{ flex: 1, fontSize: '13px', fontWeight: 700, lineHeight: 1.4 }}>
                        {liveCitizenNotice || `🟢 DESTINATION PREPARED: ${trackingData.destinationHospital?.name || trackingData.referralHospitalName} Emergency Department has confirmed admission and reserved an ER Bed!`}
                      </div>
                    </div>
                  )}

                  {/* 4-Step Emergency Lifecycle Tracker */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', margin: '20px 0' }}>
                    {/* Step 1: Request Registered */}
                    <div style={{ padding: '12px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>
                        <CheckCircle2 size={16} /> 1. Registered
                      </div>
                      <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                        Emergency call logged
                      </div>
                    </div>

                    {/* Step 2: Ambulance Dispatched */}
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: trackingData.assignedAmbulance ? '#f0fdf4' : '#fffbeb',
                        border: `1px solid ${trackingData.assignedAmbulance ? '#bbf7d0' : '#fde68a'}`
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: trackingData.assignedAmbulance ? '#16a34a' : '#d97706',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        <AmbulanceIcon size={16} /> 2. Ambulance
                      </div>
                      <div style={{ fontSize: '11px', color: trackingData.assignedAmbulance ? '#15803d' : '#b45309', marginTop: '2px' }}>
                        {trackingData.assignedAmbulance
                          ? `${trackingData.assignedAmbulance.ambulanceId} (${trackingData.assignedAmbulance.status})`
                          : 'Assigning vehicle…'}
                      </div>
                    </div>

                    {/* Step 3: Hospital Review & Bed Allocation */}
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: trackingData.referralStatus === 'accepted' ? '#f0fdf4' : '#f0f9ff',
                        border: `1px solid ${trackingData.referralStatus === 'accepted' ? '#bbf7d0' : '#bae6fd'}`
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: trackingData.referralStatus === 'accepted' ? '#16a34a' : '#0284c7',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        <HospitalIcon size={16} /> 3. Hospital Approval
                      </div>
                      <div style={{ fontSize: '11px', color: trackingData.referralStatus === 'accepted' ? '#15803d' : '#0369a1', marginTop: '2px' }}>
                        {trackingData.referralStatus === 'accepted'
                          ? 'Approved: Bed & Team Reserved'
                          : `Pending: ${trackingData.referralHospitalName || 'Receiving Facility'}`}
                      </div>
                    </div>

                    {/* Step 4: Transport & Arrival */}
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: ['arrived', 'handed_over', 'closed'].includes(trackingData.status) ? '#f0fdf4' : '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 700, fontSize: '13px' }}>
                        <Clock size={16} /> 4. Handover
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {['arrived', 'handed_over', 'closed'].includes(trackingData.status)
                          ? 'Handover Completed'
                          : 'En route / In transit'}
                      </div>
                    </div>
                  </div>

                  {/* Route & Destination Information */}
                  {trackingData.destinationHospital && (
                    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                          Receiving Emergency Hospital
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                          {trackingData.destinationHospital.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {trackingData.destinationHospital.location?.address || 'Hospital Location'} • Phone: {trackingData.destinationHospital.contactPhone || 'N/A'}{trackingData.destinationHospital.contactEmail ? ` • Email: ${trackingData.destinationHospital.contactEmail}` : ''}
                        </div>
                      </div>

                      {trackingData.route && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>
                            {trackingData.route.durationMinutes} min
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {trackingData.route.distanceKm} km route
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interactive Live Map */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                      Live Geographic Route to Destination Facility:
                    </div>
                    <MapboxMap
                      height="380px"
                      hospitals={trackingData.destinationHospital ? [trackingData.destinationHospital] : []}
                      ambulances={
                        trackingData.assignedAmbulance?.currentLocation
                          ? [
                              {
                                _id: trackingData.assignedAmbulance.ambulanceId,
                                ambulanceId: trackingData.assignedAmbulance.ambulanceId,
                                status: trackingData.assignedAmbulance.status || 'assigned',
                                currentLocation: trackingData.assignedAmbulance.currentLocation
                              }
                            ]
                          : []
                      }
                      emergencies={
                        trackingData.pickupLocation
                          ? [
                              {
                                _id: trackingData.caseId || 'current_case',
                                caseId: trackingData.caseId || 'Emergency',
                                priorityCategory: 'critical',
                                summary: trackingData.summary || 'Emergency Case',
                                status: (trackingData.status || 'referral_pending') as any,
                                pickupLocation: trackingData.pickupLocation,
                                requiredResources: [],
                                requiredSpecialties: [],
                                createdBy: '',
                                version: 1,
                                createdAt: trackingData.createdAt || new Date().toISOString(),
                                updatedAt: trackingData.createdAt || new Date().toISOString()
                              }
                            ]
                          : []
                      }
                      selectedEmergency={
                        trackingData.pickupLocation
                          ? {
                              _id: trackingData.caseId || 'current_case',
                              caseId: trackingData.caseId || 'Emergency',
                              priorityCategory: 'critical',
                              summary: trackingData.summary || 'Emergency Case',
                              status: (trackingData.status || 'referral_pending') as any,
                              pickupLocation: trackingData.pickupLocation,
                              requiredResources: [],
                              requiredSpecialties: [],
                              createdBy: '',
                              version: 1,
                              createdAt: trackingData.createdAt || new Date().toISOString(),
                              updatedAt: trackingData.createdAt || new Date().toISOString()
                            }
                          : null
                      }
                      routeGeometry={trackingData.route?.geometry}
                      routeColor="#0284c7"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 1-Click Dispatch Modal */}
      {showDispatchModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AmbulanceIcon size={22} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Request Emergency Ambulance Dispatch
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Rescue 1122 / Edhi units will be notified with your exact GPS location.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Patient Condition / Chief Complaint:
                </label>
                <input
                  type="text"
                  value={conditionText}
                  onChange={(e) => setConditionText(e.target.value)}
                  placeholder="e.g. Chest pain, unconscious, severe bleeding"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                <span><b>Instant 1-Click Dispatch (No Phone Required)</b>: Rescue 1122 ambulance and the destination hospital are alerted immediately with your exact GPS location.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Live Pickup Location:
                </label>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b' }}>
                  <MapPin size={14} style={{ display: 'inline', marginRight: '4px', color: '#dc2626' }} />
                  {pickupLocation.address} ({pickupLocation.lat.toFixed(4)}, {pickupLocation.lng.toFixed(4)})
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Triage Priority Severity:
                </label>
                <select
                  value={dispatchPriority}
                  onChange={(e) => setDispatchPriority(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <option value="critical">Immediate / Critical (Life-threatening)</option>
                  <option value="urgent">Urgent (Needs rapid care)</option>
                  <option value="standard">Standard (Stable condition)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Email for case & referral updates (optional):
                </label>
                <input
                  type="email"
                  value={dispatchEmail}
                  onChange={(e) => setDispatchEmail(e.target.value)}
                  placeholder="e.g. family@example.com (optional)"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {dispatchError && (
                <div style={{ padding: '10px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '13px' }}>
                  {dispatchError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDispatchSubmit}
                  disabled={dispatchBusy}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(220,38,38,0.35)'
                  }}
                >
                  {dispatchBusy ? 'Dispatching…' : 'Confirm Rescue 1122 Dispatch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-STAGE REAL-TIME REQUEST & NOTIFICATION PROGRESS MODAL */}
      {requestProgress.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #cbd5e1',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(220,38,38,0.5)'
                  }}
                >
                  <HeartPulse size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                    Live Emergency Request & Hospital Coordination
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    {requestProgress.caseId ? `Case #${requestProgress.caseId} • Direct Rescue 1122 Dispatch` : 'Transmitting to Emergency Network…'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRequestProgress((p) => ({ ...p, isOpen: false }))}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                ✕
              </button>
            </div>

            {/* 4-Stage Stepper Tracker */}
            <div style={{ padding: '24px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative' }}>
                {/* Step 1 */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      margin: '0 auto 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#10b981',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '14px',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                    }}
                  >
                    ✓
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>1. Request Sent</div>
                  <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600 }}>Registered</div>
                </div>

                {/* Step 2 */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      margin: '0 auto 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: ['dispatched', 'referred', 'accepted'].includes(requestProgress.stage)
                        ? '#10b981'
                        : requestProgress.stage === 'sending'
                        ? '#0284c7'
                        : '#cbd5e1',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '14px'
                    }}
                  >
                    {['dispatched', 'referred', 'accepted'].includes(requestProgress.stage) ? '✓' : '2'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>2. Ambulance</div>
                  <div style={{ fontSize: '10px', color: ['dispatched', 'referred', 'accepted'].includes(requestProgress.stage) ? '#16a34a' : '#64748b', fontWeight: 600 }}>
                    {requestProgress.ambulanceId || 'Assigned'}
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      margin: '0 auto 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: ['referred', 'accepted'].includes(requestProgress.stage)
                        ? '#10b981'
                        : ['dispatched'].includes(requestProgress.stage)
                        ? '#0284c7'
                        : '#cbd5e1',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '14px'
                    }}
                  >
                    {['referred', 'accepted'].includes(requestProgress.stage) ? '✓' : '3'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>3. Referral Alert</div>
                  <div style={{ fontSize: '10px', color: ['referred', 'accepted'].includes(requestProgress.stage) ? '#16a34a' : '#64748b', fontWeight: 600 }}>
                    Hospital Notified
                  </div>
                </div>

                {/* Step 4 */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      margin: '0 auto 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: requestProgress.stage === 'accepted' ? '#10b981' : '#f59e0b',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '14px',
                      boxShadow: requestProgress.stage === 'accepted' ? '0 0 12px rgba(16,185,129,0.5)' : 'none'
                    }}
                  >
                    {requestProgress.stage === 'accepted' ? '✓' : '4'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>4. Bed Reserved</div>
                  <div style={{ fontSize: '10px', color: requestProgress.stage === 'accepted' ? '#16a34a' : '#b45309', fontWeight: 600 }}>
                    {requestProgress.stage === 'accepted' ? (requestProgress.autonomousAccepted ? 'Auto-Accepted ⚡' : 'Accepted 🟢') : 'Awaiting (15s fallback)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Target Hospital & Ambulance Summary Card */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: requestProgress.stage === 'accepted' ? '#f0fdf4' : '#f0f9ff',
                  border: `1px solid ${requestProgress.stage === 'accepted' ? '#86efac' : '#bae6fd'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: requestProgress.stage === 'accepted' ? '#15803d' : '#0369a1' }}>
                    {requestProgress.stage === 'accepted' ? '🟢 Destination Confirmed & Bed Reserved' : '🚑 Response Unit En Route'}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {requestProgress.hospitalName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Assigned Vehicle: <b>{requestProgress.ambulanceId || 'Rescue 1122 Unit'}</b> • Estimated Arrival: ~{requestProgress.etaMinutes} min
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: requestProgress.stage === 'accepted' ? '#16a34a' : '#0284c7',
                      color: '#ffffff'
                    }}
                  >
                    {requestProgress.stage === 'accepted' ? 'BED READY' : 'DISPATCHED'}
                  </span>
                </div>
              </div>

              {/* Live Event Stream Log */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  Live Event Stream & Telemetry:
                </div>
                <div
                  style={{
                    maxHeight: '130px',
                    overflowY: 'auto',
                    background: '#0f172a',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  {requestProgress.logs.map((log, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#94a3b8', flexShrink: 0 }}>[{log.time}]</span>
                      <span style={{ color: log.stage === 'accepted' ? '#4ade80' : log.stage === 'dispatched' ? '#38bdf8' : '#f1f5f9' }}>
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRequestProgress((p) => ({ ...p, isOpen: false }));
                    if (requestProgress.caseId) {
                      setActiveTab('track');
                      setTrackingCaseId(requestProgress.caseId);
                      const targetUrl = `/portal/track/${requestProgress.caseId}${trackingToken ? `#token=${encodeURIComponent(trackingToken)}` : ''}`;
                      navigate(targetUrl);
                      void fetchTracking(requestProgress.caseId, trackingToken);
                    }
                  }}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(2,132,199,0.3)'
                  }}
                >
                  <Radio size={16} /> 🗺️ Open Live GPS Tracking & Road Route
                </button>
                <button
                  type="button"
                  onClick={() => setRequestProgress((p) => ({ ...p, isOpen: false }))}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Keep Monitoring
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
