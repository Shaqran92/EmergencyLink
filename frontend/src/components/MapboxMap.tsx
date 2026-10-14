import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Hospital, Ambulance, Emergency } from '../shared/types';
import { MapPin } from 'lucide-react';

interface MapboxMapProps {
  hospitals?: Hospital[];
  ambulances?: Ambulance[];
  emergencies?: Emergency[];
  selectedEmergency?: Emergency | null;
  selectedHospital?: Hospital | null;
  routeGeometry?: any;
  routeColor?: string;
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [74.3450, 31.5120]; // Pakistan emergency hub (Lahore)

export default function MapboxMap({
  hospitals = [],
  ambulances = [],
  emergencies = [],
  selectedEmergency = null,
  selectedHospital = null,
  routeGeometry = null,
  routeColor = '#0284c7',
  height = '420px',
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

  const token =
    import.meta.env.VITE_MAPBOX_TOKEN ||
    'pk.eyJ1Ijoic2hhcXJhbiIsImEiOiJjbXY2c2pvaXIwaGFmMnhzZmozaWJhbXEyIn0.yw7huxs7cE_VJuJJ0q909g';

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!token) {
      setMapError('Mapbox access token is not configured.');
      return;
    }

    try {
      if (typeof mapboxgl.supported === 'function' && !mapboxgl.supported()) {
        setMapError('WebGL is not supported or enabled in your browser. Road map rendering is disabled.');
        return;
      }

      mapboxgl.accessToken = token;

      // Determine initial center
      let initialCenter: [number, number] = DEFAULT_CENTER;
      if (selectedEmergency?.pickupLocation?.lng && selectedEmergency?.pickupLocation?.lat) {
        initialCenter = [selectedEmergency.pickupLocation.lng, selectedEmergency.pickupLocation.lat];
      } else if (hospitals.length > 0 && hospitals[0].location?.lng && hospitals[0].location?.lat) {
        initialCenter = [hospitals[0].location.lng, hospitals[0].location.lat];
      }

      const m = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: initialCenter,
        zoom: 11,
      });

      m.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

      map.current = m;

      return () => {
        markersRef.current.forEach((mk) => mk.remove());
        markersRef.current = [];
        try {
          m.remove();
        } catch {
          // Ignore disposal errors
        }
        map.current = null;
      };
    } catch (err: any) {
      setMapError(err?.message || 'Failed to initialize Mapbox.');
    }
  }, [token]);

  // Update markers and route lines when data changes
  useEffect(() => {
    if (!map.current) return;

    try {
      // Clear existing markers
      markersRef.current.forEach((mk) => {
        try {
          mk.remove();
        } catch {
          // ignore
        }
      });
      markersRef.current = [];

      const bounds = new mapboxgl.LngLatBounds();
      let hasCoords = false;

      // 1. Add Hospital Markers (Blue)
      hospitals.forEach((h) => {
        if (!h || !h.location?.lng || !h.location?.lat) return;

        const el = document.createElement('div');
        el.className = 'map-marker hospital-marker';
        el.innerHTML = `
          <div style="background:#0284c7;color:white;padding:6px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;border:2px solid white;display:flex;align-items:center;justify-content:center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12m-6-6h12"/></svg>
          </div>
        `;

        const specialties = (h as any).specialties || [];
        const statusText = (h.status || 'Active').toUpperCase();
        const hospName = h.name || 'Hospital';
        const hospAddr = h.location.address || 'Emergency Department';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding:4px;font-family:sans-serif;">
            <h4 style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0f172a;">${hospName}</h4>
            <p style="margin:0 0 4px;font-size:12px;color:#64748b;">${hospAddr}</p>
            <div style="font-size:11px;color:#0284c7;font-weight:600;">Status: ${statusText}</div>
            <div style="font-size:11px;color:#334155;margin-top:2px;">Specialties: ${specialties.slice(0, 3).join(', ')}</div>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([h.location.lng, h.location.lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
        bounds.extend([h.location.lng, h.location.lat]);
        hasCoords = true;
      });

      // 2. Add Ambulance Markers (Amber)
      ambulances.forEach((amb) => {
        if (!amb || !amb.currentLocation?.lng || !amb.currentLocation?.lat) return;

        const el = document.createElement('div');
        el.className = 'map-marker ambulance-marker';
        el.innerHTML = `
          <div style="background:#d97706;color:white;padding:6px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;border:2px solid white;display:flex;align-items:center;justify-content:center;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          </div>
        `;

        const ambStatus = amb.status || 'Active';
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding:4px;font-family:sans-serif;">
            <h4 style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0f172a;">Ambulance ${amb.ambulanceId || ''}</h4>
            <div style="font-size:11px;color:#d97706;font-weight:600;margin-top:2px;">Status: ${ambStatus}</div>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([amb.currentLocation.lng, amb.currentLocation.lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
        bounds.extend([amb.currentLocation.lng, amb.currentLocation.lat]);
        hasCoords = true;
      });

      // 3. Add Incident Markers (Red Pulse)
      emergencies.forEach((em) => {
        if (!em || !em.pickupLocation?.lng || !em.pickupLocation?.lat) return;

        const el = document.createElement('div');
        el.className = 'map-marker emergency-marker';
        const isSelected = selectedEmergency?.caseId === em.caseId;
        el.innerHTML = `
          <div style="background:${isSelected ? '#dc2626' : '#ea580c'};color:white;padding:${isSelected ? '8px' : '6px'};border-radius:50%;box-shadow:0 0 0 ${isSelected ? '6px' : '3px'} rgba(220,38,38,0.25);cursor:pointer;border:2px solid white;display:flex;align-items:center;justify-content:center;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
        `;

        const priority = em.priorityCategory || 'urgent';
        const summary = em.summary || 'Emergency Case';
        const addr = em.pickupLocation.address || 'Incident Location';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding:4px;font-family:sans-serif;">
            <div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;">Priority: ${priority}</div>
            <h4 style="margin:2px 0 4px;font-size:14px;font-weight:600;color:#0f172a;">${em.caseId || ''}</h4>
            <p style="margin:0 0 4px;font-size:12px;color:#475569;">${summary}</p>
            <div style="font-size:11px;color:#64748b;">${addr}</div>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([em.pickupLocation.lng, em.pickupLocation.lat])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
        bounds.extend([em.pickupLocation.lng, em.pickupLocation.lat]);
        hasCoords = true;
      });

      // 4. Render Route Geometry if provided or compute via client fallback
      const applyGeojsonRoute = (geom: any) => {
        if (!map.current || !geom?.coordinates || !Array.isArray(geom.coordinates) || geom.coordinates.length === 0) return;

        const geojsonData: any = {
          type: 'Feature',
          properties: {},
          geometry: geom,
        };

        if (map.current.getSource('directions-route')) {
          (map.current.getSource('directions-route') as mapboxgl.GeoJSONSource).setData(geojsonData);
        } else {
          map.current.addSource('directions-route', {
            type: 'geojson',
            data: geojsonData,
          });

          map.current.addLayer({
            id: 'directions-route-line',
            type: 'line',
            source: 'directions-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': routeColor,
              'line-width': 5,
              'line-opacity': 0.85,
            },
          });
        }

        const routeBounds = new mapboxgl.LngLatBounds();
        geom.coordinates.forEach((coord: [number, number]) => {
          if (coord && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
            routeBounds.extend(coord);
          }
        });
        if (!routeBounds.isEmpty()) {
          map.current.fitBounds(routeBounds, { padding: 60, maxZoom: 14 });
        }
      };

      const updateRouteLayer = () => {
        if (!map.current) return;

        if (routeGeometry && routeGeometry.coordinates && Array.isArray(routeGeometry.coordinates) && routeGeometry.coordinates.length > 0) {
          applyGeojsonRoute(routeGeometry);
          return;
        }

        // Client fallback if routeGeometry is missing but start and end points exist
        const startPoint = selectedEmergency?.pickupLocation;
        const endPoint = selectedHospital?.location || (hospitals[0]?.location);

        if (startPoint?.lng && startPoint?.lat && endPoint?.lng && endPoint?.lat) {
          const mapboxToken = token || 'pk.eyJ1Ijoic2hhcXJhbiIsImEiOiJjbXY2c2pvaXIwaGFmMnhzZmozaWJhbXEyIn0.yw7huxs7cE_VJuJJ0q909g';
          fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}?geometries=geojson&overview=full&access_token=${mapboxToken}`
          )
            .then((r) => r.json())
            .then((res) => {
              if (res.routes && res.routes[0]?.geometry) {
                applyGeojsonRoute(res.routes[0].geometry);
              } else {
                applyGeojsonRoute({
                  type: 'LineString',
                  coordinates: [
                    [startPoint.lng, startPoint.lat],
                    [endPoint.lng, endPoint.lat]
                  ]
                });
              }
            })
            .catch(() => {
              applyGeojsonRoute({
                type: 'LineString',
                coordinates: [
                  [startPoint.lng, startPoint.lat],
                  [endPoint.lng, endPoint.lat]
                ]
              });
            });
          return;
        }

        if (map.current.getLayer('directions-route-line')) {
          map.current.removeLayer('directions-route-line');
        }
        if (map.current.getSource('directions-route')) {
          map.current.removeSource('directions-route');
        }
      };

      if (map.current.isStyleLoaded()) {
        updateRouteLayer();
      } else {
        map.current.once('style.load', updateRouteLayer);
      }

      // Fit map bounds if there are markers and no route override
      if (!routeGeometry) {
        if (hasCoords && !selectedEmergency && !bounds.isEmpty()) {
          map.current.fitBounds(bounds, { padding: 50, maxZoom: 13 });
        } else if (selectedEmergency?.pickupLocation?.lng && selectedEmergency?.pickupLocation?.lat) {
          map.current.flyTo({
            center: [selectedEmergency.pickupLocation.lng, selectedEmergency.pickupLocation.lat],
            zoom: 12,
            speed: 1.2,
          });
        }
      }
    } catch (err) {
      console.warn('Mapbox markers update error caught safely:', err);
    }
  }, [hospitals, ambulances, emergencies, selectedEmergency, selectedHospital, routeGeometry, routeColor]);

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      {mapError ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc', color: '#64748b', padding: '24px', textAlign: 'center' }}>
          <MapPin size={32} style={{ marginBottom: '8px', color: '#94a3b8' }} />
          <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Map Unavailable</div>
          <div style={{ fontSize: '13px' }}>{mapError}</div>
        </div>
      ) : (
        <>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(255,255,255,0.92)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', display: 'flex', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', backdropFilter: 'blur(4px)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} /> Hospital
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#d97706', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} /> Ambulance
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} /> Incident
            </span>
          </div>
        </>
      )}
    </div>
  );
}
